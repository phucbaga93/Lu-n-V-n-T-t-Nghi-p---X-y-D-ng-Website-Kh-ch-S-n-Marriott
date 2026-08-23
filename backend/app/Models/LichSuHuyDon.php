<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LichSuHuyDon extends Model
{
    protected $table = 'lich_su_huy_don';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'don_dat_id',
        'nguoi_huy_id',
        'thoi_diem_huy',
        'ly_do',
        'so_tien_phat',
        'so_tien_hoan'
    ];

    protected $casts = [
        'thoi_diem_huy' => 'datetime'
    ];

    // Relationships
    public function donDat(): BelongsTo
    {
        return $this->belongsTo(DonDatPhong::class, 'don_dat_id', 'don_dat_id');
    }

    public function nguoiHuy(): BelongsTo
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_huy_id', 'nguoi_dung_id');
    }
}