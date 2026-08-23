<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KhuyenMai;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PromotionAPIController extends Controller
{
    // =========================================================================
    // NGHIỆP VỤ: LẤY DANH SÁCH MÃ GIẢM GIÁ / VOUCHER CÒN HIỆU LỰC
    // =========================================================================
    public function index()
    {
        $today = Carbon::today()->toDateString();
        $list = KhuyenMai::where('ngay_ket_thuc', '>=', $today)->get();
        return response()->json($list, 200);
    }

    // =========================================================================
    // NGHIỆP VỤ: ĐỐI SOÁT VÀ TÍNH TOÁN TIỀN GIẢM GIÁ MÃ VOUCHER
    // POST /api/v1/promotions/validate
    // =========================================================================
    public function applyCode(Request $request)
    {
        $request->validate([
            'ma_code' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        $code = strtoupper(trim($request->ma_code));
        $amount = (float) $request->amount;

        // 🟢 1. Tìm mã khuyến mãi trong bảng `khuyen_mai`
        $promo = KhuyenMai::find($code);

        if (!$promo) {
            return response()->json(['message' => 'Mã ưu đãi không chính xác.'], 404);
        }

        // 🟢 2. Kiểm tra ngày hiệu lực & hết hạn áp dụng của Voucher
        $today = Carbon::today();
        $start = Carbon::parse($promo->ngay_bat_dau)->startOfDay();
        $end = Carbon::parse($promo->ngay_ket_thuc)->endOfDay();

        if ($today->lt($start)) {
            return response()->json([
                'message' => "Mã khuyến mãi '{$promo->ma_code}' chưa đến thời gian áp dụng (Hiệu lực từ " . $start->format('d/m/Y') . " đến " . $end->format('d/m/Y') . ")!"
            ], 422);
        }

        if ($today->gt($end)) {
            return response()->json([
                'message' => "Mã khuyến mãi '{$promo->ma_code}' đã hết hạn áp dụng (Hạn dùng đến ngày " . $end->format('d/m/Y') . ")!"
            ], 422);
        }

        // 🟢 3. RÀNG BUỘC SỐ LƯỢNG NGƯỜI SỬ DỤNG TỐI ĐA (MAX USAGE LIMIT)
        if ($promo->so_luong_gioi_han > 0 && $promo->so_lan_da_su_dung >= $promo->so_luong_gioi_han) {
            return response()->json([
                'message' => "Mã khuyến mãi '{$promo->ma_code}' này đã hết lượt sử dụng (đã đạt giới hạn {$promo->so_luong_gioi_han} lượt dùng)!"
            ], 422);
        }

        // 🟢 4. RÀNG BUỘC ĐƠN HÀNG TỐI THIỂU (MIN SPEND) - Tránh lỗ vốn khi áp mã
        $minSpend = (float) ($promo->don_hang_toi_thieu ?? 0);
        if ($minSpend > 0 && $amount < $minSpend) {
            return response()->json([
                'message' => "Mã khuyến mãi '{$promo->ma_code}' chỉ áp dụng cho đơn phòng có tổng tiền từ " . number_format($minSpend, 0, ',', '.') . " đ trở lên!"
            ], 422);
        }

        // 🟢 5. RÀNG BUỘC KỲ LƯU TRÚ ÁP DỤNG (STAY WINDOW / KHÔNG ÁP DỤNG MÙA CAO ĐIỂM)
        if ($request->filled('checkin_date') && !empty($promo->ngay_checkin_tu) && !empty($promo->ngay_checkin_den)) {
            $stayDate = Carbon::parse($request->checkin_date)->startOfDay();
            $stayStart = Carbon::parse($promo->ngay_checkin_tu)->startOfDay();
            $stayEnd = Carbon::parse($promo->ngay_checkin_den)->endOfDay();
            if ($stayDate->lt($stayStart) || $stayDate->gt($stayEnd)) {
                return response()->json([
                    'message' => "Mã khuyến mãi '{$promo->ma_code}' chỉ áp dụng cho kỳ lưu trú từ " . $stayStart->format('d/m/Y') . " đến " . $stayEnd->format('d/m/Y') . " (Không áp dụng cho giai đoạn cao điểm)!"
                ], 422);
            }
        }

        // 🟢 3. Thuật toán tính tiền giảm theo phần trăm (%)
        $discount = ($amount * $promo->phan_tram_giam) / 100;
        
        // 🟢 4. Áp dụng trần khống chế số tiền giảm tối đa (nếu có cấu hình)
        if ($promo->so_tien_giam_toi_da > 0 && $discount > $promo->so_tien_giam_toi_da) {
            $discount = (float) $promo->so_tien_giam_toi_da;
        }

        // 🟢 5. Tính thành tiền cuối cùng sau khi giảm
        $final = $amount - $discount;

        return response()->json([
            'ma_code' => $promo->ma_code,
            'mo_ta' => $promo->mo_ta,
            'phan_tram_giam' => $promo->phan_tram_giam,
            'discount_amount' => $discount,
            'final_amount' => $final
        ], 200);
    }

    // --- ALIAS METHODS CHO PHÙ HỢP CẤU TRÚC ROUTING API ---
    public function show($code)
    {
        $promo = KhuyenMai::find(strtoupper(trim($code)));
        if (!$promo) {
            return response()->json(['message' => 'Mã khuyến mãi không tồn tại.'], 404);
        }
        return response()->json($promo, 200);
    }

    public function validatePromo(Request $request)
    {
        return $this->applyCode($request);
    }
}
