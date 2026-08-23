<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\Phong;
use App\Models\NguoiDung;
use App\Models\LoaiPhong;
use App\Models\HoaDonThanhToan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();

        $totalRevenue     = DonDatPhong::whereIn('trang_thai_don', ['Da_Thanh_Toan', 'Da_Tra_Phong', 'Dang_O'])->sum('thanh_tien_cuoi');
        $totalBookings    = DonDatPhong::count();
        $activeBookingsToday = DonDatPhong::where('ngay_checkin', '<=', $today)
            ->where('ngay_checkout', '>=', $today)
            ->whereNotIn('trang_thai_don', ['Da_Huy'])
            ->count();

        $totalCustomers   = NguoiDung::where('vai_tro', 'Khach_Hang')->count();
        $totalStaff       = NguoiDung::whereIn('vai_tro', ['Le_Tan', 'Admin'])->count();

        // Trạng thái phòng
        $roomsCount = [
            'empty'       => Phong::where('trang_thai_hien_tai', 0)->count(),
            'occupied'    => Phong::where('trang_thai_hien_tai', 1)->count(),
            'cleaning'    => Phong::where('trang_thai_hien_tai', 2)->count(),
            'maintenance' => Phong::where('trang_thai_hien_tai', 3)->count(),
        ];

        $recentBookings = DonDatPhong::with('khachHang')
            ->orderBy('ngay_dat_don', 'desc')
            ->limit(5)
            ->get();

        // =========================================================================
        // 🟢 NHÂN VIÊN XỬ LÝ: Lấy danh sách Check-in / Check-out hôm nay
        // kèm tên nhân viên thực hiện (từ bảng hoa_don_thanh_toan)
        // =========================================================================
        $staffActivityToday = DB::table('don_dat_phong as d')
            ->join('chi_tiet_dat_phong as ct', 'd.don_dat_id', '=', 'ct.don_dat_id')
            ->join('phong as p', 'ct.phong_id', '=', 'p.phong_id')
            ->join('nguoi_dung as kh', 'd.khach_hang_id', '=', 'kh.nguoi_dung_id')
            ->leftJoin('hoa_don_thanh_toan as hd', 'd.don_dat_id', '=', 'hd.don_dat_id')
            ->leftJoin('nguoi_dung as nv', 'hd.nhan_vien_tao_id', '=', 'nv.nguoi_dung_id')
            ->where(function($q) use ($today) {
                $q->where('d.ngay_checkin', $today)     // Check-in hôm nay
                  ->orWhere('d.ngay_checkout', $today);  // Check-out hôm nay
            })
            ->whereNotIn('d.trang_thai_don', ['Da_Huy'])
            ->select([
                'd.don_dat_id',
                'p.so_phong',
                'kh.ho_ten as ten_khach',
                'd.trang_thai_don',
                'd.ngay_checkin',
                'd.ngay_checkout',
                'nv.ho_ten as ten_nhan_vien',
                'nv.email as email_nhan_vien',
                'hd.ngay_thanh_toan as thoi_gian_xu_ly',
            ])
            ->orderBy('d.ngay_checkin', 'asc')
            ->get()
            ->map(function($row) {
                $action = match($row->trang_thai_don) {
                    'Dang_O'       => 'check_in',
                    'Da_Tra_Phong' => 'check_out',
                    default        => 'pending',
                };
                return [
                    'don_dat_id'      => $row->don_dat_id,
                    'so_phong'        => $row->so_phong,
                    'ten_khach'       => $row->ten_khach,
                    'trang_thai'      => $row->trang_thai_don,
                    'action'          => $action,
                    'ngay_checkin'    => $row->ngay_checkin,
                    'ngay_checkout'   => $row->ngay_checkout,
                    'ten_nhan_vien'   => $row->ten_nhan_vien ?? 'Chưa xử lý',
                    'email_nhan_vien' => $row->email_nhan_vien ?? null,
                    'thoi_gian_xu_ly' => $row->thoi_gian_xu_ly,
                ];
            });

        // Thống kê số đơn theo từng nhân viên (trong tháng hiện tại)
        $staffStats = DB::table('hoa_don_thanh_toan as hd')
            ->join('nguoi_dung as nv', 'hd.nhan_vien_tao_id', '=', 'nv.nguoi_dung_id')
            ->whereIn('nv.vai_tro', ['Le_Tan', 'Admin'])
            ->whereMonth('hd.ngay_thanh_toan', Carbon::now()->month)
            ->whereYear('hd.ngay_thanh_toan', Carbon::now()->year)
            ->select([
                'nv.nguoi_dung_id',
                'nv.ho_ten',
                'nv.email',
                'nv.vai_tro',
                DB::raw('COUNT(hd.hoa_don_id) as so_don_xu_ly'),
                DB::raw('SUM(hd.tong_tien_thanh_toan) as tong_doanh_thu'),
            ])
            ->groupBy('nv.nguoi_dung_id', 'nv.ho_ten', 'nv.email', 'nv.vai_tro')
            ->orderByDesc('so_don_xu_ly')
            ->get()
            ->map(function($row) {
                // Extract chi nhánh từ email: toan.SG@hotel.com → SG
                $chiNhanh = null;
                if (preg_match('/\.([A-Z]{2,6})@hotel\.com$/', $row->email, $m)) {
                    $chiNhanh = $m[1];
                }
                return [
                    'nhan_vien_id'   => $row->nguoi_dung_id,
                    'ten_nhan_vien'  => $row->ho_ten,
                    'email'          => $row->email,
                    'vai_tro'        => $row->vai_tro === 'Le_Tan' ? 'Lễ Tân' : 'Admin',
                    'chi_nhanh'      => $chiNhanh,
                    'so_don_xu_ly'   => (int) $row->so_don_xu_ly,
                    'tong_doanh_thu' => (float) $row->tong_doanh_thu,
                ];
            });

        return response()->json([
            'revenue'              => (float)$totalRevenue,
            'bookings_count'       => $totalBookings,
            'active_today'         => $activeBookingsToday,
            'customers_count'      => $totalCustomers,
            'staff_count'          => $totalStaff,
            'rooms_status'         => $roomsCount,
            'recent_bookings'      => $recentBookings,
            'staff_activity_today' => $staffActivityToday,   // 🟢 Hoạt động nhân viên hôm nay
            'staff_stats'          => $staffStats,           // 🟢 Thống kê theo nhân viên (tháng này)
        ], 200);
    }

    public function getRevenueChart()
    {
        $data = DB::table('don_dat_phong')
            ->select(
                DB::raw("DATE(ngay_dat_don) as date"),
                DB::raw('SUM(thanh_tien_cuoi) as revenue')
            )
            ->whereNotIn('trang_thai_don', ['Da_Huy'])
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data, 200);
    }

    public function getRoomTypeStats()
    {
        $stats = LoaiPhong::withCount(['phongs'])->get()->map(function($lp) {
            $bookingsCount = DB::table('chi_tiet_dat_phong')
                ->join('phong', 'chi_tiet_dat_phong.phong_id', '=', 'phong.phong_id')
                ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
                ->where('phong.loai_phong_id', $lp->loai_phong_id)
                ->where('don_dat_phong.trang_thai_don', '!=', 'Da_Huy')
                ->count();

            return [
                'loai_phong_id'  => $lp->loai_phong_id,
                'ten_loai_phong' => $lp->ten_loai_phong,
                'rooms_count'    => $lp->phongs_count,
                'bookings_count' => $bookingsCount,
            ];
        });

        return response()->json($stats, 200);
    }
}
