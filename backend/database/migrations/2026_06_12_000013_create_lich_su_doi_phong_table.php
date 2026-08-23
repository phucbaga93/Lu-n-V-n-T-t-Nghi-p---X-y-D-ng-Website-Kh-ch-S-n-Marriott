<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lich_su_doi_phong', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('lich_su_id', true);
            $table->integer('chi_tiet_dat_phong_id');
            $table->integer('phong_cu');
            $table->integer('phong_moi');
            $table->timestamp('thoi_gian')->useCurrent();
            $table->text('ly_do')->nullable();
            $table->decimal('phu_thu_thanh_toan', 12, 2)->default(0.00);

            $table->foreign('chi_tiet_dat_phong_id')->references('chi_tiet_dat_phong_id')->on('chi_tiet_dat_phong')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('phong_cu')->references('phong_id')->on('phong')->onDelete('restrict')->onUpdate('restrict');
            $table->foreign('phong_moi')->references('phong_id')->on('phong')->onDelete('restrict')->onUpdate('restrict');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('lich_su_doi_phong');
    }
};
