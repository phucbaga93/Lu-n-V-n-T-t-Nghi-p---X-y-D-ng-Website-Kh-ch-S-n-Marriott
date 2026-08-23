<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('don_dat_phong', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('don_dat_id', true);
            $table->integer('khach_hang_id');
            $table->integer('nguoi_tao_don');
            $table->enum('nguon_dat', ['ONLINE', 'OFFLINE']);
            $table->string('ma_khuyen_mai_id', 50)->nullable();
            $table->timestamp('ngay_dat_don')->useCurrent();
            $table->date('ngay_checkin');
            $table->date('ngay_checkout');
            $table->integer('so_nguoi_lon')->default(1);
            $table->integer('so_tre_em')->default(0);
            $table->decimal('tong_tien_phong', 12, 2)->default(0.00);
            $table->decimal('thanh_tien_cuoi', 12, 2)->default(0.00);
            $table->integer('phan_tram_dat_coc')->default(100);
            $table->decimal('so_tien_da_coc', 12, 2)->default(0.00);
            $table->enum('trang_thai_don', ['Cho_Xac_Nhan', 'Da_Xac_Nhan', 'Da_Thanh_Toan', 'Dang_O', 'Da_Tra_Phong', 'Da_Huy', 'No_Show'])->default('Cho_Xac_Nhan');
            $table->timestamp('ngay_huy_don')->nullable();
            $table->text('ghi_chu_dac_biet')->nullable();

            $table->foreign('khach_hang_id')->references('nguoi_dung_id')->on('nguoi_dung')->onDelete('restrict');
            $table->foreign('nguoi_tao_don')->references('nguoi_dung_id')->on('nguoi_dung')->onDelete('restrict');
            $table->foreign('ma_khuyen_mai_id')->references('ma_code')->on('khuyen_mai')->onDelete('set null')->onUpdate('cascade');
        $table->timestamps();
            });

    }

    public function down(): void
    {
        Schema::dropIfExists('don_dat_phong');
    }
};
