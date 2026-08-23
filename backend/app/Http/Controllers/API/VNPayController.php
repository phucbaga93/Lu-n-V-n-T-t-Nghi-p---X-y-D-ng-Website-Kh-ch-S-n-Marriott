<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\HoaDonThanhToan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingInvoiceMail;

class VNPayController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: KHỞI TẠO URL THANH TOÁN VNPAY SANDBOX & TẠO CHỮ KÝ SHA512
    // POST /api/v1/payments/vnpay-url
    // =========================================================================
    public function createPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:don_dat_phong,don_dat_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $booking = DonDatPhong::findOrFail($request->booking_id);

        // 🟢 ĐỌC CẤU HÌNH VNPAY MERCHANT TỪ FILE backend/.env
        $vnp_Url = config('services.vnpay.url', env('VNP_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'));
        $vnp_Returnurl = config('services.vnpay.return_url', env('VNP_RETURN_URL', 'http://localhost:3000/customer/vnpay-callback'));
        $vnp_TmnCode = config('services.vnpay.tmn_code', env('VNP_TMN_CODE', 'MZR1HRAY'));
        $vnp_HashSecret = config('services.vnpay.hash_secret', env('VNP_HASH_SECRET', 'EQZO0QJV666YT9GGPP4YA3ODKQIXH2D1'));

        $vnp_TxnRef = $booking->don_dat_id;
        $vnp_OrderInfo = "Thanh toan dat phong " . $booking->don_dat_id;
        $vnp_OrderType = "billpayment";
        
        // 🟢 CHUẨN VNPAY: LẤY SỐ TIỀN THANH TOÁN TỪ REQUEST (HOẶC TỪ ĐƠN ĐẶT PHÒNG KHÔNG)
        if ($request->filled('amount') && (float)$request->input('amount') > 0) {
            $amountToPay = (float) $request->input('amount');
        } else {
            $amountToPay = (float) ($booking->so_tien_da_coc > 0 ? $booking->so_tien_da_coc : $booking->thanh_tien_cuoi);
        }
        $vnp_Amount = (int) round($amountToPay * 100);
        $vnp_Locale = "vn";
        $vnp_BankCode = "NCB"; // Ngân hàng test mặc định của VNPay Sandbox
        $vnp_IpAddr = $request->ip();

        $now = \Carbon\Carbon::now('Asia/Ho_Chi_Minh');
        $vnp_CreateDate = $now->format('YmdHis');
        $vnp_ExpireDate = $now->copy()->addMinutes(30)->format('YmdHis');

        $inputData = array(
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => $vnp_CreateDate,
            "vnp_ExpireDate" => $vnp_ExpireDate,
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => $vnp_OrderInfo,
            "vnp_OrderType" => $vnp_OrderType,
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef,
        );

        if (isset($vnp_BankCode) && $vnp_BankCode != "") {
            $inputData['vnp_BankCode'] = $vnp_BankCode;
        }

        // Sắp xếp các tham số theo bảng chữ cái A-Z chuẩn quy định VNPay
        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $query .= '&' . urlencode($key) . "=" . urlencode($value);
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $query .= urlencode($key) . "=" . urlencode($value);
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        
        // 🟢 DÒNG CODE MÃ HÓA TẠO CHỮ KÝ BẢO MẬT HMAC-SHA512 GẮN VÀO URL:
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= '&vnp_SecureHash=' . $vnpSecureHash;
        }

        return response()->json([
            'success' => true,
            'payment_url' => $vnp_Url
        ]);
    }

    // =========================================================================
    // NGHIỆP VỤ: XÁC MINH THANH TOÁN VNPAY KHI CALLBACK TRẢ VỀ FRONTEND
    // POST /api/v1/payments/vnpay-verify
    // =========================================================================
    public function verifyPayment(Request $request)
    {
        $vnp_HashSecret = config('services.vnpay.hash_secret', env('VNP_HASH_SECRET', 'EQZO0QJV666YT9GGPP4YA3ODKQIXH2D1'));
        $vnp_SecureHash = $request->input('vnp_SecureHash');

        $inputData = array();
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }

        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        ksort($inputData);

        $i = 0;
        $hashData = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        // 🟢 DÒNG CODE TÁI TẠO CHỮ KÝ ĐỂ KIỂM TRA CHỐNG GIẢ MẠO DỮ LIỆU:
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        // Đối soát chữ ký checksum HMAC-SHA512 chuẩn VNPay
        if (!empty($vnp_SecureHash) && $secureHash === $vnp_SecureHash) {
            $bookingId = $request->input('vnp_TxnRef');
            $responseCode = $request->input('vnp_ResponseCode');
            $amount = $request->input('vnp_Amount') ? ($request->input('vnp_Amount') / 100) : 0; // Đổi về số tiền gốc

            // 🟢 TRƯỜNG HỢP THANH TOÁN THÀNH CÔNG (ResponseCode == '00'):
            if ($responseCode == '00') {
                $booking = DonDatPhong::find($bookingId);
                if ($booking) {
                    if ($booking->trang_thai_don !== 'Da_Thanh_Toan') {
                        
                        // 🟢 MỞ DB TRANSACTION ĐẢM BẢO TÍNH TOÀN VẸN DỮ LIỆU CSDL
                        DB::transaction(function() use ($booking, $amount, $request) {
                            
                            // 1. Cập nhật trạng thái đơn đặt phòng chính
                            $newStatus = ($booking->phan_tram_dat_coc >= 100) ? 'Da_Thanh_Toan' : 'Da_Xac_Nhan';
                            $booking->update(['trang_thai_don' => $newStatus]);

                            // Cập nhật tất cả các đơn đặt phòng khác cùng được tạo trong giỏ hàng
                            $cartGroupTag = null;
                            if (!empty($booking->ghi_chu_dac_biet) && preg_match('/\[MaGioHang:\s*(GH\d+)\]/i', $booking->ghi_chu_dac_biet, $m)) {
                                $cartGroupTag = $m[1];
                            }

                            if ($cartGroupTag) {
                                $relatedBookings = DonDatPhong::where('ghi_chu_dac_biet', 'LIKE', "%[MaGioHang: {$cartGroupTag}]%")->get();
                            } else {
                                $relatedBookings = DonDatPhong::where('khach_hang_id', $booking->khach_hang_id)
                                    ->whereIn('trang_thai_don', ['Cho_Xac_Nhan', 'Da_Xac_Nhan'])
                                    ->where('created_at', '>=', now()->subMinutes(15))
                                    ->get();
                            }

                            foreach ($relatedBookings as $relB) {
                                $relStatus = ($relB->phan_tram_dat_coc >= 100) ? 'Da_Thanh_Toan' : 'Da_Xac_Nhan';
                                $relB->update(['trang_thai_don' => $relStatus]);
                            }

                            // 2. Tạo bản ghi Hóa đơn thanh toán lưu vĩnh viễn vào CSDL MySQL
                            $exists = HoaDonThanhToan::where('don_dat_id', $booking->don_dat_id)->exists();
                            if (!$exists) {
                                HoaDonThanhToan::create([
                                    'don_dat_id' => $booking->don_dat_id,
                                    'nhan_vien_tao_id' => 1, // Hệ thống tự động xử lý
                                    'ngay_thanh_toan' => now(),
                                    'tong_tien_thanh_toan' => $amount,
                                    'hinh_thuc_thanh_toan' => 'VNPAY',
                                    'ghi_chu' => 'Thanh toán trực tuyến VNPay Sandbox cho giỏ hàng. GD: ' . $request->input('vnp_TransactionNo')
                                ]);
                            }
                        });

                        // 🟢 DÒNG CODE TỰ ĐỘNG GỬI EMAIL HÓA ĐƠN ĐIỆN TỬ VỀ GMAIL KHÁCH HÀNG:
                        try {
                            $booking->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan']);
                            $email = $booking->khachHang->email ?? null;
                            if ($email) {
                                Mail::to($email)->send(new BookingInvoiceMail($booking));
                            }
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email hóa đơn VNPay: ' . $e->getMessage());
                        }
                    }
                    return response()->json([
                        'success' => true,
                        'message' => 'Xác nhận thanh toán thành công!',
                        'booking_id' => $bookingId
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy đơn đặt phòng.'
                    ], 404);
                }
            } else {
                // 🔴 TRƯỜNG HỢP HỦY THANH TOÁN HOẶC GIAO DỊCH THẤT BẠI:
                $booking = DonDatPhong::find($bookingId);
                if ($booking) {
                    // Dòng code xóa đơn tạm để nhả phòng trống cho người khác đặt
                    $booking->delete();
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Giao dịch thanh toán không thành công hoặc đã bị hủy (Mã phản hồi: ' . $responseCode . '). Đơn đặt phòng tạm tính đã được hủy tự động và phòng đã được nhả lại.'
                ], 200);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Chữ ký bảo mật không khớp.'
            ], 400);
        }
    }
}
