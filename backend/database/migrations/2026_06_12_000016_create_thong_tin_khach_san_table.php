<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thong_tin_khach_san', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('thong_tin_id', true);
            $table->string('ten_khach_san', 255);
            $table->string('dia_chi', 255);
            $table->string('so_dien_thoai', 15);
            $table->time('gio_checkin_chuan')->default('14:00:00');
            $table->time('gio_checkout_chuan')->default('12:00:00');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thong_tin_khach_san');
    }
};
