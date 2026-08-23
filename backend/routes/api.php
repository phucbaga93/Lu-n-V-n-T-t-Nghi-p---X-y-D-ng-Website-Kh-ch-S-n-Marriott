<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\API\RoomAPIController;
use App\Http\Controllers\API\BookingAPIController;
use App\Http\Controllers\API\PromotionAPIController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CheckInOutController as AdminCheckInOutController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\RoomController as AdminRoomController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Customer\ReviewController as CustomerReviewController;
use App\Http\Controllers\API\VNPayController;

/*
|--------------------------------------------------------------------------
| API Routes (Laravel 11) - Tất cả các route dữ liệu JSON phục vụ React App
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PHÂN HỆ XÁC THỰC (AUTHENTICATION)
// ==========================================
Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/check-email', [RegisterController::class, 'checkEmail']);
    Route::post('/check-phone', [RegisterController::class, 'checkPhone']);
    Route::post('/forgot-password', [LoginController::class, 'forgotPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [LoginController::class, 'logout']);
        Route::get('/me', [LoginController::class, 'me']);
    });
});

// ==========================================
// 2. API CÔNG KHAI (PUBLIC ENDPOINTS)
// ==========================================
Route::prefix('v1')->group(function () {
    // === THÔNG TIN KHÁCH SẠN (HOTEL PROFILE) ===
    Route::get('/hotel-info', function () {
        return response()->json(DB::table('thong_tin_khach_san')->first());
    });

    // === PHÒNG & LOẠI PHÒNG ===
    Route::get('/rooms', [RoomAPIController::class, 'index']);
    Route::get('/rooms/{id}', [RoomAPIController::class, 'show']);
    Route::get('/room-types', [RoomAPIController::class, 'getRoomTypes']);
    Route::post('/rooms/check-availability', [RoomAPIController::class, 'checkAvailability']);
    Route::post('/bookings/quick', [BookingAPIController::class, 'storeGuestBooking']);
    Route::post('/bookings/lookup', [BookingAPIController::class, 'lookupBooking']);

    // === THANH TOÁN VNPAY ===
    Route::post('/payments/vnpay-url', [VNPayController::class, 'createPayment']);
    Route::post('/payments/vnpay-verify', [VNPayController::class, 'verifyPayment']);
    
    // === KHUYẾN MÃI ===
    Route::get('/promotions', [PromotionAPIController::class, 'index']);
    Route::get('/promotions/{code}', [PromotionAPIController::class, 'show']);
    Route::post('/promotions/validate', [PromotionAPIController::class, 'validatePromo']);
    
    // === ĐÁNH GIÁ ===
    Route::get('/reviews/room-type/{roomTypeId}', [CustomerReviewController::class, 'apiGetByRoomType']);
});

// ==========================================
// 3. API CHO KHÁCH HÀNG (CUSTOMER PROTECTED)
// ==========================================
Route::prefix('v1')->group(function () {
    // === TRANG CÁ NHÂN ===
    Route::prefix('profile')->group(function () {
        Route::get('/', [CustomerProfileController::class, 'apiProfile']);
        Route::put('/', [CustomerProfileController::class, 'apiUpdate']);
        Route::post('/change-password', [CustomerProfileController::class, 'changePassword']);
    });
    
    // === LỊCH SỬ & ĐẶT PHÒNG ===
    Route::prefix('bookings')->group(function () {
        Route::post('/', [BookingAPIController::class, 'store']);
        Route::get('/my-bookings', [BookingAPIController::class, 'myBookings']);
        Route::get('/my-bookings/{id}', [BookingAPIController::class, 'show']);
        Route::post('/my-bookings/{id}/cancel', [BookingAPIController::class, 'cancel']);
    });
    
    // === ĐÁNH GIÁ TRẢI NGHIỆM ===
    Route::prefix('reviews')->group(function () {
        Route::post('/', [CustomerReviewController::class, 'apiStore']);
        Route::get('/my-reviews', [CustomerReviewController::class, 'getUserReviews']);
    });
});

// ==========================================
// 4. API CHO QUẢN TRỊ VIÊN (ADMIN DASHBOARD & CONTROLS)
// ==========================================
Route::prefix('v1/admin')->group(function () {
    // Dashboard Stats & Analytics
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/dashboard/revenue', [AdminDashboardController::class, 'getRevenueChart']);
    Route::get('/dashboard/room-type-stats', [AdminDashboardController::class, 'getRoomTypeStats']);
    
    // Quản lý phòng vật lý
    Route::prefix('rooms')->group(function () {
        Route::get('/', [AdminRoomController::class, 'index']);
        Route::post('/upload-image', [AdminRoomController::class, 'uploadImage']);
        Route::get('/{id}', [AdminRoomController::class, 'adminShow']);
        Route::post('/', [AdminRoomController::class, 'store']);
        Route::put('/{id}', [AdminRoomController::class, 'update']);
        Route::delete('/{id}', [AdminRoomController::class, 'destroy']);
    });
    
    // Quản lý các hạng phòng (Loại phòng)
    Route::prefix('room-types')->group(function () {
        Route::get('/', [AdminRoomController::class, 'getRoomTypes']);
        Route::post('/', [AdminRoomController::class, 'storeRoomType']);
        Route::put('/{id}', [AdminRoomController::class, 'updateRoomType']);
        Route::delete('/{id}', [AdminRoomController::class, 'deleteRoomType']);
    });
    
    // Quản lý tiện nghi phòng khách sạn
    Route::prefix('amenities')->group(function () {
        Route::get('/', [AdminRoomController::class, 'getAmenities']);
        Route::post('/', [AdminRoomController::class, 'storeAmenity']);
        Route::delete('/{id}', [AdminRoomController::class, 'deleteAmenity']);
    });
    
    // Quản lý đơn đặt phòng tổng thể
    Route::prefix('bookings')->group(function () {
        Route::get('/', [AdminBookingController::class, 'index']);
        Route::get('/stats', [AdminBookingController::class, 'getStats']);
        Route::get('/{id}', [AdminBookingController::class, 'show']);
        Route::post('/', [AdminBookingController::class, 'store']);
        Route::put('/{id}/status', [AdminBookingController::class, 'updateStatus']);
        Route::put('/{id}', [AdminBookingController::class, 'update']);
        Route::post('/{id}/cancel', [AdminBookingController::class, 'cancel']);
        Route::post('/{id}/change-room', [AdminBookingController::class, 'changeRoom']);
    });
    
    // Quầy tiếp tân: Check-in / Check-out
    Route::prefix('checkinout')->group(function () {
        Route::get('/checkin/pending', [AdminCheckInOutController::class, 'getPendingCheckins']);
        Route::get('/checkout/pending', [AdminCheckInOutController::class, 'getPendingCheckouts']);
        Route::get('/{id}', [AdminCheckInOutController::class, 'getDetail']);
        Route::post('/checkin/{id}/process', [AdminCheckInOutController::class, 'processCheckin']);
        Route::post('/checkout/{id}/process', [AdminCheckInOutController::class, 'processCheckout']);
        Route::post('/checkout/by-room', [AdminCheckInOutController::class, 'quickCheckoutByRoom']);
        Route::get('/checkin/stats/today', [AdminCheckInOutController::class, 'getTodayStats']);
        Route::get('/checkin/search', [AdminCheckInOutController::class, 'search']);
    });
    
    // Quản lý tài khoản khách hàng
    Route::prefix('customers')->group(function () {
        Route::get('/', [AdminUserController::class, 'index']);
        Route::get('/{id}', [AdminUserController::class, 'show']);
        Route::get('/{id}/bookings', [AdminUserController::class, 'getCustomerBookings']);
        Route::post('/', [AdminUserController::class, 'store']);
        Route::put('/{id}', [AdminUserController::class, 'update']);
        Route::delete('/{id}', [AdminUserController::class, 'destroy']);
    });
    
    // Quản lý dịch vụ gia tăng (Spa, Dining, Tour)
    Route::prefix('services')->group(function () {
        Route::get('/', [AdminServiceController::class, 'index']);
        Route::post('/', [AdminServiceController::class, 'store']);
        Route::put('/{id}', [AdminServiceController::class, 'update']);
        Route::delete('/{id}', [AdminServiceController::class, 'destroy']);
    });
    
    // Quản lý chương trình khuyến mãi vouchers
    Route::prefix('promotions')->group(function () {
        Route::get('/', [AdminPromotionController::class, 'index']);
        Route::post('/', [AdminPromotionController::class, 'store']);
        Route::put('/{code}', [AdminPromotionController::class, 'update']);
        Route::delete('/{code}', [AdminPromotionController::class, 'destroy']);
    });
    
    // Quản lý sổ cái thanh toán hóa đơn
    Route::prefix('payments')->group(function () {
        Route::get('/', [AdminPaymentController::class, 'index']);
        Route::get('/booking/{bookingId}', [AdminPaymentController::class, 'getByBooking']);
        Route::post('/process', [AdminPaymentController::class, 'processPayment']);
    });
    
    // Báo cáo doanh thu & tỷ lệ lấp đầy phòng
    Route::prefix('reports')->group(function () {
        Route::get('/revenue', [AdminReportController::class, 'revenueReport']);
        Route::get('/occupancy', [AdminReportController::class, 'occupancyReport']);
        Route::get('/room-type', [AdminReportController::class, 'roomTypeReport']);
    });
});

// ==========================================
// 5. HEALTH CHECK / GIAO TIẾP HỆ THỐNG
// ==========================================
Route::get('/v1/health', function () {
    try {
        $dbName = DB::connection()->getDatabaseName();
        $dbStatus = 'Connected to ' . $dbName;
    } catch (\Exception $e) {
        $dbStatus = 'Connection error: ' . $e->getMessage();
    }
    
    return response()->json([
        'status' => 'ok',
        'message' => 'Marriott Saigon Hotel API is operating normally.',
        'database' => $dbStatus,
        'timestamp' => now()->toIso8601String()
    ]);
});

// ==========================================
// 6. GIAO DIỆN TRANG CHỦ & PHÒNG NGỪA LỖI
// ==========================================
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint is either incorrect or does not exist.'
    ], 404);
});
