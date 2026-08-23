<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanhGiaTraiNghiem extends Model
{
    protected $table = 'danh_gia_trai_nghiem';
    protected $primaryKey = 'danh_gia_id';
    public $timestamps = false;

    protected $fillable = [
        'khach_hang_id',
        'loai_phong_id',
        'so_sao',
        'binh_luan',
        'ngay_danh_gia'
    ];

    protected $casts = [
        'so_sao' => 'integer',
        'ngay_danh_gia' => 'date'
    ];

    // Relationships
    public function khachHang(): BelongsTo
    {
        return $this->belongsTo(NguoiDung::class, 'khach_hang_id', 'nguoi_dung_id');
    }

    public function loaiPhong(): BelongsTo
    {
        return $this->belongsTo(LoaiPhong::class, 'loai_phong_id', 'loai_phong_id');
    }

    // Scopes
    public function scopeByRating($query, $minRating = 1, $maxRating = 5)
    {
        return $query->whereBetween('so_sao', [$minRating, $maxRating]);
    }

    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('ngay_danh_gia', 'desc')->limit($limit);
    }

    // Accessors
    public function getRatingStarsAttribute()
    {
        return str_repeat('⭐', $this->so_sao);
    }
}