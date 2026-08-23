<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phong', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('phong_id', true);
            $table->string('so_phong', 20)->unique();
            $table->integer('loai_phong_id');
            $table->integer('tang')->nullable();
            $table->text('mo_ta')->nullable();
            $table->tinyInteger('trang_thai_hien_tai')->default(0)->comment('0: Trong, 1: Dang su dung, 2: Don dep, 3: Bao tri');
            $table->string('vi_tri', 100)->nullable();

            $table->foreign('loai_phong_id')->references('loai_phong_id')->on('loai_phong')->onUpdate('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phong');
    }
};
