import { Coffee, Waves, Shield, Car, HeartPulse, UtensilsCrossed, Sparkles, MapPin } from "lucide-react";
import { formatPrice } from "../../data/mockData";

export default function HotelServicesPage() {
  const services = [
    {
      title: "Nhà hàng & Ẩm thực 5 Sao",
      desc: "Trải nghiệm ẩm thực phong phú phong cách Âu-Á từ các đầu bếp danh tiếng quốc tế. Buffet sáng miễn phí cho tất cả khách lưu trú.",
      icon: UtensilsCrossed,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      details: ["Bữa sáng Buffet: 06:00 - 10:30", "Bữa tối Fine Dining: 18:00 - 22:30", "Phục vụ tại phòng (In-room Dining): 24/7"]
    },
    {
      title: "L'Apothiquaire Spa & Trị liệu",
      desc: "Liệu trình chăm sóc sức khỏe toàn diện kết hợp massage truyền thống và dược mỹ phẩm organic từ Pháp giúp tái tạo năng lượng hoàn hảo.",
      icon: HeartPulse,
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      details: ["Massage body, đá nóng & thảo dược", "Chăm sóc da mặt chuyên sâu", "Mở cửa: 09:00 AM - 10:00 PM"]
    },
    {
      title: "Hồ bơi vô cực Skyview",
      desc: "Hồ bơi tràn viền ngoài trời tọa lạc tại tầng thượng với tầm nhìn 360 độ ôm trọn trung tâm và cảnh quan thiên nhiên quyến rũ.",
      icon: Waves,
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      details: ["Ghế tắm nắng & Khăn tắm miễn phí", "Sky Bar phục vụ cocktails & snacks", "Mở cửa: 06:00 AM - 10:00 PM"]
    },
    {
      title: "Phòng hội nghị & Sự kiện",
      desc: "Không gian hội nghị sang trọng với sức chứa lên đến 300 khách, trang bị âm thanh ánh sáng LED âm trần hiện đại, chuẩn quốc tế.",
      icon: Sparkles,
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      details: ["Thiết bị họp trực tuyến chuẩn HD", "Tiệc trà giữa giờ & Ăn trưa hội nghị", "Hỗ trợ kỹ thuật chuyên nghiệp suốt sự kiện"]
    }
  ];

  const standardAmenities = [
    { title: "Dịch vụ Concierge", desc: "Hỗ trợ đặt tour, vé máy bay, taxi và đặt bàn nhà hàng trung tâm.", icon: MapPin },
    { title: "Đỗ xe & Trông xe", desc: "Bãi đỗ xe tầng hầm an toàn 24/7, có nhân viên hỗ trợ đỗ xe (valet parking).", icon: Car },
    { title: "Phòng tập Gym 24/7", desc: "Đầy đủ trang thiết bị Technogym hiện đại phục vụ sức khỏe của quý khách.", icon: HeartPulse },
    { title: "An ninh tối đa", desc: "Hệ thống bảo vệ chuyên nghiệp, thẻ từ phân tầng thang máy an toàn.", icon: Shield }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Dịch vụ & Tiện ích</h1>
        <p className="text-gray-500">Tại khách sạn Marriott, chúng tôi không chỉ mang lại giấc ngủ ngon mà còn cung cấp hệ sinh thái dịch vụ đa dạng để nâng tầm kỳ nghỉ của quý khách.</p>
      </div>

      {/* Main Services Grid */}
      <div className="space-y-16 mb-16">
        {services.map((service, index) => (
          <div
            key={index}
            className={`flex flex-col lg:flex-row gap-8 items-center ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg h-72 sm:h-96">
              <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
            </div>
            <div className="w-full lg:w-1/2 space-y-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#f0ece2" }}>
                <service.icon className="w-6 h-6" style={{ color: "#1a3a5c" }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{service.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{service.desc}</p>
              <ul className="space-y-2 border-t border-gray-100 pt-4">
                {service.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Standard Amenities section */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tiện ích đi kèm miễn phí</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standardAmenities.map((item, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ background: "#f0ece2" }}>
                <item.icon className="w-6 h-6" style={{ color: "#1a3a5c" }} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
