<?php

namespace App\Mail;

use App\Models\DonDatPhong;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $services;

    /**
     * Create a new message instance.
     *
     * @param DonDatPhong $booking
     * @param array $services
     */
    public function __construct(DonDatPhong $booking, array $services = [])
    {
        $this->booking = $booking;
        $this->services = $services;

        // 🟢 NẾU LÀ ĐƠN TỪ GIỎ HÀNG NHIỀU PHÒNG: TỰ ĐỘNG GỘP TẤT CẢ CÁC PHÒNG ĐƯỢC TẠO CÙNG PHIÊN ĐỂ EMAIL HÓA ĐƠN ĐẦY ĐỦ 100%
        $cartGroupTag = null;
        if (!empty($booking->ghi_chu_dac_biet) && preg_match('/\[MaGioHang:\s*(GH\d+)\]/i', $booking->ghi_chu_dac_biet, $m)) {
            $cartGroupTag = $m[1];
        }

        $query = DonDatPhong::with(['chiTietDatPhongs.phong.loaiPhong']);
        if ($cartGroupTag) {
            $query->where('ghi_chu_dac_biet', 'LIKE', "%[MaGioHang: {$cartGroupTag}]%");
        } else if ($booking->khach_hang_id) {
            $bookingTime = \Carbon\Carbon::parse($booking->ngay_dat_don ?? $booking->created_at ?? now());
            $query->where('khach_hang_id', $booking->khach_hang_id)
                  ->whereBetween('ngay_dat_don', [$bookingTime->copy()->subMinutes(10), $bookingTime->copy()->addMinutes(10)]);
        } else {
            return;
        }

        $sessionBookings = $query->get();

        if ($sessionBookings->count() > 1) {
            $allDetails = collect();
            $totalTongTien = 0;
            $totalCoc = 0;
            $relatedBookingIds = [];

            foreach ($sessionBookings as $sb) {
                $relatedBookingIds[] = '#' . $sb->don_dat_id;
                $allDetails = $allDetails->concat($sb->chiTietDatPhongs);
                $totalTongTien += (float) $sb->thanh_tien_cuoi;
                $totalCoc += (float) $sb->so_tien_da_coc;
            }

            $this->booking->setRelation('chiTietDatPhongs', $allDetails);
            $this->booking->thanh_tien_cuoi = $totalTongTien;
            $this->booking->so_tien_da_coc = $totalCoc;
            $this->booking->multi_booking_note = 'Đơn giỏ hàng gồm ' . $sessionBookings->count() . ' phòng (Mã các đơn: ' . implode(', ', $relatedBookingIds) . ')';
        }
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Xác nhận đặt phòng thành công #' . strtoupper($this->booking->don_dat_id))
                    ->view('emails.invoice');
    }
}
