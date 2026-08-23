<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chào mừng thành viên Marriott Bonvoy mới!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
        
        <!-- Header Banner -->
        <div style="background-color: #1a3a5c; padding: 35px 30px; text-align: center; border-bottom: 4px solid #c9a227;">
            <div style="display: inline-block; padding: 8px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 10px;">
                <span style="color: #c9a227; font-size: 14px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">★★★★★ Luxury Experience</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">MARRIOTT HOTEL</h1>
            <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 14px;">Chào mừng thành viên mới</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 30px;">
            <p style="margin-top: 0; font-size: 16px;">Kính chào quý khách <strong>{{ $user->ho_ten }}</strong>,</p>
            <p style="font-size: 15px; color: #555555;">
                Chúc mừng quý khách đã đăng ký thành công tài khoản thành viên **Marriott Bonvoy** tại **Marriott Hotel**. Chúng tôi rất vinh hạnh được đồng hành cùng quý khách trong các hành trình sắp tới.
            </p>

            <!-- Membership Account Summary -->
            <div style="background-color: #f8fafc; border-left: 4px solid #1a3a5c; padding: 20px; border-radius: 0 8px 8px 0; margin-top: 25px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #1a3a5c; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Thông tin tài khoản thành viên
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 35%;">Họ và tên:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">{{ $user->ho_ten }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Tên đăng nhập (Email):</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">{{ $user->email }}</td>
                    </tr>
                    @if(!empty($user->so_dien_thoai))
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Số điện thoại:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #334155;">{{ $user->so_dien_thoai }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Hạng thành viên:</td>
                        <td style="padding: 6px 0;">
                            <span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; border: 1px solid #fde68a;">
                                Member Gold
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 15px; color: #555555; margin-bottom: 25px;">
                Với tư cách là thành viên Marriott Bonvoy, bạn sẽ được hưởng các đặc quyền ưu đãi dành riêng khi đặt phòng trực tuyến như: tích lũy điểm thưởng, miễn phí WiFi tốc độ cao, nhận phòng sớm/trả phòng trễ linh hoạt (tuỳ thuộc vào tình trạng phòng).
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="display: inline-block; background-color: #1a3a5c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 10px rgba(26,58,92,0.2); transition: all 0.3s ease;">
                    Đăng nhập và đặt phòng ngay
                </a>
            </div>

            <p style="font-size: 15px; color: #555555; margin-top: 30px; margin-bottom: 0;">
                Nếu quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận dịch vụ khách hàng qua hotline <strong>028 3823 4567</strong> hoặc gửi mail về địa chỉ <strong>support@marriotthotel.vn</strong>.
            </p>
            <p style="font-size: 15px; color: #555555; margin-top: 10px;">
                Trân trọng cảm ơn và hẹn gặp lại quý khách!
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1a3a5c;">MARRIOTT HOTEL LUXURY EXPERIENCE</p>
            <p style="margin: 4px 0;">📍 123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
            <p style="margin: 4px 0;">📞 Hotline: 028 3823 4567 | ✉ Email: info@marriotthotel.vn</p>
            <p style="margin: 15px 0 0 0; border-top: 1px dotted #cbd5e1; padding-top: 12px; color: #94a3b8; font-size: 11px;">
                Email này được gửi tự động bởi hệ thống Marriott Hotel. Vui lòng không trả lời trực tiếp email này.
            </p>
        </div>

    </div>
</body>
</html>
