<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    // =========================================================================
    // Mapping vai_tro (DB) ↔ role (UI)
    // DB:  'Admin' | 'Le_Tan' | 'Khach_Hang'
    // UI:  'admin' | 'staff'  | 'customer'
    // =========================================================================
    private function dbToUiRole(string $vaiTro): string
    {
        return match($vaiTro) {
            'Admin'   => 'admin',
            'Le_Tan'  => 'staff',
            default   => 'customer',
        };
    }

    private function uiToDbRole(string $role): string
    {
        return match($role) {
            'admin' => 'Admin',
            'staff' => 'Le_Tan',
            default => 'Khach_Hang',
        };
    }

    // =========================================================================
    // VALIDATE EMAIL NHÂN VIÊN: Phải theo format ten.CHINHANH@hotel.com
    // Ví dụ: toan.SG@hotel.com, lan.HN@hotel.com
    // =========================================================================
    private function validateStaffEmail(string $email, Validator $validator = null): ?string
    {
        if (!preg_match('/^[a-zA-Z]+\.[A-Z]{2,6}@hotel\.com$/', $email)) {
            return 'Email nhân viên phải theo định dạng: ten.CHINHANH@hotel.com (VD: toan.SG@hotel.com, lan.HN@hotel.com)';
        }
        return null;
    }

    public function index(Request $request)
    {
        $query = NguoiDung::query();

        // Lọc theo vai trò (hỗ trợ cả 3 role)
        if ($request->has('role') && $request->role !== 'all') {
            $dbRole = $this->uiToDbRole($request->role);
            $query->where('vai_tro', $dbRole);
        }

        // Tìm kiếm theo tên/email/SĐT
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('ho_ten', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('so_dien_thoai', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->orderBy('nguoi_dung_id', 'desc')->get();

        return response()->json($users->map(function($user) {
            $user->makeVisible('mat_khau');
            return [
                'id'         => $user->nguoi_dung_id,
                'name'       => $user->ho_ten,
                'email'      => $user->email,
                'phone'      => $user->so_dien_thoai,
                'id_card'    => $user->cccd,
                'birth_date' => $user->ngay_sinh,
                'address'    => $user->dia_chi,
                'role'       => $this->dbToUiRole($user->vai_tro),
                'mat_khau'   => $user->mat_khau,
                'created_at' => $user->created_at,
            ];
        }));
    }

    public function show($id)
    {
        $user = NguoiDung::findOrFail($id);
        return response()->json([
            'id'         => $user->nguoi_dung_id,
            'name'       => $user->ho_ten,
            'email'      => $user->email,
            'phone'      => $user->so_dien_thoai,
            'id_card'    => $user->cccd,
            'birth_date' => $user->ngay_sinh,
            'address'    => $user->dia_chi,
            'role'       => $this->dbToUiRole($user->vai_tro),
            'created_at' => $user->created_at,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:nguoi_dung,email',
            'phone'      => 'required|string|max:15|unique:nguoi_dung,so_dien_thoai',
            'password'   => 'required|string|min:6',
            'role'       => 'required|in:admin,customer,staff',
            'id_card'    => 'nullable|string|max:20|unique:nguoi_dung,cccd',
            'birth_date' => 'nullable|date',
            'address'    => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 🟢 KIỂM TRA EMAIL NHÂN VIÊN THEO FORMAT CHI NHÁNH
        if (in_array($request->role, ['staff', 'admin'])) {
            $emailError = $this->validateStaffEmail($request->email);
            if ($emailError) {
                return response()->json(['errors' => ['email' => [$emailError]]], 422);
            }
        }

        $user = NguoiDung::create([
            'ho_ten'       => $request->name,
            'email'        => $request->email,
            'so_dien_thoai'=> $request->phone,
            'mat_khau'     => Hash::make($request->password),
            'vai_tro'      => $this->uiToDbRole($request->role),
            'cccd'         => $request->id_card,
            'ngay_sinh'    => $request->birth_date,
            'dia_chi'      => $request->address,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm người dùng thành công',
            'data'    => array_merge($user->toArray(), ['role' => $this->dbToUiRole($user->vai_tro)]),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = NguoiDung::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|string|max:100',
            'email'      => 'sometimes|email|unique:nguoi_dung,email,' . $id . ',nguoi_dung_id',
            'phone'      => 'sometimes|string|max:15|unique:nguoi_dung,so_dien_thoai,' . $id . ',nguoi_dung_id',
            'role'       => 'sometimes|in:admin,customer,staff',
            'id_card'    => 'nullable|string|max:20|unique:nguoi_dung,cccd,' . $id . ',nguoi_dung_id',
            'birth_date' => 'nullable|date',
            'address'    => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Kiểm tra email nhân viên nếu đổi sang role nhân viên
        $newRole = $request->role ?? $this->dbToUiRole($user->vai_tro);
        if (in_array($newRole, ['staff', 'admin']) && $request->has('email')) {
            $emailError = $this->validateStaffEmail($request->email);
            if ($emailError) {
                return response()->json(['errors' => ['email' => [$emailError]]], 422);
            }
        }

        $data = [];
        if ($request->has('name'))       $data['ho_ten']        = $request->name;
        if ($request->has('email'))      $data['email']         = $request->email;
        if ($request->has('phone'))      $data['so_dien_thoai'] = $request->phone;
        if ($request->has('id_card'))    $data['cccd']          = $request->id_card;
        if ($request->has('birth_date')) $data['ngay_sinh']     = $request->birth_date;
        if ($request->has('address'))    $data['dia_chi']       = $request->address;
        if ($request->has('role'))       $data['vai_tro']       = $this->uiToDbRole($request->role);
        if ($request->has('password') && $request->password) {
            $data['mat_khau'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật người dùng thành công',
        ]);
    }

    public function destroy($id)
    {
        $user = NguoiDung::findOrFail($id);

        // 🔴 Không cho xóa admin duy nhất
        if ($user->vai_tro === 'Admin') {
            $adminCount = NguoiDung::where('vai_tro', 'Admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa tài khoản Admin duy nhất',
                ], 400);
            }
        }

        try {
            $user->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa tài khoản này vì đang có dữ liệu đặt phòng liên quan hoặc hóa đơn trên hệ thống.',
                ], 400);
            }
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa tài khoản: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Xóa người dùng thành công',
        ]);
    }

    public function getCustomerBookings($id)
    {
        $user = NguoiDung::findOrFail($id);

        $bookings = $user->donDatPhong()->with(['chiTietDatPhong.phong', 'hoaDon'])
            ->orderBy('ngay_dat_don', 'desc')
            ->get()
            ->map(function($booking) {
                return [
                    'id'           => $booking->don_dat_id,
                    'check_in'     => $booking->ngay_checkin,
                    'check_out'    => $booking->ngay_checkout,
                    'room_numbers' => $booking->chiTietDatPhong->map(function($ct) {
                        return $ct->phong->so_phong;
                    })->implode(', '),
                    'total_amount' => (float) $booking->thanh_tien_cuoi,
                    'status'       => $booking->trang_thai_don,
                    'created_at'   => $booking->ngay_dat_don,
                ];
            });

        return response()->json($bookings);
    }
}