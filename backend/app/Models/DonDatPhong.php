<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DonDatPhong extends Model
{
    use HasFactory;

    protected $table = 'don_dat_phong';
    protected $primaryKey = 'don_dat_id';
    public $timestamps = false; // The table uses custom datetime defaults without Laravel's default created_at / updated_at

    protected static function booted()
    {
        static::updated(function ($booking) {
            // Khi đơn đặt phòng được cập nhật sang trạng thái "Đã trả phòng" (Da_Tra_Phong hoặc checked_out)
            if ($booking->trang_thai_don === 'Da_Tra_Phong' || $booking->trang_thai_don === 'checked_out') {
                // Tự động đồng bộ trạng thái chi tiết đặt phòng và phòng vật lý thành "Dọn dẹp" (2)
                foreach ($booking->chiTietDatPhongs as $detail) {
                    if ($detail->trang_thai !== 'checked_out') {
                        $detail->update(['trang_thai' => 'checked_out']);
                    }
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room && $room->trang_thai_hien_tai != 2) {
                        $room->trang_thai_hien_tai = 2;
                        $room->mo_ta = '[Dọn dẹp] Thời lượng: 30 phút.';
                        $room->save();
                    }
                }

                // Tự động tạo hóa đơn thanh toán tiền mặt (Tien_Mat) nếu chưa có hóa đơn thanh toán nào cho đơn này
                $hasInvoice = \App\Models\HoaDonThanhToan::where('don_dat_id', $booking->don_dat_id)->exists();
                if (!$hasInvoice) {
                    \App\Models\HoaDonThanhToan::create([
                        'don_dat_id' => $booking->don_dat_id,
                        'nhan_vien_tao_id' => $booking->nguoi_tao_don ?? 1,
                        'ngay_thanh_toan' => now(),
                        'tong_tien_thanh_toan' => $booking->thanh_tien_cuoi,
                        'hinh_thuc_thanh_toan' => 'OFFLINE',
                        'ghi_chu' => 'Hệ thống tự động ghi nhận thanh toán tiền mặt trực tiếp tại quầy khi trả phòng (Check-out).'
                    ]);
                }
            }
            // Đồng bộ cho trạng thái check-in (Dang_O hoặc checked_in)
            elseif ($booking->trang_thai_don === 'Dang_O' || $booking->trang_thai_don === 'checked_in') {
                foreach ($booking->chiTietDatPhongs as $detail) {
                    if ($detail->trang_thai !== 'checked_in') {
                        $detail->update(['trang_thai' => 'checked_in']);
                    }
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room && $room->trang_thai_hien_tai != 1) {
                        $room->trang_thai_hien_tai = 1;
                        $room->save();
                    }
                }
            }
            // Đồng bộ cho trạng thái hủy (Da_Huy hoặc cancelled)
            elseif ($booking->trang_thai_don === 'Da_Huy' || $booking->trang_thai_don === 'cancelled') {
                foreach ($booking->chiTietDatPhongs as $detail) {
                    if ($detail->trang_thai !== 'cancelled') {
                        $detail->update(['trang_thai' => 'cancelled']);
                    }
                    $room = \App\Models\Phong::find($detail->phong_id);
                    if ($room && $room->trang_thai_hien_tai != 0) {
                        $room->trang_thai_hien_tai = 0;
                        if (strpos($room->mo_ta ?? '', '[Dọn dẹp]') === 0 || strpos($room->mo_ta ?? '', '[Bảo trì]') === 0) {
                            $room->mo_ta = '';
                        }
                        $room->save();
                    }
                }
            }
        });
    }

    protected $fillable = [
        'khach_hang_id',
        'nguoi_tao_don',
        'nguon_dat',
        'ma_khuyen_mai_id',
        'ngay_dat_don',
        'ngay_checkin',
        'ngay_checkout',
        'so_nguoi_lon',
        'so_tre_em',
        'tong_tien_phong',
        'thanh_tien_cuoi',
        'trang_thai_don',
        'ngay_huy_don',
        'ghi_chu_dac_biet',
        'phan_tram_dat_coc',
        'so_tien_da_coc'
    ];

    protected $casts = [
        'ngay_dat_don' => 'datetime',
        'ngay_checkin' => 'date:Y-m-d',
        'ngay_checkout' => 'date:Y-m-d',
        'so_nguoi_lon' => 'integer',
        'so_tre_em' => 'integer',
        'tong_tien_phong' => 'decimal:2',
        'thanh_tien_cuoi' => 'decimal:2',
        'ngay_huy_don' => 'datetime'
    ];

    public function khachHang()
    {
        return $this->belongsTo(NguoiDung::class, 'khach_hang_id');
    }

    public function khach_hang()
    {
        return $this->belongsTo(NguoiDung::class, 'khach_hang_id');
    }

    public function nguoiTaoDon()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tao_don');
    }

    public function nguoi_tao_don()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tao_don');
    }

    public function khuyenMai()
    {
        return $this->belongsTo(KhuyenMai::class, 'ma_khuyen_mai_id', 'ma_code');
    }

    public function khuyen_mai()
    {
        return $this->belongsTo(KhuyenMai::class, 'ma_khuyen_mai_id', 'ma_code');
    }

    public function chiTietDatPhongs()
    {
        return $this->hasMany(ChiTietDatPhong::class, 'don_dat_id');
    }

    public function chiTietDatPhong()
    {
        return $this->hasMany(ChiTietDatPhong::class, 'don_dat_id');
    }

    public function chi_tiet_dat_phong()
    {
        return $this->hasMany(ChiTietDatPhong::class, 'don_dat_id');
    }

    public function chi_tiet_dat_phongs()
    {
        return $this->hasMany(ChiTietDatPhong::class, 'don_dat_id');
    }

    public function hoaDonThanhToan()
    {
        return $this->hasOne(HoaDonThanhToan::class, 'don_dat_id');
    }

    public function hoa_don_thanh_toan()
    {
        return $this->hasOne(HoaDonThanhToan::class, 'don_dat_id');
    }

    public function lichSuHuys()
    {
        return $this->hasMany(LichSuHuyDon::class, 'don_dat_id');
    }

    public function lichSuHuyDons()
    {
        return $this->hasMany(LichSuHuyDon::class, 'don_dat_id');
    }

    public function lich_su_huy_dons()
    {
        return $this->hasMany(LichSuHuyDon::class, 'don_dat_id');
    }

    public function lich_su_huys()
    {
        return $this->hasMany(LichSuHuyDon::class, 'don_dat_id');
    }
}
