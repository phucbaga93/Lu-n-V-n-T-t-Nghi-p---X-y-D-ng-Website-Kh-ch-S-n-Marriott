<?php

namespace App\Http\Controllers\Customer;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\Phong;
use App\Models\KhuyenMai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BookingController extends Controller
{
    /**
     * Hiển thị form đặt phòng
     * GET /customer/bookings/create
     */
    public function create()
    {
        $roomTypes = DB::table('loai_phong')->get();
        $promotions = KhuyenMai::where('ngay_bat_dau', '<=', now())
            ->where('ngay_ket_thuc', '>=', now())
            ->get();

        return view('customer.bookings.create', compact('roomTypes', 'promotions'));
    }

    /**
     * Xử lý đặt phòng từ customer
     * POST /customer/bookings
     */
    public function store(Request $request)
    {
        $maxDate = now()->addMonths(6)->toDateString();
        $validator = Validator::make($request->all(), [
            'room_id' => 'required|exists:phong,phong_id',
            'check_in' => 'required|date|after_or_equal:today|before_or_equal:' . $maxDate,
            'check_out' => 'required|date|after:check_in',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'promotion_code' => 'nullable|exists:khuyen_mai,ma_code',
            'special_requests' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Kiểm tra phòng trống
        $isAvailable = !DB::table('chi_tiet_dat_phong as ctdp')
            ->join('don_dat_phong as ddp', 'ctdp.don_dat_id', '=', 'ddp.don_dat_id')
            ->where('ctdp.phong_id', $request->room_id)
            ->where('ddp.trang_thai_don', '!=', 'Da_Huy')
            ->where(function($q) use ($request) {
                $q->whereBetween('ddp.ngay_checkin', [$request->check_in, $request->check_out])
                    ->orWhereBetween('ddp.ngay_checkout', [$request->check_in, $request->check_out])
                    ->orWhere(function($q2) use ($request) {
                        $q2->where('ddp.ngay_checkin', '<=', $request->check_in)
                            ->where('ddp.ngay_checkout', '>=', $request->check_out);
                    });
            })
            ->exists();

        if (!$isAvailable) {
            return redirect()->back()->with('error', 'Phòng không còn trống trong khoảng thời gian này');
        }

        $room = Phong::find($request->room_id);
        $days = now()->parse($request->check_in)->diffInDays(now()->parse($request->check_out));
        $roomTotal = $room->loaiPhong->gia_theo_dem * $days;
        $finalTotal = $roomTotal;

        // Áp dụng khuyến mãi
        if ($request->promotion_code) {
            $promotion = KhuyenMai::where('ma_code', $request->promotion_code)->first();
            if ($promotion) {
                $discount = min(
                    $roomTotal * $promotion->phan_tram_giam / 100,
                    $promotion->so_tien_giam_toi_da
                );
                $finalTotal = $roomTotal - $discount;
            }
        }

        DB::beginTransaction();
        try {
            $booking = DonDatPhong::create([
                'khach_hang_id' => Auth::id(),
                'nguoi_tao_don' => Auth::id(),
                'nguon_dat' => 'ONLINE',
                'ma_khuyen_mai_id' => $request->promotion_code,
                'ngay_dat_don' => now(),
                'ngay_checkin' => $request->check_in,
                'ngay_checkout' => $request->check_out,
                'so_nguoi_lon' => $request->adults,
                'so_tre_em' => $request->children ?? 0,
                'tong_tien_phong' => $roomTotal,
                'thanh_tien_cuoi' => $finalTotal,
                'trang_thai_don' => 'Cho_Xac_Nhan',
                'ghi_chu_dac_biet' => $request->special_requests,
            ]);

            DB::table('chi_tiet_dat_phong')->insert([
                'don_dat_id' => $booking->don_dat_id,
                'phong_id' => $request->room_id,
                'gia_ap_dung' => $room->loaiPhong->gia_theo_dem,
                'trang_thai' => 'booked',
            ]);

            DB::commit();

            return redirect()->route('customer.bookings.show', $booking->don_dat_id)
                ->with('success', 'Đặt phòng thành công! Vui lòng chờ xác nhận.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Đặt phòng thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Danh sách đơn đặt của customer
     * GET /customer/bookings
     */
    public function index()
    {
        $bookings = DonDatPhong::with(['chiTietDatPhong.phong', 'hoaDon'])
            ->where('khach_hang_id', Auth::id())
            ->orderBy('ngay_dat_don', 'desc')
            ->paginate(10);

        return view('customer.bookings.index', compact('bookings'));
    }

    /**
     * Chi tiết đơn đặt
     * GET /customer/bookings/{id}
     */
    public function show($id)
    {
        $booking = DonDatPhong::with([
            'khachHang',
            'chiTietDatPhong.phong.loaiPhong',
            'chiTietDatPhong.phong.hinhAnh',
            'hoaDon'
        ])
        ->where('khach_hang_id', Auth::id())
        ->findOrFail($id);

        $canCancel = in_array($booking->trang_thai_don, ['Cho_Xac_Nhan', 'Da_Xac_Nhan']) 
            && $booking->ngay_checkin > now()->addDays(1)->toDateString();

        return view('customer.bookings.show', compact('booking', 'canCancel'));
    }

    /**
     * Hủy đơn đặt
     * POST /customer/bookings/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        $booking = DonDatPhong::where('khach_hang_id', Auth::id())->findOrFail($id);

        if (!in_array($booking->trang_thai_don, ['Cho_Xac_Nhan', 'Da_Xac_Nhan'])) {
            return redirect()->back()->with('error', 'Không thể hủy đơn đặt ở trạng thái này');
        }

        if ($booking->ngay_checkin <= now()->addDays(1)->toDateString()) {
            return redirect()->back()->with('error', 'Chỉ có thể hủy đơn trước ngày nhận phòng ít nhất 1 ngày');
        }

        DB::beginTransaction();
        try {
            $booking->trang_thai_don = 'Da_Huy';
            $booking->ngay_huy_don = now();
            $booking->save();

            DB::commit();

            return redirect()->route('customer.bookings.index')
                ->with('success', 'Hủy đơn đặt thành công');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Hủy đơn thất bại: ' . $e->getMessage());
        }
    }
}