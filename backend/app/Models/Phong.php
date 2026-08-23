<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Phong extends Model
{
    protected $table = 'phong';
    protected $primaryKey = 'phong_id';
    public $timestamps = true;

    protected $fillable = [
        'so_phong',
        'loai_phong_id',
        'tang',
        'mo_ta',
        'trang_thai_hien_tai',
        'vi_tri'
    ];

    protected $casts = [
        'trang_thai_hien_tai' => 'integer'
    ];

    protected $appends = [
        'danh_sach_tien_nghi',
        'status_for_ui',
        'hinh_anh_dau_tien',
        'thoi_gian_con_lai_don_dep',
        'thoi_gian_bao_tri'
    ];

    // Relationships
    public function loaiPhong(): BelongsTo
    {
        return $this->belongsTo(LoaiPhong::class, 'loai_phong_id', 'loai_phong_id');
    }

    public function chiTietDatPhong(): HasMany
    {
        return $this->hasMany(ChiTietDatPhong::class, 'phong_id', 'phong_id');
    }

    public function hinhAnh(): HasMany
    {
        return $this->hasMany(HinhAnhPhong::class, 'phong_id', 'phong_id');
    }

    public function tienNghi(): BelongsToMany
    {
        return $this->belongsToMany(
            TienNghi::class,
            'chi_tiet_tien_nghi',
            'phong_id',
            'tien_nghi_id'
        );
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('trang_thai_hien_tai', 0);
    }

    public function scopeOccupied($query)
    {
        return $query->where('trang_thai_hien_tai', 1);
    }

    public function scopeCleaning($query)
    {
        return $query->where('trang_thai_hien_tai', 2);
    }

    public function scopeMaintenance($query)
    {
        return $query->where('trang_thai_hien_tai', 3);
    }

    public function scopeByRoomType($query, $roomTypeId)
    {
        return $query->where('loai_phong_id', $roomTypeId);
    }

    public static function syncStatuses()
    {
        $rooms = self::all();
        foreach ($rooms as $room) {
            $hasActiveBooking = ChiTietDatPhong::where('phong_id', $room->phong_id)
                ->whereHas('donDat', function ($query) {
                    $query->where('trang_thai_don', 'Dang_O');
                })
                ->exists();

            if ($hasActiveBooking) {
                if ($room->trang_thai_hien_tai != 1) {
                    $room->trang_thai_hien_tai = 1;
                    $room->save();
                }
            } else {
                if ($room->trang_thai_hien_tai == 1) {
                    $room->trang_thai_hien_tai = 2;
                    $room->mo_ta = '[Dọn dẹp] Thời lượng: 30 phút.';
                    $room->save();
                }

                // Tự động chuyển từ Dọn dẹp (2) sang Trống (0) nếu đã dọn dẹp xong
                if ($room->trang_thai_hien_tai == 2) {
                    $startTime = $room->updated_at;
                    if ($startTime) {
                        $elapsedSeconds = abs(now()->diffInSeconds($startTime));
                        if (($elapsedSeconds / 60) >= $room->getCleaningDurationMinutes()) {
                            $room->trang_thai_hien_tai = 0;
                            if (strpos($room->mo_ta ?? '', '[Dọn dẹp]') === 0) {
                                $room->mo_ta = '';
                            }
                            $room->save();
                        }
                    } else {
                        // Nếu không có mốc thời gian, gán tạm thời là thời gian hiện tại
                        $room->updated_at = now();
                        $room->save();
                    }
                }
            }
        }
    }

    public function getCleaningDurationMinutes(): int
    {
        if ($this->trang_thai_hien_tai != 2) return 30;

        if ($this->mo_ta && preg_match('/Thời lượng:\s*(\d+)/ui', $this->mo_ta, $matches)) {
            return (int)$matches[1];
        }

        return 30;
    }

    // Accessors
    public function getTrangThaiTextAttribute(): string
    {
        $map = [
            0 => 'Còn trống',
            1 => 'Đang ở',
            2 => 'Đang dọn dẹp',
            3 => 'Bảo trì'
        ];
        return $map[$this->trang_thai_hien_tai] ?? 'Không xác định';
    }

    public function getStatusForUIAttribute(): string
    {
        $map = [
            0 => 'available',
            1 => 'occupied',
            2 => 'cleaning',
            3 => 'maintenance'
        ];
        return $map[$this->trang_thai_hien_tai] ?? 'available';
    }

    public function getGiaTheoDemAttribute(): float
    {
        return (float) ($this->loaiPhong->gia_theo_dem ?? 0);
    }

    public function getTenLoaiPhongAttribute(): string
    {
        return $this->loaiPhong->ten_loai_phong ?? 'Standard';
    }

    public function getHinhAnhDauTienAttribute(): ?string
    {
        return $this->hinhAnh->first()->url_hinh_anh ?? null;
    }

    public function getDanhSachTienNghiAttribute(): array
    {
        return $this->tienNghi->pluck('ten_tien_nghi')->toArray();
    }

    // Check if room is available for given dates
    public function isAvailable($checkIn, $checkOut, $excludeDetailId = null): bool
    {
        $query = $this->chiTietDatPhong()
            ->whereHas('donDat', function ($q) use ($checkIn, $checkOut) {
                $q->where('trang_thai_don', '!=', 'Da_Huy')
                    ->where('trang_thai_don', '!=', 'Da_Tra_Phong')
                    ->where(function ($q2) use ($checkIn, $checkOut) {
                        $q2->whereBetween('ngay_checkin', [$checkIn, $checkOut])
                            ->orWhereBetween('ngay_checkout', [$checkIn, $checkOut])
                            ->orWhere(function ($q3) use ($checkIn, $checkOut) {
                                $q3->where('ngay_checkin', '<=', $checkIn)
                                    ->where('ngay_checkout', '>=', $checkOut);
                            });
                    });
            });

        if ($excludeDetailId) {
            $query->where('chi_tiet_dat_phong_id', '!=', $excludeDetailId);
        }

        return $query->count() === 0;
    }

    public function getThoiGianConLaiDonDepAttribute(): ?string
    {
        if ($this->trang_thai_hien_tai != 2) return null;

        $startTime = $this->updated_at;
        if (!$startTime) return "Còn 30 phút";

        $duration = $this->getCleaningDurationMinutes();
        $elapsedSeconds = abs(now()->diffInSeconds($startTime));
        $elapsedMinutes = $elapsedSeconds / 60;
        $diff = $duration - $elapsedMinutes;
        $diffMinutes = (int)ceil($diff);

        if ($diffMinutes <= 0) return null;
        return "Còn " . $diffMinutes . " phút";
    }

    public function getThoiGianBaoTriAttribute(): ?string
    {
        if ($this->trang_thai_hien_tai != 3) return null;

        $startTime = $this->updated_at;
        if (!$startTime) return "Đang bảo trì";

        $expected = '';
        if ($this->mo_ta && preg_match('/Dự kiến:\s*([^.|]+)/ui', $this->mo_ta, $matches)) {
            $expected = trim($matches[1]);
        }

        $reason = '';
        if ($this->mo_ta && preg_match('/Lý do:\s*([^.|]+)/ui', $this->mo_ta, $matches)) {
            $reason = trim($matches[1]);
        }

        $diffSeconds = abs(now()->diffInSeconds($startTime));
        $diffMinutes = (int)round($diffSeconds / 60);
        $elapsedStr = '';
        if ($diffMinutes < 60) {
            $elapsedStr = "Đã bảo trì " . $diffMinutes . " phút";
        } else {
            $diffHours = (int)round($diffSeconds / 3600);
            if ($diffHours < 24) {
                $elapsedStr = "Đã bảo trì " . $diffHours . " giờ";
            } else {
                $diffDays = (int)round($diffSeconds / 86400);
                $elapsedStr = "Đã bảo trì " . $diffDays . " ngày";
            }
        }

        $result = $elapsedStr;
        if ($expected) {
            $result .= " (Dự kiến: " . $expected . ")";
        }
        if ($reason) {
            $result .= " - Lý do: " . $reason;
        }

        return $result;
    }
}