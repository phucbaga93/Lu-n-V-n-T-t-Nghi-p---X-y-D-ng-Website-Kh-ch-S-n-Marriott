<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\ChiTietDatPhong;
use App\Models\Phong;
use App\Models\NguoiDung;
use App\Models\HoaDonThanhToan;
use App\Models\LichSuDoiPhong;
use App\Models\LichSuHuyDon;
use App\Models\KhuyenMai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingInvoiceMail;

class BookingAPIController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: LẤY DANH SÁCH ĐƠN ĐẶT PHÒNG CỦA KHÁCH HÀNG HOẶC QUẢN TRỊ VIÊN
    // =========================================================================
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong']);

        if ($userId) {
            $query->where('khach_hang_id', $userId);
        }

        return response()->json($query->orderBy('ngay_dat_don', 'desc')->get(), 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: LẤY THÔNG TIN CHI TIẾT 1 ĐƠN ĐẶT PHÒNG (BAO GỒM HÓA ĐƠN)
    // =========================================================================
    public function show($id)
    {
        $booking = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Đơn đặt phòng không tồn tại.'], 404);
        }

        return response()->json($booking, 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: TẠO ĐƠN ĐẶT PHÒNG THÀNH VIÊN (MEMBER BOOKING ENGINE)
    // =========================================================================
    public function store(Request $request)
    {
        // Khống chế thời gian đặt không vượt quá 6 tháng
        $maxDate = Carbon::now()->addMonths(6)->toDateString();
        $request->validate([
            'khach_hang_id' => 'required|exists:nguoi_dung,nguoi_dung_id',
            'ngay_checkin' => 'required|date|after_or_equal:today|before_or_equal:' . $maxDate,
            'ngay_checkout' => 'required|date|after:ngay_checkin',
            'loai_phong_id' => 'required|exists:loai_phong,loai_phong_id',
            'so_nguoi_lon' => 'required|integer',
            'so_tre_em' => 'integer',
            'ma_khuyen_mai_id' => 'nullable|exists:khuyen_mai,ma_code'
        ], [
            'khach_hang_id.required' => 'Vui lòng đăng nhập tài khoản trước khi đặt phòng.',
            'khach_hang_id.exists' => 'Tài khoản người dùng không tồn tại.',
            'ngay_checkin.required' => 'Vui lòng chọn ngày nhận phòng (Check-in).',
            'ngay_checkin.after_or_equal' => 'Ngày nhận phòng không được nằm trong quá khứ.',
            'ngay_checkin.before_or_equal' => 'Khách sạn chỉ tiếp nhận đặt phòng trước tối đa 6 tháng.',
            'ngay_checkout.required' => 'Vui lòng chọn ngày trả phòng (Check-out).',
            'ngay_checkout.after' => 'Ngày trả phòng (Check-out) phải sau ngày nhận phòng.',
            'loai_phong_id.required' => 'Vui lòng chọn hạng phòng hợp lệ.',
            'loai_phong_id.exists' => 'Hạng phòng đã chọn không tồn tại trên hệ thống.',
            'so_nguoi_lon.required' => 'Vui lòng nhập số lượng người lớn.',
            'ma_khuyen_mai_id.exists' => 'Mã khuyến mãi không hợp lệ hoặc đã bị vô hiệu hóa.'
        ]);

        $checkIn = $request->ngay_checkin;
        $checkOut = $request->ngay_checkout;
        $category_id = $request->loai_phong_id;

        // 🛡️ QUY ĐỊNH BẢO MẬT: Đặt trước > 14 ngày hoặc Lưu trú > 14 đêm bắt buộc Thanh toán VNPay
        $nights = Carbon::parse($checkIn)->diffInDays(Carbon::parse($checkOut));
        $diffDays = Carbon::now()->startOfDay()->diffInDays(Carbon::parse($checkIn), false);
        if (($diffDays > 14 || $nights > 14) && $request->payment_method === 'counter') {
            return response()->json([
                'message' => 'Các đơn đặt trước trên 14 ngày hoặc lưu trú trên 14 đêm bắt buộc phải Thanh toán trực tuyến qua VNPay để giữ phòng cố định.'
            ], 422);
        }

        // 🟢 BẮT ĐẦU TRANSACTON CSDL ĐỂ TỰ ĐỘNG KHÓA VÀ GÁN PHÒNG TRỐNG
        return DB::transaction(function() use ($request, $checkIn, $checkOut, $category_id) {
            
            // 🟢 TÌM MỘT PHÒNG VẬT LÝ KHẢ DỤNG THUỘC HẠNG PHÒNG ĐƯỢC CHỌN (CHỐNG GIAO LỊCH)
            $excludeRoomIds = $request->input('exclude_room_ids', []);
            $availableRoom = $this->findAvailablePhysicalRoom($category_id, $checkIn, $checkOut, $excludeRoomIds);

            if (!$availableRoom) {
                return response()->json([
                    'message' => 'Hạng phòng này đã kín lịch trong khoảng thời gian đã chọn.'
                ], 422);
            }

            // 🟢 1. TẠO ĐƠN ĐẶT PHÒNG TRONG BẢNG `don_dat_phong`
            $pct = (string) intval($request->phan_tram_dat_coc ?? 100);
            $booking = DonDatPhong::create([
                'khach_hang_id' => $request->khach_hang_id,
                'nguoi_tao_don' => $request->khach_hang_id,
                'nguon_dat' => 'ONLINE',
                'ma_khuyen_mai_id' => $request->ma_khuyen_mai_id,
                'ngay_checkin' => $checkIn,
                'ngay_checkout' => $checkOut,
                'so_nguoi_lon' => $request->so_nguoi_lon,
                'so_tre_em' => $request->so_tre_em ?? 0,
                'tong_tien_phong' => $request->tong_tien_phong,
                'thanh_tien_cuoi' => $request->thanh_tien_cuoi,
                'phan_tram_dat_coc' => $pct,
                'so_tien_da_coc' => ($request->thanh_tien_cuoi * intval($pct)) / 100,
                'trang_thai_don' => 'Cho_Xac_Nhan',
                'ghi_chu_dac_biet' => $request->ghi_chu_dac_biet
            ]);

            if ($request->ma_khuyen_mai_id) {
                $promo = KhuyenMai::where('ma_code', $request->ma_khuyen_mai_id)->first();
                if ($promo) {
                    $maxUses = (int) ($promo->so_luong_gioi_han ?? 0);
                    $usedCount = (int) ($promo->so_lan_da_su_dung ?? 0);
                    if ($maxUses > 0 && $usedCount >= $maxUses) {
                        return response()->json([
                            'message' => "Mã khuyến mãi '{$promo->ma_code}' đã hết lượt sử dụng."
                        ], 422);
                    }
                    $promo->increment('so_lan_da_su_dung');
                }
            }

            // 🟢 2. TẠO DÒNG CHI TIẾT ĐẶT PHÒNG TRONG BẢNG `chi_tiet_dat_phong`
            ChiTietDatPhong::create([
                'don_dat_id' => $booking->don_dat_id,
                'phong_id' => $availableRoom->phong_id,
                'gia_ap_dung' => $request->gia_ap_dung ?? $availableRoom->loaiPhong->gia_theo_dem,
                'trang_thai' => 'booked'
            ]);

            // 🟢 3. GỬI EMAIL XÁC NHẬN ĐẶT PHÒNG (Chỉ gửi ngay nếu Thanh toán tại quầy, còn VNPay sẽ gửi sau khi thanh toán thành công)
            if ($request->payment_method !== 'vnpay') {
                try {
                    $booking->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong']);
                    $email = $booking->khachHang->email ?? null;
                    if ($email) {
                        Mail::to($email)->send(new BookingInvoiceMail($booking));
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email xác nhận đặt phòng (store): ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Khởi tạo đơn đặt phòng thành công!',
                'booking' => $booking
            ], 201);
        });
    }

    // =========================================================================
    // NGHIỆP VỤ: ĐẶT PHÒNG NHANH CHO KHÁCH VÃNG LAI (GUEST QUICK BOOKING)
    // Tự động khởi tạo tài khoản mới nếu chưa tồn tại trong hệ thống
    // =========================================================================
    public function storeGuestBooking(Request $request)
    {
        $maxDate = Carbon::now()->addMonths(6)->toDateString();
        $request->validate([
            'guest_name' => 'required|string|max:100',
            'guest_email' => 'required|email',
            'guest_phone' => 'required|string|regex:/^[0-9]{10}$/',
            'guest_cccd' => 'required|string',
            'ngay_checkin' => 'required|date|after_or_equal:today|before_or_equal:' . $maxDate,
            'ngay_checkout' => 'required|date|after:ngay_checkin',
            'loai_phong_id' => 'required|exists:loai_phong,loai_phong_id',
            'so_nguoi_lon' => 'required|integer',
            'so_tre_em' => 'integer',
            'ma_khuyen_mai_id' => 'nullable|exists:khuyen_mai,ma_code'
        ], [
            'guest_name.required' => 'Vui lòng nhập họ và tên khách hàng.',
            'guest_name.max' => 'Họ và tên không được vượt quá 100 ký tự.',
            'guest_email.required' => 'Vui lòng nhập địa chỉ Email liên hệ.',
            'guest_email.email' => 'Địa chỉ Email không hợp lệ. Vui lòng kiểm tra lại (ví dụ: ten@gmail.com).',
            'guest_phone.required' => 'Vui lòng nhập số điện thoại liên hệ.',
            'guest_phone.regex' => 'Số điện thoại không hợp lệ (phải bao gồm đúng 10 chữ số).',
            'guest_cccd.required' => 'Vui lòng nhập số CCCD/CMND.',
            'ngay_checkin.required' => 'Vui lòng chọn ngày nhận phòng (Check-in).',
            'ngay_checkin.after_or_equal' => 'Ngày nhận phòng không được nằm trong quá khứ.',
            'ngay_checkin.before_or_equal' => 'Khách sạn chỉ tiếp nhận đặt phòng trước tối đa 6 tháng.',
            'ngay_checkout.required' => 'Vui lòng chọn ngày trả phòng (Check-out).',
            'ngay_checkout.after' => 'Ngày trả phòng (Check-out) phải sau ngày nhận phòng.',
            'loai_phong_id.required' => 'Vui lòng chọn hạng phòng hợp lệ.',
            'loai_phong_id.exists' => 'Hạng phòng đã chọn không tồn tại trên hệ thống.',
            'so_nguoi_lon.required' => 'Vui lòng nhập số lượng người lớn.',
            'ma_khuyen_mai_id.exists' => 'Mã khuyến mãi không hợp lệ hoặc đã bị vô hiệu hóa.'
        ]);

        return DB::transaction(function() use ($request) {
            // 🟢 ĐỐI SOÁT TÌM HOẶC TỰ ĐỘNG ĐĂNG KÝ TÀI KHOẢN TẠM CHO KHÁCH VÃNG LAI:
            $email = trim($request->guest_email);
            $phone = trim($request->guest_phone ?? '');
            $cccd = trim($request->guest_cccd ?? '');
            $name = trim($request->guest_name ?? '');

            // 🛑 CHẶN NGAY NẾU EMAIL HẶC SĐT TRÙNG VỚI TÀI KHOẢN THÀNH VIÊN ĐÃ ĐĂNG KÝ TRÊN HỆ THỐNG
            $existingRegisteredUser = NguoiDung::where(function($q) use ($email, $phone) {
                    $q->where('email', $email);
                    if (!empty($phone)) {
                        $q->orWhere('so_dien_thoai', $phone);
                    }
                })
                ->where('mat_khau', '!=', 'GUEST_NO_ACCOUNT')
                ->first();

            if ($existingRegisteredUser) {
                return response()->json([
                    'message' => '⚠️ Email hoặc Số điện thoại này (' . ($phone ? $phone . ' / ' : '') . $email . ') đã được đăng ký tài khoản thành viên trên hệ thống Marriott Hotel! Vui lòng ĐĂNG NHẬP tài khoản của bạn để nhận ưu đãi thành viên và tiếp tục đặt phòng, hoặc sử dụng Email/SĐT khác nếu là khách vãng lai khác.'
                ], 422);
            }

            // 1. Kiểm tra xem Email, SĐT hoặc CCCD đã có trong bảng nguoi_dung chưa (đã có từ đơn vãng lai trước đó)
            $user = NguoiDung::where('email', $email)->first();
            if (!$user && !empty($phone)) {
                $user = NguoiDung::where('so_dien_thoai', $phone)->first();
            }
            if (!$user && !empty($cccd)) {
                $user = NguoiDung::where('cccd', $cccd)->first();
            }

            if ($user) {
                // Cập nhật các thông tin nếu user chưa có
                $updates = [];
                if (empty($user->ho_ten) && !empty($name)) $updates['ho_ten'] = $name;
                if (empty($user->so_dien_thoai) && !empty($phone)) $updates['so_dien_thoai'] = $phone;
                if (empty($user->cccd) && !empty($cccd)) $updates['cccd'] = $cccd;
                if (!empty($updates)) $user->update($updates);
            } else {
                try {
                    $user = NguoiDung::create([
                        'ho_ten' => $name,
                        'email' => $email,
                        'mat_khau' => 'GUEST_NO_ACCOUNT',
                        'so_dien_thoai' => !empty($phone) ? $phone : null,
                        'cccd' => !empty($cccd) ? $cccd : null,
                        'vai_tro' => 'Khach_Hang'
                    ]);
                } catch (\Illuminate\Database\QueryException $e) {
                    // Nếu gặp trùng Unique Index do tranh chấp, lấy user đang chứa SĐT/CCCD/Email
                    $user = NguoiDung::where('so_dien_thoai', $phone)
                        ->orWhere('cccd', $cccd)
                        ->orWhere('email', $email)
                        ->first();
                }
            }

            // Gán phòng vật lý khả dụng
            $excludeRoomIds = $request->input('exclude_room_ids', []);
            $availableRoom = $this->findAvailablePhysicalRoom($request->loai_phong_id, $request->ngay_checkin, $request->ngay_checkout, $excludeRoomIds);
            if (!$availableRoom) {
                return response()->json(['message' => 'Hạng phòng đã hết chỗ trống.'], 422);
            }

            $pct = (string) intval($request->phan_tram_dat_coc ?? 100);
            $booking = DonDatPhong::create([
                'khach_hang_id' => $user->nguoi_dung_id,
                'nguoi_tao_don' => $user->nguoi_dung_id,
                'nguon_dat' => 'ONLINE',
                'ma_khuyen_mai_id' => $request->ma_khuyen_mai_id,
                'ngay_checkin' => $request->ngay_checkin,
                'ngay_checkout' => $request->ngay_checkout,
                'so_nguoi_lon' => $request->so_nguoi_lon,
                'so_tre_em' => $request->so_tre_em ?? 0,
                'tong_tien_phong' => $request->tong_tien_phong,
                'thanh_tien_cuoi' => $request->thanh_tien_cuoi,
                'phan_tram_dat_coc' => $pct,
                'so_tien_da_coc' => ($request->thanh_tien_cuoi * intval($pct)) / 100,
                'trang_thai_don' => 'Cho_Xac_Nhan',
                'ghi_chu_dac_biet' => 'Đặt phòng trực tuyến nhanh'
            ]);

            if ($request->ma_khuyen_mai_id) {
                $promo = KhuyenMai::where('ma_code', $request->ma_khuyen_mai_id)->first();
                if ($promo) {
                    $maxUses = (int) ($promo->so_luong_gioi_han ?? 0);
                    $usedCount = (int) ($promo->so_lan_da_su_dung ?? 0);
                    if ($maxUses > 0 && $usedCount >= $maxUses) {
                        return response()->json([
                            'message' => "Mã khuyến mãi '{$promo->ma_code}' đã hết lượt sử dụng."
                        ], 422);
                    }
                    $promo->increment('so_lan_da_su_dung');
                }
            }

            ChiTietDatPhong::create([
                'don_dat_id' => $booking->don_dat_id,
                'phong_id' => $availableRoom->phong_id,
                'gia_ap_dung' => $request->gia_ap_dung ?? $availableRoom->loaiPhong->gia_theo_dem,
                'trang_thai' => 'booked'
            ]);

            // Gửi email xác nhận đặt phòng (Chỉ gửi ngay nếu Thanh toán tại quầy)
            if ($request->payment_method !== 'vnpay') {
                try {
                    $booking->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong']);
                    $email = $booking->khachHang->email ?? null;
                    if ($email) {
                        Mail::to($email)->send(new BookingInvoiceMail($booking));
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email xác nhận đặt phòng (storeGuest): ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Đặt phòng trực tuyến thành công!',
                'booking' => $booking
            ], 201);
        });
    }

    // =========================================================================
    // HELPER: THUẬT TOÁN TÌM PHÒNG VẬT LÝ KHÔNG BỊ TRÙNG THỜI GIAN ĐẶT
    // =========================================================================
    private function findAvailablePhysicalRoom($category_id, $checkIn, $checkOut, array $excludeRoomIds = [])
    {
        $query = Phong::where('loai_phong_id', $category_id)
            ->where('trang_thai_hien_tai', '!=', 3); // Bỏ qua phòng đang bảo trì

        if (!empty($excludeRoomIds)) {
            $query->whereNotIn('phong_id', $excludeRoomIds);
        }

        $rooms = $query->with(['loaiPhong'])->get();

        foreach ($rooms as $room) {
            // 🟢 THUẬT TOÁN ĐỐI SOÁT GIAO THỜI GIAN TRÁNH OVERBOOKING
            $hasOverlap = ChiTietDatPhong::where('phong_id', $room->phong_id)
                ->where('trang_thai', '!=', 'cancelled')
                ->whereHas('donDatPhong', function($query) use ($checkIn, $checkOut) {
                    $query->whereNotIn('trang_thai_don', ['Da_Huy', 'Da_Tra_Phong', 'No_Show'])
                        ->where(function($q) use ($checkIn, $checkOut) {
                            $q->where('ngay_checkin', '<', $checkOut)
                              ->where('ngay_checkout', '>', $checkIn);
                        });
                })->exists();

            if (!$hasOverlap) {
                return $room; // Trả về phòng trống đầu tiên chưa bị trùng
            }
        }

        return null;
    }

    // =========================================================================
    // NGHIỆP VỤ: HỦY ĐƠN ĐẶT PHÒNG VÀ GHI LOG LỊCH SỬ HỦY
    // =========================================================================
    public function cancelBooking(Request $request, $id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Đơn hàng không tồn tại.'], 404);
        }

        return DB::transaction(function() use ($booking, $request) {
            // Tính toán thời gian đặt và ngày check-in
            $today = Carbon::now()->startOfDay();
            $checkIn = Carbon::parse($booking->ngay_checkin)->startOfDay();
            $diffDays = $today->diffInDays($checkIn, false);

            // Kiểm tra xem đơn hàng mới được đặt gần đây hay không (trong vòng 60 phút)
            $createdAt = $booking->created_at ?? $booking->ngay_dat_don ?? Carbon::now();
            $diffMinutes = abs(Carbon::now()->diffInMinutes(Carbon::parse($createdAt), false));
            $isRecent = ($diffMinutes <= 60);

            // Quy tắc phạt cọc phân tầng (30% - 50% - 70% - 100%):
            // 1. Mới đặt trong vòng 60 phút HOẶC Hủy trước ngày Check-in >= 14 ngày: MIỄN PHẠT (0% phạt) -> Hoàn 100% tiền cọc
            // 2. Hủy trước ngày Check-in từ 7 đến 13 ngày: Phạt 30% tiền cọc (Hoàn 70%)
            // 3. Hủy trước ngày Check-in từ 3 đến 6 ngày: Phạt 50% tiền cọc (Hoàn 50%)
            // 4. Hủy trước ngày Check-in từ 1 đến 2 ngày: Phạt 70% tiền cọc (Hoàn 30%)
            // 5. Hủy trong vòng 24h trước Check-in (trong ngày Check-in) hoặc sau Check-in: Phạt 100% tiền cọc (No-Show)
            $penaltyPct = 0;
            if (!$isRecent) {
                if ($diffDays >= 14) {
                    $penaltyPct = 0;
                } elseif ($diffDays >= 7) {
                    $penaltyPct = 30;
                } elseif ($diffDays >= 3) {
                    $penaltyPct = 50;
                } elseif ($diffDays >= 1) {
                    $penaltyPct = 70;
                } else {
                    $penaltyPct = 100;
                }
            }

            // Số tiền cọc thực tế khách đã nộp (hoặc tổng tiền nếu cọc 100%)
            $depositPaid = (float)($booking->so_tien_da_coc > 0 ? $booking->so_tien_da_coc : $booking->thanh_tien_cuoi);
            $penaltyAmount = ($depositPaid * $penaltyPct) / 100;
            $refundAmount = max(0, $depositPaid - $penaltyAmount);

            // 1. Cập nhật trạng thái đơn thành Da_Huy
            $booking->update([
                'trang_thai_don' => 'Da_Huy',
                'ngay_huy_don' => Carbon::now()
            ]);

            // 2. Giải phóng chi tiết đơn đặt phòng
            ChiTietDatPhong::where('don_dat_id', $booking->don_dat_id)->update([
                'trang_thai' => 'cancelled'
            ]);

            $reasonText = $request->ly_do ?? 'Khách hủy trực tuyến';
            $reasonText .= " | Phụ thu hủy phòng: {$penaltyPct}% (" . number_format($penaltyAmount, 0, ',', '.') . "đ), Hoàn tiền cọc: " . number_format($refundAmount, 0, ',', '.') . "đ";

            // 3. Ghi vết nhật ký lịch sử hủy đơn vào CSDL MySQL
            LichSuHuyDon::create([
                'don_dat_id' => $booking->don_dat_id,
                'nguoi_huy_id' => $booking->khach_hang_id,
                'ly_do' => $reasonText,
                'so_tien_phat' => $penaltyAmount,
                'so_tien_hoan' => $refundAmount
            ]);

            return response()->json([
                'message' => 'Đã hủy đơn hàng thành công.',
                'so_tien_phat' => $penaltyAmount,
                'so_tien_hoan' => $refundAmount
            ], 200);
        });
    }

    // =========================================================================
    // NGHIỆP VỤ: LẬP HÓA ĐƠN & XÁC NHẬN THANH TOÁN TRỰC NẮM TẠI QUẦY HOẶC ONLINE
    // =========================================================================
    public function pay(Request $request, $id)
    {
        $booking = DonDatPhong::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Mã đặt phòng không chính xác.'], 404);
        }

        DB::transaction(function() use ($booking, $request) {
            $booking->update(['trang_thai_don' => 'Da_Thanh_Toan']);

            HoaDonThanhToan::create([
                'don_dat_id' => $booking->don_dat_id,
                'nhan_vien_tao_id' => $request->user_id ?? 1,
                'ngay_thanh_toan' => Carbon::now(),
                'tong_tien_thanh_toan' => $booking->thanh_tien_cuoi,
                'hinh_thuc_thanh_toan' => (strtolower($request->payment_method ?? '') === 'vnpay') ? 'VNPAY' : 'OFFLINE',
                'ghi_chu' => 'Thanh toán trực tuyến thành công.'
            ]);
        });

        // Gửi email hóa đơn sau khi thanh toán thành công
        try {
            $booking->load(['khachHang', 'chiTietDatPhongs.phong.loaiPhong', 'hoaDonThanhToan']);
            $email = $booking->khachHang->email ?? null;
            if ($email) {
                Mail::to($email)->send(new BookingInvoiceMail($booking));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email hóa đơn BookingAPI: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Thanh toán hóa đơn phòng thành công!'], 200);
    }

    // --- ALIAS METHODS CHO PHÙ HỢP CẤU TRÚC ROUTING API ---
    public function myBookings(Request $request)
    {
        $userId = Auth::id() ?? $request->query('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Vui lòng cung cấp mã khách hàng.'], 400);
        }

        $query = DonDatPhong::with(['khachHang', 'chiTietDatPhongs.phong.loaiPhong'])
            ->where('khach_hang_id', $userId);

        return response()->json($query->orderBy('ngay_dat_don', 'desc')->get(), 200);
    }

    public function cancel(Request $request, $id)
    {
        return $this->cancelBooking($request, $id);
    }

    // =========================================================================
    // NGHIỆP VỤ: TRA CỨU ĐƠN ĐẶT PHÒNG THEO MÃ ĐƠN & EMAIL/SĐT (DÙNG CHO KHÁCH VÃNG LAI)
    // =========================================================================
    public function lookupBooking(Request $request)
    {
        $request->validate([
            'booking_id' => 'required',
            'email_or_phone' => 'required'
        ]);

        $bookingId = str_ireplace('#', '', $request->booking_id);

        $booking = DonDatPhong::with(['chiTietDatPhongs.phong.loaiPhong', 'khachHang', 'lichSuHuyDons'])
            ->where('don_dat_id', $bookingId)
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng với mã này.'], 404);
        }

        $cust = $booking->khachHang;
        if (!$cust) {
            return response()->json(['message' => 'Thông tin khách hàng của đơn đặt phòng không khả dụng.'], 404);
        }

        // 🟢 TIÊU CHÍ BẢO MẬT: Kiểm tra thông tin liên hệ nhập vào có khớp với tài khoản đặt không
        $inputContact = trim($request->email_or_phone);
        $emailMatch = !empty($cust->email) && (strcasecmp(trim($cust->email), $inputContact) === 0);
        $phoneMatch = !empty($cust->so_dien_thoai) && (trim($cust->so_dien_thoai) === $inputContact || str_ends_with(trim($cust->so_dien_thoai), $inputContact) || str_ends_with($inputContact, trim($cust->so_dien_thoai)));
        $cccdMatch = !empty($cust->cccd) && (trim($cust->cccd) === $inputContact);
        $nameMatch = !empty($cust->ho_ten) && (mb_strtolower(trim($cust->ho_ten)) === mb_strtolower($inputContact));

        if (!$emailMatch && !$phoneMatch && !$cccdMatch && !$nameMatch) {
            return response()->json(['message' => 'Thông tin Email hoặc Số điện thoại đặt phòng không khớp với mã đơn đặt phòng này.'], 404);
        }

        // 🟢 TIÊU CHÍ ĐỐI SOÁT GỘP ĐƠN GIỎ HÀNG NHIỀU PHÒNG:
        // 1. Kiểm tra xem ghi_chu_dac_biet có chứa thẻ [MaGioHang: GHxxx] không
        // 2. Hoặc tìm các đơn cùng khach_hang_id trong mốc thời gian (10 phút)
        $cartGroupTag = null;
        if (!empty($booking->ghi_chu_dac_biet) && preg_match('/\[MaGioHang:\s*(GH\d+)\]/i', $booking->ghi_chu_dac_biet, $m)) {
            $cartGroupTag = $m[1];
        }

        $query = DonDatPhong::with(['chiTietDatPhongs.phong.loaiPhong', 'lichSuHuyDons']);
        if ($cartGroupTag) {
            $query->where('ghi_chu_dac_biet', 'LIKE', "%[MaGioHang: {$cartGroupTag}]%");
        } else {
            $bookingTime = \Carbon\Carbon::parse($booking->ngay_dat_don ?? $booking->created_at ?? now());
            $query->where('khach_hang_id', $booking->khach_hang_id)
                  ->where('ngay_checkin', $booking->ngay_checkin)
                  ->where('ngay_checkout', $booking->ngay_checkout)
                  ->whereBetween('ngay_dat_don', [$bookingTime->copy()->subMinutes(5), $bookingTime->copy()->addMinutes(5)]);
        }

        $sessionBookings = $query->get();

        if ($sessionBookings->count() > 1) {
            $allDetails = collect();
            $allLichSuHuys = collect($booking->lichSuHuyDons ?? []);
            $totalTongTienPhong = 0;
            $totalThanhTienCuoi = 0;
            $totalSoTienDaCoc = 0;
            $relatedBookingIds = [];

            foreach ($sessionBookings as $sb) {
                $relatedBookingIds[] = '#' . $sb->don_dat_id;
                foreach ($sb->chiTietDatPhongs as $detail) {
                    $detail->don_dat_id_goc = $sb->don_dat_id;
                    $detail->trang_thai_don_goc = $sb->trang_thai_don;
                    if (in_array($sb->trang_thai_don, ['Da_Huy', 'cancelled']) && $detail->trang_thai !== 'cancelled') {
                        $detail->trang_thai = 'cancelled';
                    }
                    $allDetails->push($detail);
                }
                if ($sb->lichSuHuyDons && $sb->lichSuHuyDons->count() > 0) {
                    $allLichSuHuys = $allLichSuHuys->concat($sb->lichSuHuyDons);
                }
                $totalTongTienPhong += (float) $sb->tong_tien_phong;
                $totalThanhTienCuoi += (float) $sb->thanh_tien_cuoi;
                $totalSoTienDaCoc += (float) $sb->so_tien_da_coc;
            }

            $booking->setRelation('chiTietDatPhongs', $allDetails);
            $booking->setRelation('lichSuHuyDons', $allLichSuHuys->unique('lich_su_id'));
            $booking->tong_tien_phong = $totalTongTienPhong;
            $booking->thanh_tien_cuoi = $totalThanhTienCuoi;
            $booking->so_tien_da_coc = $totalSoTienDaCoc;
            $booking->ghi_chu_dac_biet = 'Đơn giỏ hàng gồm ' . $sessionBookings->count() . ' phòng (Mã các đơn: ' . implode(', ', $relatedBookingIds) . ')';
        }

        return response()->json($booking, 200);
    }

    private function removeAccents($str)
    {
        $str = preg_replace("/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/", 'a', $str);
        $str = preg_replace("/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/", 'e', $str);
        $str = preg_replace("/(ì|í|ị|ỉ|ĩ)/", 'i', $str);
        $str = preg_replace("/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/", 'o', $str);
        $str = preg_replace("/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/", 'u', $str);
        $str = preg_replace("/(ỳ|ý|ỵ|ỷ|ỹ)/", 'y', $str);
        $str = preg_replace("/(đ)/", 'd', $str);
        $str = preg_replace("/(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)/", 'a', $str);
        $str = preg_replace("/(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)/", 'e', $str);
        $str = preg_replace("/(Ì|Í|Ị|Ỉ|Ĩ)/", 'i', $str);
        $str = preg_replace("/(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)/", 'o', $str);
        $str = preg_replace("/(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)/", 'u', $str);
        $str = preg_replace("/(Ỳ|Ý|Ỵ|Ỷ|Ỹ)/", 'y', $str);
        $str = preg_replace("/(Đ)/", 'd', $str);
        return preg_replace('/\s+/', ' ', trim($str));
    }

    private function isNameMatch($name1, $name2)
    {
        $n1 = mb_strtolower($this->removeAccents($name1), 'UTF-8');
        $n2 = mb_strtolower($this->removeAccents($name2), 'UTF-8');
        return $n1 === $n2;
    }
}
