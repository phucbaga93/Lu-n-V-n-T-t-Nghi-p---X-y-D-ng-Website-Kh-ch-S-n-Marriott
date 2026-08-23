<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongTinKhachSan extends Model
{
    protected $table = 'thong_tin_khach_san';
    protected $primaryKey = 'thong_tin_id';
    public $timestamps = false;

    protected $fillable = [
        'ten_khach_san',
        'dia_chi',
        'so_dien_thoai',
        'gio_checkin_chuan',
        'gio_checkout_chuan'
    ];

    protected $casts = [
        'gio_checkin_chuan' => 'datetime:H:i',
        'gio_checkout_chuan' => 'datetime:H:i'
    ];

    // Singleton pattern - chỉ có 1 record
    public static function getInstance()
    {
        return self::first();
    }

    // Accessors
    public function getGioCheckinFormattedAttribute()
    {
        return $this->gio_checkin_chuan ? $this->gio_checkin_chuan->format('H:i') : '14:00';
    }

    public function getGioCheckoutFormattedAttribute()
    {
        return $this->gio_checkout_chuan ? $this->gio_checkout_chuan->format('H:i') : '12:00';
    }

    public function getFullAddressAttribute()
    {
        return $this->dia_chi;
    }

    public function getPhoneFormattedAttribute()
    {
        return $this->so_dien_thoai;
    }
}