<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dich_vu', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->integer('dich_vu_id', true);
            $table->string('ten_dich_vu', 100)->unique();
            $table->string('loai_dich_vu', 100)->nullable();
            $table->decimal('gia_mac_dinh', 10, 2)->default(0.00);
            $table->text('mo_ta')->nullable();
             $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dich_vu');
    }
};
