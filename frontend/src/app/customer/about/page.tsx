import { Star, MapPin, Phone, Mail, Award, Clock, ShieldCheck } from "lucide-react";

export default function HotelInfoPage() {
  const reviews = [
    { name: "John Doe", text: "Trải nghiệm tuyệt vời! Phòng suite cực kỳ sang trọng, tầm nhìn toàn cảnh xuất sắc. Nhân viên phục vụ tận tình.", rating: 5 },
    { name: "Nguyễn Thị Mai", text: "Khách sạn nằm ở vị trí đắc địa, di chuyển rất thuận tiện. Đồ ăn buffet sáng vô cùng đa dạng và ngon miệng.", rating: 5 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-xl h-[400px]">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200"
          alt="Marriott Hotel Lobby"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,58,92,0.4) 0%, rgba(26,58,92,0.85) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 text-white">
          <div className="flex text-yellow-400 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Khách sạn Marriott</h1>
          <p className="text-lg text-blue-100 max-w-2xl">Trải nghiệm dịch vụ 5 sao đẳng cấp quốc tế, kết hợp nét tinh tế Á Đông tại các vị trí đắc địa trên toàn quốc.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6" style={{ color: "#1a3a5c" }} />
              Giới thiệu chung
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Với hệ thống chi nhánh trải dài tại các vị trí đắc địa bậc nhất trên cả nước (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc), 
              <strong> Khách sạn Marriott</strong> tự hào mang đến không gian lưu trú 5 sao sang trọng, đẳng cấp quốc tế. 
              Mỗi phòng nghỉ đều được thiết kế hiện đại, tinh tế cùng ban công rộng mở ngắm toàn cảnh bờ biển thơ mộng hoặc thành phố lung linh về đêm.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Khách sạn là sự kết hợp hoàn hảo giữa các tiện nghi công nghệ cao bậc nhất và nghệ thuật phục vụ chu đáo, tận tâm. 
              Bất kể quý khách đi công tác hay nghỉ dưỡng cùng gia đình, chúng tôi cam kết mang lại một kỳ lưu trú trọn vẹn và đẳng cấp.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" style={{ color: "#1a3a5c" }} />
              Chính sách Khách sạn & Quy định đặt phòng (Hotel Policies)
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <h3 className="font-bold text-blue-950 flex items-center gap-1.5">
                  1. Quy định đặt phòng & Đặt cọc (Booking & Deposit Guidelines)
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Thời gian đặt trước:</strong> Khách sạn nhận đặt phòng trực tuyến trước tối đa <strong>6 tháng</strong>.</li>
                  <li><strong>Tỷ lệ đặt cọc phòng:</strong> Khách hàng có thể linh hoạt lựa chọn mức đặt cọc trước <strong>30%, 50%, 70% hoặc 100%</strong> giá trị đơn hàng qua cổng trực tuyến VNPay Sandbox. Số tiền còn lại sẽ được thanh toán trực tiếp khi làm thủ tục Check-in/Check-out tại quầy lễ tân.</li>
                  <li><strong>Dành cho Khách vãng lai:</strong> Đặt phòng trực tuyến nhanh không bắt buộc phải tạo tài khoản thành viên. Sau khi đặt thành công, mã đơn phòng sẽ được gửi về Email để tra cứu trực tiếp.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-red-50/30 border border-red-100 space-y-2">
                <h3 className="font-bold text-red-950 flex items-center gap-1.5">
                  2. Chính sách Hủy đặt phòng & Hoàn tiền cọc (Cancellation & Refund Policy)
                </h3>
                <p className="leading-relaxed">
                  Quý khách có thể tự hủy đơn phòng trực tuyến tại trang <strong>Tra cứu đơn đặt</strong> hoặc liên hệ hotline Lễ tân. Phụ thu hủy phòng được tính trên số tiền cọc đã nộp như sau:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Mới đặt trong vòng 60 phút HOẶC Hủy trước Check-in từ 14 ngày trở lên:</strong> Miễn 100% phụ thu hủy phòng (Hoàn 100% tiền cọc).</li>
                  <li><strong>Hủy trước ngày Check-in từ 7 đến 13 ngày:</strong> Phụ thu <strong>30% số tiền cọc</strong> (Hệ thống hoàn lại 70% cọc).</li>
                  <li><strong>Hủy trước ngày Check-in từ 3 đến 6 ngày:</strong> Phụ thu <strong>50% số tiền cọc</strong> (Hệ thống hoàn lại 50% cọc).</li>
                  <li><strong>Hủy trước ngày Check-in từ 1 đến 2 ngày:</strong> Phụ thu <strong>70% số tiền cọc</strong> (Hệ thống hoàn lại 30% cọc).</li>
                  <li><strong>Hủy trong vòng 24h trước Check-in hoặc không đến (No-Show):</strong> Phụ thu <strong>100% số tiền cọc</strong> đã nộp.</li>
                  <li><strong>Thời gian hoàn cọc:</strong> Bộ phận Lễ tân / Kế toán sẽ liên hệ xác nhận số tài khoản và hoàn tiền trong vòng <strong>24h - 48h</strong> làm việc.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100 space-y-2">
                <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                  3. Thời gian Nhận/Trả phòng & Trả phòng sớm (Check-in/out & Early Departure)
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Giờ nhận phòng (Check-in):</strong> 14:00 PM</li>
                  <li><strong>Giờ trả phòng (Check-out):</strong> 12:00 PM</li>
                  <li><strong>Chính sách Trả phòng sớm (Early Check-out):</strong>
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs text-gray-600">
                      <li><strong>Số đêm thực tế đã ở:</strong> Tính 100% giá phòng theo hợp đồng.</li>
                      <li><strong>Thông báo trước 24h:</strong> Miễn 100% phụ thu, hoàn lại tiền phòng các đêm chưa ở.</li>
                      <li><strong>Thông báo đột xuất trong ngày:</strong> Phụ thu 1 đêm tiếp theo (Early Departure Fee), hoàn lại 100% tiền các đêm còn lại (nếu có).</li>
                    </ul>
                  </li>
                  <li><strong>Phụ phí trả phòng muộn (Late Check-out Fee):</strong>
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs text-gray-600">
                      <li><strong>Từ 12:00 PM đến 15:00 PM (Trễ dưới 3 tiếng):</strong> Phụ thu 30% giá phòng 1 đêm.</li>
                      <li><strong>Từ 15:00 PM đến 18:00 PM (Trễ 3 - 6 tiếng):</strong> Phụ thu 50% giá phòng 1 đêm.</li>
                      <li><strong>Sau 18:00 PM (Trễ trên 6 tiếng / Quá ngày):</strong> Phụ thu 100% giá phòng 1 đêm.</li>
                      <li><strong>Chính sách linh hoạt tại quầy:</strong> Hệ thống hỗ trợ Lễ tân/Admin tự động tính toán phụ thu chính xác trên hóa đơn Check-out, đồng thời có thể hỗ trợ miễn trừ phụ thu với các trường hợp đặc biệt (Khách VIP, thiện chí dịch vụ).</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2">
                <h3 className="font-bold text-purple-950 flex items-center gap-1.5">
                  4. Quy định Khách không đến & Thanh toán tại quầy (No-Show & Counter Policy)
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Giờ G nhận phòng tại quầy:</strong> Đơn chọn Thanh toán tại quầy áp dụng giữ phòng đến <strong>18:00 (6h chiều)</strong> ngày nhận phòng. Quý khách đến sau 18:00 vui lòng thông báo trước hotline <code>028 3823 4567</code> để tránh trường hợp đơn bị tự động chuyển sang <code>No-Show</code>.</li>
                  <li><strong>Đối soát tự động khi Check-out:</strong> Tiền cọc trước (VNPay/Tiền mặt) sẽ được tự động cấn trừ trên hóa đơn Check-out. Quý khách chỉ thanh toán số tiền chênh lệch còn lại tại quầy.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <h3 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  5. Chính sách Trẻ em & Quy định Khai báo Tạm trú (Children Policy & Resident Declaration)
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Giới hạn số lượng trẻ em đi kèm (dưới 12 tuổi) theo Hạng phòng:</strong>
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs text-gray-600">
                      <li><strong>Deluxe City View Room (Standard):</strong> Tối đa 1 trẻ em đi kèm.</li>
                      <li><strong>Club Deluxe Premium View (Superior):</strong> Tối đa 1 trẻ em đi kèm.</li>
                      <li><strong>Executive Studio Suite (Deluxe):</strong> Tối đa 2 trẻ em đi kèm.</li>
                      <li><strong>Presidential Penthouse Suite (Suite):</strong> Tối đa 2 trẻ em đi kèm.</li>
                      <li><strong>Family Premium Suite (Family):</strong> Tối đa 3 trẻ em đi kèm.</li>
                    </ul>
                  </li>
                  <li><strong>Quy định bắt buộc Khai báo tạm trú:</strong>
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs text-gray-600">
                      <li><strong>Người lớn đi kèm (Từ khách thứ 2):</strong> Bắt buộc khai báo đầy đủ Họ tên + Số CCCD/CMND/Hộ chiếu để phục vụ công tác quản lý lưu trú Công an địa phương.</li>
                      <li><strong>Trẻ em đi kèm (Dưới 12 tuổi):</strong> Bắt buộc khai báo Họ và tên + Độ tuổi / Năm sinh + Mối quan hệ thân nhân (Con, Cháu...) nhằm đảm bảo an toàn tuyệt đối cho trẻ trong thời gian nghỉ dưỡng.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Guest Reviews */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Đánh giá tiêu biểu</h2>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                    <div className="flex text-yellow-400">
                      {[...Array(r.rating)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{r.text}"</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Thông tin liên hệ</h3>
            <div className="space-y-3.5 text-sm text-gray-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-900 mt-1 flex-shrink-0" />
                <span>Hệ thống toàn quốc: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-900 flex-shrink-0" />
                <span>028 3823 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-900 flex-shrink-0" />
                <span>info@marriotthotel.vn</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-900 flex-shrink-0" />
                <span>Mở cửa quanh năm (24/7)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Vị trí đắc địa</h3>
              <p className="text-xs text-gray-500 mb-4">Các chi nhánh của khách sạn Marriott tọa lạc tại các trung tâm thành phố nhộn nhịp hoặc dọc bờ biển tuyệt đẹp.</p>
            </div>
            <img
              src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/882952789.jpg?k=18b6d041b6368ee1c0a8f6d86b543bccb2b132af8a4a328f4e8ad21541f0fa02&o="
              alt="Map area view"
              className="w-full h-44 object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
