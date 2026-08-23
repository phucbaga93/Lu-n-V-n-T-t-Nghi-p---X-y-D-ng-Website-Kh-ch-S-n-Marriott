<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LoaiPhong extends Model
{
    protected $table = 'loai_phong';
    protected $primaryKey = 'loai_phong_id';
    public $timestamps = false;

    protected $fillable = [
        'ten_loai_phong',
        'gia_theo_dem',
        'dien_tich_m2',
        'so_giuong',
        'so_khach_toi_da',
        'mo_ta'
    ];

    protected $casts = [
        'gia_theo_dem' => 'decimal:2',
        'dien_tich_m2' => 'integer',
        'so_giuong' => 'integer',
        'so_khach_toi_da' => 'integer'
    ];

    /**
     * Relationship: LoaiPhong có nhiều Phong
     */
    public function phong(): HasMany
    {
        return $this->hasMany(Phong::class, 'loai_phong_id', 'loai_phong_id');
    }

    /**
     * Relationship: LoaiPhong có nhiều Phong (số nhiều)
     */
    public function phongs(): HasMany
    {
        return $this->hasMany(Phong::class, 'loai_phong_id', 'loai_phong_id');
    }

    /**
     * Relationship: LoaiPhong có nhiều DanhGia
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(DanhGiaTraiNghiem::class, 'loai_phong_id', 'loai_phong_id');
    }

    public function danhGia(): HasMany
    {
        return $this->hasMany(DanhGiaTraiNghiem::class, 'loai_phong_id', 'loai_phong_id');
    }

    public function dichVu(): BelongsToMany
    {
        return $this->belongsToMany(
            DichVu::class,
            'loai_phong_dich_vu',
            'loai_phong_id',
            'dich_vu_id'
        )->withPivot('included');
    }

    public function dich_vu(): BelongsToMany
    {
        return $this->dichVu();
    }

    // Accessors
    public function getGiaFormattedAttribute(): string
    {
        return number_format($this->gia_theo_dem, 0, ',', '.') . ' ₫';
    }

    public function getRatingAvgAttribute(): float
    {
        return round($this->danhGia()->avg('so_sao') ?? 0, 1);
    }

    public function getSoPhongTrongAttribute(): int
    {
        return $this->phong()->where('trang_thai_hien_tai', 0)->count();
    }
}