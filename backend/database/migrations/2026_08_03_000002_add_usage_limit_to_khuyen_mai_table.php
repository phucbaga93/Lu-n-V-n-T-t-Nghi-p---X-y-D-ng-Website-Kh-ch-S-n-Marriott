<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('khuyen_mai')) {
            Schema::table('khuyen_mai', function (Blueprint $table) {
                if (!Schema::hasColumn('khuyen_mai', 'so_luong_gioi_han')) {
                    $table->integer('so_luong_gioi_han')->default(100)->after('so_tien_giam_toi_da');
                }
                if (!Schema::hasColumn('khuyen_mai', 'so_lan_da_su_dung')) {
                    $table->integer('so_lan_da_su_dung')->default(0)->after('so_luong_gioi_han');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('khuyen_mai')) {
            Schema::table('khuyen_mai', function (Blueprint $table) {
                $table->dropColumn(['so_luong_gioi_han', 'so_lan_da_su_dung']);
            });
        }
    }
};
