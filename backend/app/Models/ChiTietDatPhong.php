<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChiTietDatPhong extends Model
{
    protected $table = 'chi_tiet_dat_phong';
    protected $primaryKey = 'chi_tiet_dat_phong_id';
    public $timestamps = false;

    protected $fillable = [
        'don_dat_id',
        'phong_id',
        'gia_ap_dung',
        'phong_id_ban_dau',
        'trang_thai'
    ];

    protected $casts = [
        'gia_ap_dung' => 'decimal:2',
    ];

    // Relationships
    public function donDat(): BelongsTo
    {
        return $this->belongsTo(DonDatPhong::class, 'don_dat_id', 'don_dat_id');
    }

    public function donDatPhong(): BelongsTo
    {
        return $this->belongsTo(DonDatPhong::class, 'don_dat_id', 'don_dat_id');
    }

    public function phong(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_id', 'phong_id');
    }

    public function phongBanDau(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_id_ban_dau', 'phong_id');
    }

    public function lichSuDoiPhong()
    {
        return $this->hasMany(LichSuDoiPhong::class, 'chi_tiet_dat_phong_id', 'chi_tiet_dat_phong_id');
    }

    // Scopes
    public function scopeBooked($query)
    {
        return $query->where('trang_thai', 'booked');
    }

    public function scopeCheckedIn($query)
    {
        return $query->where('trang_thai', 'checked_in');
    }

    public function scopeCheckedOut($query)
    {
        return $query->where('trang_thai', 'checked_out');
    }

    public function scopeCancelled($query)
    {
        return $query->where('trang_thai', 'cancelled');
    }

    // Accessors
    public function getTrangThaiTextAttribute()
    {
        $map = [
            'booked' => 'Đã đặt',
            'checked_in' => 'Đã nhận phòng',
            'checked_out' => 'Đã trả phòng',
            'cancelled' => 'Đã hủy',
        ];
        return $map[$this->trang_thai] ?? $this->trang_thai;
    }
}