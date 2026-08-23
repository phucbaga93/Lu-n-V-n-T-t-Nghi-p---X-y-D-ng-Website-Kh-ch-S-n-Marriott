"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Filter, BedDouble, Users, Star, SlidersHorizontal, Search } from "lucide-react";
import { roomTypeLabels, formatPrice, RoomType, calcNights, getLocalToday } from "../../data/mockData";

function RoomListPageContent() {
  const { rooms, fetchRooms, addToCart, clearCart } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterType, setFilterType] = useState<RoomType | "all">("all");
  const [filterMaxPrice, setFilterMaxPrice] = useState(30000000);
  const [filterCapacity, setFilterCapacity] = useState(Number(searchParams.get("guests")) || 1);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "type">("price_asc");
  const [showFilter, setShowFilter] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>(searchParams.get("location") || "all");

  const today = getLocalToday();
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const getClampedDate = (val: string | null, fallback: string) => {
    if (!val) return fallback;
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() + 6);
    limitDate.setHours(23, 59, 59, 999);
    if (d > limitDate) {
      return limitDate.toISOString().split("T")[0];
    }
    return val;
  };

  const [checkInState, setCheckInState] = useState(getClampedDate(searchParams.get("checkIn"), ""));
  const [checkOutState, setCheckOutState] = useState(getClampedDate(searchParams.get("checkOut"), ""));

  const handleCheckInStateChange = (val: string) => {
    if (val) {
      const selected = new Date(val);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        setCheckInState(limitDate.toISOString().split("T")[0]);
        return;
      }
    }
    setCheckInState(val);
  };

  const handleCheckOutStateChange = (val: string) => {
    if (val) {
      const selected = new Date(val);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        setCheckOutState(limitDate.toISOString().split("T")[0]);
        return;
      }
    }
    setCheckOutState(val);
  };

  useEffect(() => {
    if (checkInState && checkOutState) {
      const nights = calcNights(checkInState, checkOutState);
      if (nights >= 1 && nights <= 30) {
        const checkInDate = new Date(checkInState);
        const maxLeadDate = new Date();
        maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
        if (checkInDate <= maxLeadDate) {
          fetchRooms(checkInState, checkOutState, filterLocation);
        }
      }
    } else {
      fetchRooms(undefined, undefined, filterLocation);
    }
  }, [checkInState, checkOutState, filterLocation, fetchRooms]);

  function handleUpdateSearch() {
    if (checkInState && checkOutState) {
      const nights = calcNights(checkInState, checkOutState);
      if (nights < 1 || nights > 30) {
        alert("Thời gian lưu trú phải từ 1 đến 30 đêm!");
        return;
      }
      const checkInDate = new Date(checkInState);
      const maxLeadDate = new Date();
      maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
      if (checkInDate > maxLeadDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        return;
      }
    }
    router.replace(`/customer/rooms?checkIn=${checkInState}&checkOut=${checkOutState}&guests=${filterCapacity}&location=${filterLocation}`);
  }

  function handleBookNow(room: any) {
    clearCart();
    const inDate = checkInState || getLocalToday();
    const outDate = checkOutState || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    addToCart({
      id: "cart_" + Date.now(),
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      pricePerNight: room.pricePerNight,
      imageUrl: room.imageUrl,
      checkIn: inDate,
      checkOut: outDate,
      guests: filterCapacity,
    });
    router.push("/customer/cart");
  }

  function handleAddToCart(room: any) {
    const inDate = checkInState || getLocalToday();
    const outDate = checkOutState || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    addToCart({
      id: "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      pricePerNight: room.pricePerNight,
      imageUrl: room.imageUrl,
      checkIn: inDate,
      checkOut: outDate,
      guests: filterCapacity,
    });
    alert(`Đã thêm hạng phòng ${roomTypeLabels[room.type] || room.type} vào giỏ hàng đặt phòng của bạn!`);
  }

  let filtered = rooms.filter(r => {
    if (showOnlyAvailable && r.status !== "available") return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    if (r.pricePerNight > filterMaxPrice) return false;
    if (r.capacity < filterCapacity) return false;
    if (filterLocation !== "all" && r.location !== filterLocation) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === "price_asc") return a.pricePerNight - b.pricePerNight;
    if (sortBy === "price_desc") return b.pricePerNight - a.pricePerNight;
    return a.type.localeCompare(b.type);
  });

  // Nhóm các phòng vật lý theo Hạng phòng và Chi nhánh (Vị trí) để hiển thị riêng biệt từng nơi
  const categoriesMap = new Map<string, any>();
  for (const room of filtered) {
    const key = `${room.type}_${room.location}`;
    if (!categoriesMap.has(key)) {
      categoriesMap.set(key, {
        ...room,
        physicalRooms: [room], // Danh sách phòng vật lý
      });
    } else {
      categoriesMap.get(key).physicalRooms.push(room);
    }
  }
  const groupedRooms = Array.from(categoriesMap.values());

  const statusColors: Record<string, string> = {
    available: "#22c55e",
    occupied: "#ef4444",
    maintenance: "#f59e0b",
    reserved: "#3b82f6",
    cleaning: "#22c55e",
  };
  const statusLabels: Record<string, string> = {
    available: "Trống",
    occupied: "Đang dùng",
    maintenance: "Bảo trì",
    reserved: "Đã đặt",
    cleaning: "Trống",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Date Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh sách phòng</h1>
          <p className="text-gray-500 mt-1">
            {checkInState && checkOutState ? `Từ ${checkInState} đến ${checkOutState} · ` : ""}{filtered.length} phòng phù hợp
          </p>
        </div>
      </div>

      {/* Date-Guest selection panel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end mb-8">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vị trí</label>
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-1 bg-white"
          >
            <option value="all">Tất cả vị trí</option>
            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Phú Quốc">Phú Quốc</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ngày nhận phòng</label>
          <input
            type="date"
            value={checkInState}
            min={today}
            max={maxDate}
            onChange={e => handleCheckInStateChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-1"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ngày trả phòng</label>
          <input
            type="date"
            value={checkOutState}
            min={checkInState || today}
            max={maxDate}
            onChange={e => handleCheckOutStateChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-1"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Số khách</label>
          <select
            value={filterCapacity}
            onChange={e => setFilterCapacity(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-1"
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} người</option>)}
          </select>
        </div>
        <button
          onClick={handleUpdateSearch}
          className="px-6 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 h-9 justify-center"
          style={{ background: "#1a3a5c" }}
        >
          <Search className="w-4 h-4" />
          Cập nhật
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter sidebar */}
        <div className={`lg:w-72 space-y-5 ${showFilter ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </h3>

            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Loại phòng</label>
              <div className="space-y-2">
                {(["all", "standard", "superior", "deluxe", "suite", "family"] as const).map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" checked={filterType === t} onChange={() => setFilterType(t)} className="accent-blue-800" />
                    <span className="text-sm text-gray-700">{t === "all" ? "Tất cả" : roomTypeLabels[t]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Giá tối đa: <span className="font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(filterMaxPrice)}</span>
              </label>
              <input
                type="range"
                min={1000000}
                max={30000000}
                step={500000}
                value={filterMaxPrice}
                onChange={e => setFilterMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-800"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1M</span>
                <span>30M</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Số khách tối thiểu</label>
              <select value={filterCapacity} onChange={e => setFilterCapacity(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} người</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showOnlyAvailable} onChange={e => setShowOnlyAvailable(e.target.checked)} className="accent-blue-800" />
              <span className="text-sm text-gray-700">Chỉ hiện phòng trống</span>
            </label>
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <button className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" onClick={() => setShowFilter(v => !v)}>
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">Sắp xếp:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white">
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="type">Theo loại</option>
              </select>
            </div>
          </div>

          {groupedRooms.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy phòng phù hợp</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedRooms.map(room => {
                const repRoom = room.physicalRooms[0];
                const roomsAvailable = room.physicalRooms.length;
                return (
                  <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col sm:flex-row">
                    <div className="relative sm:w-72 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                      <img src={room.imageUrl} alt={room.typeName || roomTypeLabels[room.type]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#c9a227" }}>
                        {room.typeName || roomTypeLabels[room.type]}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 leading-snug">{room.typeName || roomTypeLabels[room.type]}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Vị trí: {room.location} · Diện tích: {room.area}m²</p>
                          </div>
                          <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            Còn trống {roomsAvailable} phòng
                          </span>
                        </div>
                        <p className="text-sm sm:text-[15.5px] text-gray-700 leading-relaxed mb-4 font-normal">{room.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {room.amenities.slice(0, 5).map((a, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 text-gray-600 border border-gray-200">{a}</span>
                          ))}
                          {room.amenities.length > 5 && <span className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 text-gray-500 border border-gray-200 font-medium">+{room.amenities.length - 5}</span>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1.5 font-medium"><Users className="w-4 h-4 text-gray-400" /> Tối đa {room.capacity} khách</span>
                          <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                        <div>
                          <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#1a3a5c" }}>{formatPrice(room.pricePerNight)}</span>
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">/đêm</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/customer/rooms/${repRoom.id}`)} className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">Chi tiết</button>
                          {roomsAvailable > 0 && (
                            <>
                              <button onClick={() => handleAddToCart(repRoom)} className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors" style={{ borderColor: "#1a3a5c", color: "#1a3a5c" }}>
                                Thêm vào giỏ
                              </button>
                              <button onClick={() => handleBookNow(repRoom)} className="px-5 py-2.5 rounded-xl text-xs sm:text-sm text-white font-bold transition-all hover:opacity-95 shadow-sm" style={{ background: "#1a3a5c" }}>
                                Đặt ngay
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải danh sách phòng...</div>}>
      <RoomListPageContent />
    </Suspense>
  );
}
