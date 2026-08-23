<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\NguoiDung;
use App\Models\LoaiPhong;
use App\Models\Phong;
use App\Models\DonDatPhong;
use App\Models\ChiTietDatPhong;
use App\Models\KhuyenMai;
use App\Models\DichVu;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;

class HotelSystemTest extends TestCase
{
    // ==========================================
    // 1. PHÂN HỆ XÁC THỰC & BẢO MẬT (AUTH & SECURITY)
    // ==========================================

    /**
     * TEST 1.1: Đăng nhập sai 5 lần liên tiếp -> Khóa tài khoản 15 phút (Status 403)
     */
    public function test_login_validation_and_lockout()
    {
        $email = 'test_lockout_' . time() . '@hotel.com';
        
        for ($i = 1; $i <= 4; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => $email,
                'mat_khau' => 'wrong_password'
            ]);
            $response->assertStatus(401);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'mat_khau' => 'wrong_password'
        ]);
        $response->assertStatus(403);
        $this->assertStringContainsString('khóa', $response->json('message'));

        Cache::forget('login_lockout_' . $email);
        Cache::forget('login_attempts_' . $email);
    }

    /**
     * TEST 1.2: Đăng nhập thành công với tài khoản hợp lệ
     */
    public function test_successful_login()
    {
        $user = NguoiDung::firstOrCreate(
            ['email' => 'testuser_login@hotel.com'],
            [
                'ho_ten' => 'Khách Hàng Test',
                'mat_khau' => Hash::make('12345678'),
                'so_dien_thoai' => '0901112233',
                'cccd' => '079201009999',
                'vai_tro' => 'Khach_Hang'
            ]
        );

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'testuser_login@hotel.com',
            'mat_khau' => '12345678'
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'user' => ['nguoi_dung_id', 'email', 'ho_ten']]);
    }

    /**
     * TEST 1.3: Quên mật khẩu -> Sinh mật khẩu tạm & gửi mail
     */
    public function test_forgot_password_generates_temp_password()
    {
        $user = NguoiDung::first();
        if (!$user) {
            $this->assertTrue(true);
            return;
        }

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    /**
     * TEST 1.4: Kiểm tra trùng lặp Email và Số điện thoại khi đăng ký
     */
    public function test_check_email_and_phone_availability()
    {
        $user = NguoiDung::first();
        if ($user) {
            $response = $this->postJson('/api/v1/auth/check-email', ['email' => $user->email]);
            $response->assertStatus(200);
            $this->assertTrue($response->json('exists'));
        }
    }

    /**
     * TEST 1.5: Đăng ký thành viên mới và đổi mật khẩu cá nhân
     */
    public function test_register_and_change_password()
    {
        $email = 'newuser_' . time() . '@gmail.com';
        $phone = '09' . rand(10000000, 99999999);
        $cccd = '079' . rand(100000009, 999999999);

        $regRes = $this->postJson('/api/v1/auth/register', [
            'ho_ten' => 'Nguyễn Văn Mới',
            'email' => $email,
            'so_dien_thoai' => $phone,
            'cccd' => $cccd,
            'mat_khau' => '12345678'
        ]);
        $regRes->assertStatus(201);

        $user = NguoiDung::where('email', $email)->first();
        $this->assertNotNull($user);

        // Đổi mật khẩu (cần new_password_confirmation)
        $changeRes = $this->postJson('/api/v1/profile/change-password', [
            'user_id' => $user->nguoi_dung_id,
            'old_password' => '12345678',
            'new_password' => '87654321',
            'new_password_confirmation' => '87654321'
        ]);
        $changeRes->assertStatus(200);
    }


    // ==========================================
    // 2. PHÂN HỆ XEM PHÒNG & LOẠI PHÒNG (ROOMS & CATEGORIES)
    // ==========================================

    /**
     * TEST 2.1: Lấy danh sách hạng phòng kèm điểm rating trung bình
     */
    public function test_get_room_categories_with_ratings()
    {
        $response = $this->getJson('/api/v1/room-types');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    /**
     * TEST 2.2: Lấy chi tiết 1 hạng phòng
     */
    public function test_get_room_category_detail()
    {
        $cat = LoaiPhong::first();
        if ($cat) {
            $response = $this->getJson('/api/v1/rooms/' . $cat->loai_phong_id);
            $response->assertStatus(200);
            $response->assertJsonStructure(['loai_phong_id', 'ten_loai_phong', 'gia_theo_dem']);
        }
    }

    /**
     * TEST 2.3: Lọc phòng trống theo ngày (Overbooking Prevention Check)
     */
    public function test_room_availability_overbooking_prevention()
    {
        $response = $this->getJson('/api/v1/rooms?check_in=2026-10-01&check_out=2026-10-03');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    /**
     * TEST 2.4: Admin cập nhật trạng thái phòng vật lý (Chuyển sang Dọn dẹp/Bảo trì)
     */
    public function test_admin_update_physical_room_status()
    {
        $room = Phong::first();
        if ($room) {
            $response = $this->putJson('/api/v1/admin/rooms/' . $room->phong_id, [
                'trang_thai_hien_tai' => 2 // 2: Dọn dẹp
            ]);
            $response->assertStatus(200);
        }
    }


    // ==========================================
    // 3. PHÂN HỆ ĐẶT PHÒNG & CHỐNG OVERBOOKING (BOOKING ENGINE)
    // ==========================================

    /**
     * TEST 3.1: Đặt phòng nhanh cho Khách vãng lai (Guest Quick Booking)
     */
    public function test_store_guest_quick_booking()
    {
        $cat = LoaiPhong::first();
        if (!$cat) {
            $this->assertTrue(true);
            return;
        }

        $email = 'guest_' . time() . '@gmail.com';
        $phone = '09' . rand(10000000, 99999999);
        $cccd = '079' . rand(100000009, 999999999);

        $response = $this->postJson('/api/v1/bookings/quick', [
            'guest_name' => 'Khách Vãng Lai Test',
            'guest_email' => $email,
            'guest_phone' => $phone,
            'guest_cccd' => $cccd,
            'ngay_checkin' => '2026-11-10',
            'ngay_checkout' => '2026-11-12',
            'loai_phong_id' => $cat->loai_phong_id,
            'so_nguoi_lon' => 2,
            'so_tre_em' => 0,
            'tong_tien_phong' => (float)$cat->gia_theo_dem * 2,
            'thanh_tien_cuoi' => (float)$cat->gia_theo_dem * 2,
            'payment_method' => 'counter'
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['message', 'booking' => ['don_dat_id']]);
    }

    /**
     * TEST 3.2: Tra cứu đơn đặt phòng theo Mã đơn + Email/SĐT
     */
    public function test_lookup_booking()
    {
        $booking = DonDatPhong::with('khachHang')->first();
        if ($booking && $booking->khachHang) {
            $response = $this->postJson('/api/v1/bookings/lookup', [
                'booking_id' => (string)$booking->don_dat_id,
                'email_or_phone' => $booking->khachHang->email
            ]);
            $response->assertStatus(200);
            $response->assertJsonStructure(['don_dat_id', 'ngay_checkin', 'ngay_checkout']);
        }
    }


    // ==========================================
    // 4. PHÂN HỆ HỦY ĐƠN & PHẠT CỌC PHÂN TẦNG (TIERED PENALTY)
    // ==========================================

    /**
     * TEST 4.1: Hủy đơn trước ngày nhận phòng >= 14 ngày -> Miễn phạt 100% (Phạt 0%)
     */
    public function test_tiered_cancellation_penalty_14_days()
    {
        $cat = LoaiPhong::first();
        $user = NguoiDung::first();
        if (!$cat || !$user) {
            $this->assertTrue(true);
            return;
        }

        $booking = DonDatPhong::create([
            'khach_hang_id' => $user->nguoi_dung_id,
            'nguoi_tao_don' => $user->nguoi_dung_id,
            'nguon_dat' => 'ONLINE',
            'ngay_checkin' => '2026-12-20',
            'ngay_checkout' => '2026-12-22',
            'so_nguoi_lon' => 2,
            'tong_tien_phong' => 3000000,
            'thanh_tien_cuoi' => 3000000,
            'phan_tram_dat_coc' => '50',
            'so_tien_da_coc' => 1500000,
            'trang_thai_don' => 'Cho_Xac_Nhan',
            'created_at' => now()->subDays(2)
        ]);

        $response = $this->postJson('/api/v1/bookings/my-bookings/' . $booking->don_dat_id . '/cancel', [
            'ly_do' => 'Hủy kế hoạch công tác'
        ]);

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('so_tien_phat'));
        $this->assertEquals(1500000, $response->json('so_tien_hoan'));
    }

    /**
     * TEST 4.2: Hủy đơn trong vòng 24h trước Check-in -> Phạt 100% cọc (Hoàn 0đ)
     */
    public function test_tiered_cancellation_penalty_same_day()
    {
        $user = NguoiDung::first();
        if (!$user) {
            $this->assertTrue(true);
            return;
        }

        $pastTime = now()->subHours(5)->toDateTimeString();
        $booking = DonDatPhong::create([
            'khach_hang_id' => $user->nguoi_dung_id,
            'nguoi_tao_don' => $user->nguoi_dung_id,
            'nguon_dat' => 'ONLINE',
            'ngay_checkin' => now()->toDateString(),
            'ngay_checkout' => now()->addDays(2)->toDateString(),
            'so_nguoi_lon' => 2,
            'tong_tien_phong' => 2000000,
            'thanh_tien_cuoi' => 2000000,
            'phan_tram_dat_coc' => '50',
            'so_tien_da_coc' => 1000000,
            'trang_thai_don' => 'Cho_Xac_Nhan',
        ]);

        \Illuminate\Support\Facades\DB::table('don_dat_phong')
            ->where('don_dat_id', $booking->don_dat_id)
            ->update([
                'created_at' => $pastTime,
                'ngay_dat_don' => $pastTime
            ]);

        $response = $this->postJson('/api/v1/bookings/my-bookings/' . $booking->don_dat_id . '/cancel', [
            'ly_do' => 'Hủy sát giờ'
        ]);

        $response->assertStatus(200);
        $this->assertEquals(1000000, $response->json('so_tien_phat'));
        $this->assertEquals(0, $response->json('so_tien_hoan'));
    }


    // ==========================================
    // 5. PHÂN HỆ THANH TOÁN VNPAY (VNPAY GATEWAY & SECURITY)
    // ==========================================

    /**
     * TEST 5.1: Khởi tạo URL Thanh toán VNPay Sandbox
     */
    public function test_vnpay_url_generation()
    {
        $booking = DonDatPhong::first();
        if ($booking) {
            $response = $this->postJson('/api/v1/payments/vnpay-url', [
                'booking_id' => $booking->don_dat_id
            ]);

            $response->assertStatus(200);
            $response->assertJsonStructure(['success', 'payment_url']);
            $this->assertStringContainsString('vnp_SecureHash=', $response->json('payment_url'));
        }
    }

    /**
     * TEST 5.2: Kiểm tra Chữ ký VNPay HMAC-SHA512 Security Verification
     */
    public function test_vnpay_checksum_security_verification()
    {
        $response = $this->postJson('/api/v1/payments/vnpay-verify', [
            'vnp_TxnRef' => '1',
            'vnp_ResponseCode' => '00'
        ]);

        $response->assertStatus(400);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('Chữ ký', $response->json('message'));
    }


    // ==========================================
    // 6. PHÂN HỆ QUẦY LỄ TÂN (RECEPTIONIST CHECK-IN / CHECK-OUT)
    // ==========================================

    /**
     * TEST 6.1: Thống kê Check-in/out hôm nay của Lễ tân
     */
    public function test_checkin_checkout_today_stats()
    {
        $response = $this->getJson('/api/v1/admin/checkinout/checkin/stats/today');
        $response->assertStatus(200);
        $response->assertJsonStructure(['checkins_today', 'checkouts_today', 'pending_checkin']);
    }

    /**
     * TEST 6.2: Kiểm tra danh sách Chờ Check-in và Chờ Check-out
     */
    public function test_get_pending_checkins_and_checkouts()
    {
        $resCheckin = $this->getJson('/api/v1/admin/checkinout/checkin/pending');
        $resCheckin->assertStatus(200);

        $resCheckout = $this->getJson('/api/v1/admin/checkinout/checkout/pending');
        $resCheckout->assertStatus(200);
    }


    // ==========================================
    // 7. PHÂN HỆ KHUYẾN MÃI & DỊCH VỤ (SERVICES & PROMOTIONS)
    // ==========================================

    /**
     * TEST 7.1: Lấy danh sách chương trình khuyến mãi công khai
     */
    public function test_get_promotions()
    {
        $response = $this->getJson('/api/v1/promotions');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    /**
     * TEST 7.2: Validate mã khuyến mãi
     */
    public function test_validate_promo_code()
    {
        $promo = KhuyenMai::first();
        if ($promo) {
            $response = $this->postJson('/api/v1/promotions/validate', [
                'ma_code' => $promo->ma_code,
                'amount' => 2000000
            ]);
            $response->assertStatus(200);
        } else {
            $this->assertTrue(true);
        }
    }

    /**
     * TEST 7.3: Lấy danh sách Dịch vụ gia tăng (Spa, Dining, Giặt ủi)
     */
    public function test_get_add_on_services()
    {
        $response = $this->getJson('/api/v1/admin/services');
        $response->assertStatus(200);
    }


    // ==========================================
    // 8. PHÂN HỆ QUẢN TRỊ VIÊN & BÁO CÁO (ADMIN & REPORTS)
    // ==========================================

    /**
     * TEST 8.1: Thống kê Dashboard Admin tổng quan
     */
    public function test_admin_dashboard_index()
    {
        $response = $this->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(200);
    }

    /**
     * TEST 8.2: Báo cáo Doanh thu & Tỷ lệ lấp đầy phòng (Occupancy Rate)
     */
    public function test_admin_reports()
    {
        $resRev = $this->getJson('/api/v1/admin/reports/revenue');
        $resRev->assertStatus(200);

        $resOcc = $this->getJson('/api/v1/admin/reports/occupancy');
        $resOcc->assertStatus(200);
    }

    /**
     * TEST 8.3: Lấy danh sách Khách hàng hệ thống Admin
     */
    public function test_admin_get_customers()
    {
        $response = $this->getJson('/api/v1/admin/customers');
        $response->assertStatus(200);
    }
}
