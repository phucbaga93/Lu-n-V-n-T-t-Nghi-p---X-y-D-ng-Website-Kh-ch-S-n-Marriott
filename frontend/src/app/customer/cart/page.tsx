"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Trash2, Calendar, Users, CreditCard, Sparkles, Ticket, FileText, CheckCircle2, ShoppingBag, ShoppingCart, Tag, X } from "lucide-react";
import { roomTypeLabels, formatPrice, calcNights, getLocalToday, AVAILABLE_PROMOTIONS, AvailablePromo } from "../../data/mockData";
import { api } from "../../data/api";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateCartItem, currentUser, users, rooms, fetchRooms } = useApp();
  const router = useRouter();

  const today = getLocalToday();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const [servicesList, setServicesList] = useState<any[]>([]);
  const [cartServices, setCartServices] = useState<Record<string, any[]>>({});
  const [cartNotes, setCartNotes] = useState<Record<string, string>>({});

  const [promoInputs, setPromoInputs] = useState<Record<string, string>>({});
  const [promoErrors, setPromoErrors] = useState<Record<string, string>>({});

  // Guest walk-in state if not logged in
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCccd, setGuestCccd] = useState("");
  const [emailCheckResult, setEmailCheckResult] = useState<{ 
    exists: boolean; 
    is_member: boolean;
    user_info?: { ho_ten?: string; so_dien_thoai?: string; cccd?: string };
  } | null>(null);

  const handleGuestEmailCheck = async (val: string) => {
    const trimmed = val.trim();
    if (trimmed && trimmed.includes("@") && trimmed.includes(".")) {
      try {
        const res = await api.checkEmail(trimmed);
        setEmailCheckResult(res);
      } catch (e) {
        console.error(e);
      }
    } else {
      setEmailCheckResult(null);
    }
  };

  const savedInfo = emailCheckResult?.user_info;
  const normalizeStr = (s?: string) => {
    if (!s) return "";
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().trim();
  };

  const hasSavedName = !!(savedInfo?.ho_ten && savedInfo.ho_ten.trim());
  const hasSavedPhone = !!(savedInfo?.so_dien_thoai && savedInfo.so_dien_thoai.trim());
  const hasSavedCccd = !!(savedInfo?.cccd && savedInfo.cccd.trim());

  const isNameMismatch = emailCheckResult?.exists && hasSavedName && guestName.trim() !== "" && 
    normalizeStr(guestName) !== normalizeStr(savedInfo?.ho_ten);

  const isPhoneMismatch = emailCheckResult?.exists && hasSavedPhone && guestPhone.trim() !== "" && 
    guestPhone.trim() !== savedInfo?.so_dien_thoai?.trim();

  const isCccdMismatch = emailCheckResult?.exists && hasSavedCccd && guestCccd.trim() !== "" && 
    guestCccd.trim() !== savedInfo?.cccd?.trim();

  const [depositPercent, setDepositPercent] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [doneBookings, setDoneBookings] = useState<any[]>([]);

  const [dbPromotions, setDbPromotions] = useState<any[]>([]);

  useEffect(() => {
    async function loadServicesAndPromos() {
      try {
        const data = await api.getServices();
        setServicesList(data);
      } catch (e) {
        console.error("Failed to load services:", e);
      }
      try {
        const promoData = await api.getPublicPromotions();
        if (promoData && Array.isArray(promoData)) {
          setDbPromotions(promoData);
        }
      } catch (e) {
        console.error("Failed to load DB promos:", e);
      }
    }
    loadServicesAndPromos();
  }, []);

  // Recalculate room price dynamically when dates change
  function handleDateChange(itemId: string, field: "checkIn" | "checkOut", value: string) {
    if (value) {
      const selected = new Date(value);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        updateCartItem(itemId, {
          [field]: limitDate.toISOString().split("T")[0],
          appliedPromo: undefined
        });
        return;
      }
    }
    updateCartItem(itemId, { 
      [field]: value,
      appliedPromo: undefined // Reset coupon when date changes as room subtotal changes
    });
  }

  const [activePromoModalItemId, setActivePromoModalItemId] = useState<string | null>(null);

  async function handleApplyPromo(itemId: string, itemSubtotal: number) {
    const code = (promoInputs[itemId] || "").trim();
    if (!code) return;

    setPromoErrors(prev => ({ ...prev, [itemId]: "" }));
    try {
      const res = await api.validatePromo(code, itemSubtotal);
      updateCartItem(itemId, {
        appliedPromo: {
          code: res.ma_code,
          discountAmount: Number(res.discount_amount),
          description: res.mo_ta || "Mã giảm giá đã được áp dụng",
        }
      });
      setPromoInputs(prev => ({ ...prev, [itemId]: "" }));
    } catch (err: any) {
      setPromoErrors(prev => ({ ...prev, [itemId]: err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn." }));
      updateCartItem(itemId, { appliedPromo: undefined });
    }
  }

  async function handleQuickApplyCartPromo(itemId: string, codeToApply: string, itemSubtotal: number) {
    setPromoInputs(prev => ({ ...prev, [itemId]: codeToApply }));
    setPromoErrors(prev => ({ ...prev, [itemId]: "" }));
    try {
      const res = await api.validatePromo(codeToApply, itemSubtotal);
      updateCartItem(itemId, {
        appliedPromo: {
          code: res.ma_code,
          discountAmount: Number(res.discount_amount),
          description: res.mo_ta || "Mã giảm giá đã được áp dụng",
        }
      });
      setPromoInputs(prev => ({ ...prev, [itemId]: "" }));
      setActivePromoModalItemId(null);
    } catch (err: any) {
      setPromoErrors(prev => ({ ...prev, [itemId]: err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn." }));
      updateCartItem(itemId, { appliedPromo: undefined });
    }
  }

  function handleRemovePromo(itemId: string) {
    updateCartItem(itemId, { appliedPromo: undefined });
  }

  // Calculate totals
  let totalOriginalRooms = 0;
  let totalDiscounts = 0;
  let totalServices = 0;

  const itemDetailsList = cart.map(item => {
    const room = rooms.find(r => r.id === item.roomId);
    const nights = calcNights(item.checkIn, item.checkOut);

    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const checkInObj = new Date(item.checkIn);
    checkInObj.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((checkInObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));

    const roomTotal = item.pricePerNight * nights;
    const discount = item.appliedPromo ? item.appliedPromo.discountAmount : 0;
    
    const selectedSrvs = cartServices[item.id] || [];
    const servicesTotal = selectedSrvs.reduce((sum, s) => sum + s.price, 0);
    const finalTotal = Math.max(0, roomTotal - discount) + servicesTotal;

    totalOriginalRooms += roomTotal;
    totalDiscounts += discount;
    totalServices += servicesTotal;

    return {
      item,
      room,
      nights,
      diffDays,
      roomTotal,
      discount,
      servicesTotal,
      finalTotal,
      selectedSrvs
    };
  });

  const isFarAdvanceOrLongStay = itemDetailsList.some(d => d.nights > 14 || d.diffDays > 14);

  const finalPayable = totalOriginalRooms - totalDiscounts + totalServices;

  async function handleCheckout() {
    if (cart.length === 0) return;

    // Validation checks
    for (const detail of itemDetailsList) {
      const { item, room, nights } = detail;
      if (nights < 1 || nights > 30) {
        alert(`Thời gian lưu trú cho Phòng ${item.roomNumber} phải từ 1 đến 30 đêm!`);
        return;
      }

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const checkInDate = new Date(item.checkIn);
      checkInDate.setHours(0, 0, 0, 0);

      if (checkInDate < todayDate) {
        alert(`Ngày nhận phòng cho Phòng ${item.roomNumber} không được ở trong quá khứ! Vui lòng chọn lại ngày.`);
        return;
      }

      const maxLeadDate = new Date();
      maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
      maxLeadDate.setHours(23, 59, 59, 999);

      if (checkInDate > maxLeadDate) {
        alert(`Chỉ được đặt trước tối đa 6 tháng! Lỗi tại Phòng ${item.roomNumber}`);
        return;
      }

      if (item.guests > (room?.capacity || 2)) {
        alert(`Số lượng khách cho Phòng ${item.roomNumber} vượt quá sức chứa tối đa của phòng (${room?.capacity || 2} khách)!`);
        return;
      }
    }

    if (!currentUser) {
      if (!guestName.trim()) {
        alert("Họ và tên khách hàng không được để trống!");
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(guestPhone.trim())) {
        alert("Số điện thoại của khách vãng lai phải có đúng 10 số!");
        return;
      }
      if (!guestEmail.trim() || !guestCccd.trim()) {
        alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
        return;
      }
      if (users.some(u => u.role === "customer" && (u.email.toLowerCase() === guestEmail.trim().toLowerCase() || u.phone === guestPhone.trim()))) {
        alert("⚠️ Email hoặc Số điện thoại này (" + guestPhone.trim() + " / " + guestEmail.trim() + ") đã được đăng ký tài khoản thành viên trên hệ thống Marriott Hotel!\n\nVui lòng BẤM ĐĂNG NHẬP tài khoản của bạn để nhận ưu đãi thành viên và tiếp tục đặt phòng, hoặc sử dụng Email & Số điện thoại khác nếu bạn là khách vãng lai khác.");
        return;
      }
      if (isNameMismatch || isPhoneMismatch || isCccdMismatch) {
        alert("Thông tin Họ tên, SĐT hoặc CCCD nhập vào không trùng khớp với dữ liệu đã lưu của Email này! Vui lòng kiểm tra lại để đối soát hợp lệ.");
        return;
      }
    }

    // 🟢 KIỂM TRA SỐ LƯỢNG PHÒNG TRỐNG THỰC TẾ THEO HẠNG PHÒNG TRƯỚC KHI CHO THANH TOÁN
    const typeGroupCounts: Record<string, { count: number; roomType: string; checkIn: string; checkOut: string; typeName: string }> = {};
    for (const detail of itemDetailsList) {
      const key = `${detail.item.roomType}_${detail.item.checkIn}_${detail.item.checkOut}`;
      const typeName = roomTypeLabels[detail.item.roomType] || detail.item.roomType;
      if (!typeGroupCounts[key]) {
        typeGroupCounts[key] = { count: 0, roomType: detail.item.roomType, checkIn: detail.item.checkIn, checkOut: detail.item.checkOut, typeName };
      }
      typeGroupCounts[key].count += 1;
    }

    setLoading(true);
    try {
      // Đối soát số phòng khả dụng thực tế với CSDL
      for (const key in typeGroupCounts) {
        const grp = typeGroupCounts[key];
        try {
          const availRooms = await api.getRooms(grp.checkIn, grp.checkOut);
          const matchingAvail = availRooms.filter((r: any) => r.type === grp.roomType);
          if (grp.count > matchingAvail.length) {
            setLoading(false);
            alert(`⚠️ Hạng phòng "${grp.typeName}" hiện chỉ còn ${matchingAvail.length} phòng trống trong khoảng thời gian từ ${grp.checkIn} đến ${grp.checkOut}.\n\nGiỏ hàng của bạn đang có ${grp.count} phòng thuộc hạng này. Vui lòng điều chỉnh lại số lượng phòng!`);
            return;
          }
        } catch (e) {
          console.error("Availability check error:", e);
        }
      }

      const assignedRoomIds: number[] = [];
      const results: any[] = [];
      const cartSessionTag = `[MaGioHang: GH${Date.now()}]`;

      for (const detail of itemDetailsList) {
        const { item, roomTotal, discount, selectedSrvs, finalTotal } = detail;
        
        const servicesNote = selectedSrvs.length > 0
          ? `Dịch vụ thêm: ${selectedSrvs.map(s => `${s.name} (${formatPrice(s.price)})`).join(", ")}`
          : "";
        const note = cartNotes[item.id] || "";
        const baseNotes = note.trim()
          ? (servicesNote ? `${note} | ${servicesNote}` : note)
          : servicesNote;
        const finalNotes = baseNotes ? `${baseNotes} | ${cartSessionTag}` : cartSessionTag;

        if (currentUser) {
          const bookingData = {
            customerId: currentUser.id,
            customerName: currentUser.name,
            customerPhone: currentUser.phone,
            customerEmail: currentUser.email,
            roomId: item.roomId,
            roomNumber: item.roomNumber,
            roomType: item.roomType as any,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            guests: item.guests,
            totalPrice: finalTotal,
            tongTienPhong: roomTotal,
            maKhuyenMaiId: item.appliedPromo?.code || undefined,
            status: "pending" as const,
            createdAt: new Date().toISOString().split("T")[0],
            notes: finalNotes,
            phanTramDatCoc: depositPercent,
            payment_method: "vnpay",
            exclude_room_ids: assignedRoomIds,
          };
          const res = await api.createBooking(bookingData);
          results.push(res);
          if (res?.roomId) assignedRoomIds.push(Number(res.roomId));
        } else {
          const guestBookingData = {
            guest_name: guestName.trim(),
            guest_email: guestEmail.trim(),
            guest_phone: guestPhone.trim(),
            guest_cccd: guestCccd.trim(),
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            roomType: item.roomType,
            guests: item.guests,
            totalPrice: finalTotal,
            tongTienPhong: roomTotal,
            maKhuyenMaiId: item.appliedPromo?.code || undefined,
            notes: finalNotes,
            phanTramDatCoc: depositPercent,
            payment_method: "vnpay",
            exclude_room_ids: assignedRoomIds,
          };
          const res = await api.quickBooking(guestBookingData);
          results.push(res);
          if (res?.roomId) assignedRoomIds.push(Number(res.roomId));
        }
      }

      if (results.length > 0) {
        try {
          const firstBooking = results[0];
          // 🛡️ TÍNH TỔNG SỐ TIỀN CỌC CỦA TẤT CẢ CÁC PHÒNG TRONG GIỎ HÀNG GỬI ĐẾN VNPAY (SỬA LỖI 6.7M VẬN HÀNH)
          const totalDepositAll = results.reduce((sum, b) => sum + (Number(b.totalPrice || 0) * depositPercent) / 100, 0);
          const vnpayRes = await api.getVNPayUrl(firstBooking.id, totalDepositAll);
          if (vnpayRes && vnpayRes.payment_url) {
            const contactInfo = currentUser?.email || guestEmail.trim() || guestPhone.trim();
            if (contactInfo && typeof window !== "undefined") {
              sessionStorage.setItem("last_booking_contact", contactInfo);
              localStorage.removeItem("last_booking_contact");
            }
            clearCart();
            fetchRooms();
            window.location.href = vnpayRes.payment_url;
            return;
          } else {
            alert("Lỗi khi kết nối với cổng thanh toán VNPay.");
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi kết nối cổng thanh toán.");
        }
      }

      setDoneBookings(results);
      clearCart();
      fetchRooms(); // refresh rooms availability state
    } catch (err: any) {
      let msg = err.message || "Vui lòng kiểm tra lại thông tin.";
      alert("Đặt phòng thất bại! " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Receipt screen
  if (doneBookings.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dcfce7" }}>
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt phòng thành công!</h1>
        <p className="text-gray-500 mb-8">Hệ thống đã ghi nhận các yêu cầu đặt phòng của bạn.</p>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-left mb-8 space-y-6">
          <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Chi tiết hóa đơn đơn hàng</h3>
          <div className="space-y-4">
            {doneBookings.map((b, idx) => (
              <div key={idx} className="flex justify-between items-start pb-4 border-b border-dashed border-gray-100 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-bold text-gray-900">Phòng {b.roomNumber} ({roomTypeLabels[b.roomType]})</p>
                  <p className="text-xs text-gray-400 mt-0.5">Thời gian: {b.checkIn} → {b.checkOut}</p>
                  <p className="text-xs text-gray-500 mt-1">Mã đơn đặt: <strong className="text-gray-700">#{b.id.toUpperCase()}</strong></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-900">{formatPrice(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-base">Tổng tiền thanh toán</span>
            <span className="font-extrabold text-2xl text-blue-900">{formatPrice(doneBookings.reduce((sum, b) => sum + b.totalPrice, 0))}</span>
          </div>
        </div>

        <div className="flex gap-4 max-w-md mx-auto">
          {currentUser ? (
            <button onClick={() => router.push("/customer/my-bookings")} className="flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90" style={{ background: "#1a3a5c" }}>
              Xem phòng của tôi
            </button>
          ) : null}
          <button onClick={() => router.push("/")} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Giỏ đặt phòng trống</h2>
        <p className="text-gray-400 text-sm mb-6">Bạn chưa thêm phòng nghỉ nào vào danh sách đặt phòng.</p>
        <button onClick={() => router.push("/customer/rooms")} className="px-6 py-3 rounded-xl text-white font-medium hover:opacity-95 transition-all" style={{ background: "#1a3a5c" }}>
          Tìm kiếm phòng ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-7 h-7 text-blue-900" /> Giỏ phòng của bạn
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Cart items list */}
        <div className="lg:col-span-2 space-y-6">
          {itemDetailsList.map(detail => {
            const { item, room, nights, roomTotal, discount, finalTotal, selectedSrvs } = detail;
            const pInput = promoInputs[item.id] || "";
            const pError = promoErrors[item.id] || "";

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Header Room Info */}
                <div className="p-5 flex gap-4 border-b border-gray-50 bg-slate-50/50">
                  <img src={item.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{roomTypeLabels[item.roomType] || item.roomType}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Tối đa {room?.capacity || 2} khách</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-blue-900">{formatPrice(item.pricePerNight)}</span>
                      <span className="text-xs text-gray-400">/ đêm</span>
                    </div>
                  </div>
                </div>

                {/* Configuration Inputs */}
                <div className="p-5 border-b border-gray-50 space-y-2.5">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-900" /> Ngày nhận phòng
                      </label>
                      <input 
                        type="date" 
                        value={item.checkIn}
                        min={today}
                        max={maxDate}
                        onChange={e => handleDateChange(item.id, "checkIn", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Nhận phòng: Từ 14:00</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-900" /> Ngày trả phòng
                      </label>
                      <input 
                        type="date" 
                        value={item.checkOut}
                        min={item.checkIn || today}
                        max={maxDate}
                        onChange={e => handleDateChange(item.id, "checkOut", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Trả phòng: Trước 12:00</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-900" /> Số lượng khách
                      </label>
                      <select 
                        value={item.guests}
                        onChange={e => updateCartItem(item.id, { guests: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none bg-white"
                      >
                        {Array.from({ length: room?.capacity || 2 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} khách</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {item.checkIn === today && (() => {
                    const currentHour = new Date().getHours();
                    const isAfterCheckInTime = currentHour >= 14;
                    return (
                      <div className="p-2 bg-blue-50/80 border border-blue-100 rounded-lg text-[11px] text-blue-800 flex items-center gap-1.5 animate-fadeIn">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        {isAfterCheckInTime ? (
                          <span><strong>⚡ Nhận phòng ngay hôm nay ({today}):</strong> Giờ hiện tại ({currentHour}:00) đã qua mốc nhận phòng 14:00. Phòng đã chuẩn bị sẵn sàng 100%, quý khách có thể đến khách sạn nhận phòng ngay lập tức sau khi đặt thành công!</span>
                        ) : (
                          <span><strong>🕒 Đặt phòng hôm nay ({today}):</strong> Phòng sẽ sẵn sàng bàn giao từ 14:00 chiều nay. Quý khách có thể đến làm thủ tục nhận phòng từ mốc 14:00!</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Additional Services Selection */}
                {servicesList.length > 0 && (
                  <div className="p-5 border-b border-gray-50 bg-slate-50/20">
                    <p className="text-xs font-semibold text-gray-600 mb-2.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-900" /> Dịch vụ đi kèm cho phòng này:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {servicesList.map(srv => {
                        const isComplimentary = !!room?.services?.some(s => s.name.toLowerCase() === srv.name.toLowerCase() && s.included);
                        const isChecked = isComplimentary || selectedSrvs.some(s => s.id === srv.id);
                        return (
                          <label key={srv.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors ${isComplimentary ? "border-green-100 bg-green-50/20 cursor-not-allowed" : "border-gray-100 bg-white hover:bg-slate-50 cursor-pointer"}`}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              disabled={isComplimentary}
                              onChange={() => {
                                if (isComplimentary) return;
                                const currentSrvs = cartServices[item.id] || [];
                                if (selectedSrvs.some(s => s.id === srv.id)) {
                                  setCartServices({
                                    ...cartServices,
                                    [item.id]: currentSrvs.filter(s => s.id !== srv.id)
                                  });
                                } else {
                                  setCartServices({
                                    ...cartServices,
                                    [item.id]: [...currentSrvs, srv]
                                  });
                                }
                              }}
                              className="accent-blue-900"
                            />
                            <div className="flex-1 flex justify-between items-center">
                              <span className="font-semibold text-gray-800">{srv.name}</span>
                              {isComplimentary ? (
                                <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                  Miễn phí đi kèm
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-900 font-bold">({formatPrice(srv.price)})</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Voucher code / discount */}
                <div className="p-5 border-b border-gray-50 flex flex-wrap gap-4 items-end justify-between bg-yellow-50/10">
                  <div className="w-full sm:w-80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-amber-600" /> Mã khuyến mãi áp dụng
                      </label>
                      <button
                        type="button"
                        onClick={() => setActivePromoModalItemId(item.id)}
                        className="text-[10px] text-blue-900 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-100 transition-colors"
                      >
                        <Tag className="w-3 h-3 text-amber-500" /> Chọn Voucher ({AVAILABLE_PROMOTIONS.length})
                      </button>
                    </div>
                    {item.appliedPromo ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div>
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {item.appliedPromo.code}
                          </p>
                          <p className="text-[10px] text-emerald-700 leading-none mt-0.5">{item.appliedPromo.description}</p>
                        </div>
                        <button 
                          onClick={() => handleRemovePromo(item.id)}
                          className="text-xs text-red-500 font-semibold hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={pInput}
                          onChange={e => setPromoInputs({ ...promoInputs, [item.id]: e.target.value.toUpperCase() })}
                          placeholder="Mã KM (Vd: SUMMER2026)"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none uppercase font-semibold text-blue-900"
                        />
                        <button 
                          onClick={() => handleApplyPromo(item.id, roomTotal)}
                          className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold transition-all hover:bg-opacity-90"
                          style={{ background: "#1a3a5c" }}
                        >
                          Áp dụng
                        </button>
                      </div>
                    )}
                    {pError && <p className="text-red-500 text-[10px] mt-1">{pError}</p>}
                  </div>

                  <div className="text-right mt-3 sm:mt-0">
                    <span className="text-xs text-gray-400">Tạm tính ({nights} đêm):</span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-800 line-through leading-none">{discount > 0 ? formatPrice(roomTotal) : ""}</span>
                      <span className="text-base font-bold text-gray-900 mt-0.5">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-4 bg-gray-50/50">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-900" /> Ghi chú đặc biệt cho phòng này
                  </label>
                  <textarea 
                    value={cartNotes[item.id] || ""}
                    onChange={e => setCartNotes({ ...cartNotes, [item.id]: e.target.value })}
                    placeholder="Yêu cầu giường phụ, phòng tầng cao, view sông..."
                    rows={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none resize-none bg-white"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Customer Info & Checkout summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Guest Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" /> Thông tin người đặt phòng
            </h3>

            {currentUser ? (
              <div className="space-y-3.5 text-sm">
                <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Họ và tên khách</span>
                  <span className="font-semibold text-gray-800">{currentUser.name}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Email liên hệ</span>
                  <span className="font-semibold text-gray-800">{currentUser.email}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Số điện thoại</span>
                  <span className="font-semibold text-gray-800">{currentUser.phone}</span>
                </div>
                {currentUser.idNumber && (
                  <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Số CCCD</span>
                    <span className="font-semibold text-gray-800">{currentUser.idNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên khách vãng lai *</label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${
                      isNameMismatch ? "border-red-400 bg-red-50/20 text-red-900" : "border-gray-200"
                    }`}
                    required
                  />
                  {isNameMismatch && (
                    <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      ⚠️ Họ và tên không khớp với dữ liệu đã lưu cho Email này!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email nhận xác nhận *</label>
                  <input 
                    type="email" 
                    value={guestEmail}
                    onChange={e => { 
                      const val = e.target.value;
                      setGuestEmail(val); 
                      handleGuestEmailCheck(val);
                    }}
                    onBlur={e => handleGuestEmailCheck(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                  {emailCheckResult?.exists && (
                    <div className="mt-2.5 p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-sm animate-fadeIn space-y-2">
                      <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>💡 Email này đã tồn tại dữ liệu trên hệ thống!</span>
                      </div>
                      <p className="text-blue-800 text-[11px] leading-relaxed">
                        Quý khách vui lòng nhập <strong>ĐÚNG Họ và tên, SĐT và CCCD/CMND chính chủ</strong> đã lưu trước đó để hệ thống đối soát dữ liệu hợp lệ khi tạo đơn.
                      </p>
                      {emailCheckResult.is_member && (
                        <div className="pt-1.5 flex items-center justify-between border-t border-blue-200/60">
                          <span className="text-[11px] text-blue-800 font-medium">Đã có tài khoản thành viên?</span>
                          <button
                            type="button"
                            onClick={() => router.push(`/login?redirect=/customer/cart`)}
                            className="px-2.5 py-1 rounded-lg text-white font-semibold text-[11px] transition-all hover:opacity-90 shadow-xs"
                            style={{ background: "#1a3a5c" }}
                          >
                            Đăng nhập ngay
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại liên lạc (10 số) *</label>
                  <input 
                    type="tel" 
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${
                      isPhoneMismatch ? "border-red-400 bg-red-50/20 text-red-900" : "border-gray-200"
                    }`}
                    required
                  />
                  {isPhoneMismatch && (
                    <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      ⚠️ Số điện thoại không khớp với dữ liệu đã lưu cho Email này!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số CCCD / Hộ chiếu *</label>
                  <input 
                    type="text" 
                    value={guestCccd}
                    onChange={e => setGuestCccd(e.target.value)}
                    placeholder="07920100xxxx"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${
                      isCccdMismatch ? "border-red-400 bg-red-50/20 text-red-900" : "border-gray-200"
                    }`}
                    required
                  />
                  {isCccdMismatch && (
                    <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      ⚠️ Số CCCD/CMND không khớp với dữ liệu đã lưu cho Email này!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Card - Deposit selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-900" /> Chọn mức đặt cọc giữ phòng
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Quý khách vui lòng chọn mức đặt cọc phòng trực tuyến qua cổng **VNPay (Sandbox)** để xác nhận đơn phòng. Số tiền còn lại sẽ được thanh toán khi nhận phòng tại quầy.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[30, 50, 70, 100].map(pct => {
                const isSelected = depositPercent === pct;
                const depositValue = (finalPayable * pct) / 100;
                return (
                  <label 
                    key={pct} 
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "border-blue-900 bg-blue-50/50" 
                        : "border-gray-200 hover:bg-slate-50"
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="depositPercent" 
                      value={pct}
                      checked={isSelected}
                      onChange={() => setDepositPercent(pct)}
                      className="mt-1 accent-blue-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-snug">
                        {pct === 100 ? "Thanh toán 100%" : `Đặt cọc ${pct}%`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-none">
                        {formatPrice(depositValue)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900 space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span>Đặt cọc ngay qua VNPay:</span>
                <span>{formatPrice((finalPayable * depositPercent) / 100)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Thanh toán tại quầy khi check-in:</span>
                <span>{formatPrice(finalPayable - (finalPayable * depositPercent) / 100)}</span>
              </div>
            </div>
          </div>

          {/* Receipt Summary Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Tổng hợp thanh toán</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tổng tiền phòng gốc:</span>
                <span className="font-medium text-gray-800">{formatPrice(totalOriginalRooms)}</span>
              </div>
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Khuyến mãi giảm giá:</span>
                  <span className="font-bold">-{formatPrice(totalDiscounts)}</span>
                </div>
              )}
              {totalServices > 0 && (
                <div className="flex justify-between text-blue-900">
                  <span>Tổng tiền dịch vụ thêm:</span>
                  <span className="font-bold">+{formatPrice(totalServices)}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Đặt cọc online ({depositPercent}%):</span>
                <span className="font-bold text-gray-800">-{formatPrice((finalPayable * depositPercent) / 100)}</span>
              </div>
              <div className="pt-1 flex justify-between items-center text-xs text-gray-500">
                <span>Còn lại trả tại quầy:</span>
                <span className="font-medium text-gray-700">{formatPrice(finalPayable - (finalPayable * depositPercent) / 100)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900">Tổng cộng đơn phòng:</span>
                <span className="font-extrabold text-lg text-blue-900">{formatPrice(finalPayable)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:bg-opacity-95 text-center text-sm disabled:opacity-50"
              style={{ background: "#1a3a5c" }}
            >
              {loading ? "Đang xử lý đặt phòng..." : "Xác nhận đặt phòng ngay"}
            </button>
            <p className="text-[10px] text-gray-400 text-center leading-normal">
              Bằng việc bấm xác nhận, bạn đồng ý với các Điều khoản đặt phòng & Chính sách hủy phòng của Marriott Hotel.
            </p>
          </div>
        </div>
    </div>

      {/* 🎟️ MODAL GỢI Ý MÃ KHUYẾN MÃI / VOUCHER TRONG GIỎ HÀNG */}
      {activePromoModalItemId && (() => {
        const item = cart.find(i => i.id === activePromoModalItemId);
        if (!item) return null;
        const nights = calcNights(item.checkIn, item.checkOut);
        const roomTotal = item.pricePerNight * nights;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-400 animate-bounce" />
                  <div>
                    <h3 className="font-bold text-base">Danh sách Voucher & Mã Ưu Đãi</h3>
                    <p className="text-xs text-slate-300">Áp dụng riêng cho Phòng {item.roomNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePromoModalItemId(null)}
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50">
                {(() => {
                  const listToRender = dbPromotions.length > 0
                    ? dbPromotions.map((p: any) => ({
                        code: p.ma_code,
                        title: p.mo_ta || `Ưu đãi mã ${p.ma_code}`,
                        subtitle: p.don_hang_toi_thieu > 0 ? `Áp dụng cho đơn từ ${formatPrice(Number(p.don_hang_toi_thieu))}` : "Áp dụng trực tiếp cho đơn đặt phòng.",
                        badge: Number(p.phan_tram_giam) > 0 ? `Giảm ${p.phan_tram_giam}%` : (Number(p.so_tien_giam_toi_da) > 0 ? `Giảm ${formatPrice(Number(p.so_tien_giam_toi_da))}` : "Ưu đãi"),
                        expiry: p.ngay_ket_thuc ? new Date(p.ngay_ket_thuc).toLocaleDateString("vi-VN") : "31/12/2026",
                        tagColor: Number(p.phan_tram_giam) >= 20 ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                      }))
                    : AVAILABLE_PROMOTIONS;

                  return listToRender.map((promo: any) => {
                    const isSelected = item.appliedPromo?.code === promo.code;
                    return (
                      <div
                        key={promo.code}
                        className={`p-4 rounded-xl border transition-all relative overflow-hidden bg-white shadow-xs ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border-r border-gray-200" />
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border-l border-gray-200" />

                        <div className="flex items-start justify-between gap-3 pl-2 pr-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${promo.tagColor || "bg-blue-600 text-white"}`}>
                                {promo.badge}
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                                {promo.code}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 leading-snug pt-1">
                              {promo.title}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {promo.subtitle}
                            </p>
                            <p className="text-[11px] text-gray-400 pt-1">
                              Hạn sử dụng: <strong>{promo.expiry}</strong>
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-center self-center gap-2">
                            {isSelected ? (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã dùng
                              </span>
                            ) : (
                              <button
                                onClick={() => handleQuickApplyCartPromo(item.id, promo.code, roomTotal)}
                                className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1"
                                style={{ background: "#1a3a5c" }}
                              >
                                Áp dụng
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer */}
              <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
                <span>💡 Mỗi phòng áp dụng tối đa 1 mã ưu đãi</span>
                <button
                  onClick={() => setActivePromoModalItemId(null)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
