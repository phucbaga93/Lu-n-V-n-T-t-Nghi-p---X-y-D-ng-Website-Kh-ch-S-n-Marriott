<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tien_nghi', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('tien_nghi_id', true);
            $table->string('ten_tien_nghi', 100)->unique();
             $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tien_nghi');
    }
};
