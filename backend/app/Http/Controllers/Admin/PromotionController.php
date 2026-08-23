<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KhuyenMai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = KhuyenMai::orderBy('ngay_bat_dau', 'desc')->get();
        
        return response()->json($promotions->map(function($promo) {
            return [
                'code' => $promo->ma_code,
                'description' => $promo->mo_ta,
                'discount_percent' => $promo->phan_tram_giam,
                'max_discount' => (float) $promo->so_tien_giam_toi_da,
                'min_booking_amount' => (float) ($promo->don_hang_toi_thieu ?? 0),
                'max_uses' => (int) ($promo->so_luong_gioi_han ?? 100),
                'used_count' => (int) ($promo->so_lan_da_su_dung ?? 0),
                'start_date' => $promo->ngay_bat_dau,
                'end_date' => $promo->ngay_ket_thuc,
                'stay_start_date' => $promo->ngay_checkin_tu,
                'stay_end_date' => $promo->ngay_checkin_den,
                'is_active' => $promo->ngay_bat_dau <= now() && $promo->ngay_ket_thuc >= now() && (($promo->so_luong_gioi_han ?? 100) == 0 || ($promo->so_lan_da_su_dung ?? 0) < ($promo->so_luong_gioi_han ?? 100)),
            ];
        }));
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:khuyen_mai,ma_code',
            'description' => 'nullable|string',
            'discount_percent' => 'required|integer|min:1|max:100',
            'max_discount' => 'nullable|numeric|min:0',
            'min_booking_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'stay_start_date' => 'nullable|date',
            'stay_end_date' => 'nullable|date|after_or_equal:stay_start_date',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $promotion = KhuyenMai::create([
            'ma_code' => strtoupper(trim($request->code)),
            'mo_ta' => $request->description,
            'phan_tram_giam' => $request->discount_percent,
            'so_tien_giam_toi_da' => $request->max_discount ?? 0,
            'don_hang_toi_thieu' => $request->min_booking_amount ?? 0,
            'so_luong_gioi_han' => $request->max_uses ?? 100,
            'so_lan_da_su_dung' => 0,
            'ngay_bat_dau' => $request->start_date,
            'ngay_ket_thuc' => $request->end_date,
            'ngay_checkin_tu' => $request->stay_start_date,
            'ngay_checkin_den' => $request->stay_end_date,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Thêm khuyến mãi thành công',
            'data' => $promotion
        ]);
    }
    
    public function update(Request $request, $code)
    {
        $promotion = KhuyenMai::findOrFail($code);
        
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string',
            'discount_percent' => 'sometimes|integer|min:1|max:100',
            'max_discount' => 'nullable|numeric|min:0',
            'min_booking_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'stay_start_date' => 'nullable|date',
            'stay_end_date' => 'nullable|date',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $updateData = [];
        if ($request->has('description')) $updateData['mo_ta'] = $request->description;
        if ($request->has('discount_percent')) $updateData['phan_tram_giam'] = $request->discount_percent;
        if ($request->has('max_discount')) $updateData['so_tien_giam_toi_da'] = $request->max_discount;
        if ($request->has('min_booking_amount')) $updateData['don_hang_toi_thieu'] = $request->min_booking_amount;
        if ($request->has('max_uses')) $updateData['so_luong_gioi_han'] = $request->max_uses;
        if ($request->has('start_date')) $updateData['ngay_bat_dau'] = $request->start_date;
        if ($request->has('end_date')) $updateData['ngay_ket_thuc'] = $request->end_date;
        if ($request->has('stay_start_date')) $updateData['ngay_checkin_tu'] = $request->stay_start_date;
        if ($request->has('stay_end_date')) $updateData['ngay_checkin_den'] = $request->stay_end_date;

        $promotion->update($updateData);
        
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật khuyến mãi thành công'
        ]);
    }
    
    public function destroy($code)
    {
        $promotion = KhuyenMai::findOrFail($code);
        $promotion->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Xóa khuyến mãi thành công'
        ]);
    }
    
    public function validatePromo(Request $request)
    {
        $request->validate(['code' => 'required|string']);
        
        $promotion = KhuyenMai::where('ma_code', $request->code)
            ->where('ngay_bat_dau', '<=', now())
            ->where('ngay_ket_thuc', '>=', now())
            ->first();
        
        if (!$promotion) {
            return response()->json([
                'valid' => false,
                'message' => 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'
            ]);
        }
        
        return response()->json([
            'valid' => true,
            'discount_percent' => $promotion->phan_tram_giam,
            'max_discount' => (float) $promotion->so_tien_giam_toi_da,
        ]);
    }
}