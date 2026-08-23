<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChiTietTienNghi extends Model
{
    protected $table = 'chi_tiet_tien_nghi';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'tien_nghi_id',
        'phong_id'
    ];

    public function tienNghi(): BelongsTo
    {
        return $this->belongsTo(TienNghi::class, 'tien_nghi_id', 'tien_nghi_id');
    }

    public function phong(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_id', 'phong_id');
    }
}