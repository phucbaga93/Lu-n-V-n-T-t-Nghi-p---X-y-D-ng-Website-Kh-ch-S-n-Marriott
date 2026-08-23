<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DonDatPhong;
use App\Models\LoaiPhong;
use App\Models\DanhGiaTraiNghiem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index()
    {
        // 1. Monthly revenue breakdown
        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite'
            ? 'strftime("%Y-%m", ngay_dat_don)'
            : "DATE_FORMAT(ngay_dat_don, '%Y-%m')"; // MySQL chuẩn

        $monthlyRevenue = DonDatPhong::select(
            DB::raw("$monthExpr as month"),
            DB::raw('SUM(thanh_tien_cuoi) as revenue'),
            DB::raw('COUNT(don_dat_id) as count')
        )
        ->whereNotIn('trang_thai_don', ['Da_Huy'])
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->get();

        // 2. Room category utilization popularity
        $categorySales = LoaiPhong::withCount(['reviews'])->get()->map(function($cat) {
            // count bookings relating to this category if any
            $bookingsCount = DB::table('chi_tiet_dat_phong')
                ->join('phong', 'chi_tiet_dat_phong.phong_id', '=', 'phong.phong_id')
                ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
                ->where('phong.loai_phong_id', $cat->loai_phong_id)
                ->where('don_dat_phong.trang_thai_don', '!=', 'Da_Huy')
                ->count();

            return [
                'category_name' => $cat->ten_loai_phong,
                'bookings_count' => $bookingsCount,
                'average_rating' => round($cat->reviews()->avg('so_sao') ?: 0, 1),
            ];
        });

        // 3. Payment methods metrics
        $paymentMethods = DB::table('hoa_don_thanh_toan')
            ->select('hinh_thuc_thanh_toan as method', DB::raw('SUM(tong_tien_thanh_toan) as total'), DB::raw('COUNT(hoa_don_id) as count'))
            ->groupBy('method')
            ->get();

        return response()->json([
            'monthly_revenue' => $monthlyRevenue,
            'category_sales' => $categorySales,
            'payment_methods' => $paymentMethods
        ], 200);
    }

    public function revenueReport()
    {
        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite'
            ? 'strftime("%Y-%m", ngay_dat_don)'
            : "DATE_FORMAT(ngay_dat_don, '%Y-%m')"; // MySQL chuẩn

        $monthlyRevenue = DonDatPhong::select(
            DB::raw("$monthExpr as month"),
            DB::raw('SUM(thanh_tien_cuoi) as revenue'),
            DB::raw('COUNT(don_dat_id) as count')
        )
        ->whereNotIn('trang_thai_don', ['Da_Huy'])
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->get();

        return response()->json([
            'revenue_by_month' => $monthlyRevenue
        ], 200);
    }

    public function occupancyReport()
    {
        $totalRooms = \App\Models\Phong::count();
        $occupiedRooms = \App\Models\Phong::where('trang_thai_hien_tai', 1)->count();
        $cleaningRooms = \App\Models\Phong::where('trang_thai_hien_tai', 2)->count();
        $maintenanceRooms = \App\Models\Phong::where('trang_thai_hien_tai', 3)->count();
        $emptyRooms = \App\Models\Phong::where('trang_thai_hien_tai', 0)->count();

        return response()->json([
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'cleaning_rooms' => $cleaningRooms,
            'maintenance_rooms' => $maintenanceRooms,
            'empty_rooms' => $emptyRooms,
            'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0
        ], 200);
    }

    public function roomTypeReport()
    {
        $report = LoaiPhong::withCount(['reviews'])->get()->map(function($type) {
            $bookingsCount = DB::table('chi_tiet_dat_phong')
                ->join('phong', 'chi_tiet_dat_phong.phong_id', '=', 'phong.phong_id')
                ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
                ->where('phong.loai_phong_id', $type->loai_phong_id)
                ->where('don_dat_phong.trang_thai_don', '!=', 'Da_Huy')
                ->count();

            return [
                'loai_phong_id' => $type->loai_phong_id,
                'ten_loai_phong' => $type->ten_loai_phong,
                'bookings_count' => $bookingsCount,
                'average_rating' => round($type->reviews()->avg('so_sao') ?: 0, 1),
            ];
        });

        return response()->json($report, 200);
    }
}
