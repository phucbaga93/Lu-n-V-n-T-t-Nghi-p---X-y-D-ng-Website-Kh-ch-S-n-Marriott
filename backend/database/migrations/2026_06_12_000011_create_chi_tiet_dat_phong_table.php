<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chi_tiet_dat_phong', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('chi_tiet_dat_phong_id', true);
            $table->integer('don_dat_id');
            $table->integer('phong_id');
            $table->decimal('gia_ap_dung', 10, 2);
            $table->integer('phong_id_ban_dau')->nullable();
            $table->enum('trang_thai', ['booked', 'checked_in', 'checked_out', 'cancelled'])->default('booked');

            $table->unique(['don_dat_id', 'phong_id'], 'unique_phong_trong_don');
            $table->foreign('don_dat_id')->references('don_dat_id')->on('don_dat_phong')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('phong_id')->references('phong_id')->on('phong')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('phong_id_ban_dau')->references('phong_id')->on('phong')->onDelete('set null')->onUpdate('cascade');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('chi_tiet_dat_phong');
    }
};
