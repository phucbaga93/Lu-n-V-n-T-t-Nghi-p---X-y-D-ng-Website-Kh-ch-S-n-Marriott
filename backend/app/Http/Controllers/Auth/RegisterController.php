<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\RegisterSuccessMail;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'ho_ten' => 'required|string|max:100',
            'email' => 'required|email',
            'mat_khau' => 'required|string|min:6',
            'so_dien_thoai' => 'nullable|string',
            'cccd' => 'nullable|string',
            'ngay_sinh' => 'nullable|date',
            'dia_chi' => 'nullable|string'
        ]);

        $email = trim($request->email);
        $name = trim($request->ho_ten);
        $phone = trim($request->so_dien_thoai ?? '');
        $cccd = trim($request->cccd ?? '');

        $user = NguoiDung::where('email', $email)->first();

        // 1. Kiểm tra Số điện thoại xem có thuộc về tài khoản người dùng khác không
        if (!empty($phone)) {
            $phoneQuery = NguoiDung::where('so_dien_thoai', $phone);
            if ($user) $phoneQuery->where('nguoi_dung_id', '!=', $user->nguoi_dung_id);
            if ($phoneQuery->exists()) {
                return response()->json([
                    'message' => 'Số điện thoại này đã được đăng ký bởi một tài khoản khác trên hệ thống. Vui lòng kiểm tra lại!'
                ], 422);
            }
        }

        // 2. Kiểm tra CCCD xem có thuộc về tài khoản người dùng khác không
        if (!empty($cccd)) {
            $cccdQuery = NguoiDung::where('cccd', $cccd);
            if ($user) $cccdQuery->where('nguoi_dung_id', '!=', $user->nguoi_dung_id);
            if ($cccdQuery->exists()) {
                return response()->json([
                    'message' => 'Số CCCD/CMND này đã được đăng ký bởi một tài khoản khác trên hệ thống. Vui lòng kiểm tra lại!'
                ], 422);
            }
        }

        if ($user) {
            // Đối chiếu thông tin Họ tên, SĐT, CCCD với dữ liệu đã lưu cho Gmail này
            $nameMatches = empty($user->ho_ten) || NguoiDung::isNameMatch($user->ho_ten, $name);
            $phoneMatches = empty($user->so_dien_thoai) || empty($phone) || (trim($user->so_dien_thoai) === $phone);
            $cccdMatches = empty($user->cccd) || empty($cccd) || (trim($user->cccd) === $cccd);

            if (!$nameMatches || !$phoneMatches || !$cccdMatches) {
                return response()->json([
                    'message' => 'Gmail này đã tồn tại trên hệ thống nhưng thông tin Tên tài khoản, Số điện thoại hoặc CCCD nhập vào không trùng khớp với dữ liệu đã lưu. Vui lòng kiểm tra lại thông tin!'
                ], 422);
            }

            // Nếu đã có tài khoản thành viên chính thức (đã có mật khẩu thực sự)
            if ($user->mat_khau !== 'GUEST_NO_ACCOUNT') {
                return response()->json(['message' => 'Email này đã được đăng ký tài khoản thành viên. Vui lòng chuyển sang trang đăng nhập.'], 422);
            }

            // Chuyển đổi từ hồ sơ khách vãng lai sang tài khoản thành viên chính thức
            $user->update([
                'ho_ten' => $name,
                'mat_khau' => Hash::make($request->mat_khau),
                'so_dien_thoai' => !empty($phone) ? $phone : $user->so_dien_thoai,
                'cccd' => !empty($cccd) ? $cccd : $user->cccd,
                'ngay_sinh' => $request->ngay_sinh,
                'dia_chi' => $request->dia_chi,
                'vai_tro' => $request->vai_tro ?? 'Khach_Hang'
            ]);
        } else {
            // Tạo mới tài khoản thành viên chính thức
            $user = NguoiDung::create([
                'ho_ten' => $name,
                'email' => $email,
                'mat_khau' => Hash::make($request->mat_khau),
                'so_dien_thoai' => !empty($phone) ? $phone : null,
                'cccd' => !empty($cccd) ? $cccd : null,
                'ngay_sinh' => $request->ngay_sinh,
                'dia_chi' => $request->dia_chi,
                'vai_tro' => $request->vai_tro ?? 'Khach_Hang'
            ]);
        }

        // Gửi email chào mừng thành viên mới đăng ký
        try {
            if ($user->email) {
                Mail::to($user->email)->send(new RegisterSuccessMail($user));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lỗi khi gửi email chào mừng đăng ký: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Đăng ký tài khoản Marriott Bonvoy thành công!',
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
        ], 201);
    }

    public function checkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        // 🟢 Chỉ kiểm tra tài khoản đã ĐĂNG KÝ trên hệ thống web (không tính email vãng lai GUEST_NO_ACCOUNT)
        $user = NguoiDung::where('email', trim($request->email))
            ->where('mat_khau', '!=', 'GUEST_NO_ACCOUNT')
            ->first();

        if (!$user) {
            return response()->json(['exists' => false, 'is_member' => false], 200);
        }

        return response()->json([
            'exists' => true,
            'is_member' => true,
            'user_info' => [
                'ho_ten' => $user->ho_ten ?? '',
                'so_dien_thoai' => $user->so_dien_thoai ?? '',
                'cccd' => $user->cccd ?? '',
            ]
        ], 200);
    }

    public function checkPhone(Request $request)
    {
        // Support both "so_dien_thoai" and "phone" field keys for absolute safety
        $phone = $request->input('so_dien_thoai') ?? $request->input('phone');
        
        if (!$phone) {
            return response()->json(['message' => 'Trường số điện thoại là bắt buộc.'], 422);
        }
        
        $exists = NguoiDung::where('so_dien_thoai', $phone)
            ->where('mat_khau', '!=', 'GUEST_NO_ACCOUNT')
            ->exists();
        return response()->json(['exists' => $exists], 200);
    }
}
