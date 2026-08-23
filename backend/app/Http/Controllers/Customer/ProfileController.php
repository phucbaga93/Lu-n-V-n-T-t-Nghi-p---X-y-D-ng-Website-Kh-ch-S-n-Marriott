<?php

namespace App\Http\Controllers\Customer;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: LẤY THÔNG TIN HỒ SƠ CÁ NHÂN CỦA KHÁCH HÀNG (READ PROFILE)
    // =========================================================================
    public function show($id)
    {
        $user = NguoiDung::find($id);

        if (!$user || $user->vai_tro !== 'Khach_Hang') {
            return response()->json(['message' => 'Hồ sơ khách hàng không hợp lệ.'], 404);
        }

        return response()->json([
            'nguoi_dung_id' => $user->nguoi_dung_id,
            'ho_ten' => $user->ho_ten,
            'email' => $user->email,
            'so_dien_thoai' => $user->so_dien_thoai,
            'cccd' => $user->cccd,
            'ngay_sinh' => $user->ngay_sinh,
            'dia_chi' => $user->dia_chi,
            'vai_tro' => $user->vai_tro,
            'created_at' => $user->created_at
        ], 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: CẬP NHẬT THÔNG TIN HỒ SƠ KHÁCH HÀNG (UPDATE PROFILE)
    // =========================================================================
    public function update(Request $request, $id)
    {
        $user = NguoiDung::find($id);

        if (!$user || $user->vai_tro !== 'Khach_Hang') {
            return response()->json(['message' => 'Không tìm thấy hồ sơ khách hàng.'], 404);
        }

        $request->validate([
            'ho_ten' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|unique:nguoi_dung,email,' . $id . ',nguoi_dung_id',
            'so_dien_thoai' => 'sometimes|required|string|unique:nguoi_dung,so_dien_thoai,' . $id . ',nguoi_dung_id',
            'cccd' => 'nullable|string|unique:nguoi_dung,cccd,' . $id . ',nguoi_dung_id',
            'ngay_sinh' => 'nullable|date',
            'dia_chi' => 'nullable|string',
        ]);

        $data = $request->only(['ho_ten', 'email', 'so_dien_thoai', 'cccd', 'ngay_sinh', 'dia_chi']);

        if ($request->filled('mat_khau')) {
            $request->validate(['mat_khau' => 'required|min:6']);
            $data['mat_khau'] = Hash::make($request->mat_khau);
        }

        // Cập nhật thông tin vào CSDL MySQL
        $user->update($data);

        return response()->json([
            'message' => 'Hồ sơ đã được lưu thay đổi thành công!',
            'user' => [
                'nguoi_dung_id' => $user->nguoi_dung_id,
                'ho_ten' => $user->ho_ten,
                'email' => $user->email,
                'so_dien_thoai' => $user->so_dien_thoai,
                'cccd' => $user->cccd,
                'ngay_sinh' => $user->ngay_sinh,
                'dia_chi' => $user->dia_chi,
                'vai_tro' => $user->vai_tro,
                'created_at' => $user->created_at
            ]
        ], 200);
    }

    // --- ALIAS METHODS CHO PHÙ HỢP CẤU TRÚC ROUTING API ---
    public function apiProfile(Request $request)
    {
        $userId = Auth::id() ?? $request->query('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Yêu cầu đăng nhập hoặc mã người dùng.'], 401);
        }
        return $this->show($userId);
    }

    public function apiUpdate(Request $request)
    {
        $userId = Auth::id() ?? $request->query('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Yêu cầu đăng nhập hoặc mã người dùng.'], 401);
        }
        return $this->update($request, $userId);
    }

    // =========================================================================
    // NGHIỆP VỤ: ĐỔI MẬT KHẨU TÀI KHOẢN CÁ NHÂN (CHANGE PASSWORD)
    // POST /api/v1/profile/change-password
    // =========================================================================
    public function changePassword(Request $request)
    {
        // 🟢 LẤY USER ID TỪ TOKEN HOẶC THAM SỐ TRUYỀN LÊN
        $userId = Auth::id() ?? $request->query('user_id') ?? $request->input('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Vui lòng đăng nhập để thực hiện đổi mật khẩu.'], 401);
        }

        // 🟢 VALIDATE DỮ LIỆU ĐẦU VÀO
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed'
        ], [
            'old_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'new_password.required' => 'Vui lòng nhập mật khẩu mới.',
            'new_password.min' => 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
            'new_password.confirmed' => 'Mật khẩu xác nhận không trùng khớp.'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $user = NguoiDung::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Tài khoản người dùng không tồn tại trên hệ thống.'], 404);
        }

        // 🟢 DÒNG CODE ĐỐI SOÁT MẬT KHẨU CŨ VỚI CHUỖI BĂM TRONG CSDL MYSQL:
        if (!Hash::check($request->old_password, $user->mat_khau) && $request->old_password !== $user->mat_khau) {
            return response()->json(['message' => 'Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại!'], 400);
        }

        // 🟢 DÒNG CODE BĂM MẬT KHẨU MỚI VÀ CẬP NHẬT VÀO MYSQL:
        $user->update([
            'mat_khau' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Đổi mật khẩu thành công!'], 200);
    }
}
