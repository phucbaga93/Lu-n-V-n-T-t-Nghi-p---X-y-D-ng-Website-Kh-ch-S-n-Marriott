<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('khuyen_mai', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->string('ma_code', 50)->primary();
            $table->text('mo_ta')->nullable();
            $table->integer('phan_tram_giam');
            $table->decimal('so_tien_giam_toi_da', 12, 2)->default(0.00);
            $table->date('ngay_bat_dau');
            $table->date('ngay_ket_thuc');
             $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('khuyen_mai');
    }
};
