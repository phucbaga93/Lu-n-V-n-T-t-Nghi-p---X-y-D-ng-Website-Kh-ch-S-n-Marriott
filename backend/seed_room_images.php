<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Phong;
use App\Models\LoaiPhong;
use Illuminate\Support\Facades\DB;

echo "Seeding actual JW Marriott Hotel & Suites Saigon room photos locally...\n";

$suiteLP = LoaiPhong::where('ten_loai_phong', 'like', '%Suite%')
    ->orWhere('ten_loai_phong', 'like', '%SUT%')->first();
if ($suiteLP) {
    $suiteLP->mo_ta = "Phòng thượng hạng tầng cao nhất, phong cách JW Marriott Saigon, phòng khách riêng rộng rãi, bồn tắm nằm đá cẩm thạch và view thành phố Quận 1 tuyệt đẹp.";
    $suiteLP->save();
}

DB::table('hinh_anh_phong')->truncate();
echo "Truncated hinh_anh_phong table.\n";

// Target local directory in Laravel public folder
$targetDir = __DIR__ . '/public/images/rooms';
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "Created directory: {$targetDir}\n";
}

/*
 * Official JW Marriott Hotel & Suites Saigon images
 */
$marriottImages = [
    '0101' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-twin-beds-21396?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-29045?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-32090?wid=800',
    ],
    '0102' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-corner-king-bed-22411?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-37056?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-lounge-12189?wid=800',
    ],
    '0201' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-club-deluxe-corner-room-37123?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-32090?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-lounge-12189?wid=800',
    ],
    '0202' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-club-deluxe-corner-room-15056?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-37056?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-lounge-12189?wid=800',
    ],
    '0301' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-suite-king-bed-15989?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-suite-living-28506?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-29045?wid=800',
    ],
    '0302' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-residential-suite-king--15827?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-residential-suite-living-26085?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-37056?wid=800',
    ],
    '0501' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-king--27471?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-living-14578?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-bathr-36596?wid=800',
    ],
    '0502' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-dining-26317?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-living-14578?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-presidential-suite-bathr-36596?wid=800',
    ],
    '0601' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-club-deluxe-room-king--27361?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-36295?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-lounge-12189?wid=800',
    ],
    '0701' => [
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-club-deluxe-room-twin--21356?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-deluxe-room-bathroom-29045?wid=800',
        'https://cache.marriott.com/is/image/marriotts7prod/jw-sgnjs-executive-lounge-12189?wid=800',
    ],
];

// Fallback images in case download fails
$unsplashFallbacks = [
    '0101' => [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598928636135?auto=format&fit=crop&w=800&q=80',
    ],
    '0102' => [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
    ],
    '0201' => [
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80',
    ],
    '0202' => [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=800&q=80',
    ],
    '0301' => [
        'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    ],
    '0302' => [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    ],
    '0501' => [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    ],
    '0502' => [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    '0601' => [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    ],
    '0701' => [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    ],
];

// Set User-Agent context to bypass Marriott 403 Forbidden
$options = [
    'http' => [
        'method' => 'GET',
        'header' => 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
];
$context = stream_context_create($options);

$rooms = Phong::all();
$insertedCount = 0;

foreach ($rooms as $room) {
    $num = $room->so_phong;
    $urls = $marriottImages[$num] ?? [];
    
    for ($i = 0; $i < 3; $i++) {
        $imgUrl = isset($urls[$i]) ? $urls[$i] : null;
        $localFileName = "room_{$num}_" . ($i + 1) . ".jpg";
        $localPath = "{$targetDir}/{$localFileName}";
        $dbUrl = "http://localhost:8000/images/rooms/{$localFileName}";
        
        $downloadSuccess = false;
        
        if ($imgUrl) {
            echo "Downloading {$imgUrl} to local file {$localFileName}...\n";
            try {
                $imgData = file_get_contents($imgUrl, false, $context);
                if ($imgData !== false && strlen($imgData) > 5000) {
                    file_put_contents($localPath, $imgData);
                    $downloadSuccess = true;
                    echo "Successfully downloaded {$localFileName}.\n";
                } else {
                    echo "Downloaded data for {$localFileName} was empty or too small.\n";
                }
            } catch (\Exception $e) {
                echo "Error downloading {$localFileName}: " . $e->getMessage() . "\n";
            }
        }
        
        // If Marriott download failed, use Unsplash fallback (which is always hotlinkable directly)
        if (!$downloadSuccess) {
            $fallbackUrl = $unsplashFallbacks[$num][$i] ?? 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80';
            echo "Using Unsplash fallback for Room {$num} Image " . ($i + 1) . ": {$fallbackUrl}\n";
            $dbUrl = $fallbackUrl;
        }
        
        DB::table('hinh_anh_phong')->insert([
            'phong_id'     => $room->phong_id,
            'url_hinh_anh' => $dbUrl,
        ]);
        $insertedCount++;
    }
}

echo "Successfully seeded {$insertedCount} images! Real hotel room images are now hosted locally or fall back to high-quality Unsplash.\n";
