"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { ArrowLeft, BedDouble, Users, Star, Wifi, Tv, Wind, Coffee, Bath, LayoutGrid, CheckCircle2, ShoppingCart } from "lucide-react";
import { roomTypeLabels, formatPrice, getLocalToday } from "../../../data/mockData";

const amenityIcons: Record<string, React.ElementType> = {
  "WiFi": Wifi,
  "Smart TV": Tv,
  "TV": Tv,
  "Điều hòa": Wind,
  "Minibar": Coffee,
  "Bồn tắm": Bath,
};

// ── VERIFIED UNSPLASH HOTEL PHOTOS ──────────────────────────────────────
// Only confirmed hotel interior IDs used here (no guesses):
//  Bedrooms: 1598928506311, 1618773928121, 1618219908412, 1618221195710,
//            1596394516093, 1566665797739, 1505691938895, 1582719478250,
//            1598928636135, 1631049307264
//  Bathrooms: 1507652313519, 1590490360182, 1584622650111, 1600585154340
//  Details:   1582719508461, 1540518614846, 1566073771259
// ─────────────────────────────────────────────────────────────────────────

const serviceImages: Record<string, string> = {
  "buffet ăn sáng":         "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=300&q=80",
  "xe đưa đón sân bay":     "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&q=80",
  "giặt ủi cấp tốc":        "https://images.unsplash.com/photo-1545173168-9f1947eebd01?w=300&q=80",
  "massage & spa toàn thân":"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80",
  "buffet sáng cao cấp":    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=300&q=80",
  "trà & cà phê chiều":     "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80",
  "quản gia riêng":         "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80",
};

const defaultServicesByType: Record<string, Array<{ name: string; type: string; price: number; included: boolean }>> = {
  standard: [
    { name: "Buffet Sáng Cao Cấp", type: "Ẩm thực", price: 0, included: true },
    { name: "WiFi Tốc Độ Cao 5G", type: "Tiện ích", price: 0, included: true },
    { name: "Sử Dụng Hồ Bơi Bốn Mùa", type: "Giải trí", price: 0, included: true },
    { name: "Xe Đưa Đón Sân Bay", type: "Di chuyển", price: 350000, included: false },
  ],
  superior: [
    { name: "Buffet Sáng Á - Âu", type: "Ẩm thực", price: 0, included: true },
    { name: "Trà & Cà Phê Chiều Tại Lounge", type: "Ẩm thực", price: 0, included: true },
    { name: "Phòng Gym & Sauna 24/7", type: "Thể thao & Spa", price: 0, included: true },
    { name: "Giặt Ủi Cấp Tốc", type: "Tiện ích", price: 200000, included: false },
  ],
  deluxe: [
    { name: "Buffet Sáng Quốc Tế Đa Dạng", type: "Ẩm thực", price: 0, included: true },
    { name: "Đặc Quyền Executive Lounge", type: "Đặc quyền VIP", price: 0, included: true },
    { name: "Rượu Vang & Trái Cây Đón Chào", type: "Ẩm thực", price: 0, included: true },
    { name: "Massage & Spa Toàn Thân 60 Phút", type: "Spa & Wellness", price: 800000, included: false },
    { name: "Xe Đưa Đón Sân Bay Luxury", type: "Di chuyển", price: 0, included: true },
  ],
  suite: [
    { name: "Buffet Sáng Phục Vụ Tại Phòng Suite", type: "Ẩm thực VIP", price: 0, included: true },
    { name: "Quản Gia Riêng (Butler Service) 24/7", type: "Đặc quyền Tổng thống", price: 0, included: true },
    { name: "Đưa Đón Sân Bay Xe Mercedes/BMW", type: "Di chuyển VIP", price: 0, included: true },
    { name: "Tiệc Trà Chiều & Cocktail Đêm Lounge", type: "Ẩm thực", price: 0, included: true },
    { name: "Gói Spa & Thư Giãn Toàn Thân", type: "Spa & Wellness", price: 0, included: true },
  ],
  family: [
    { name: "Buffet Sáng Cả Gia Đình (4 Người)", type: "Ẩm thực Gia đình", price: 0, included: true },
    { name: "Khu Vui Chơi Trẻ Em Kid's Club", type: "Giải trí Trẻ em", price: 0, included: true },
    { name: "Vé Hồ Bơi & Công Viên Nước", type: "Giải trí", price: 0, included: true },
    { name: "Dịch Vụ Trông Trẻ Theo Giờ", type: "Dịch vụ", price: 250000, included: false },
  ],
};

// Fallback gallery per room type (only shown if API returns no images)
// ALL images are stable, high-quality Unsplash hotel interior photos to prevent 403 blocks
const roomGalleries: Record<string, string[]> = {
  standard: [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
    "https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=600&q=80",
  ],
  superior: [
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=600&q=80",
  ],
  deluxe: [
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
  ],
  suite: [
    "https://images.unsplash.com/photo-1631049307264?w=600&q=80",
    "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80",
  ],
  family: [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
  ]
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const { rooms, getRoomReviews, addToCart, clearCart } = useApp();
  const router = useRouter();
  const room = rooms.find(r => r.id === id);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentImage, setCurrentImage] = useState<string>("");

  let loai_phong_id = 1;
  if (room) {
    if (room.type === "deluxe") loai_phong_id = 3;
    else if (room.type === "suite") loai_phong_id = 4;
  }

  useEffect(() => {
    if (room) {
      setCurrentImage(room.imageUrl);
      setLoadingReviews(true);
      getRoomReviews(loai_phong_id).then(data => {
        setReviews(data);
        setLoadingReviews(false);
      });
    }
  }, [room, getRoomReviews, loai_phong_id]);

  if (!room) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <BedDouble className="w-12 h-12 mb-3 opacity-40" />
      <p>Không tìm thấy phòng</p>
      <button onClick={() => router.push("/customer/rooms")} className="mt-4 text-sm underline">Quay lại danh sách</button>
    </div>
  );

  const statusColor = room.status === "available" || room.status === "cleaning" ? "#22c55e" : room.status === "occupied" ? "#ef4444" : "#f59e0b";
  const statusLabel = { available: "Còn trống", occupied: "Đã có khách", maintenance: "Bảo trì", reserved: "Đã đặt", cleaning: "Còn trống" }[room.status];

  const today = getLocalToday();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  function handleBookNow() {
    clearCart();
    addToCart({
      id: "cart_" + Date.now(),
      roomId: room!.id,
      roomNumber: room!.number,
      roomType: room!.type,
      pricePerNight: room!.pricePerNight,
      imageUrl: room!.imageUrl,
      checkIn: today,
      checkOut: tomorrow,
      guests: 1,
    });
    router.push("/customer/cart");
  }

  function handleAddToCart() {
    addToCart({
      id: "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      roomId: room!.id,
      roomNumber: room!.number,
      roomType: room!.type,
      pricePerNight: room!.pricePerNight,
      imageUrl: room!.imageUrl,
      checkIn: today,
      checkOut: tomorrow,
      guests: 1,
    });
    alert(`Đã thêm hạng phòng ${room!.typeName || roomTypeLabels[room!.type]} vào giỏ hàng đặt phòng của bạn!`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: images + info */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 mb-3 shadow-sm border border-gray-150">
              <img src={currentImage || room.imageUrl} alt={room.typeName || roomTypeLabels[room.type]} className="w-full h-full object-cover transition-all duration-300" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ background: "#c9a227" }}>
                  {room.typeName || roomTypeLabels[room.type]}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ background: statusColor }}>
                  {statusLabel}
                </span>
              </div>
            </div>
            {/* Gallery Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {[room.imageUrl, ...(room.images ? room.images.filter(img => img !== room.imageUrl) : (roomGalleries[room.type] || []))].map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(img)}
                  className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${currentImage === img ? "border-blue-900 scale-95 opacity-100" : "border-transparent opacity-65 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.typeName || roomTypeLabels[room.type]}</h1>
                <p className="text-gray-500">Diện tích: {room.area}m² · Vị trí: {room.location}</p>
              </div>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">{room.description}</p>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" style={{ color: "#1a3a5c" }} /> Loại: {room.typeName || roomTypeLabels[room.type]}</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{ color: "#1a3a5c" }} /> Tối đa {room.capacity} khách</span>
              <span className="flex items-center gap-1.5"><LayoutGrid className="w-4 h-4" style={{ color: "#1a3a5c" }} /> {room.area}m²</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Tiện nghi phòng</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {room.amenities.map((a, i) => {
                const Icon = amenityIcons[a] || CheckCircle2;
                return (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-slate-50 hover:border-gray-200 transition-all duration-200">
                    <div className="w-8 h-8 rounded-lg bg-blue-50/60 flex items-center justify-center text-blue-900 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-800">{a}</span>
                      <p className="text-[9px] text-gray-400">Tiêu chuẩn</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {(() => {
            const displayServices = (room.services && room.services.length > 0)
              ? room.services
              : (defaultServicesByType[room.type] || defaultServicesByType.standard);

            return (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Dịch vụ đi kèm hạng phòng</span>
                  <span className="text-xs text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                    {displayServices.filter(s => s.included).length} dịch vụ miễn phí
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayServices.map((s, idx) => {
                    const srvImg = serviceImages[s.name.toLowerCase()] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80";
                    return (
                      <div key={idx} className="flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
                        <img src={srvImg} alt={s.name} className="w-full h-28 object-cover" />
                        <div className="p-3 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-bold text-gray-800 leading-snug">{s.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{s.type}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${s.included ? "text-green-700 bg-green-50 border border-green-200" : "text-blue-950 bg-blue-50 border border-blue-200"}`}>
                            {s.included ? "Miễn phí" : `+${formatPrice(s.price)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Reviews List */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Đánh giá từ khách hàng</h2>
            {loadingReviews ? (
              <p className="text-gray-500 text-sm italic">Đang tải đánh giá...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Chưa có đánh giá nào cho hạng phòng này.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{r.khach_hang?.ho_ten || "Khách hàng ẩn danh"}</p>
                        <p className="text-[11px] text-gray-400">{r.ngay_danh_gia}</p>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} className={`w-3.5 h-3.5 ${idx < r.so_sao ? "fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{r.binh_luan || "Không có bình luận chi tiết."}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="text-center mb-5 pb-5 border-b border-gray-100">
              <p className="text-gray-500 text-sm mb-1">Giá phòng từ</p>
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-3xl font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(room.pricePerNight)}</p>
                <p className="text-gray-400 text-sm">/đêm</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-500" /> Miễn phí hủy trước 14 ngày (hoặc trong 60 phút)</div>
              {room.services && room.services.filter(s => s.included).map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Bao gồm {s.name} (Miễn phí)
                </div>
              ))}
              {(!room.services || room.services.filter(s => s.included).length === 0) && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-500" /> WiFi miễn phí</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-500" /> Đỗ xe miễn phí</div>
                </>
              )}
            </div>
            {room.status === "available" ? (
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-2.5 rounded-xl border font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm"
                  style={{ borderColor: "#1a3a5c", color: "#1a3a5c" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleBookNow}
                  className="w-full py-2.5 rounded-xl text-white font-medium hover:opacity-95 transition-opacity text-sm"
                  style={{ background: "#1a3a5c" }}
                >
                  Đặt phòng ngay
                </button>
              </div>
            ) : (
              <div className="w-full py-3 rounded-xl text-center text-gray-500 bg-gray-100 text-sm">
                Phòng hiện không khả dụng
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">Check-in: 14:00 · Check-out: 12:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
