<?php

namespace App\Http\Controllers\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\HoaDonThanhToan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingInvoiceMail;

class PaymentController extends Controller
{
    /**
     * Danh sách hóa đơn thanh toán
     * GET /api/v1/admin/payments
     */
    public function index()
    {
        $invoices = HoaDonThanhToan::with(['donDat.khachHang', 'nhanVienTao'])
            ->orderBy('ngay_thanh_toan', 'desc')
            ->get()
            ->map(function($invoice) {
                return [
                    'id' => $invoice->hoa_don_id,
                    'booking_id' => $invoice->don_dat_id,
                    'customer_name' => $invoice->donDat->khachHang->ho_ten ?? 'N/A',
                    'customer_phone' => $invoice->donDat->khachHang->so_dien_thoai ?? 'N/A',
                    'total_amount' => (float) $invoice->tong_tien_thanh_toan,
                    'payment_method' => $invoice->hinh_thuc_thanh_toan,
                    'payment_date' => $invoice->ngay_thanh_toan,
                    'created_by' => $invoice->nhanVienTao->ho_ten ?? 'Customer',
                    'note' => $invoice->ghi_chu,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }

    /**
     * Lấy hóa đơn theo booking
     * GET /api/v1/admin/payments/booking/{bookingId}
     */
    public function getByBooking($bookingId)
    {
        $invoice = HoaDonThanhToan::with(['donDat.khachHang', 'donDat.chiTietDatPhong.phong'])
            ->where('don_dat_id', $bookingId)
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa có hóa đơn thanh toán cho đơn đặt này'
            ], 404);
        }

        $booking = $invoice->donDat;
        $paidAmount = (float) $invoice->tong_tien_thanh_toan;
        $totalAmount = (float) $booking->thanh_tien_cuoi;
        $remainingAmount = $totalAmount - $paidAmount;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $invoice->hoa_don_id,
                'booking_id' => $booking->don_dat_id,
                'customer' => [
                    'name' => $booking->khachHang->ho_ten,
                    'phone' => $booking->khachHang->so_dien_thoai,
                    'email' => $booking->khachHang->email,
                ],
                'rooms' => $booking->chiTietDatPhong->map(function($ct) {
                    return [
                        'room_number' => $ct->phong->so_phong,
                        'price' => (float) $ct->gia_ap_dung,
                    ];
                }),
                'check_in' => $booking->ngay_checkin,
                'check_out' => $booking->ngay_checkout,
                'nights' => now()->parse($booking->ngay_checkin)->diffInDays(now()->parse($booking->ngay_checkout)),
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'payment_method' => $invoice->hinh_thuc_thanh_toan,
                'payment_date' => $invoice->ngay_thanh_toan,
                'note' => $invoice->ghi_chu,
                'is_fully_paid' => $remainingAmount <= 0,
            ]
        ]);
    }

    /**
     * Xử lý thanh toán
     * POST /api/v1/admin/payments/process
     */
    public function processPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:don_dat_phong,don_dat_id',
            'payment_method' => 'required|in:VNPAY,OFFLINE,Online_Banking,Vi_Dien_Tu,Tien_Mat,counter,offline',
            'amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $booking = DonDatPhong::findOrFail($request->booking_id);
        
        // Tính số tiền đã thanh toán
        $paidAmount = HoaDonThanhToan::where('don_dat_id', $request->booking_id)->sum('tong_tien_thanh_toan');
        $totalAmount = (float) $booking->thanh_tien_cuoi;
        $remainingAmount = $totalAmount - $paidAmount;
        
        // Xác định số tiền thanh toán
        $paymentAmount = $request->amount ?? $remainingAmount;
        
        if ($paymentAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Số tiền thanh toán phải lớn hơn 0'
            ], 400);
        }
        
        if ($paymentAmount > $remainingAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Số tiền thanh toán vượt quá số tiền còn lại'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Tạo hóa đơn
            $invoice = HoaDonThanhToan::create([
                'don_dat_id' => $request->booking_id,
                'nhan_vien_tao_id' => Auth::id(),
                'ngay_thanh_toan' => now(),
                'tong_tien_thanh_toan' => $paymentAmount,
                'hinh_thuc_thanh_toan' => in_array($request->payment_method, ['VNPAY', 'vnpay', 'Online_Banking', 'Vi_Dien_Tu']) ? 'VNPAY' : 'OFFLINE',
                'ghi_chu' => $request->note
            ]);
            
            // Kiểm tra nếu thanh toán đủ
            $newPaidAmount = $paidAmount + $paymentAmount;
            $shouldSendEmail = false;
            if ($newPaidAmount >= $totalAmount) {
                $booking->trang_thai_don = 'Da_Thanh_Toan';
                $booking->save();
                $shouldSendEmail = true;
            }
            
            DB::commit();
            
            // Gửi email hóa đơn sau khi thanh toán thành công
            if ($shouldSendEmail) {
                try {
                    $booking->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan']);
                    $email = $booking->khachHang->email ?? null;
                    if ($email) {
                        Mail::to($email)->send(new BookingInvoiceMail($booking));
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email hóa đơn PaymentController: ' . $e->getMessage());
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công',
                'data' => [
                    'invoice_id' => $invoice->hoa_don_id,
                    'booking_id' => $request->booking_id,
                    'paid_amount' => $paymentAmount,
                    'total_paid' => $newPaidAmount,
                    'remaining' => $totalAmount - $newPaidAmount,
                    'is_fully_paid' => ($totalAmount - $newPaidAmount) <= 0
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Thanh toán thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
}