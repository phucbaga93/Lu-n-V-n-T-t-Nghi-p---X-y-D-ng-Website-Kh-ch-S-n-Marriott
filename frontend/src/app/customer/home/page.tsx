"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Search, Star, Wifi, Coffee, Car, Waves, MapPin, ChevronRight, BedDouble, Users, Calendar } from "lucide-react";
import { roomTypeLabels, formatPrice, calcNights, getLocalToday } from "../../data/mockData";

export default function HomePage() {
  const { rooms, currentUser } = useApp();
  const router = useRouter();
  const today = getLocalToday();
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [location, setLocation] = useState("all");

  const handleCheckInChange = (val: string) => {
    if (val) {
      const selected = new Date(val);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        setCheckIn(limitDate.toISOString().split("T")[0]);
        return;
      }
    }
    setCheckIn(val);
  };

  const handleCheckOutChange = (val: string) => {
    if (val) {
      const selected = new Date(val);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        setCheckOut(limitDate.toISOString().split("T")[0]);
        return;
      }
    }
    setCheckOut(val);
  };

  const [guests, setGuests] = useState(1);

  const availableRooms = rooms.filter(r => r.status === "available").slice(0, 4);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      alert("Vui lòng chọn ngày nhận phòng và trả phòng!");
      return;
    }

    const nights = calcNights(checkIn, checkOut);
    if (nights < 1 || nights > 30) {
      alert("Thời gian lưu trú phải từ 1 đến 30 đêm!");
      return;
    }

    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    const maxLeadDate = new Date();
    maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
    maxLeadDate.setHours(23, 59, 59, 999);

    if (checkInDate > maxLeadDate) {
      alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
      return;
    }

    router.push(`/customer/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&location=${location}`);
  }

  const features = [
    { icon: Wifi, label: "WiFi miễn phí", desc: "Toàn khách sạn" },
    { icon: Coffee, label: "Bữa sáng", desc: "Buffet đa dạng" },
    { icon: Car, label: "Đỗ xe miễn phí", desc: "24/7 bảo vệ" },
    { icon: Waves, label: "Hồ bơi", desc: "Mở cửa 6h-22h" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[500px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1692153142524-60285a93c249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400"
          alt="Marriott Hotel"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,58,92,0.6) 0%, rgba(26,58,92,0.8) 100%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <p className="text-lg mb-2" style={{ color: "#c9a227" }}>★★★★★</p>
          <h1 className="text-5xl font-bold mb-4">Xin chào, {currentUser ? currentUser.name.split(" ").pop() : "Quý khách"}!</h1>
          <p className="text-xl text-blue-100 mb-8">Trải nghiệm nghỉ dưỡng đẳng cấp 5 sao tại các vị trí đắc địa</p>

          {/* Search box */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-2xl flex flex-wrap gap-3 items-end w-full max-w-3xl">
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Vị trí</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 bg-white"
              >
                <option value="all">Tất cả vị trí</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Phú Quốc">Phú Quốc</option>
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nhận phòng</label>
              <input
                type="date"
                value={checkIn}
                min={today}
                max={maxDate}
                onChange={e => handleCheckInChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Trả phòng</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                max={maxDate}
                onChange={e => handleCheckOutChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div className="min-w-32">
              <label className="block text-xs font-medium text-gray-500 mb-1">Số khách</label>
              <select
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} người</option>)}
              </select>
            </div>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium" style={{ background: "#1a3a5c" }}>
              <Search className="w-4 h-4" />
              Tìm phòng
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#f0ece2" }}>
                <f.icon className="w-6 h-6" style={{ color: "#1a3a5c" }} />
              </div>
              <p className="font-semibold text-gray-800">{f.label}</p>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Available rooms */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phòng trống hiện tại</h2>
              <p className="text-gray-500 mt-1">Đặt ngay để nhận ưu đãi tốt nhất</p>
            </div>
            <button onClick={() => router.push("/customer/rooms")} className="flex items-center gap-1 text-sm font-medium" style={{ color: "#1a3a5c" }}>
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {availableRooms.map(room => (
              <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => router.push(`/customer/rooms/${room.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={room.imageUrl} alt={`Phòng ${room.number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#c9a227" }}>
                    {roomTypeLabels[room.type]}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900">Phòng {room.number}</h3>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> Tầng {room.floor}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity} khách</span>
                    <span>{room.area}m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(room.pricePerNight)}</span>
                      <span className="text-xs text-gray-400">/đêm</span>
                    </div>
                    <button className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#1a3a5c" }}>Đặt ngay</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotel info */}
        <div className="rounded-2xl overflow-hidden grid md:grid-cols-2" style={{ background: "#1a3a5c" }}>
          <div className="p-8 text-white flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-3">Khách sạn Marriott</h2>
            <div className="flex items-center gap-2 mb-4" style={{ color: "#c9a227" }}>
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              <span className="text-white ml-2">5 Sao Quốc Tế</span>
            </div>
            <p className="text-blue-200 mb-4">Với hệ thống chi nhánh sang trọng tại các vị trí đắc địa nhất (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc), Marriott mang đến trải nghiệm nghỉ dưỡng xa hoa, đẳng cấp quốc tế.</p>
            <div className="flex items-center gap-2 text-blue-200">
              <MapPin className="w-4 h-4" style={{ color: "#c9a227" }} />
              <span>Hệ thống toàn quốc: Hà Nội, TP. HCM, Đà Nẵng, Phú Quốc</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-blue-200">
              <Calendar className="w-4 h-4" style={{ color: "#c9a227" }} />
              <span>Check-in: 14:00 | Check-out: 12:00</span>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1724230758718-406bab979e67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
            alt="Hotel"
            className="w-full h-64 md:h-auto object-cover"
          />
        </div>
      </div>
    </div>
  );
}
