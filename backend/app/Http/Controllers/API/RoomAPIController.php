<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LoaiPhong;
use App\Models\Phong;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoomAPIController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: LẤY DANH SÁCH HẠNG PHÒNG KÈM ĐÁNH GIÁ TRUNG BÌNH (RATING)
    // =========================================================================
    public function getRoomCategories()
    {
        $categories = LoaiPhong::with(['reviews'])->get();

        $formatted = $categories->map(function ($cat) {
            // Tính số sao trung bình của loại phòng từ bảng danh_gia_trai_nghiem
            $avgStars = $cat->reviews->avg('so_sao') ?: 0;
            return [
                'loai_phong_id' => $cat->loai_phong_id,
                'ten_loai_phong' => $cat->ten_loai_phong,
                'gia_theo_dem' => (float) $cat->gia_theo_dem,
                'dien_tich_m2' => $cat->dien_tich_m2,
                'so_giuong' => $cat->so_giuong,
                'so_khach_toi_da' => $cat->so_khach_toi_da,
                'mo_ta' => $cat->mo_ta,
                'average_rating' => round($avgStars, 1),
                'reviews_count' => $cat->reviews->count()
            ];
        });

        return response()->json($formatted, 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: LẤY CHI TIẾT 1 HẠNG PHÒNG (BAO GỒM DỊCH VỤ VÀ BÌNH LUẬN)
    // =========================================================================
    public function getRoomCategoryDetail($id)
    {
        $category = LoaiPhong::with(['reviews.khachHang', 'dichVu'])->find($id);

        if (!$category) {
            return response()->json(['message' => 'Hạng phòng không tồn tại.'], 404);
        }

        return response()->json($category, 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: LỌC PHÒNG VẬT LÝ VÀ THUẬT TOÁN CHỐNG TRÙNG LỊCH (OVERBOOKING)
    // =========================================================================
    public function getAllRooms(Request $request)
    {
        // Tự động đồng bộ trạng thái dọn dẹp/bảo trì phòng theo thời gian thực
        Phong::syncStatuses();
        $query = Phong::with(['loaiPhong.dichVu', 'tienNghi', 'hinhAnh']);

        // Lọc theo trạng thái hiện tại (0: Trống, 1: Đang ở, 2: Dọn dẹp, 3: Bảo trì)
        if ($request->has('status')) {
            $query->where('trang_thai_hien_tai', $request->status);
        }

        // Lọc theo Hạng phòng cụ thể
        if ($request->has('category_id')) {
            $query->where('loai_phong_id', $request->category_id);
        }

        // Lọc theo Vị trí cụ thể
        if ($request->has('vi_tri') && $request->vi_tri != 'all' && $request->vi_tri != '') {
            $query->where('vi_tri', $request->vi_tri);
        }

        // 🟢 DÒNG CODE SQL LOẠI TRỪ PHÒNG ĐÃ TRÙNG LỊCH (CHỐNG OVERBOOKING):
        // Nếu người dùng chọn ngày Check-in và Check-out để tìm phòng
        if ($request->has('check_in') && $request->has('check_out')) {
            $checkIn = $request->check_in;
            $checkOut = $request->check_out;

            $query->where('trang_thai_hien_tai', '!=', 3) // Loại trừ các phòng đang Bảo trì
                  ->whereNotExists(function($subQuery) use ($checkIn, $checkOut) {
                      // Sub-query kiểm tra phòng có đơn đặt phòng nào trùng khoảng thời gian chọn không
                      $subQuery->select(DB::raw(1))
                          ->from('chi_tiet_dat_phong')
                          ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
                          ->whereColumn('chi_tiet_dat_phong.phong_id', 'phong.phong_id')
                          ->where('chi_tiet_dat_phong.trang_thai', '!=', 'cancelled')
                          // Bỏ qua các đơn đã bị Hủy, đã Trả phòng hoặc Khách không đến (No-Show)
                          ->whereNotIn('don_dat_phong.trang_thai_don', ['Da_Huy', 'Da_Tra_Phong', 'No_Show'])
                          // Thuật toán Giao khoảng thời gian (Overlap Algorithm):
                          // Đơn bị trùng nếu: ngay_checkin_cu < check_out_moi AND ngay_checkout_cu > check_in_moi
                          ->where(function($q) use ($checkIn, $checkOut) {
                              $q->where('don_dat_phong.ngay_checkin', '<', $checkOut)
                                ->where('don_dat_phong.ngay_checkout', '>', $checkIn);
                          });
                  });
        }

        return response()->json($query->get(), 200);
    }

    // --- ALIAS METHODS CHO PHÙ HỢP CẤU TRÚC ROUTING ---
    public function index(Request $request)
    {
        return $this->getAllRooms($request);
    }

    public function show($id)
    {
        return $this->getRoomCategoryDetail($id);
    }

    public function getRoomTypes()
    {
        return $this->getRoomCategories();
    }

    // =========================================================================
    // NGHIỆP VỤ: KIỂM TRA PHÒNG CÒN TRỐNG THEO LOẠI PHÒNG (QUICK CHECK)
    // =========================================================================
    public function checkAvailability(Request $request)
    {
        Phong::syncStatuses();
        $request->validate([
            'ngay_checkin' => 'required|date',
            'ngay_checkout' => 'required|date|after:ngay_checkin',
            'loai_phong_id' => 'required|exists:loai_phong,loai_phong_id'
        ]);

        // Lấy tất cả phòng thuộc hạng phòng được chọn (trừ phòng bảo trì)
        $rooms = Phong::where('loai_phong_id', $request->loai_phong_id)
            ->where('trang_thai_hien_tai', '!=', 3)
            ->get();

        $availableCount = 0;
        foreach ($rooms as $room) {
            // 🟢 THUẬT TOÁN ĐỐI SOÁT XEM PHÒNG CÓ BỊ GIAO THỜI GIAN ĐẶT KHÔNG:
            $hasOverlap = \App\Models\ChiTietDatPhong::where('phong_id', $room->phong_id)
                ->where('trang_thai', '!=', 'cancelled')
                ->whereHas('donDatPhong', function($query) use ($request) {
                    $query->whereNotIn('trang_thai_don', ['Da_Huy', 'Da_Tra_Phong', 'No_Show'])
                        ->where(function($q) use ($request) {
                            $q->where('ngay_checkin', '<', $request->ngay_checkout)
                              ->where('ngay_checkout', '>', $request->ngay_checkin);
                        });
                })->exists();

            // Nếu không bị chồng lịch -> Đếm thêm 1 phòng khả dụng
            if (!$hasOverlap) {
                $availableCount++;
            }
        }

        return response()->json([
            'available' => $availableCount > 0,
            'available_rooms_count' => $availableCount
        ], 200);
    }
}
