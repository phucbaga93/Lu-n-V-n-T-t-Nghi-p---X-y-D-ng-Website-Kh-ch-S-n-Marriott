<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\ForgotPasswordMail;

class LoginController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: ĐĂNG NHẬP VÀ GIỚI HẠN THỬ SAI BẢO MẬT (CACHE BRUTE-FORCE LOCKOUT)
    // =========================================================================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'mat_khau' => 'required|string'
        ]);

        // 🟢 DÒNG CODE KIỂM TRA CACHE XEM TÀI KHOẢN CÓ ĐANG BỊ KHÓA 15 PHÚT KHÔNG:
        $lockKey = 'login_lockout_' . $request->email;
        if (\Illuminate\Support\Facades\Cache::has($lockKey)) {
            $secondsLeft = \Illuminate\Support\Facades\Cache::get($lockKey) - time();
            if ($secondsLeft > 0) {
                $minutesLeft = ceil($secondsLeft / 60);
                return response()->json([
                    'message' => 'Tài khoản này đã bị khóa do nhập sai quá 5 lần. Vui lòng thử lại sau ' . $minutesLeft . ' phút.'
                ], 403);
            } else {
                // Hết thời gian 15 phút -> Xóa key khóa trong Cache
                \Illuminate\Support\Facades\Cache::forget($lockKey);
            }
        }

        $user = NguoiDung::where('email', $request->email)->first();

        // 🔴 XỬ LÝ KHI EMAIL KHÔNG TỒN TẠI TRÊN HỆ THỐNG:
        if (!$user) {
            // Tăng số lần thử sai trong Cache (Lưu tại storage/framework/cache/data/)
            $attemptsKey = 'login_attempts_' . $request->email;
            $attempts = \Illuminate\Support\Facades\Cache::get($attemptsKey, 0) + 1;
            \Illuminate\Support\Facades\Cache::put($attemptsKey, $attempts, now()->addMinutes(15));

            // Nếu nhập sai từ 5 lần trở lên -> Khóa tài khoản 15 phút trong Cache
            if ($attempts >= 5) {
                \Illuminate\Support\Facades\Cache::put($lockKey, time() + 15 * 60, now()->addMinutes(15));
                \Illuminate\Support\Facades\Cache::forget($attemptsKey);
                return response()->json([
                    'message' => 'Tài khoản này đã bị khóa 15 phút do đăng nhập sai 5 lần.'
                ], 403);
            }

            $remaining = 5 - $attempts;
            return response()->json([
                'message' => 'Địa chỉ Email đăng nhập không tồn tại trên hệ thống. Bạn còn ' . $remaining . ' lần thử.'
            ], 401);
        }

        // 🔴 XỬ LÝ KHI LÀ TÀI KHOẢN KHÁCH VÃNG LAI (CHƯA ĐĂNG KÝ MẬT KHẨU THÀNH VIÊN)
        if ($user->mat_khau === 'GUEST_NO_ACCOUNT') {
            return response()->json([
                'message' => 'Email này hiện chỉ lưu thông tin khách vãng lai khi đặt phòng. Vui lòng chuyển sang trang Đăng ký để thiết lập mật khẩu thành viên!'
            ], 401);
        }

        // 🟢 ĐỐI SOÁT MẬT KHẨU BẰNG THUẬT TOÁN BĂM BCRYPT:
        $passwordMatches = Hash::check($request->mat_khau, $user->mat_khau);

        // 🔴 XỬ LÝ KHI NHẬP SAI MẬT KHẨU:
        if (!$passwordMatches) {
            $attemptsKey = 'login_attempts_' . $request->email;
            $attempts = \Illuminate\Support\Facades\Cache::get($attemptsKey, 0) + 1;
            \Illuminate\Support\Facades\Cache::put($attemptsKey, $attempts, now()->addMinutes(15));

            // Sai đủ 5 lần -> Kích hoạt khóa 15 phút
            if ($attempts >= 5) {
                \Illuminate\Support\Facades\Cache::put($lockKey, time() + 15 * 60, now()->addMinutes(15));
                \Illuminate\Support\Facades\Cache::forget($attemptsKey);
                return response()->json([
                    'message' => 'Tài khoản này đã bị khóa 15 phút do đăng nhập sai 5 lần.'
                ], 403);
            }

            $remaining = 5 - $attempts;
            return response()->json([
                'message' => 'Mật khẩu đăng nhập không chính xác. Bạn còn ' . $remaining . ' lần thử.'
            ], 401);
        }

        // 🟢 ĐĂNG NHẬP THÀNH CÔNG: Xóa lượt đếm sai trong Cache
        \Illuminate\Support\Facades\Cache::forget('login_attempts_' . $request->email);

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'user' => [
                'nguoi_dung_id' => $user->nguoi_dung_id,
                'ho_ten' => $user->ho_ten,
                'email' => $user->email,
                'so_dien_thoai' => $user->so_dien_thoai,
                'cccd' => $user->cccd,
                'dia_chi' => $user->dia_chi,
                'vai_tro' => $user->vai_tro,
                'created_at' => $user->created_at
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        if (Auth::check()) {
            Auth::logout();
        }
        return response()->json(['message' => 'Đã đăng xuất thành công.'], 200);
    }

    public function me(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Vui lòng đăng nhập.'], 401);
        }
        return response()->json($user, 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: QUÊN MẬT KHẨU (GỬI MẬT KHẨU TẠM QUA GMAIL SMTP)
    // =========================================================================
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = NguoiDung::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Địa chỉ Email này không tồn tại trên hệ thống.'
            ], 404);
        }

        // 🟢 DÒNG CODE SINH MẬT KHẨU TẠM NGẪU NHIÊN 8 KÝ TỰ:
        $tempPassword = Str::random(8);

        // 🟢 DÒNG CODE BĂM MẬT KHẨU BCRYPT VÀ LƯU TRỰC TIẾP VÀO CSDL MYSQL:
        $user->mat_khau = Hash::make($tempPassword);
        $user->save();

        // 🟢 DÒNG CODE GỬI GMAIL SMTP KÈM BẮT LỖI GHI LOG NẾU MẤT MẠNG:
        try {
            Mail::to($user->email)->send(new ForgotPasswordMail($user, $tempPassword));
        } catch (\Exception $e) {
            // Nếu lỗi kết nối SMTP, ghi log lỗi chi tiết vào file storage/logs/laravel.log
            \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email khôi phục mật khẩu: ' . $e->getMessage());
            return response()->json([
                'message' => 'Không thể gửi email mật khẩu tạm thời do lỗi kết nối SMTP: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mật khẩu tạm thời đã được gửi đến email của bạn thành công!'
        ], 200);
    }
}
