<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nguoi_dung', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('nguoi_dung_id', true);
            $table->string('ho_ten', 100);
            $table->string('email', 100)->unique();
            $table->string('mat_khau', 255);
            $table->string('so_dien_thoai', 15)->unique();
            $table->string('cccd', 20)->nullable()->unique();
            $table->date('ngay_sinh')->nullable();
            $table->string('dia_chi', 255)->nullable();
            $table->enum('vai_tro', ['Admin', 'Khach_Hang'])->default('Khach_Hang');
            $table->timestamps();

            });
    }

    public function down(): void
    {
        Schema::dropIfExists('nguoi_dung');
    }
};
