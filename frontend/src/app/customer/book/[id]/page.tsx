"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { ArrowLeft, CheckCircle2, Calendar, Users, CreditCard, FileText, Sparkles, ShieldCheck, Ticket, Tag, X, Percent } from "lucide-react";
import { roomTypeLabels, formatPrice, calcNights, Booking, getLocalToday, AVAILABLE_PROMOTIONS, AvailablePromo, maxChildrenPerRoomType } from "../../../data/mockData";
import { api } from "../../../data/api";

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rooms, currentUser, users, addBooking, addGuestBooking, validatePromo } = useApp();
  const room = rooms.find(r => r.id === id);

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

  const [checkIn, setCheckIn] = useState(getClampedDate(searchParams.get("checkIn"), today));
  const [checkOut, setCheckOut] = useState(getClampedDate(searchParams.get("checkOut"), tomorrow));
  const [adultsCount, setAdultsCount] = useState(Number(searchParams.get("guests")) || 1);
  const [childrenCount, setChildrenCount] = useState(0);
  const guests = adultsCount; // for room capacity comparison

  // States khai báo thông tin Khách đi kèm (Khách 2, 3...) & Trẻ em đi kèm cho Đặt phòng Online
  const [accompanyingGuests, setAccompanyingGuests] = useState<Array<{ name: string; idCard: string }>>([]);
  const [childrenDetails, setChildrenDetails] = useState<Array<{ name: string; ageOrYear: string; relationship: string }>>([]);

  // Auto sync accompanying guests count when adultsCount changes
  useEffect(() => {
    const count = Math.max(0, adultsCount - 1);
    setAccompanyingGuests(prev => {
      if (prev.length === count) return prev;
      const next = [...prev];
      while (next.length < count) {
        next.push({ name: "", idCard: "" });
      }
      return next.slice(0, count);
    });
  }, [adultsCount]);

  // Auto sync children details count when childrenCount changes
  useEffect(() => {
    setChildrenDetails(prev => {
      if (prev.length === childrenCount) return prev;
      const next = [...prev];
      while (next.length < childrenCount) {
        next.push({ name: "", ageOrYear: "", relationship: "Con" });
      }
      return next.slice(0, childrenCount);
    });
  }, [childrenCount]);

  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState("counter");
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<Booking | null>(null);

  // Walk-in / guest state if not logged in
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCccd, setGuestCccd] = useState("");
  const [emailCheckResult, setEmailCheckResult] = useState<{ exists: boolean; is_member: boolean } | null>(null);

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

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  // Services list and selection state
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

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

  if (!room) return <div className="text-center py-16 text-gray-400">Không tìm thấy phòng</div>;

  const nights = calcNights(checkIn, checkOut);
  const total = room.pricePerNight * nights;
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const finalPrice = (appliedPromo ? Math.max(0, total - appliedPromo.discountAmount) : total) + servicesTotal;

  const handleCheckInChange = (val: string) => {
    if (val) {
      const selected = new Date(val);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 6);
      limitDate.setHours(23, 59, 59, 999);
      if (selected > limitDate) {
        alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
        setCheckIn(limitDate.toISOString().split("T")[0]);
        setAppliedPromo(null);
        setPromoError("");
        return;
      }
    }
    setCheckIn(val);
    setAppliedPromo(null);
    setPromoError("");
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
        setAppliedPromo(null);
        setPromoError("");
        return;
      }
    }
    setCheckOut(val);
    setAppliedPromo(null);
    setPromoError("");
  };

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoError("");
    try {
      const res = await validatePromo(promoCode.trim(), total);
      setAppliedPromo({
        code: res.ma_code,
        discountAmount: Number(res.discount_amount),
        description: res.mo_ta || "Mã giảm giá đã được áp dụng",
      });
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      setAppliedPromo(null);
    }
  }

  async function handleQuickApplyPromo(codeToApply: string) {
    setPromoCode(codeToApply);
    setPromoError("");
    try {
      const res = await validatePromo(codeToApply, total);
      setAppliedPromo({
        code: res.ma_code,
        discountAmount: Number(res.discount_amount),
        description: res.mo_ta || "Mã giảm giá đã được áp dụng",
      });
      setPromoCode("");
      setIsPromoModalOpen(false);
    } catch (err: any) {
      setPromoError(err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      setAppliedPromo(null);
    }
  }

  function handleStep1Proceed() {
    const nights = calcNights(checkIn, checkOut);
    if (nights < 1 || nights > 30) {
      alert("Thời gian lưu trú phải từ 1 đến 30 đêm!");
      return;
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    const maxLeadDate = new Date();
    maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
    maxLeadDate.setHours(23, 59, 59, 999);

    if (checkInDate > maxLeadDate) {
      alert("Chỉ được đặt phòng trước tối đa 6 tháng!");
      return;
    }

    if (adultsCount > room.capacity) {
      alert(`Số lượng người lớn (${adultsCount} người) vượt quá sức chứa tối đa của phòng (${room.capacity} người)!`);
      return;
    }

    // Validate Khách đi kèm người lớn khi adultsCount >= 2
    if (adultsCount >= 2) {
      for (let i = 0; i < accompanyingGuests.length; i++) {
        const g = accompanyingGuests[i];
        if (!g.name.trim()) {
          alert(`Vui lòng điền Họ và tên đầy đủ cho Người lớn đi kèm thứ ${i + 2}!`);
          return;
        }
      }
    }

    // Validate Trẻ em đi kèm khi childrenCount > 0
    if (childrenCount > 0) {
      for (let i = 0; i < childrenDetails.length; i++) {
        const c = childrenDetails[i];
        if (!c.name.trim() || !c.ageOrYear.trim()) {
          alert(`Vui lòng điền đầy đủ Họ tên và Độ tuổi/Năm sinh cho Trẻ em thứ ${i + 1}!`);
          return;
        }
      }
    }

    setStep(2);
  }

  async function handleConfirm() {
    let guestInfoStr = "";
    if (adultsCount >= 2 && accompanyingGuests.length > 0) {
      const accList = accompanyingGuests.map((g, idx) => 
        `Khách ${idx + 2}: ${g.name.trim()}${g.idCard.trim() ? ` (CCCD: ${g.idCard.trim()})` : ''}`
      ).join('; ');
      guestInfoStr += `Khai báo tạm trú: [${accList}]`;
    }

    if (childrenCount > 0 && childrenDetails.length > 0) {
      const childList = childrenDetails.map((c, idx) => 
        `Trẻ ${idx + 1}: ${c.name.trim()} (Tuổi/Năm sinh: ${c.ageOrYear.trim()}, Mối quan hệ: ${c.relationship || 'Con'})`
      ).join('; ');
      const childStr = `Trẻ em đi kèm (${childrenCount} trẻ): [${childList}]`;
      guestInfoStr = guestInfoStr ? `${guestInfoStr} | ${childStr}` : childStr;
    }

    const servicesNote = selectedServices.length > 0
      ? `Dịch vụ thêm: ${selectedServices.map(s => `${s.name} (${formatPrice(s.price)})`).join(", ")}`
      : "";

    let finalNotes = notes.trim();
    if (guestInfoStr) {
      finalNotes = finalNotes ? `${finalNotes} | ${guestInfoStr}` : guestInfoStr;
    }
    if (servicesNote) {
      finalNotes = finalNotes ? `${finalNotes} | ${servicesNote}` : servicesNote;
    }

    if (currentUser) {
      const booking: Booking = {
        id: "b" + Date.now(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerPhone: currentUser.phone,
        customerEmail: currentUser.email,
        roomId: room!.id,
        roomNumber: room!.number,
        roomType: room!.type,
        checkIn,
        checkOut,
        guests,
        totalPrice: finalPrice,
        tongTienPhong: total,
        maKhuyenMaiId: appliedPromo?.code || undefined,
        status: "pending",
        createdAt: getLocalToday(),
        notes: finalNotes,
        payment_method: payMethod,
      };
      
      const createdBooking = await addBooking(booking);
      if (createdBooking) {
        if (payMethod === "vnpay") {
          try {
            const vnpayRes = await api.getVNPayUrl(createdBooking.id, finalPrice);
            if (vnpayRes && vnpayRes.payment_url) {
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
        setDone(createdBooking);
        setStep(3);
      } else {
        alert("Đặt phòng thất bại.");
      }
    } else {
      if (!guestName.trim()) {
        alert("Họ và tên không được để trống!");
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
      const guestBookingData = {
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        guest_cccd: guestCccd.trim(),
        checkIn,
        checkOut,
        roomType: room!.type,
        guests,
        totalPrice: finalPrice,
        tongTienPhong: total,
        maKhuyenMaiId: appliedPromo?.code || undefined,
        notes: finalNotes,
        payment_method: payMethod,
      };
      try {
        const res = await addGuestBooking(guestBookingData);
        if (res) {
          if (payMethod === "vnpay") {
            try {
              const vnpayRes = await api.getVNPayUrl(res.id, finalPrice);
              if (vnpayRes && vnpayRes.payment_url) {
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
          setDone(res);
          setStep(3);
        }
      } catch (err: any) {
        alert(err.message || "Đặt phòng thất bại! Thông tin nhập vào không hợp lệ.");
      }
    }
  }

  if (step === 3 && done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dcfce7" }}>
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt phòng thành công!</h1>
      <p className="text-gray-500 mb-6">Mã đặt phòng của bạn: <strong className="text-gray-800">#{done.id.toUpperCase()}</strong></p>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left mb-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-400">Phòng</p><p className="font-semibold">Phòng {done.roomNumber} ({roomTypeLabels[done.roomType]})</p></div>
          <div><p className="text-gray-400">Nhận phòng</p><p className="font-semibold">{done.checkIn}</p></div>
          <div><p className="text-gray-400">Trả phòng</p><p className="font-semibold">{done.checkOut}</p></div>
          <div><p className="text-gray-400">Số đêm</p><p className="font-semibold">{nights} đêm</p></div>
          <div className="col-span-2"><p className="text-gray-400">Tổng tiền</p><p className="font-bold text-lg" style={{ color: "#1a3a5c" }}>{formatPrice(done.totalPrice)}</p></div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => router.push("/customer/my-bookings")} className="flex-1 py-3 rounded-xl text-white font-medium" style={{ background: "#1a3a5c" }}>Xem đặt phòng của tôi</button>
        <button onClick={() => router.push("/")} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700">Về trang chủ</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => step === 1 ? router.back() : setStep(s => s - 1)} className="flex items-center gap-2 text-gray-600 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đặt phòng</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={step >= s ? { background: "#1a3a5c", color: "#fff" } : { background: "#e5e7eb", color: "#9ca3af" }}>
              {s}
            </div>
            <span className="text-sm hidden sm:inline" style={{ color: step >= s ? "#1a3a5c" : "#9ca3af" }}>
              {s === 1 ? "Thông tin đặt phòng" : "Xác nhận & thanh toán"}
            </span>
            {s < 2 && <div className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: "#1a3a5c" }} /> Ngày lưu trú</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày nhận phòng</label>
                  <input type="date" value={checkIn} min={today} max={maxDate} onChange={e => handleCheckInChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 text-sm" />
                  <span className="text-[11px] text-gray-400 mt-1 block">Giờ nhận phòng: Từ 14:00</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày trả phòng</label>
                  <input type="date" value={checkOut} min={checkIn} max={maxDate} onChange={e => handleCheckOutChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 text-sm" />
                  <span className="text-[11px] text-gray-400 mt-1 block">Giờ trả phòng: Trước 12:00</span>
                </div>
              </div>
              {checkIn === today && (() => {
                const currentHour = new Date().getHours();
                const isAfterCheckInTime = currentHour >= 14;
                return (
                  <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {isAfterCheckInTime ? (
                      <span><strong>⚡ Nhận phòng ngay hôm nay ({today}):</strong> Giờ hiện tại ({currentHour}:00) đã qua mốc 14:00. Phòng đã chuẩn bị sẵn sàng 100%, quý khách có thể đến khách sạn làm thủ tục nhận phòng ngay lập tức sau khi hoàn tất đặt phòng!</span>
                    ) : (
                      <span><strong>🕒 Đặt phòng hôm nay ({today}):</strong> Phòng sẽ sẵn sàng bàn giao từ 14:00 chiều nay. Quý khách có thể đến nhận phòng từ mốc 14:00!</span>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Users className="w-4 h-4 inline mr-1 text-blue-900" />Số người lớn</label>
                  <select value={adultsCount} onChange={e => setAdultsCount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none text-sm bg-white">
                    {Array.from({ length: room.capacity }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} người lớn</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Sparkles className="w-4 h-4 inline mr-1 text-amber-600" />Số trẻ em (dưới 12 tuổi)</label>
                  <select value={childrenCount} onChange={e => setChildrenCount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none text-sm bg-white font-medium">
                    <option value={0}>Không có trẻ em</option>
                    {Array.from({ length: maxChildrenPerRoomType[room.type] || 2 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} trẻ em (Tối đa {maxChildrenPerRoomType[room.type] || 2} trẻ)</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Hạng {roomTypeLabels[room.type] || room.type} cho phép tối đa {maxChildrenPerRoomType[room.type] || 2} trẻ em đi kèm.
                  </span>
                </div>
              </div>

              {/* Khai báo Người lớn đi kèm (Khách 2, 3...) khi adultsCount >= 2 */}
              {adultsCount >= 2 && (
                <div className="space-y-3 pt-2 bg-purple-50/60 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-700" /> Khai báo Người lớn đi kèm ({adultsCount - 1} khách)
                  </h3>
                  <p className="text-xs text-purple-700 font-medium">Vui lòng điền Họ và tên đầy đủ cho các người lớn đi cùng:</p>
                  
                  <div className="space-y-2.5">
                    {accompanyingGuests.map((guest, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-1">Họ và tên Khách {idx + 2} *</label>
                          <input
                            type="text"
                            placeholder="Nguyễn Văn B *"
                            value={guest.name}
                            onChange={e => {
                              const updated = [...accompanyingGuests];
                              updated[idx].name = e.target.value;
                              setAccompanyingGuests(updated);
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-1">Số CCCD / CMND (Không bắt buộc)</label>
                          <input
                            type="text"
                            placeholder="001099xxxxxx"
                            value={guest.idCard}
                            onChange={e => {
                              const updated = [...accompanyingGuests];
                              updated[idx].idCard = e.target.value;
                              setAccompanyingGuests(updated);
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khai báo Trẻ em đi kèm khi childrenCount > 0 */}
              {childrenCount > 0 && (
                <div className="space-y-3 pt-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" /> Khai báo thông tin Trẻ em đi kèm ({childrenCount} trẻ em)
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">Phục vụ thủ tục Tạm trú & Bảo đảm an toàn cho trẻ. Vui lòng khai báo Họ tên và Độ tuổi/Năm sinh:</p>
                  
                  <div className="space-y-2.5">
                    {childrenDetails.map((child, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-900 mb-1">Họ tên Trẻ em {idx + 1} *</label>
                          <input
                            type="text"
                            placeholder="Nguyễn Minh C *"
                            value={child.name}
                            onChange={e => {
                              const updated = [...childrenDetails];
                              updated[idx].name = e.target.value;
                              setChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-900 mb-1">Độ tuổi / Năm sinh *</label>
                          <input
                            type="text"
                            placeholder="6 tuổi hoặc 2018 *"
                            value={child.ageOrYear}
                            onChange={e => {
                              const updated = [...childrenDetails];
                              updated[idx].ageOrYear = e.target.value;
                              setChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-900 mb-1">Mối quan hệ *</label>
                          <select
                            value={child.relationship}
                            onChange={e => {
                              const updated = [...childrenDetails];
                              updated[idx].relationship = e.target.value;
                              setChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                          >
                            <option value="Con">Con</option>
                            <option value="Cháu">Cháu</option>
                            <option value="Họ hàng">Họ hàng</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {servicesList.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-sm font-medium text-gray-700"><Sparkles className="w-4 h-4 inline mr-1 text-blue-900" />Dịch vụ đi kèm (Tùy chọn)</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {servicesList.map(srv => {
                      const isChecked = selectedServices.some(s => s.id === srv.id);
                      return (
                        <label key={srv.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedServices(prev => prev.filter(s => s.id !== srv.id));
                              } else {
                                setSelectedServices(prev => [...prev, srv]);
                              }
                            }}
                            className="mt-1 accent-blue-900"
                          />
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{srv.name}</p>
                            {srv.description && <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{srv.description}</p>}
                            <p className="text-xs font-bold text-blue-900 mt-1">{formatPrice(srv.price)}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><FileText className="w-4 h-4 inline mr-1" />Ghi chú đặc biệt</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Yêu cầu đặc biệt (tầng cao, view đẹp, cần nôi trẻ em...)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none text-sm resize-none" />
              </div>
              <button onClick={handleStep1Proceed} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: "#1a3a5c" }}>Tiếp theo</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5" style={{ color: "#1a3a5c" }} /> Thông tin khách hàng</h2>
                {currentUser ? (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-500 text-xs">Họ tên</p><p className="font-medium">{currentUser.name}</p></div>
                    <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-500 text-xs">Email</p><p className="font-medium">{currentUser.email}</p></div>
                    <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-500 text-xs">Điện thoại</p><p className="font-medium">{currentUser.phone}</p></div>
                    <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-500 text-xs">CCCD</p><p className="font-medium">{currentUser.idNumber || "Chưa cập nhật"}</p></div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Họ và tên *</label>
                      <input required type="text" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1" placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
                      <input
                        required
                        type="email"
                        value={guestEmail}
                        onChange={e => {
                          const val = e.target.value;
                          setGuestEmail(val);
                          handleGuestEmailCheck(val);
                        }}
                        onBlur={e => handleGuestEmailCheck(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                        placeholder="email@gmail.com"
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
                                onClick={() => router.push(`/login?redirect=/customer/book/${id}`)}
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
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Số điện thoại *</label>
                      <input required type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1" placeholder="0901234567" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">CCCD / CMND *</label>
                      <input required type="text" value={guestCccd} onChange={e => setGuestCccd(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1" placeholder="079201001234" />
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" style={{ color: "#1a3a5c" }} /> Phương thức thanh toán</h2>
                
                {/* 🛡️ BANNER THÔNG BÁO HÀNG RÀO 1: BẮT BUỘC VNPAY VỚI ĐƠN ĐẶT XA (> 14 NGÀY) */}
                {(() => {
                  const todayObj = new Date();
                  todayObj.setHours(0, 0, 0, 0);
                  const checkInObj = new Date(checkIn);
                  checkInObj.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((checkInObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));
                  const isFarAdvance = diffDays > 14;
                  
                  return (
                    <>
                      {isFarAdvance && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm mb-4">
                          <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-950 mb-1">
                              Quy định Đặt phòng trước xa ({diffDays} ngày tới):
                            </p>
                            <p className="leading-relaxed text-amber-800">
                              Để đảm bảo không bị giữ phòng ảo, các đơn đặt phòng trước xa <strong>trên 14 ngày</strong> bắt buộc phải <strong>Thanh toán trực tuyến qua VNPay (Sandbox)</strong> để giữ phòng cố định 100%. Tùy chọn <em>Thanh toán tại quầy</em> không áp dụng cho đơn đặt xa.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {[
                          {
                            val: "counter",
                            label: "Thanh toán tại quầy",
                            desc: isFarAdvance
                              ? "Không áp dụng cho đơn đặt trước xa trên 14 ngày"
                              : "Thanh toán khi nhận phòng (Check-in trước 18:00)",
                            disabled: isFarAdvance,
                          },
                          {
                            val: "vnpay",
                            label: "Thanh toán VNPay (Sandbox)",
                            desc: "Bảo đảm và giữ phòng 100% tức thì",
                            disabled: false,
                          },
                        ].map(opt => {
                          const isSelected = payMethod === opt.val && !opt.disabled;
                          const isCurrentCounterDisabled = opt.disabled;
                          return (
                            <label
                              key={opt.val}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isCurrentCounterDisabled
                                  ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                                  : isSelected
                                  ? "border-blue-900 bg-blue-50/50 cursor-pointer"
                                  : "border-gray-200 cursor-pointer hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="pay"
                                value={opt.val}
                                disabled={opt.disabled}
                                checked={isFarAdvance ? opt.val === "vnpay" : payMethod === opt.val}
                                onChange={e => {
                                  if (!opt.disabled) setPayMethod(e.target.value);
                                }}
                                className="accent-blue-800"
                              />
                              <div>
                                <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                                  {opt.label}
                                  {opt.disabled && (
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-normal">
                                      Tạm khóa đối với đơn xa &gt; 14 ngày
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{opt.desc}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
              <button onClick={handleConfirm} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: "#1a3a5c" }}>
                Xác nhận đặt phòng
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Tóm tắt đặt phòng</h3>
            <img src={room.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />
            <p className="font-semibold text-gray-900">Phòng {room.number}</p>
            <p className="text-sm text-gray-500 mb-4">{roomTypeLabels[room.type]} · Tầng {room.floor}</p>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600"><span>Nhận phòng</span><span className="font-medium">{checkIn}</span></div>
              <div className="flex justify-between text-gray-600"><span>Trả phòng</span><span className="font-medium">{checkOut}</span></div>
              <div className="flex justify-between text-gray-600"><span>Số đêm</span><span className="font-medium">{nights} đêm</span></div>
              <div className="flex justify-between text-gray-600"><span>Giá/đêm</span><span className="font-medium">{formatPrice(room.pricePerNight)}</span></div>
              {appliedPromo && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Khuyến mãi ({appliedPromo.code})</span>
                  <span>-{formatPrice(appliedPromo.discountAmount)}</span>
                </div>
              )}
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between text-gray-600 text-xs">
                  <span>{s.name}</span>
                  <span className="font-medium text-blue-900">+{formatPrice(s.price)}</span>
                </div>
              ))}
            </div>

            {/* Promo input field */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-amber-600" /> Mã khuyến mãi
                </label>
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(true)}
                  className="text-[11px] text-blue-900 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 transition-colors"
                >
                  <Tag className="w-3 h-3 text-amber-500" /> Chọn Voucher ({AVAILABLE_PROMOTIONS.length})
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (Ví dụ: SUMMER2026)"
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 uppercase font-semibold text-blue-900"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:opacity-90"
                  style={{ background: "#1a3a5c" }}
                >
                  Áp dụng
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
              {appliedPromo && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <p className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Mã <strong>{appliedPromo.code}</strong>: {appliedPromo.description}</span>
                  </p>
                  <button
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoCode("");
                    }}
                    className="text-[10px] text-red-500 font-semibold underline hover:text-red-700"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="font-bold text-gray-900">Tổng cộng</span>
              <span className="font-bold text-lg" style={{ color: "#1a3a5c" }}>{formatPrice(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🎟️ MODAL GỢI Ý MÃ KHUYẾN MÃI / VOUCHER */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <h3 className="font-bold text-base">Danh sách Voucher & Mã Ưu Đãi</h3>
                  <p className="text-xs text-slate-300">Chọn mã khuyến mãi tốt nhất cho đơn đặt phòng của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
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

                return listToRender.map((item: any) => {
                  const isSelected = appliedPromo?.code === item.code;
                  return (
                    <div
                      key={item.code}
                      className={`p-4 rounded-xl border transition-all relative overflow-hidden bg-white shadow-xs ${
                        isSelected
                          ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      {/* Ticket notch decoration */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border-r border-gray-200" />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border-l border-gray-200" />

                      <div className="flex items-start justify-between gap-3 pl-2 pr-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.tagColor || "bg-blue-600 text-white"}`}>
                              {item.badge}
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.code}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 leading-snug pt-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {item.subtitle}
                          </p>
                          <p className="text-[11px] text-gray-400 pt-1">
                            Hạn sử dụng: <strong>{item.expiry}</strong>
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-center self-center gap-2">
                          {isSelected ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã dùng
                            </span>
                          ) : (
                            <button
                              onClick={() => handleQuickApplyPromo(item.code)}
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
              <span>💡 Mỗi đơn hàng áp dụng tối đa 1 mã ưu đãi</span>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
