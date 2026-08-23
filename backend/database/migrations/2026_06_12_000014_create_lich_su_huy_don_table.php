<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lich_su_huy_don', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('id', true);
            $table->integer('don_dat_id')->nullable();
            $table->integer('nguoi_huy_id')->nullable();
            $table->timestamp('thoi_diem_huy')->useCurrent();
            $table->text('ly_do')->nullable();
            $table->decimal('so_tien_phat', 12, 2)->default(0.00);
            $table->decimal('so_tien_hoan', 12, 2)->default(0.00);

            $table->foreign('don_dat_id')->references('don_dat_id')->on('don_dat_phong')->onDelete('cascade');
            $table->foreign('nguoi_huy_id')->references('nguoi_dung_id')->on('nguoi_dung')->onDelete('set null');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('lich_su_huy_don');
    }
};
