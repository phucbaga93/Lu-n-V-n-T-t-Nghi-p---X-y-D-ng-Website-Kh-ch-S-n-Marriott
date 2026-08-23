<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LichSuDoiPhong extends Model
{
    protected $table = 'lich_su_doi_phong';
    protected $primaryKey = 'lich_su_id';
    public $timestamps = false;

    protected $fillable = [
        'chi_tiet_dat_phong_id',
        'phong_cu',
        'phong_moi',
        'thoi_gian',
        'ly_do',
        'phu_thu_thanh_toan'
    ];

    protected $casts = [
        'thoi_gian' => 'datetime',
        'phu_thu_thanh_toan' => 'decimal:2'
    ];

    // Relationships
    public function chiTietDatPhong(): BelongsTo
    {
        return $this->belongsTo(ChiTietDatPhong::class, 'chi_tiet_dat_phong_id', 'chi_tiet_dat_phong_id');
    }

    public function phongCu(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_cu', 'phong_id');
    }

    public function phongMoi(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_moi', 'phong_id');
    }
}