<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TienNghi extends Model
{
    protected $table = 'tien_nghi';
    protected $primaryKey = 'tien_nghi_id';
    public $timestamps = true;

    protected $fillable = [
        'ten_tien_nghi'
    ];

    // Relationships
    public function phong(): BelongsToMany
    {
        return $this->belongsToMany(
            Phong::class,
            'chi_tiet_tien_nghi',
            'tien_nghi_id',
            'phong_id'
        );
    }
}