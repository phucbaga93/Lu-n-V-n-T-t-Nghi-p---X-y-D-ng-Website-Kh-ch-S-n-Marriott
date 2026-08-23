<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận thanh toán đơn đặt phòng #{{ $booking->don_dat_id }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
        
        <!-- Header Banner -->
        <div style="background-color: #1a3a5c; padding: 35px 30px; text-align: center; border-bottom: 4px solid #c9a227;">
            <div style="display: inline-block; padding: 8px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 10px;">
                <span style="color: #c9a227; font-size: 14px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">★★★★★ Luxury Experience</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">MARRIOTT HOTEL</h1>
            <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 14px;">Hóa đơn thanh toán phòng thành công</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 30px;">
            <p style="margin-top: 0; font-size: 16px;">Kính chào quý khách <strong>{{ $booking->khachHang->ho_ten ?? 'Quý khách' }}</strong>,</p>
            <p style="font-size: 15px; color: #555555; margin-bottom: 25px;">
                Marriott Hotel xin trân trọng thông báo đơn đặt phòng của quý khách đã được thanh toán thành công. Dưới đây là chi tiết hóa đơn đặt phòng và các thông tin cần thiết cho kỳ nghỉ của bạn.
            </p>

            <!-- Booking Summary Card -->
            <div style="background-color: #f8fafc; border-left: 4px solid #1a3a5c; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #1a3a5c; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Thông tin đơn đặt phòng #{{ $booking->don_dat_id }}
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 40%;">Ngày đặt phòng:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">{{ $booking->ngay_dat_don ? $booking->ngay_dat_don->format('d/m/Y H:i') : now()->format('d/m/Y H:i') }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Thời gian lưu trú:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">
                            {{ \Carbon\Carbon::parse($booking->ngay_checkin)->format('d/m/Y') }} – {{ \Carbon\Carbon::parse($booking->ngay_checkout)->format('d/m/Y') }}
                            ({{ \Carbon\Carbon::parse($booking->ngay_checkin)->diffInDays(\Carbon\Carbon::parse($booking->ngay_checkout)) }} đêm)
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Số lượng khách:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">
                            {{ $booking->so_nguoi_lon }} Người lớn
                            @if($booking->so_tre_em > 0)
                                , {{ $booking->so_tre_em }} Trẻ em
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Trạng thái đơn:</td>
                        <td style="padding: 6px 0;">
                            <span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; border: 1px solid #a7f3d0;">
                                Đã thanh toán
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Customer Details Card -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #1a3a5c; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
                    Thông tin khách hàng
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 30%;">Họ và tên:</td>
                        <td style="padding: 6px 0; font-weight: 500; color: #334155;">{{ $booking->khachHang->ho_ten ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Số điện thoại:</td>
                        <td style="padding: 6px 0; font-weight: 500; color: #334155;">{{ $booking->khachHang->so_dien_thoai ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Email liên lạc:</td>
                        <td style="padding: 6px 0; font-weight: 500; color: #334155;">{{ $booking->khachHang->email ?? 'N/A' }}</td>
                    </tr>
                    @if(!empty($booking->khachHang->cccd))
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Số CCCD/Passport:</td>
                        <td style="padding: 6px 0; font-weight: 500; color: #334155;">{{ $booking->khachHang->cccd }}</td>
                    </tr>
                    @endif
                </table>
            </div>

            <!-- Room Allocations Table -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #1a3a5c; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
                    Danh sách phòng đã đặt
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                    <thead>
                        <tr style="background-color: #f1f5f9;">
                            <th style="padding: 10px; border: 1px solid #cbd5e1; color: #475569;">STT</th>
                            <th style="padding: 10px; border: 1px solid #cbd5e1; color: #475569;">Hạng phòng đã đặt</th>
                            <th style="padding: 10px; border: 1px solid #cbd5e1; color: #475569; text-align: right;">Đơn giá phòng / đêm</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($booking->chiTietDatPhongs as $idx => $detail)
                            @if($detail->trang_thai !== 'cancelled')
                            <tr>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1a3a5c;">
                                    Phòng {{ $idx + 1 }}
                                </td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; color: #334155;">
                                    {{ $detail->phong->loaiPhong->ten_loai_phong ?? 'Hạng phòng Standard' }}
                                    @if(in_array($detail->trang_thai, ['checked_in', 'checked_out']))
                                        ({{ $detail->phong->so_phong ?? '' }})
                                    @endif
                                </td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #334155;">
                                    {{ number_format($detail->gia_ap_dung, 0, ',', '.') }} VND
                                </td>
                            </tr>
                            @endif
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Payment details & Receipt -->
            <div style="border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #1a3a5c; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase;">
                    Chi tiết giao dịch thanh toán
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 5px 0; color: #64748b;">Phương thức thanh toán:</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #334155;">
                            @if(($booking->hoaDonThanhToan->hinh_thuc_thanh_toan ?? '') === 'Online_Banking')
                                Chuyển khoản trực tuyến (VNPay)
                            @elseif(($booking->hoaDonThanhToan->hinh_thuc_thanh_toan ?? '') === 'Tien_Mat')
                                Tiền mặt tại quầy lễ tân
                            @elseif(($booking->hoaDonThanhToan->hinh_thuc_thanh_toan ?? '') === 'Vi_Dien_Tu')
                                Ví điện tử
                            @else
                                Chuyển khoản ngân hàng / VNPay
                            @endif
                        </td>
                    </tr>
                    @if(!empty($booking->hoaDonThanhToan->ngay_thanh_toan))
                    <tr>
                        <td style="padding: 5px 0; color: #64748b;">Thời gian giao dịch:</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: 500; color: #334155;">
                            {{ \Carbon\Carbon::parse($booking->hoaDonThanhToan->ngay_thanh_toan)->format('d/m/Y H:i:s') }}
                        </td>
                    </tr>
                    @endif
                    @if(!empty($booking->hoaDonThanhToan->ghi_chu))
                    <tr>
                        <td style="padding: 5px 0; color: #64748b;">Ghi chú thanh toán:</td>
                        <td style="padding: 5px 0; text-align: right; font-size: 13px; font-style: italic; color: #475569;">
                            {{ $booking->hoaDonThanhToan->ghi_chu }}
                        </td>
                    </tr>
                    @endif
                    <tr style="border-top: 1px solid #cbd5e1;">
                        <td style="padding: 10px 0 0 0; font-size: 14px; font-weight: bold; color: #1a3a5c;">TỔNG TIỀN PHÒNG:</td>
                        <td style="padding: 10px 0 0 0; text-align: right; font-size: 16px; font-weight: bold; color: #1a3a5c;">
                            {{ number_format($booking->tong_tien_phong, 0, ',', '.') }} VND
                        </td>
                    </tr>
                    @if($booking->tong_tien_phong > $booking->thanh_tien_cuoi)
                    <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #ef4444;">Giảm giá / Khuyến mãi:</td>
                        <td style="padding: 4px 0; text-align: right; font-size: 14px; font-weight: 600; color: #ef4444;">
                            -{{ number_format($booking->tong_tien_phong - $booking->thanh_tien_cuoi, 0, ',', '.') }} VND
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 6px 0 0 0; font-size: 15px; font-weight: bold; color: #1a3a5c;">TỔNG GIÁ TRỊ ĐƠN ĐẶT:</td>
                        <td style="padding: 6px 0 0 0; text-align: right; font-size: 17px; font-weight: bold; color: #1a3a5c;">
                            {{ number_format($booking->thanh_tien_cuoi, 0, ',', '.') }} VND
                        </td>
                    </tr>
                    @php
                        $daCoc = (float)($booking->so_tien_da_coc > 0 ? $booking->so_tien_da_coc : $booking->thanh_tien_cuoi);
                        $tongTien = (float)($booking->thanh_tien_cuoi ?? 0);
                        $conLai = max(0, $tongTien - $daCoc);
                        $pctCoc = intval($booking->phan_tram_dat_coc ?? 100);
                    @endphp
                    <tr style="border-top: 1px dashed #cbd5e1;">
                        <td style="padding: 8px 0 0 0; font-size: 14px; font-weight: bold; color: #059669;">
                            SỐ TIỀN ĐÃ ĐẶT CỌC TRƯỚC ({{ $pctCoc }}%):
                        </td>
                        <td style="padding: 8px 0 0 0; text-align: right; font-size: 16px; font-weight: bold; color: #059669;">
                            {{ number_format($daCoc, 0, ',', '.') }} VND
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0 0 0; font-size: 15px; font-weight: bold; color: #b45309;">
                            SỐ TIỀN CÒN LẠI CẦN THANH TOÁN (KHI CHECK-IN/OUT):
                        </td>
                        <td style="padding: 8px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #b45309;">
                            {{ number_format($conLai, 0, ',', '.') }} VND
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Notes/Rules Banner -->
            <div style="margin-top: 30px; padding: 15px 20px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #b45309; font-size: 13px;">
                <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">🔔 Lưu ý quan trọng khi nhận phòng (Check-in):</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
                    <li>Thời gian nhận phòng (Check-in) tiêu chuẩn: <strong>14:00</strong> chiều.</li>
                    <li>Thời gian trả phòng (Check-out) tiêu chuẩn: <strong>12:00</strong> trưa.</li>
                    <li>Quý khách vui lòng xuất trình <strong>CCCD/Passport</strong> và đọc mã đặt phòng <strong>#{{ $booking->don_dat_id }}</strong> khi làm thủ tục check-in tại quầy lễ tân.</li>
                </ul>
            </div>
            
            <p style="font-size: 15px; color: #555555; margin-top: 30px; margin-bottom: 0;">
                Nếu quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi qua hotline <strong>028 3823 4567</strong> hoặc gửi mail về địa chỉ <strong>support@marriotthotel.vn</strong>.
            </p>
            <p style="font-size: 15px; color: #555555; margin-top: 10px;">
                Hân hạnh được phục vụ quý khách tại Marriott Hotel!
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1a3a5c;">MARRIOTT HOTEL LUXURY EXPERIENCE</p>
            <p style="margin: 4px 0;">📍 123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
            <p style="margin: 4px 0;">📞 Hotline: 028 3823 4567 | ✉ Email: info@marriotthotel.vn</p>
            <p style="margin: 15px 0 0 0; border-top: 1px dotted #cbd5e1; padding-top: 12px; color: #94a3b8; font-size: 11px;">
                Email này được gửi tự động bởi hệ thống đặt phòng Marriott Hotel. Vui lòng không trả lời trực tiếp email này.
            </p>
        </div>

    </div>
</body>
</html>
