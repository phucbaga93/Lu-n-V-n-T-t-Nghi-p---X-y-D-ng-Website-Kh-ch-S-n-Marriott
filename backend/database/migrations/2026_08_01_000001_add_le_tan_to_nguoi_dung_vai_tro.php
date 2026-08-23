<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // =========================================================================
    // MIGRATION: THÊM VAI TRÒ 'Le_Tan' VÀO CỘT ENUM vai_tro
    // Hệ thống có 3 vai trò:
    //   Admin     — Quản trị toàn quyền
    //   Le_Tan    — Nhân viên lễ tân (quyền hạn chế)
    //   Khach_Hang — Khách hàng đặt phòng
    // =========================================================================
    public function up(): void
    {
        DB::statement("ALTER TABLE nguoi_dung MODIFY COLUMN vai_tro ENUM('Admin','Le_Tan','Khach_Hang') NOT NULL DEFAULT 'Khach_Hang'");
    }

    public function down(): void
    {
        // Rollback: đổi Le_Tan về Khach_Hang trước khi thu hẹp enum
        DB::statement("UPDATE nguoi_dung SET vai_tro = 'Khach_Hang' WHERE vai_tro = 'Le_Tan'");
        DB::statement("ALTER TABLE nguoi_dung MODIFY COLUMN vai_tro ENUM('Admin','Khach_Hang') NOT NULL DEFAULT 'Khach_Hang'");
    }
};
