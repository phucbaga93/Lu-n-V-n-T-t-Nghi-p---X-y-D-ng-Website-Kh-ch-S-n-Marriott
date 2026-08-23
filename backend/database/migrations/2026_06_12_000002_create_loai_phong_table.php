<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loai_phong', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('loai_phong_id', true);
            $table->string('ten_loai_phong', 100);
            $table->decimal('gia_theo_dem', 12, 2);
            $table->integer('dien_tich_m2')->nullable();
            $table->integer('so_giuong')->default(1);
            $table->integer('so_khach_toi_da')->default(2);
            $table->text('mo_ta')->nullable();
            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loai_phong');
    }
};
