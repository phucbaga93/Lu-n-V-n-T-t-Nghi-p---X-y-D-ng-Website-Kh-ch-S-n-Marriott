<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DichVu extends Model
{
    protected $table = 'dich_vu';
    protected $primaryKey = 'dich_vu_id';
    public $timestamps = false;

    protected $fillable = [
        'ten_dich_vu',
        'loai_dich_vu',
        'gia_mac_dinh',
        'mo_ta'
    ];

    protected $casts = [
        'gia_mac_dinh' => 'decimal:2'
    ];

    /**
     * Relationship: DichVu thuộc nhiều LoaiPhong
     */
    public function loaiPhong(): BelongsToMany
    {
        return $this->belongsToMany(
            LoaiPhong::class,
            'loai_phong_dich_vu',
            'dich_vu_id',
            'loai_phong_id'
        )->withPivot('included');
    }
}