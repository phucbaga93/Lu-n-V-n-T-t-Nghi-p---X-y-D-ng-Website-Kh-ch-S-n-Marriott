<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\ChiTietDatPhong;
use App\Models\Phong;
use App\Models\HoaDonThanhToan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CheckInOutController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: LẤY DANH SÁCH CHỜ CHECK-IN
    // =========================================================================
    public function getPendingCheckins(Request $request)
    {
        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong'])
            ->whereIn('trang_thai_don', ['Da_Xac_Nhan', 'Da_Thanh_Toan', 'Cho_Xac_Nhan']);

        if ($request->filled('date')) {
            $query->whereDate('ngay_checkin', $request->query('date'));
        }

        $bookings = $query->orderBy('ngay_checkin')->get();
        return response()->json($bookings);
    }

    // =========================================================================
    // NGHIỆP VỤ: LẤY DANH SÁCH CHỜ CHECK-OUT
    // =========================================================================
    public function getPendingCheckouts(Request $request)
    {
        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong'])
            ->where('trang_thai_don', 'Dang_O');

        if ($request->filled('date')) {
            $query->whereDate('ngay_checkout', $request->query('date'));
        }

        $bookings = $query->orderBy('ngay_checkout')->get();
        return response()->json($bookings);
    }

    public function getDetail($id)
    {
        $booking = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan.nhanVien'])->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }
        return response()->json($booking);
    }

    // =========================================================================
    // NGHIỆP VỤ: XỬ LÝ CHECK-IN — Ghi lại nhân viên thực hiện
    // =========================================================================
    public function processCheckin($id)
    {
        return DB::transaction(function() use ($id) {
            $booking = DonDatPhong::with('chiTietDatPhongs')->find($id);
            if (!$booking) {
                return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
            }

            if ($booking->trang_thai_don === 'Da_Huy') {
                return response()->json(['message' => 'Đơn đặt phòng này đã bị hủy.'], 422);
            }

            $now = Carbon::now();
            $checkinDate  = Carbon::parse($booking->ngay_checkin)->startOfDay();
            $checkoutDateTime = Carbon::parse($booking->ngay_checkout)->setTime(12, 0, 0);

            if ($now->lt($checkinDate)) {
                $days = $now->startOfDay()->diffInDays($checkinDate);
                return response()->json([
                    'message' => "Chưa đến ngày nhận phòng! Ngày nhận phòng quy định là " . $checkinDate->format('d/m/Y') . " (còn {$days} ngày nữa). Nếu muốn nhận phòng vui lòng hủy phòng tạo đơn khác!"
                ], 422);
            }

            if ($now->gt($checkoutDateTime)) {
                $booking->update(['trang_thai_don' => 'Da_Huy']);
                return response()->json([
                    'message' => "Đơn đặt phòng này đã quá giờ Check-out (12:00 ngày " . $checkoutDateTime->format('d/m/Y') . ") mà khách không nhận phòng! Hệ thống đã chuyển đơn sang trạng thái Hủy đặt (No-Show)."
                ], 422);
            }

            // Cập nhật trạng thái đơn
            $booking->update(['trang_thai_don' => 'Dang_O']);

            // Cập nhật trạng thái từng phòng → Đang sử dụng (1)
            foreach ($booking->chiTietDatPhongs as $detail) {
                $detail->update(['trang_thai' => 'checked_in']);
                $room = Phong::find($detail->phong_id);
                if ($room) {
                    $room->trang_thai_hien_tai = 1;
                    $room->save();
                }
            }

            // 🟢 GHI LẠI NHÂN VIÊN XỬ LÝ CHECK-IN vào hóa đơn
            $nhanVienId = Auth::id() ?? request()->input('staff_id') ?? request()->input('nhan_vien_id') ?? 2;
            $existingInvoice = HoaDonThanhToan::where('don_dat_id', $booking->don_dat_id)->first();
            if ($existingInvoice) {
                // Cập nhật nhân viên xử lý nếu hóa đơn đã tồn tại
                $existingInvoice->update([
                    'nhan_vien_tao_id' => $nhanVienId,
                    'ngay_thanh_toan'  => now(),
                ]);
            } else {
                // Tạo bản ghi hóa đơn tạm để track nhân viên
                HoaDonThanhToan::create([
                    'don_dat_id'          => $booking->don_dat_id,
                    'nhan_vien_tao_id'    => $nhanVienId,
                    'ngay_thanh_toan'     => now(),
                    'tong_tien_thanh_toan'=> (float) $booking->thanh_tien_cuoi,
                    'hinh_thuc_thanh_toan'=> 'OFFLINE',
                    'ghi_chu'             => '[Check-in] Nhân viên lễ tân thực hiện',
                ]);
            }

            return response()->json([
                'message' => 'Nhận phòng (Check-in) thành công!',
                'booking' => $booking->fresh(['khachHang', 'chiTietDatPhongs.phong', 'hoaDonThanhToan.nhanVienTao']),
            ], 200);
        });
    }

    // =========================================================================
    // NGHIỆP VỤ: XỬ LÝ CHECK-OUT — Ghi lại nhân viên thực hiện
    // =========================================================================
    public function processCheckout($id)
    {
        return DB::transaction(function() use ($id) {
            $booking = DonDatPhong::with('chiTietDatPhongs')->find($id);
            if (!$booking) {
                return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
            }

            // Cập nhật trạng thái đơn
            $booking->update(['trang_thai_don' => 'Da_Tra_Phong']);

            // Cập nhật trạng thái phòng → Dọn dẹp (2)
            foreach ($booking->chiTietDatPhongs as $detail) {
                $detail->update(['trang_thai' => 'checked_out']);
                $room = Phong::find($detail->phong_id);
                if ($room) {
                    $room->trang_thai_hien_tai = 2;
                    $room->mo_ta = '[Dọn dẹp] Thời lượng: 30 phút.';
                    $room->save();
                }
            }

            // 🟢 CẬP NHẬT / GHI NHÂN VIÊN XỬ LÝ CHECK-OUT vào hóa đơn
            $nhanVienId = Auth::id() ?? request()->input('staff_id') ?? request()->input('nhan_vien_id') ?? 2;
            $existingInvoice = HoaDonThanhToan::where('don_dat_id', $booking->don_dat_id)->first();
            if ($existingInvoice) {
                $existingInvoice->update([
                    'nhan_vien_tao_id' => $nhanVienId,
                    'ngay_thanh_toan'  => now(),
                    'ghi_chu'          => ($existingInvoice->ghi_chu ?? '') . ' | [Check-out] Nhân viên lễ tân thực hiện',
                ]);
            } else {
                HoaDonThanhToan::create([
                    'don_dat_id'          => $booking->don_dat_id,
                    'nhan_vien_tao_id'    => $nhanVienId,
                    'ngay_thanh_toan'     => now(),
                    'tong_tien_thanh_toan'=> (float) $booking->thanh_tien_cuoi,
                    'hinh_thuc_thanh_toan'=> 'OFFLINE',
                    'ghi_chu'             => '[Check-out] Nhân viên lễ tân thực hiện',
                ]);
            }

            return response()->json([
                'message' => 'Trả phòng (Check-out) thành công! Trạng thái phòng được cập nhật thành Dọn Dẹp.',
                'booking' => $booking->fresh(['khachHang', 'chiTietDatPhongs.phong']),
            ], 200);
        });
    }

    // =========================================================================
    // NGHIỆP VỤ: CHECKOUT NHANH THEO SỐ PHÒNG
    // =========================================================================
    public function quickCheckoutByRoom(Request $request)
    {
        $request->validate(['so_phong' => 'required|string']);
        $room = Phong::where('so_phong', $request->so_phong)->first();
        if (!$room) {
            return response()->json(['message' => 'Không tìm thấy phòng.'], 404);
        }
        $detail = ChiTietDatPhong::where('phong_id', $room->phong_id)
            ->where('trang_thai', 'checked_in')
            ->latest()
            ->first();
        if (!$detail) {
            return response()->json(['message' => 'Phòng này không có khách đang ở.'], 422);
        }
        return $this->processCheckout($detail->don_dat_id);
    }

    // =========================================================================
    // NGHIỆP VỤ: THỐNG KÊ CHECK-IN/OUT HÔM NAY
    // =========================================================================
    public function getTodayStats()
    {
        $today = Carbon::today()->toDateString();
        return response()->json([
            'checkins_today'  => DonDatPhong::where('ngay_checkin', $today)->where('trang_thai_don', 'Dang_O')->count(),
            'checkouts_today' => DonDatPhong::where('ngay_checkout', $today)->where('trang_thai_don', 'Da_Tra_Phong')->count(),
            'pending_checkin' => DonDatPhong::where('ngay_checkin', $today)->whereIn('trang_thai_don', ['Da_Xac_Nhan', 'Da_Thanh_Toan'])->count(),
        ]);
    }

    // =========================================================================
    // NGHIỆP VỤ: TÌM KIẾM ĐƠN ĐẶT PHÒNG
    // =========================================================================
    public function search(Request $request)
    {
        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong']);
        if ($request->q) {
            $q = $request->q;
            $query->whereHas('khachHang', function($sq) use ($q) {
                $sq->where('ho_ten', 'LIKE', "%{$q}%")
                    ->orWhere('so_dien_thoai', 'LIKE', "%{$q}%")
                    ->orWhere('email', 'LIKE', "%{$q}%");
            })->orWhere('don_dat_id', 'LIKE', "%{$q}%");
        }
        return response()->json($query->limit(20)->get());
    }
}
