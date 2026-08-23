<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KhuyenMai extends Model
{
    protected $table = 'khuyen_mai';
    protected $primaryKey = 'ma_code';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'ma_code',
        'mo_ta',
        'phan_tram_giam',
        'so_tien_giam_toi_da',
        'don_hang_toi_thieu',
        'so_luong_gioi_han',
        'so_lan_da_su_dung',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'ngay_checkin_tu',
        'ngay_checkin_den'
    ];

    protected $casts = [
        'phan_tram_giam' => 'integer',
        'so_tien_giam_toi_da' => 'decimal:2',
        'don_hang_toi_thieu' => 'decimal:2',
        'so_luong_gioi_han' => 'integer',
        'so_lan_da_su_dung' => 'integer',
        'ngay_bat_dau' => 'date',
        'ngay_ket_thuc' => 'date',
        'ngay_checkin_tu' => 'date',
        'ngay_checkin_den' => 'date'
    ];

    // Relationships
    public function donDatPhong(): HasMany
    {
        return $this->hasMany(DonDatPhong::class, 'ma_khuyen_mai_id', 'ma_code');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('ngay_bat_dau', '<=', now())
            ->where('ngay_ket_thuc', '>=', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('ngay_ket_thuc', '<', now());
    }

    public function scopeUpcoming($query)
    {
        return $query->where('ngay_bat_dau', '>', now());
    }

    // Accessors
    public function getIsActiveAttribute()
    {
        return $this->ngay_bat_dau <= now() && $this->ngay_ket_thuc >= now();
    }

    public function getDaysLeftAttribute()
    {
        if ($this->ngay_ket_thuc < now()) {
            return 0;
        }
        return now()->diffInDays($this->ngay_ket_thuc);
    }

    public function calculateDiscount($amount)
    {
        $discount = $amount * $this->phan_tram_giam / 100;
        return min($discount, $this->so_tien_giam_toi_da);
    }
}