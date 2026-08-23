<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('danh_gia_trai_nghiem', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('danh_gia_id', true);
            $table->integer('khach_hang_id');
            $table->integer('loai_phong_id');
            $table->integer('so_sao');
            $table->text('binh_luan')->nullable();
            $table->date('ngay_danh_gia')->default(DB::raw('(CURRENT_DATE)'));

            $table->foreign('khach_hang_id')->references('nguoi_dung_id')->on('nguoi_dung')->onDelete('cascade');
            $table->foreign('loai_phong_id')->references('loai_phong_id')->on('loai_phong')->onDelete('cascade');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('danh_gia_trai_nghiem');
    }
};
