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
                if (!Schema::hasColumn('khuyen_mai', 'don_hang_toi_thieu')) {
                    $table->decimal('don_hang_toi_thieu', 12, 2)->default(0)->after('so_tien_giam_toi_da');
                }
                if (!Schema::hasColumn('khuyen_mai', 'ngay_checkin_tu')) {
                    $table->date('ngay_checkin_tu')->nullable()->after('ngay_ket_thuc');
                }
                if (!Schema::hasColumn('khuyen_mai', 'ngay_checkin_den')) {
                    $table->date('ngay_checkin_den')->nullable()->after('ngay_checkin_tu');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('khuyen_mai')) {
            Schema::table('khuyen_mai', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('khuyen_mai', 'don_hang_toi_thieu')) $columns[] = 'don_hang_toi_thieu';
                if (Schema::hasColumn('khuyen_mai', 'ngay_checkin_tu')) $columns[] = 'ngay_checkin_tu';
                if (Schema::hasColumn('khuyen_mai', 'ngay_checkin_den')) $columns[] = 'ngay_checkin_den';
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
