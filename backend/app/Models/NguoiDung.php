<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class NguoiDung extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'nguoi_dung';
    protected $primaryKey = 'nguoi_dung_id';

    protected $fillable = [
        'ho_ten',
        'email',
        'mat_khau',
        'so_dien_thoai',
        'cccd',
        'ngay_sinh',
        'dia_chi',
        'vai_tro'
    ];

    protected $hidden = [
        'mat_khau',
    ];

    protected $casts = [
        'ngay_sinh' => 'date',
    ];

    public function getAuthPassword()
    {
        return $this->mat_khau;
    }

    public static function removeAccents($str)
    {
        if (empty($str)) return '';
        $str = preg_replace("/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/", 'a', $str);
        $str = preg_replace("/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/", 'e', $str);
        $str = preg_replace("/(ì|í|ị|ỉ|ĩ)/", 'i', $str);
        $str = preg_replace("/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/", 'o', $str);
        $str = preg_replace("/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/", 'u', $str);
        $str = preg_replace("/(ỳ|ý|ỵ|ỷ|ỹ)/", 'y', $str);
        $str = preg_replace("/(đ)/", 'd', $str);
        $str = preg_replace("/(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)/", 'a', $str);
        $str = preg_replace("/(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)/", 'e', $str);
        $str = preg_replace("/(Ì|Í|Ị|Ỉ|Ĩ)/", 'i', $str);
        $str = preg_replace("/(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)/", 'o', $str);
        $str = preg_replace("/(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)/", 'u', $str);
        $str = preg_replace("/(Ỳ|Ý|Ỵ|Ỷ|Ỹ)/", 'y', $str);
        $str = preg_replace("/(Đ)/", 'd', $str);
        return preg_replace('/\s+/', ' ', trim($str));
    }

    public static function isNameMatch($name1, $name2)
    {
        $n1 = mb_strtolower(self::removeAccents($name1), 'UTF-8');
        $n2 = mb_strtolower(self::removeAccents($name2), 'UTF-8');
        return $n1 === $n2;
    }

    public function donDatPhongAsKhachHang()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function don_dat_phong_as_khach_hang()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function bookings()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function donDatPhongs()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function don_dat_phongs()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function donDatPhong()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function don_dat_phong()
    {
        return $this->hasMany(DonDatPhong::class, 'khach_hang_id');
    }

    public function donDatPhongAsCreator()
    {
        return $this->hasMany(DonDatPhong::class, 'nguoi_tao_don');
    }

    public function don_dat_phong_as_creator()
    {
        return $this->hasMany(DonDatPhong::class, 'nguoi_tao_don');
    }
}
