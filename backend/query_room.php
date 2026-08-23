<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use Illuminate\Contracts\Console\Kernel;
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\NguoiDung;

foreach (NguoiDung::all() as $u) {
    echo "ID: {$u->nguoi_dung_id} | Name: {$u->ho_ten} | Email: {$u->email} | Phone: {$u->so_dien_thoai} | CCCD: {$u->cccd}\n";
}
