<?php

namespace App\Http\Controllers\Customer;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Controller;
use App\Models\DanhGiaTraiNghiem;
use App\Models\DonDatPhong;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    // Retrieve reviews of a customer
    public function index(Request $request)
    {
        $customerId = $request->query('khach_hang_id');
        if (!$customerId) {
            return response()->json(['message' => 'Yêu cầu mã khách hàng.'], 400);
        }

        $reviews = DanhGiaTraiNghiem::with(['loaiPhong'])
            ->where('khach_hang_id', $customerId)
            ->get();

        return response()->json($reviews, 200);
    }

    // Submit a new experience review (this triggers `tg_check_review_valid` in the real database)
    public function store(Request $request)
    {
        $request->validate([
            'khach_hang_id' => 'required|exists:nguoi_dung,nguoi_dung_id',
            'loai_phong_id' => 'required|exists:loai_phong,loai_phong_id',
            'so_sao' => 'required|integer|min:1|max:5',
            'binh_luan' => 'nullable|string'
        ]);

        $khach_hang_id = $request->khach_hang_id;
        $loai_phong_id = $request->loai_phong_id;

        // Perform programmatic validation mimicking the database trigger just in case
        $hasStayed = DonDatPhong::where('khach_hang_id', $khach_hang_id)
            ->whereIn('trang_thai_don', ['Dang_O', 'Da_Tra_Phong'])
            ->whereHas('chiTietDatPhongs.phong', function($q) use ($loai_phong_id) {
                $q->where('loai_phong_id', $loai_phong_id);
            })->exists();

        if (!$hasStayed) {
             return response()->json([
                 'message' => 'Lỗi: Chỉ những khách đã từng lưu trú tại loại phòng này mới được đánh giá!'
             ], 400);
        }

        $review = DanhGiaTraiNghiem::create([
            'khach_hang_id' => $khach_hang_id,
            'loai_phong_id' => $loai_phong_id,
            'so_sao' => $request->so_sao,
            'binh_luan' => $request->binh_luan,
            'ngay_danh_gia' => now()->toDateString()
        ]);

        return response()->json([
            'message' => 'Đánh giá trải nghiệm của bạn đã được ghi nhận tuyệt vời!',
            'review' => $review
        ], 201);
    }

    // --- ALIAS METHODS FOR ROUTING COMPATIBILITY ---
    public function apiStore(Request $request)
    {
        return $this->store($request);
    }

    public function getUserReviews(Request $request)
    {
        return $this->index($request);
    }

    public function apiGetByRoomType($roomTypeId)
    {
        $reviews = DanhGiaTraiNghiem::with(['khachHang' => function($q) {
            $q->select('nguoi_dung_id', 'ho_ten', 'email');
        }])->where('loai_phong_id', $roomTypeId)->get();

        return response()->json($reviews, 200);
    }
}
