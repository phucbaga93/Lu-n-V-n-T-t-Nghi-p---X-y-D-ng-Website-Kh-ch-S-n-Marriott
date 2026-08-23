<?php

namespace App\Http\Controllers\Admin;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\ChiTietDatPhong;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingInvoiceMail;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong']);
        if ($request->has('status')) {
            $query->where('trang_thai_don', $request->status);
        }
        return response()->json($query->orderBy('ngay_dat_don', 'desc')->get(), 200);
    }

    public function show($id)
    {
        $booking = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan', 'lichSuHuys'])->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }
        return response()->json($booking, 200);
    }

    public function update(Request $request, $id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }

        $request->validate([
            'trang_thai_don' => 'sometimes|required',
            'ghi_chu_dac_biet' => 'nullable|string',
            'ngay_checkin' => 'sometimes|required|date',
            'ngay_checkout' => 'sometimes|required|date|after:ngay_checkin'
        ]);

        $booking->update($request->only(['trang_thai_don', 'ghi_chu_dac_biet', 'ngay_checkin', 'ngay_checkout', 'so_nguoi_lon', 'so_tre_em', 'thanh_tien_cuoi']));

        return response()->json([
            'message' => 'Cập nhật đơn đặt phòng thành công.',
            'booking' => $booking
        ], 200);
    }

    public function destroy($id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }
        $booking->delete();
        return response()->json(['message' => 'Xóa đơn đặt phòng thành công.'], 200);
    }

    public function getStats()
    {
        $total = DonDatPhong::count();
        $pending = DonDatPhong::where('trang_thai_don', 'Cho_Xac_Nhan')->count();
        $confirmed = DonDatPhong::where('trang_thai_don', 'Da_Xac_Nhan')->count();
        $checkedIn = DonDatPhong::where('trang_thai_don', 'Da_Nhan_Phong')->count();
        $checkedOut = DonDatPhong::where('trang_thai_don', 'Da_Tra_Phong')->count();
        $cancelled = DonDatPhong::where('trang_thai_don', 'Da_Huy')->count();

        $revenue = DonDatPhong::whereIn('trang_thai_don', ['Da_Tra_Phong', 'Da_Thanh_Toan'])->sum('thanh_tien_cuoi');

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'confirmed' => $confirmed,
            'checked_in' => $checkedIn,
            'checked_out' => $checkedOut,
            'cancelled' => $cancelled,
            'revenue' => $revenue
        ], 200);
    }

    public function store(Request $request)
    {
        $today = \Carbon\Carbon::today()->toDateString();
        $maxDate = \Carbon\Carbon::now()->addMonths(6)->toDateString();

        $request->validate([
            'khach_hang_id'  => 'nullable|integer',
            'ho_ten'         => 'nullable|string|max:100',
            'so_dien_thoai'  => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:100',
            'so_cmnd'        => 'nullable|string|max:20',
            'ngay_checkin'   => 'required|date|after_or_equal:' . $today . '|before_or_equal:' . $maxDate,
            'ngay_checkout'  => 'required|date|after:ngay_checkin',
            'so_nguoi_lon'   => 'required|integer|min:1',
            'so_tre_em'      => 'nullable|integer|min:0',
            'room_id'        => 'required|exists:phong,phong_id',
            'thanh_tien_cuoi' => 'required|numeric',
            'payment_method' => 'nullable|string'
        ], [
            'ngay_checkin.required' => 'Vui lòng chọn ngày nhận phòng (Check-in).',
            'ngay_checkin.after_or_equal' => 'Ngày nhận phòng không được nằm trong quá khứ.',
            'ngay_checkin.before_or_equal' => 'Khách sạn chỉ tiếp nhận đặt phòng trước tối đa 6 tháng.',
            'ngay_checkout.required' => 'Vui lòng chọn ngày trả phòng (Check-out).',
            'ngay_checkout.after' => 'Ngày trả phòng (Check-out) phải sau ngày nhận phòng.',
            'so_nguoi_lon.required' => 'Vui lòng chọn số lượng người lớn.',
            'room_id.required' => 'Vui lòng chọn phòng trống khả dụng.',
            'room_id.exists' => 'Phòng được chọn không tồn tại trên hệ thống.',
        ]);

        $checkInDate = \Carbon\Carbon::parse($request->ngay_checkin);
        $checkOutDate = \Carbon\Carbon::parse($request->ngay_checkout);
        $nights = max(1, $checkInDate->diffInDays($checkOutDate));
        $diffDaysFromToday = \Carbon\Carbon::now()->startOfDay()->diffInDays($checkInDate, false);

        if ($nights > 30) {
            return response()->json([
                'message' => 'Thời gian lưu trú tối đa cho một lần đặt phòng là 30 đêm.'
            ], 422);
        }

        $payMethod = (strtolower($request->payment_method ?? '') === 'vnpay') ? 'VNPAY' : 'OFFLINE';
        if (($diffDaysFromToday > 14 || $nights > 14) && $payMethod === 'OFFLINE') {
            return response()->json([
                'message' => 'Các đơn đặt trước trên 14 ngày hoặc lưu trú trên 14 đêm bắt buộc phải Thanh toán trực tuyến qua VNPay để giữ phòng cố định.'
            ], 422);
        }

        return DB::transaction(function() use ($request, $nights, $payMethod) {
            // 🟢 TỰ ĐỘNG TÌM HOẶC TẠO KHÁCH HÀNG WALK-IN NẾU CHƯA CÓ ID TÀI KHOẢN
            $khachHangId = $request->khach_hang_id;
            if (!$khachHangId) {
                $phone = $request->so_dien_thoai ?? '0900000000';
                $user = \App\Models\NguoiDung::where('so_dien_thoai', $phone)->first();
                if (!$user && $request->email) {
                    $user = \App\Models\NguoiDung::where('email', $request->email)->first();
                }
                if (!$user) {
                    $user = \App\Models\NguoiDung::create([
                        'ho_ten'        => $request->ho_ten ?? 'Khách vãng lai',
                        'so_dien_thoai' => $phone,
                        'email'         => $request->email ?? ('walkin_' . time() . '@hotel.com'),
                        'mat_khau'      => bcrypt('123456'),
                        'vai_tro'       => 'khach_hang',
                        'so_cmnd'       => $request->so_cmnd,
                        'trang_thai'    => 1
                    ]);
                }
                $khachHangId = $user->nguoi_dung_id;
            }

            // 🟢 TÍNH GIÁ ÁP DỤNG THEO ĐÊM (DAILY ROOM PRICE)
            $phong = \App\Models\Phong::with('loaiPhong')->find($request->room_id);
            $giaGocTheoDem = $phong ? (float)$phong->loaiPhong->gia_theo_dem : ((float)$request->thanh_tien_cuoi / $nights);

            // 🟢 GHI LẠI NHÂN VIÊN TẠO ĐƠN (nguoi_tao_don) cho đặt phòng offline tại quầy
            $nguoiTaoDon = Auth::id() ?? 2;

            $booking = DonDatPhong::create([
                'khach_hang_id'    => $khachHangId,
                'nguoi_tao_don'    => $nguoiTaoDon,
                'nguon_dat'        => 'OFFLINE',
                'ngay_dat_don'     => now(),
                'ngay_checkin'     => $request->ngay_checkin,
                'ngay_checkout'    => $request->ngay_checkout,
                'so_nguoi_lon'     => $request->so_nguoi_lon,
                'so_tre_em'        => $request->so_tre_em ?? 0,
                'trang_thai_don'   => 'Da_Xac_Nhan',
                'tong_tien_phong'  => $request->thanh_tien_cuoi,
                'thanh_tien_cuoi'  => $request->thanh_tien_cuoi,
                'ghi_chu_dac_biet' => $request->ghi_chu_dac_biet ?? 'Tạo bởi lễ tân tại quầy (Walk-in)'
            ]);

            ChiTietDatPhong::create([
                'don_dat_id'  => $booking->don_dat_id,
                'phong_id'    => $request->room_id,
                'gia_ap_dung' => $giaGocTheoDem,
                'trang_thai'  => 'booked'
            ]);

            // 🟢 TẠO HÓA ĐƠN NGAY KHI ĐẶT OFFLINE (thanh toán tại quầy)
            \App\Models\HoaDonThanhToan::create([
                'don_dat_id'           => $booking->don_dat_id,
                'nhan_vien_tao_id'     => $nguoiTaoDon,
                'ngay_thanh_toan'      => now(),
                'tong_tien_thanh_toan' => (float) $request->thanh_tien_cuoi,
                'hinh_thuc_thanh_toan' => $payMethod,
                'ghi_chu'              => '[Offline] Đặt phòng trực tiếp tại quầy lễ tân',
            ]);

            return response()->json([
                'message' => 'Tạo đơn đặt phòng tại quầy thành công.',
                'booking' => $booking->load(['khachHang', 'chiTietDatPhongs.phong'])
            ], 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $booking = DonDatPhong::with('chiTietDatPhongs')->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }

        $request->validate([
            'trang_thai_don' => 'required|string'
        ]);

        if ($request->trang_thai_don === 'Dang_O' || $request->trang_thai_don === 'checked_in') {
            $today = \Carbon\Carbon::today()->startOfDay();
            $checkinDate = \Carbon\Carbon::parse($booking->ngay_checkin)->startOfDay();
            if ($today->lt($checkinDate)) {
                $days = $today->diffInDays($checkinDate);
                return response()->json([
                    'message' => "Chưa đến ngày nhận phòng! Ngày nhận phòng quy định là " . $checkinDate->format('d/m/Y') . " (còn " . $days . " ngày nữa). Nếu muốn nhận phòng vui lòng hủy phòng tạo đơn khác!"
                ], 422);
            }
        }

        $result = DB::transaction(function() use ($booking, $request) {
            $booking->update([
                'trang_thai_don' => $request->trang_thai_don
            ]);

            // Sync room status based on booking status
            if ($request->trang_thai_don === 'Dang_O' || $request->trang_thai_don === 'checked_in') {
                foreach ($booking->chiTietDatPhongs as $detail) {
                    $detail->update(['trang_thai' => 'checked_in']);
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room) {
                        $room->trang_thai_hien_tai = 1;
                        $room->save();
                    }
                }
            } elseif ($request->trang_thai_don === 'Da_Tra_Phong' || $request->trang_thai_don === 'checked_out') {
                foreach ($booking->chiTietDatPhongs as $detail) {
                    $detail->update(['trang_thai' => 'checked_out']);
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room) {
                        $room->trang_thai_hien_tai = 2;
                        $room->mo_ta = '[Dọn dẹp] Thời lượng: 30 phút.';
                        $room->save();
                    }
                }
            } elseif ($request->trang_thai_don === 'Da_Huy' || $request->trang_thai_don === 'cancelled') {
                foreach ($booking->chiTietDatPhongs as $detail) {
                    $detail->update(['trang_thai' => 'cancelled']);
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room) {
                        $room->trang_thai_hien_tai = 0;
                        if (strpos($room->mo_ta ?? '', '[Dọn dẹp]') === 0 || strpos($room->mo_ta ?? '', '[Bảo trì]') === 0) {
                            $room->mo_ta = '';
                        }
                        $room->save();
                    }
                }
            }

            return $booking;
        });

        // 🟢 Ghi nhân viên xử lý vào hóa đơn khi xác nhận thanh toán
        if ($request->trang_thai_don === 'Da_Thanh_Toan') {
            $nhanVienId = Auth::id();
            if ($nhanVienId) {
                $invoice = \App\Models\HoaDonThanhToan::where('don_dat_id', $result->don_dat_id)->first();
                if ($invoice) {
                    $invoice->update([
                        'nhan_vien_tao_id' => $nhanVienId,
                        'ngay_thanh_toan'  => now(),
                    ]);
                } else {
                    \App\Models\HoaDonThanhToan::create([
                        'don_dat_id'           => $result->don_dat_id,
                        'nhan_vien_tao_id'     => $nhanVienId,
                        'ngay_thanh_toan'      => now(),
                        'tong_tien_thanh_toan' => (float) $result->thanh_tien_cuoi,
                        'hinh_thuc_thanh_toan' => 'OFFLINE',
                        'ghi_chu'              => '[Admin] Xác nhận thanh toán',
                    ]);
                }
            }

            // Gửi email hóa đơn sau khi thanh toán thành công
            try {
                $result->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan']);
                $email = $result->khachHang->email ?? null;
                if ($email) {
                    Mail::to($email)->send(new BookingInvoiceMail($result));
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email hóa đơn BookingController: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn và đồng bộ trạng thái phòng thành công.',
            'booking' => $result
        ], 200);
    }
    public function cancel(Request $request, $id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }

        return DB::transaction(function() use ($booking, $request) {
            // Tính toán số ngày từ hôm nay đến ngày check-in
            $today = \Carbon\Carbon::now()->startOfDay();
            $checkIn = \Carbon\Carbon::parse($booking->ngay_checkin)->startOfDay();
            $diffDays = $today->diffInDays($checkIn, false);

            // Kiểm tra xem đơn hàng có phải mới được đặt gần đây không (trong vòng 60 phút)
            $createdAt = $booking->created_at ?? $booking->ngay_dat_don ?? \Carbon\Carbon::now();
            $diffMinutes = \Carbon\Carbon::now()->diffInMinutes(\Carbon\Carbon::parse($createdAt));
            $isRecent = ($diffMinutes <= 60);

            // Lễ tân/Admin có quyền chọn miễn phạt (waive penalty)
            $waivePenalty = $request->waive_penalty ?? false;

            $penaltyPct = 0;
            if (!$waivePenalty && !$isRecent) {
                if ($diffDays >= 14) {
                    $penaltyPct = 0;   // Hủy trước từ 14 ngày trở lên: Miễn 100% phạt
                } elseif ($diffDays >= 7) {
                    $penaltyPct = 30;  // Hủy trước 7 - 13 ngày: Phạt 30% cọc
                } elseif ($diffDays >= 3) {
                    $penaltyPct = 50;  // Hủy trước 3 - 6 ngày: Phạt 50% cọc
                } elseif ($diffDays >= 1) {
                    $penaltyPct = 70;  // Hủy trước 1 - 2 ngày: Phạt 70% cọc
                } else {
                    $penaltyPct = 100; // Hủy trong ngày Check-in (< 24h) hoặc No-Show: Phạt 100% cọc
                }
            }

            $depositPaid = (float)($booking->so_tien_da_coc > 0 ? $booking->so_tien_da_coc : $booking->thanh_tien_cuoi);
            $penaltyAmount = ($depositPaid * $penaltyPct) / 100;
            $refundAmount = max(0, $depositPaid - $penaltyAmount);

            $booking->update([
                'trang_thai_don' => 'Da_Huy',
                'ngay_huy_don' => now()
            ]);

            ChiTietDatPhong::where('don_dat_id', $booking->don_dat_id)->update([
                'trang_thai' => 'cancelled'
            ]);

            $reasonText = $request->ly_do ?? 'Do quản trị viên hủy';
            if ($waivePenalty) {
                $reasonText .= " (Miễn phụ thu tiền)";
            }
            $reasonText .= " | Phụ thu hủy phòng: {$penaltyPct}% (" . number_format($penaltyAmount, 0, ',', '.') . "đ), Hoàn tiền: " . number_format($refundAmount, 0, ',', '.') . "đ";

            \App\Models\LichSuHuyDon::create([
                'don_dat_id' => $booking->don_dat_id,
                'nguoi_huy_id' => Auth::id() ?? $booking->khach_hang_id,
                'ly_do' => $reasonText,
                'so_tien_phat' => $penaltyAmount,
                'so_tien_hoan' => $refundAmount
            ]);

            return response()->json([
                'message' => 'Đã hủy đơn đặt phòng thành công.',
                'so_tien_phat' => $penaltyAmount,
                'so_tien_hoan' => $refundAmount
            ], 200);
        });
    }
    public function changeRoom(Request $request, $id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng.'], 404);
        }

        $request->validate([
            'chi_tiet_dat_phong_id' => 'required|exists:chi_tiet_dat_phong,chi_tiet_dat_phong_id',
            'phong_moi_id' => 'required|exists:phong,phong_id',
            'ly_do' => 'nullable|string',
            'phu_thu' => 'nullable|numeric'
        ]);

        $detail = ChiTietDatPhong::find($request->chi_tiet_dat_phong_id);
        if (!$detail || $detail->don_dat_id != $booking->don_dat_id) {
            return response()->json(['message' => 'Chi tiết đặt phòng không khớp với đơn đặt.'], 400);
        }

        $oldRoomId = $detail->phong_id;

        DB::transaction(function() use ($detail, $request, $oldRoomId) {
            $detail->update([
                'phong_id' => $request->phong_moi_id
            ]);

            \App\Models\LichSuDoiPhong::create([
                'chi_tiet_dat_phong_id' => $detail->chi_tiet_dat_phong_id,
                'phong_cu' => $oldRoomId,
                'phong_moi' => $request->phong_moi_id,
                'thoi_gian' => now(),
                'ly_do' => $request->ly_do ?? 'Quản trị viên đổi phòng',
                'phu_thu_thanh_toan' => $request->phu_thu ?? 0
            ]);
        });

        return response()->json(['message' => 'Đổi phòng thành công!'], 200);
    }
}
