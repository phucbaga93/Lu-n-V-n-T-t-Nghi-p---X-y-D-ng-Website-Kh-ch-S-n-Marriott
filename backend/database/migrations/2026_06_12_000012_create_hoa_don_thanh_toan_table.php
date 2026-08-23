<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hoa_don_thanh_toan', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('hoa_don_id', true);
            $table->integer('don_dat_id')->unique();
            $table->integer('nhan_vien_tao_id')->nullable();
            $table->timestamp('ngay_thanh_toan')->useCurrent();
            $table->decimal('tong_tien_thanh_toan', 12, 2);
            $table->enum('hinh_thuc_thanh_toan', ['VNPAY', 'OFFLINE'])->default('OFFLINE');
            $table->string('ghi_chu', 200)->nullable();

            $table->foreign('don_dat_id')->references('don_dat_id')->on('don_dat_phong')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('nhan_vien_tao_id')->references('nguoi_dung_id')->on('nguoi_dung')->onDelete('set null');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('hoa_don_thanh_toan');
    }
};
