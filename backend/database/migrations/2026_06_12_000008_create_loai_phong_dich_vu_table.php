<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loai_phong_dich_vu', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('loai_phong_id');
            $table->integer('dich_vu_id');
            $table->boolean('included')->default(true);

            $table->primary(['loai_phong_id', 'dich_vu_id']);
            $table->foreign('loai_phong_id')->references('loai_phong_id')->on('loai_phong')->onDelete('cascade');
            $table->foreign('dich_vu_id')->references('dich_vu_id')->on('dich_vu')->onDelete('cascade');
        
            $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('loai_phong_dich_vu');
    }
};
