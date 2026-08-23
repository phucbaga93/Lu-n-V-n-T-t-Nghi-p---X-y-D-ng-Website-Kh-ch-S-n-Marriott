<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HinhAnhPhong extends Model
{
    protected $table = 'hinh_anh_phong';
    protected $primaryKey = 'hinh_anh_id';
    public $timestamps = false;

    protected $fillable = [
        'phong_id',
        'url_hinh_anh'
    ];

    // Relationships
    public function phong(): BelongsTo
    {
        return $this->belongsTo(Phong::class, 'phong_id', 'phong_id');
    }
}