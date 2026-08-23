<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yêu cầu cấp lại mật khẩu tạm thời</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
        
        <!-- Header Banner -->
        <div style="background-color: #1a3a5c; padding: 35px 30px; text-align: center; border-bottom: 4px solid #c9a227;">
            <div style="display: inline-block; padding: 8px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 10px;">
                <span style="color: #c9a227; font-size: 14px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">🔒 Account Security</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">MARRIOTT HOTEL</h1>
            <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 14px;">Khôi phục mật khẩu tài khoản</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 30px;">
            <p style="margin-top: 0; font-size: 16px;">Kính chào quý khách <strong>{{ $user->ho_ten }}</strong>,</p>
            <p style="font-size: 15px; color: #555555;">
                Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản đăng nhập của bạn tại Marriott Hotel. Để đảm bảo an toàn, hệ thống đã tự động tạo một mật khẩu tạm thời ngẫu nhiên cho quý khách.
            </p>

            <!-- Temporary Password Display Card -->
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 25px; border-radius: 8px; text-align: center; margin-top: 25px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">MẬT KHẨU TẠM THỜI CỦA BẠN:</p>
                <div style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #b45309; background-color: #fffbeb; border: 1px solid #fde68a; padding: 10px 25px; border-radius: 6px; font-family: Consolas, Monaco, monospace;">
                    {{ $tempPassword }}
                </div>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #ef4444;">
                    * Lưu ý: Mật khẩu này phân biệt chữ hoa, chữ thường và ký tự đặc biệt.
                </p>
            </div>

            <!-- Warning Banner -->
            <div style="padding: 15px 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1e3a8a; font-size: 13px; margin-bottom: 25px;">
                <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">🛡️ Hướng dẫn bảo mật tài khoản:</p>
                <ol style="margin: 0; padding-left: 20px; line-height: 1.5;">
                    <li>Quý khách vui lòng sao chép mật khẩu tạm thời ở trên để đăng nhập vào trang web.</li>
                    <li><strong>Bắt buộc đổi mật khẩu mới</strong> ngay sau khi đăng nhập thành công bằng cách truy cập vào trang Cá nhân (Profile) -> Đổi mật khẩu.</li>
                    <li>Tuyệt đối không chia sẻ email này hoặc mật khẩu tạm thời cho bất kỳ ai khác.</li>
                </ol>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="display: inline-block; background-color: #1a3a5c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 10px rgba(26,58,92,0.2); transition: all 0.3s ease;">
                    Đăng nhập tài khoản
                </a>
            </div>

            <p style="font-size: 14px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                Nếu quý khách không yêu cầu khôi phục mật khẩu này, có thể tài khoản của bạn đang có hoạt động đăng nhập đáng ngờ. Hãy nhanh chóng đăng nhập bằng mật khẩu tạm thời này để thiết lập lại mật khẩu an toàn, hoặc liên hệ ngay hotline <strong>028 3823 4567</strong> để được khoá tài khoản hỗ trợ.
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
