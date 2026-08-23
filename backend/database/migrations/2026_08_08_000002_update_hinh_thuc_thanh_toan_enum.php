<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Chuẩn hóa dữ liệu hiện tại trong CSDL về 2 giá trị VNPAY và OFFLINE
        if (Schema::hasTable('hoa_don_thanh_toan')) {
            DB::table('hoa_don_thanh_toan')
                ->whereIn('hinh_thuc_thanh_toan', ['Online_Banking', 'Vi_Dien_Tu', 'vnpay', 'ONLINE'])
                ->update(['hinh_thuc_thanh_toan' => 'VNPAY']);

            DB::table('hoa_don_thanh_toan')
                ->whereNotIn('hinh_thuc_thanh_toan', ['VNPAY'])
                ->update(['hinh_thuc_thanh_toan' => 'OFFLINE']);

            DB::statement("ALTER TABLE hoa_don_thanh_toan MODIFY COLUMN hinh_thuc_thanh_toan ENUM('VNPAY', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('hoa_don_thanh_toan')) {
            Schema::table('hoa_don_thanh_toan', function (Blueprint $table) {
                $table->string('hinh_thuc_thanh_toan', 50)->default('Online_Banking')->change();
            });
        }
    }
};
