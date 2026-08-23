<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('phong', 'tang')) {
            Schema::table('phong', function (Blueprint $table) {
                $table->integer('tang')->nullable()->after('loai_phong_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('phong', 'tang')) {
            Schema::table('phong', function (Blueprint $table) {
                $table->dropColumn('tang');
            });
        }
    }
};
