<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HoaDonThanhToan extends Model
{
    protected $table = 'hoa_don_thanh_toan';
    protected $primaryKey = 'hoa_don_id';
    public $timestamps = false;

    protected $fillable = [
        'don_dat_id',
        'nhan_vien_tao_id',
        'ngay_thanh_toan',
        'tong_tien_thanh_toan',
        'hinh_thuc_thanh_toan',
        'ghi_chu'
    ];

    protected $casts = [
        'ngay_thanh_toan' => 'datetime',
        'tong_tien_thanh_toan' => 'decimal:2'
    ];

    // Relationships
    public function donDat(): BelongsTo
    {
        return $this->belongsTo(DonDatPhong::class, 'don_dat_id', 'don_dat_id');
    }

    public function nhanVienTao(): BelongsTo
    {
        return $this->belongsTo(NguoiDung::class, 'nhan_vien_tao_id', 'nguoi_dung_id');
    }

    // Accessors
    public function getHinhThucThanhToanTextAttribute()
    {
        $map = [
            'VNPAY' => 'Thanh toán VNPay (Online)',
            'OFFLINE' => 'Trực tiếp tại quầy (Lễ tân thu)',
            'Online_Banking' => 'Thanh toán VNPay (Online)',
            'Vi_Dien_Tu' => 'Thanh toán VNPay (Online)',
            'Tien_Mat' => 'Trực tiếp tại quầy (Lễ tân thu)',
        ];
        return $map[$this->hinh_thuc_thanh_toan] ?? $this->hinh_thuc_thanh_toan;
    }
}