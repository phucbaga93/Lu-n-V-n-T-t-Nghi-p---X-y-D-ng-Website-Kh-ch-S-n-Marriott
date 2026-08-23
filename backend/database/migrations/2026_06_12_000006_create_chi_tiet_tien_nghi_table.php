<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chi_tiet_tien_nghi', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('tien_nghi_id');
            $table->integer('phong_id');

            $table->primary(['tien_nghi_id', 'phong_id']);
            $table->foreign('tien_nghi_id')->references('tien_nghi_id')->on('tien_nghi')->onDelete('cascade');
            $table->foreign('phong_id')->references('phong_id')->on('phong')->onDelete('cascade');
         $table->timestamps();
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('chi_tiet_tien_nghi');
    }
};
