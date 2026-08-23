<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Customer\BookingController as CustomerBookingController;
use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Customer\ReviewController as CustomerReviewController;

Route::get('{any}', function () {
    return view('welcome'); // Đảm bảo file resources/views/welcome.blade.php tồn tại và load file JS của bạn
})->where('any', '.*');
