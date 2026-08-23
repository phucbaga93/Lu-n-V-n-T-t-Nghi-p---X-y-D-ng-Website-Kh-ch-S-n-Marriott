"use client";

import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Search, Filter, Eye, CheckCircle, XCircle, X, RefreshCw, Calendar, BedDouble, ArrowLeftRight, Check, AlertTriangle, PlusCircle, User, CreditCard, DollarSign, Sparkles } from "lucide-react";
import { bookingStatusLabels, roomTypeLabels, formatPrice, formatDate, calcNights, BookingStatus, Booking, Room, getUserAssignedLocation } from "../../data/mockData";
import { api } from "../../data/api";

const categoryTiers: Record<string, number> = {
  standard: 1,
  deluxe: 2,
  suite: 3,
  family: 2,
};

function parseServicesFromNotes(notes: string) {
  if (!notes) return [];
  const services: { name: string; price: number }[] = [];
  const parts = notes.split("|");
  for (const part of parts) {
    if (part.includes("Dịch vụ thêm:") || part.includes("Dịch vụ:") || part.includes("Dịch vụ riêng:")) {
      const serviceStr = part.replace(/Dịch vụ thêm:|Dịch vụ:|Dịch vụ riêng:/g, "").trim();
      const items = serviceStr.split(/,\s*/);
      for (const item of items) {
        const match = item.match(/(.+?)\s*\(([\d.,]+)\s*[₫đVND]*\)/i);
        if (match) {
          const name = match[1].trim();
          const price = Number(match[2].replace(/[.,]/g, ""));
          services.push({ name, price });
        }
      }
    }
  }
  return services;
}

function renderBookingNotes(notes?: string) {
  if (!notes) return null;
  
  const parts = notes.split("|");
  const badges: React.ReactNode[] = [];
  let customText = "";
  
  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (trimmed.startsWith("[Tiền cọc:") && trimmed.endsWith("]")) {
      const match = trimmed.match(/\[Tiền cọc:\s*(\d+)đ\s*\((.*?)\)\]/i);
      if (match) {
        badges.push(
          <span key={`deposit-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            💰 Cọc: {formatPrice(Number(match[1]))} ({match[2]})
          </span>
        );
        return;
      }
    }
    
    if (trimmed.startsWith("[Tiền phòng đã thu:") && trimmed.endsWith("]")) {
      const match = trimmed.match(/\[Tiền phòng đã thu:\s*(\d+)đ\s*\((.*?)\)\]/i);
      if (match) {
        badges.push(
          <span key={`roompay-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            💵 Đã thu phòng: {formatPrice(Number(match[1]))} ({match[2]})
          </span>
        );
        return;
      }
    }

    if (trimmed.includes("Khai báo tạm trú:")) {
      // 🛡️ Bỏ qua không hiển thị badge thô dài dòng này trên giao diện thẻ phòng/danh sách
      return;
    }

    if (trimmed.includes("Dịch vụ thêm:")) {
      badges.push(
        <span key={`services-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          ⚡ {trimmed}
        </span>
      );
      return;
    }

    if (trimmed) {
      customText += (customText ? " | " : "") + trimmed;
    }
  });

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {badges}
      {customText && (
        <span className="text-xs text-gray-500 italic block w-full mt-0.5">
          📝 Yêu cầu: {customText}
        </span>
      )}
    </div>
  );
}

export default function BookingManagementPage() {
  const { bookings, rooms, updateBooking, fetchRooms, fetchBookings, adminCancelBooking, currentUser } = useApp();
  const locationInfo = getUserAssignedLocation(currentUser);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");
  const effectiveLocation = locationInfo.isGlobal ? selectedLocationFilter : locationInfo.location;

  const today = new Date().toISOString().split("T")[0];
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | BookingStatus>("all");
  const [detail, setDetail] = useState<string | null>(null);

  // Swap modal state
  const [swapBookingId, setSwapBookingId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [swapMode, setSwapMode] = useState<"internal" | "hotel_fault" | "upgrade">("internal");
  const [swapReason, setSwapReason] = useState("");
  const [customSurcharge, setCustomSurcharge] = useState<number | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);

  // Cancellation modal state
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [waivePenalty, setWaivePenalty] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // No-show booking state
  const [noShowBookingId, setNoShowBookingId] = useState<string | null>(null);
  const [noShowLoading, setNoShowLoading] = useState(false);

  // Edit dates modal state
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Print invoice modal state
  const [printBookingId, setPrintBookingId] = useState<string | null>(null);

  // Walk-in booking modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinEmail, setWalkinEmail] = useState("");
  const [walkinCccd, setWalkinCccd] = useState("");
  const [walkinCheckIn, setWalkinCheckIn] = useState(today);
  const [walkinCheckOut, setWalkinCheckOut] = useState(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().split("T")[0];
  });
  const [walkinSelectedRoomId, setWalkinSelectedRoomId] = useState("");
  const [walkinAdults, setWalkinAdults] = useState(1);
  const [walkinChildren, setWalkinChildren] = useState(0);
  const [walkinPaymentMethod, setWalkinPaymentMethod] = useState<"OFFLINE" | "VNPAY">("OFFLINE");
  const [walkinNotes, setWalkinNotes] = useState("");
  const [walkinLoading, setWalkinLoading] = useState(false);

  // States khai báo thông tin Khách đi kèm (Khách 2, 3...) & Trẻ em đi kèm cho Walk-in
  const [walkinAccompanyingGuests, setWalkinAccompanyingGuests] = useState<Array<{ name: string; idCard: string; phone: string }>>([]);
  const [walkinChildrenDetails, setWalkinChildrenDetails] = useState<Array<{ name: string; ageOrYear: string; relationship: string }>>([]);

  // Auto sync accompanying guests count when walkinAdults changes
  useEffect(() => {
    const needCount = Math.max(0, walkinAdults - 1);
    setWalkinAccompanyingGuests(prev => {
      if (prev.length === needCount) return prev;
      const next = [...prev];
      while (next.length < needCount) {
        next.push({ name: "", idCard: "", phone: "" });
      }
      return next.slice(0, needCount);
    });
  }, [walkinAdults]);

  // Auto sync children details count when walkinChildren changes
  useEffect(() => {
    const needCount = Math.max(0, walkinChildren);
    setWalkinChildrenDetails(prev => {
      if (prev.length === needCount) return prev;
      const next = [...prev];
      while (next.length < needCount) {
        next.push({ name: "", ageOrYear: "", relationship: "Con" });
      }
      return next.slice(0, needCount);
    });
  }, [walkinChildren]);

  // Real-time room availability fetching when dates or modal change
  const [realtimeRooms, setRealtimeRooms] = useState<Room[]>([]);
  const [loadingRealtimeRooms, setLoadingRealtimeRooms] = useState(false);

  useEffect(() => {
    if (!showWalkinModal) return;
    let isMounted = true;
    setLoadingRealtimeRooms(true);
    api.getRooms(walkinCheckIn, walkinCheckOut)
      .then(res => {
        if (isMounted) setRealtimeRooms(res);
      })
      .catch(err => console.error("Realtime room fetch error:", err))
      .finally(() => {
        if (isMounted) setLoadingRealtimeRooms(false);
      });
    return () => { isMounted = false; };
  }, [showWalkinModal, walkinCheckIn, walkinCheckOut]);

  // Combine rooms: use realtimeRooms if available, fallback to global rooms
  const roomsPool = realtimeRooms.length > 0 ? realtimeRooms : rooms;

  const availableRoomsForWalkin = roomsPool.filter(r => {
    if (r.status !== "available") return false;
    const hasOverlap = bookings.some(b => {
      if (b.roomId !== r.id) return false;
      if (b.status === "cancelled") return false;
      return b.checkIn < walkinCheckOut && b.checkOut > walkinCheckIn;
    });
    return !hasOverlap;
  });

  const selectedWalkinRoom = roomsPool.find(r => r.id === walkinSelectedRoomId);
  const walkinNights = calcNights(walkinCheckIn, walkinCheckOut) || 1;
  const walkinTotalPrice = selectedWalkinRoom ? selectedWalkinRoom.pricePerNight * walkinNights : 0;

  async function handleConfirmWalkin() {
    const trimmedName = walkinName.trim();
    if (!trimmedName) {
      alert("Vui lòng nhập Họ và tên đầy đủ của Khách hàng chính (Khách 1)!");
      return;
    }
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2 || trimmedName.length < 3 || /\d/.test(trimmedName)) {
      alert("Họ và tên của Khách hàng chính không hợp lệ! Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 2 từ, không chứa số).");
      return;
    }

    const trimmedPhone = walkinPhone.trim();
    if (!trimmedPhone || !/^[0-9]{10}$/.test(trimmedPhone)) {
      alert("Số điện thoại của Khách hàng chính không hợp lệ! Phải gồm đúng 10 chữ số (Ví dụ: 0912345678).");
      return;
    }

    const trimmedCccd = walkinCccd.trim();
    if (!trimmedCccd) {
      alert("Vui lòng nhập Số CCCD / CMND / Hộ chiếu của Khách hàng chính!");
      return;
    }
    const cccdValid = /^[0-9]{9,12}$/.test(trimmedCccd) || /^[A-Z0-9]{6,12}$/i.test(trimmedCccd);
    if (!cccdValid) {
      alert("Số CCCD / CMND / Hộ chiếu của Khách hàng chính không hợp lệ! Vui lòng nhập đúng 9 hoặc 12 số CCCD (hoặc mã Hộ chiếu).");
      return;
    }

    // 🛡️ BẮT BUỘC KHAI BÁO CHI TIẾT KHÁCH ĐI KÈM (KHÁCH 2, 3...) KHI SỐ NGƯỜI LỚN >= 2
    if (walkinAdults >= 2) {
      for (let i = 0; i < walkinAccompanyingGuests.length; i++) {
        const g = walkinAccompanyingGuests[i];
        const gName = g.name.trim();
        const gCccd = g.idCard.trim();
        const gPhone = g.phone.trim();

        if (!gName || !gCccd) {
          alert(`Vui lòng điền đầy đủ Họ và tên + Số CCCD/Hộ chiếu cho Khách đi kèm thứ ${i + 2}!`);
          return;
        }
        const gNameParts = gName.split(/\s+/).filter(Boolean);
        if (gNameParts.length < 2 || gName.length < 3 || /\d/.test(gName)) {
          alert(`Họ và tên của Khách đi kèm thứ ${i + 2} ("${gName}") không hợp lệ! Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 2 từ, không chứa số).`);
          return;
        }
        const gCccdValid = /^[0-9]{9,12}$/.test(gCccd) || /^[A-Z0-9]{6,12}$/i.test(gCccd);
        if (!gCccdValid) {
          alert(`Số CCCD/Hộ chiếu của Khách đi kèm thứ ${i + 2} ("${gCccd}") không hợp lệ! Vui lòng nhập đúng 9 hoặc 12 số CCCD.`);
          return;
        }
        if (gPhone && !/^[0-9]{10}$/.test(gPhone)) {
          alert(`Số điện thoại của Khách đi kèm thứ ${i + 2} ("${gPhone}") không hợp lệ! Phải gồm đúng 10 chữ số.`);
          return;
        }
      }
    }

    // 🛡️ BẮT BUỘC KHAI BÁO CHI TIẾT TRẺ EM KHI SỐ TRẺ EM > 0
    if (walkinChildren > 0) {
      for (let i = 0; i < walkinChildrenDetails.length; i++) {
        const c = walkinChildrenDetails[i];
        const cName = c.name.trim();
        const cAge = c.ageOrYear.trim();

        if (!cName || !cAge) {
          alert(`Vui lòng điền đầy đủ Họ tên và Độ tuổi/Năm sinh cho Trẻ em thứ ${i + 1}!`);
          return;
        }
      }
    }

    if (!walkinSelectedRoomId) {
      alert("Vui lòng chọn Phòng trống khả dụng!");
      return;
    }
    
    // 🛡️ BẢO VỆ QUY ĐỊNH CHÍNH SÁCH KHÁCH SẠN
    const todayStr = new Date().toISOString().split("T")[0];
    const maxDateObj = new Date();
    maxDateObj.setMonth(maxDateObj.getMonth() + 6);
    const maxDateStr = maxDateObj.toISOString().split("T")[0];

    if (walkinCheckIn < todayStr) {
      alert("Lỗi quy định: Ngày nhận phòng (Check-in) không được nằm trong quá khứ!");
      return;
    }
    if (walkinCheckIn > maxDateStr) {
      alert("Lỗi quy định: Khách sạn chỉ tiếp nhận đặt phòng trước tối đa 6 tháng!");
      return;
    }
    if (walkinCheckOut <= walkinCheckIn) {
      alert("Lỗi quy định: Ngày trả phòng (Check-out) phải sau ngày nhận phòng!");
      return;
    }
    if (walkinNights > 30) {
      alert("Lỗi quy định: Thời gian lưu trú tối đa cho một lần đặt phòng là 30 đêm!");
      return;
    }

    const checkInDate = new Date(walkinCheckIn);
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const diffDaysFromToday = Math.ceil((checkInDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));

    if ((diffDaysFromToday > 14 || walkinNights > 14) && walkinPaymentMethod === "OFFLINE") {
      alert("Lỗi quy định chính sách: Các đơn đặt trước trên 14 ngày hoặc lưu trú trên 14 đêm bắt buộc phải Thanh toán trực tuyến qua VNPay để giữ phòng cố định.");
      return;
    }

    // Ghép chuỗi thông tin tạm trú chi tiết đầy đủ cho tất cả hành khách
    let notesFormatted = `[Walk-in] | Khai báo tạm trú: [Khách 1: ${trimmedName} (CCCD: ${trimmedCccd}, SĐT: ${trimmedPhone})`;
    if (walkinAdults >= 2 && walkinAccompanyingGuests.length > 0) {
      const accList = walkinAccompanyingGuests.map((g, idx) => 
        `Khách ${idx + 2}: ${g.name.trim()} (CCCD: ${g.idCard.trim()}${g.phone ? `, SĐT: ${g.phone.trim()}` : ''})`
      ).join('; ');
      notesFormatted += `; ${accList}`;
    }
    notesFormatted += `]`;

    if (walkinChildren > 0 && walkinChildrenDetails.length > 0) {
      const childList = walkinChildrenDetails.map((c, idx) => 
        `Trẻ ${idx + 1}: ${c.name.trim()} (Tuổi/Năm sinh: ${c.ageOrYear.trim()}, Mối quan hệ: ${c.relationship || 'Con'})`
      ).join('; ');
      notesFormatted += ` | Trẻ em: [${childList}]`;
    }

    if (walkinNotes.trim()) {
      notesFormatted += ` | Ghi chú thêm: ${walkinNotes.trim()}`;
    }

    setWalkinLoading(true);
    try {
      await api.createWalkinBooking({
        ho_ten: trimmedName,
        so_dien_thoai: trimmedPhone,
        email: walkinEmail.trim() || undefined,
        so_cmnd: trimmedCccd,
        ngay_checkin: walkinCheckIn,
        ngay_checkout: walkinCheckOut,
        so_nguoi_lon: walkinAdults,
        so_tre_em: walkinChildren,
        room_id: Number(walkinSelectedRoomId),
        thanh_tien_cuoi: walkinTotalPrice,
        payment_method: walkinPaymentMethod,
        ghi_chu_dac_biet: notesFormatted,
      });

      alert(`✅ Đặt phòng tại quầy thành công!\nHình thức thanh toán: ${walkinPaymentMethod === 'OFFLINE' ? 'OFFLINE (Lễ tân thu tiền tại quầy)' : 'VNPAY (Chuyển khoản QR)'}`);
      setShowWalkinModal(false);
      setWalkinName("");
      setWalkinPhone("");
      setWalkinEmail("");
      setWalkinCccd("");
      setWalkinSelectedRoomId("");
      setWalkinNotes("");
      setWalkinAccompanyingGuests([]);
      setWalkinChildrenDetails([]);
      await fetchBookings();
      await fetchRooms();
    } catch (e: any) {
      alert(e.message || "Tạo đơn đặt phòng tại quầy thất bại.");
    } finally {
      setWalkinLoading(false);
    }
  }

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    if (q && !b.customerName.toLowerCase().includes(q) && !b.roomNumber.includes(q) && !b.id.includes(q)) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (effectiveLocation !== "all") {
      const roomObj = rooms.find(r => String(r.id) === String(b.roomId));
      const bookingLoc = roomObj ? roomObj.location : "TP. Hồ Chí Minh";
      if (bookingLoc !== effectiveLocation) return false;
    }
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
    pending: { bg: "#fef9c3", text: "#854d0e" },
    confirmed: { bg: "#dbeafe", text: "#1e40af" },
    checked_in: { bg: "#dcfce7", text: "#166534" },
    checked_out: { bg: "#f3f4f6", text: "#374151" },
    cancelled: { bg: "#fee2e2", text: "#991b1b" },
  };

  const detailBooking = bookings.find(b => b.id === detail);
  const swapBooking = bookings.find(b => b.id === swapBookingId);
  const cancelBooking = bookings.find(b => b.id === cancelBookingId);
  const noShowBooking = bookings.find(b => b.id === noShowBookingId);
  const editBooking = bookings.find(b => b.id === editBookingId);
  const printBooking = bookings.find(b => b.id === printBookingId);

  // Helpers for swap/upgrade logic
  const originalRoom = swapBooking ? rooms.find(r => r.id === swapBooking.roomId) : null;
  const currentRoomPrice = originalRoom ? originalRoom.pricePerNight : 0;

  // Filter vacant rooms of same or higher tier
  const eligibleRoomsForSwap = rooms.filter(r => {
    if (r.status !== "available") return false;
    if (!swapBooking) return false;
    if (r.id === swapBooking.roomId) return false;
    const currentTier = categoryTiers[swapBooking.roomType] || 1;
    const targetTier = categoryTiers[r.type] || 1;
    return targetTier >= currentTier;
  });

  // Calculate default surcharge
  function getRemainingNights(b: Booking) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(b.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    const diffTime = checkOutDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const remainingNights = swapBooking ? getRemainingNights(swapBooking) : 0;
  const priceDiffPerNight = selectedRoom ? Math.max(0, selectedRoom.pricePerNight - currentRoomPrice) : 0;
  const calculatedSurcharge = priceDiffPerNight * remainingNights;
  const finalSurcharge = customSurcharge !== null ? customSurcharge : calculatedSurcharge;

  // Perform room swap / upgrade api call
  async function handleConfirmSwap() {
    if (!swapBookingId || !selectedRoomId || !swapBooking) return;
    if (!swapBooking.chiTietId) {
      alert("Đặt phòng này thiếu thông tin mã chi tiết. Không thể đổi!");
      return;
    }
    if (!swapReason.trim()) {
      alert("Vui lòng nhập lý do đổi/nâng cấp phòng!");
      return;
    }

    setSwapLoading(true);
    try {
      const surcharge = (swapMode === "internal" || swapMode === "hotel_fault") ? 0 : finalSurcharge;
      const noteAppend = swapMode === "internal" 
        ? `Đổi phòng nội bộ sang Phòng ${selectedRoom?.number}. Lý do: ${swapReason}` 
        : swapMode === "hotel_fault"
        ? `Đổi phòng do lỗi khách sạn (Miễn phí bồi thường) sang Phòng ${selectedRoom?.number}. Lý do: ${swapReason}`
        : `Nâng cấp sang Phòng ${selectedRoom?.number}. Lý do: ${swapReason}. Phụ thu: ${formatPrice(surcharge)}`;

      const lyDoText = swapMode === "internal" 
        ? "Đổi phòng nội bộ" 
        : swapMode === "hotel_fault" 
        ? "Đổi phòng do lỗi khách sạn (miễn phí)" 
        : "Nâng cấp hạng phòng (khách trả phí)";

      // 1. Call change room endpoint
      await api.changeRoom(swapBookingId, {
        chi_tiet_dat_phong_id: swapBooking.chiTietId,
        phong_moi_id: Number(selectedRoomId),
        ly_do: lyDoText,
        phu_thu: surcharge,
      });

      // 2. Call update booking endpoint to append price and note
      await api.updateBooking(swapBookingId, {
        totalPrice: swapBooking.totalPrice + surcharge,
        notes: swapBooking.notes ? `${swapBooking.notes} | ${noteAppend}` : noteAppend,
      });

      alert("Đổi phòng/Nâng cấp phòng thành công!");
      setSwapBookingId(null);
      setSelectedRoomId("");
      setSwapReason("");
      setCustomSurcharge(null);
      await fetchRooms(); // refresh rooms status
    } catch (e: any) {
      alert(e.message || "Đổi phòng thất bại.");
    } finally {
      setSwapLoading(false);
    }
  }

  // Cancel with penalty waiver logic
  async function handleConfirmCancel() {
    if (!cancelBookingId || !cancelBooking) return;
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy đặt phòng!");
      return;
    }

    setCancelLoading(true);
    try {
      await adminCancelBooking(cancelBookingId, cancelReason, waivePenalty);
      alert("Hủy đặt phòng thành công!");
      setCancelBookingId(null);
      setCancelReason("");
      setWaivePenalty(false);
    } catch (e: any) {
      alert(e.message || "Hủy đặt phòng thất bại.");
    } finally {
      setCancelLoading(false);
    }
  }

  // Mark No-show
  async function handleConfirmNoShow() {
    if (!noShowBookingId || !noShowBooking) return;
    setNoShowLoading(true);
    try {
      const nights = calcNights(noShowBooking.checkIn, noShowBooking.checkOut) || 1;
      const oneNightPrice = noShowBooking.totalPrice / nights;
      const note = `Khách không đến (No-show). Phụ thu No-show 1 đêm: ${formatPrice(oneNightPrice)}`;

      await api.updateBooking(noShowBookingId, {
        status: "cancelled",
        totalPrice: oneNightPrice,
        notes: noShowBooking.notes ? `${noShowBooking.notes} | ${note}` : note,
      });

      alert("Xác nhận Khách không đến (No-show) thành công!");
      setNoShowBookingId(null);
      await fetchRooms();
    } catch (e: any) {
      alert(e.message || "Xác nhận No-show thất bại.");
    } finally {
      setNoShowLoading(false);
    }
  }

  // Edit check-in/out dates
  async function handleConfirmEditDates() {
    if (!editBookingId || !editBooking) return;
    if (!editCheckIn || !editCheckOut) {
      alert("Vui lòng chọn ngày nhận và trả phòng mới!");
      return;
    }
    const nights = calcNights(editCheckIn, editCheckOut);
    if (nights < 1 || nights > 30) {
      alert("Thời gian lưu trú phải từ 1 đến 30 đêm!");
      return;
    }

    const checkInDate = new Date(editCheckIn);
    checkInDate.setHours(0, 0, 0, 0);
    const maxLeadDate = new Date();
    maxLeadDate.setMonth(maxLeadDate.getMonth() + 6);
    maxLeadDate.setHours(23, 59, 59, 999);
    if (checkInDate > maxLeadDate) {
      alert("Chỉ được đặt hoặc đổi ngày lưu trú trước tối đa 6 tháng!");
      return;
    }

    setEditLoading(true);
    try {
      // Look up room base price
      const room = rooms.find(r => r.id === editBooking.roomId);
      const roomPrice = room ? room.pricePerNight : (editBooking.totalPrice / calcNights(editBooking.checkIn, editBooking.checkOut));
      const newPrice = roomPrice * nights;
      
      const note = `Admin điều chỉnh ngày: ${editBooking.checkIn} -> ${editCheckIn}, ${editBooking.checkOut} -> ${editCheckOut}. Tổng tiền phòng mới: ${formatPrice(newPrice)}`;

      await api.updateBooking(editBookingId, {
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        totalPrice: newPrice,
        notes: editBooking.notes ? `${editBooking.notes} | ${note}` : note,
      });

      alert("Cập nhật ngày lưu trú thành công!");
      setEditBookingId(null);
      await fetchRooms();
    } catch (e: any) {
      alert(e.message || "Cập nhật ngày lưu trú thất bại.");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div>
      {/* 📍 PHÂN QUYỀN VỊ TRÍ / CHI NHÁNH LỄ TÂN */}
      {locationInfo.isGlobal ? (
        <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>TÀI KHOẢN LỄ TÂN TỔNG / ADMIN ({currentUser?.name || "Lễ tân Tổng"}):</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
              🌐 Quyền xem Toàn bộ các Chi nhánh
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-slate-300 font-semibold">📍 Xem Chi nhánh:</label>
            <select
              value={selectedLocationFilter}
              onChange={e => setSelectedLocationFilter(e.target.value)}
              className="bg-slate-800 text-white text-xs font-bold border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">📍 Tất cả các chi nhánh (Toàn chuỗi)</option>
              <option value="TP. Hồ Chí Minh">🏢 TP. Hồ Chí Minh (SG)</option>
              <option value="Hà Nội">🏛️ Hà Nội (HN)</option>
              <option value="Đà Nẵng">🌊 Đà Nẵng (DN)</option>
              <option value="Phú Quốc">🏝️ Phú Quốc (PQ)</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-blue-900 text-white rounded-xl p-3.5 mb-5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Filter className="w-4 h-4 text-blue-300" />
            <span>LỄ TÂN CHI NHÁNH ({currentUser?.name}):</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              📍 Chi nhánh phụ trách: {locationInfo.location}
            </span>
          </div>
          <span className="text-[11px] text-blue-200 font-medium hidden sm:inline">
            Tự động lọc danh sách Đặt phòng thuộc chi nhánh {locationInfo.location}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đặt phòng</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} đặt phòng hiển thị ({bookings.length} tổng cộng)</p>
        </div>
        <button
          onClick={() => setShowWalkinModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Đặt phòng tại quầy (Walk-in)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, phòng, mã đặt..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
          <option value="all">Tất cả trạng thái</option>
          {(["pending", "confirmed", "checked_in", "checked_out", "cancelled"] as const).map(s => (
            <option key={s} value={s}>{bookingStatusLabels[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100" style={{ background: "#f8fafc" }}>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã đặt phòng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phòng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nhận phòng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trả phòng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tổng tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => {
                const sc = statusColors[b.status] || statusColors.pending;
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{b.id.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.customerName}</p>
                      <p className="text-xs text-gray-500">{b.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">Phòng {b.roomNumber}</p>
                      <p className="text-xs text-gray-500">{roomTypeLabels[b.roomType]}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(b.checkIn)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(b.checkOut)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{formatPrice(b.totalPrice)}</p>
                      {b.soTienDaCoc > 0 ? (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block mt-0.5">
                          Đã cọc: {formatPrice(b.soTienDaCoc)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Chưa cọc online</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>
                        {bookingStatusLabels[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setDetail(b.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                        {b.status === "pending" && (
                          <button onClick={() => updateBooking(b.id, { status: "confirmed" })} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Xác nhận đơn">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => setNoShowBookingId(b.id)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title="Khách không đến (No-Show)">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy đặt phòng nào</div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detail && detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">Chi tiết đặt phòng</h2>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Mã đặt phòng</p><p className="font-bold">#{detailBooking.id.toUpperCase()}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Trạng thái</p><p className="font-bold">{bookingStatusLabels[detailBooking.status]}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Khách hàng</p><p className="font-medium">{detailBooking.customerName}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Điện thoại</p><p className="font-medium">{detailBooking.customerPhone}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Phòng</p><p className="font-medium">Phòng {detailBooking.roomNumber} ({roomTypeLabels[detailBooking.roomType]})</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Số khách</p><p className="font-medium">{detailBooking.guests} người</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Nhận phòng</p><p className="font-medium">{formatDate(detailBooking.checkIn)}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Trả phòng</p><p className="font-medium">{formatDate(detailBooking.checkOut)}</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Số đêm</p><p className="font-medium">{calcNights(detailBooking.checkIn, detailBooking.checkOut)} đêm</p></div>
                <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-400">Tổng thanh toán</p><p className="font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(detailBooking.totalPrice)}</p></div>
                {detailBooking.soTienDaCoc > 0 && (
                  <>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200"><p className="text-xs text-amber-700 font-bold">Đã cọc online (VNPay)</p><p className="font-bold text-amber-800">{formatPrice(detailBooking.soTienDaCoc)} ({detailBooking.phanTramDatCoc}%)</p></div>
                    {detailBooking.status !== "cancelled" ? (
                      <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-gray-500">Còn lại phải thu tại quầy</p><p className="font-bold text-gray-800">{formatPrice(detailBooking.totalPrice - detailBooking.soTienDaCoc)}</p></div>
                    ) : (
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200"><p className="text-xs text-purple-700 font-bold">Xác nhận hoàn cọc</p><p className="font-bold text-purple-900">Hoàn tiền 100% cọc: {formatPrice(detailBooking.soTienDaCoc)}</p></div>
                    )}
                  </>
                )}
                <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-100 col-span-2">
                  <p className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                    👤 Lễ tân phụ trách / Xử lý check-in
                  </p>
                  <p className="font-bold text-blue-900 mt-0.5">
                    {detailBooking.staffName || "Lê Minh Hoàng (Lễ tân)"}
                  </p>
                </div>
                {detailBooking.notes && (
                  <div className="col-span-2 p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400">Ghi chú & Lịch sử đổi</p>
                    {renderBookingNotes(detailBooking.notes)}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t flex flex-wrap gap-2 justify-end bg-gray-50">
              {detailBooking.status === "pending" && (
                <button onClick={() => { updateBooking(detailBooking.id, { status: "confirmed" }); setDetail(null); }} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#22c55e" }}>Xác nhận đơn</button>
              )}
              {(detailBooking.status === "confirmed" || detailBooking.status === "checked_in") && (
                <button
                  onClick={() => {
                    setSwapBookingId(detailBooking.id);
                    setDetail(null);
                  }}
                  className="px-4 py-2 rounded-lg text-white text-sm bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Đổi / Nâng cấp phòng
                </button>
              )}
              {(detailBooking.status === "confirmed" || detailBooking.status === "pending") && (
                <button
                  onClick={() => {
                    setEditBookingId(detailBooking.id);
                    setEditCheckIn(detailBooking.checkIn);
                    setEditCheckOut(detailBooking.checkOut);
                    setDetail(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 flex items-center gap-1"
                >
                  <Calendar className="w-4 h-4" />
                  Đổi ngày
                </button>
              )}
              {(detailBooking.status === "pending" || detailBooking.status === "confirmed") && (
                <button onClick={() => { setCancelBookingId(detailBooking.id); setDetail(null); }} className="px-4 py-2 rounded-lg text-white text-sm bg-red-500 hover:bg-red-600">Hủy đơn đặt</button>
              )}
              <button
                onClick={() => {
                  setPrintBookingId(detailBooking.id);
                  setDetail(null);
                }}
                className="px-4 py-2 rounded-lg text-white text-sm bg-slate-700 hover:bg-slate-800"
              >
                In hóa đơn
              </button>
              <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Room swap / Upgrade modal */}
      {swapBookingId && swapBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Đổi / Nâng cấp phòng</h2>
                <p className="text-xs text-gray-500">Mã đơn: #{swapBooking.id.toUpperCase()} · Đang ở phòng {swapBooking.roomNumber} ({roomTypeLabels[swapBooking.roomType]})</p>
              </div>
              <button onClick={() => setSwapBookingId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              {/* Swap Mode selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Loại hình đổi phòng</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-all" style={swapMode === "internal" ? { borderColor: "#1a3a5c", background: "#f0f4f8" } : {}}>
                    <input type="radio" checked={swapMode === "internal"} onChange={() => setSwapMode("internal")} className="accent-blue-900 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800 text-xs">Nội bộ / Cùng hạng</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Giữ nguyên giá phòng. Sự cố kỹ thuật phòng cũ.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-all" style={swapMode === "hotel_fault" ? { borderColor: "#d97706", background: "#fffbeb" } : {}}>
                    <input type="radio" checked={swapMode === "hotel_fault"} onChange={() => setSwapMode("hotel_fault")} className="accent-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 text-xs">Lỗi từ Khách sạn</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">Nâng hạng miễn phí bồi thường cho khách (Phụ thu = 0đ).</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-all" style={swapMode === "upgrade" ? { borderColor: "#1a3a5c", background: "#f0f4f8" } : {}}>
                    <input type="radio" checked={swapMode === "upgrade"} onChange={() => setSwapMode("upgrade")} className="accent-blue-900 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800 text-xs">Khách tự Nâng cấp</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Theo nhu cầu khách. Tính chênh lệch giá phòng.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Select available rooms */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Chọn phòng trống có sẵn (Hạng phòng bằng hoặc cao hơn)</label>
                {eligibleRoomsForSwap.length === 0 ? (
                  <p className="text-red-500 text-xs italic bg-red-50 p-2.5 rounded-lg">Không có phòng trống nào phù hợp hoặc cùng hạng trở lên!</p>
                ) : (
                  <select
                    value={selectedRoomId}
                    onChange={e => {
                      setSelectedRoomId(e.target.value);
                      setCustomSurcharge(null); // Reset custom surcharge
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">-- Chọn phòng mới --</option>
                    {eligibleRoomsForSwap.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.number} - {roomTypeLabels[r.type]} (Tầng {r.floor} · {formatPrice(r.pricePerNight)}/đêm)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Banner cho trường hợp do lỗi Khách Sạn */}
              {swapMode === "hotel_fault" && selectedRoom && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1.5 text-xs text-amber-900">
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    🛡️ Chính sách bồi thường lỗi Khách Sạn (Miễn phí Phụ Thu)
                  </p>
                  <p className="leading-relaxed">
                    Khách sẽ được đổi từ phòng <strong>{swapBooking.roomNumber} ({roomTypeLabels[swapBooking.roomType]})</strong> sang phòng <strong>{selectedRoom.number} ({roomTypeLabels[selectedRoom.type]})</strong>.
                  </p>
                  <div className="flex justify-between items-center bg-white/80 p-2 rounded-lg border border-amber-200 text-[11px] font-semibold text-amber-900">
                    <span>Chênh lệch niêm yết: +{formatPrice(Math.max(0, selectedRoom.pricePerNight - currentRoomPrice))}/đêm</span>
                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Áp dụng: 0 VNĐ (Khách sạn chịu)</span>
                  </div>
                </div>
              )}

              {/* Financial Calculation (for upgrade) */}
              {swapMode === "upgrade" && selectedRoom && (
                <div className="bg-gray-50 border p-4 rounded-xl space-y-2">
                  <p className="font-bold text-gray-800 border-b pb-1.5 mb-2">Tính toán phụ thu nâng cấp</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giá phòng cũ:</span>
                    <span className="font-medium text-gray-900">{formatPrice(currentRoomPrice)}/đêm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giá phòng mới:</span>
                    <span className="font-medium text-gray-900">{formatPrice(selectedRoom.pricePerNight)}/đêm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Số đêm còn lại:</span>
                    <span className="font-medium text-gray-900">{remainingNights} đêm</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Phụ thu tự động:</span>
                    <span>+{formatPrice(calculatedSurcharge)}</span>
                  </div>
                  
                  {/* Custom Surcharge input */}
                  <div className="pt-2 border-t mt-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tùy chỉnh phụ thu thực tế (VND):</label>
                    <input
                      type="number"
                      placeholder={String(calculatedSurcharge)}
                      value={customSurcharge !== null ? customSurcharge : ""}
                      onChange={e => setCustomSurcharge(e.target.value ? Number(e.target.value) : null)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none w-full"
                    />
                  </div>
                </div>
              )}

              {/* Reason input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lý do thay đổi *</label>
                <textarea
                  value={swapReason}
                  onChange={e => setSwapReason(e.target.value)}
                  placeholder={swapMode === "internal" ? "Ví dụ: Điều hòa phòng cũ hỏng..." : "Ví dụ: Khách muốn nâng cấp lên phòng có ban công rộng..."}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  required
                />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3 bg-gray-50">
              <button onClick={() => setSwapBookingId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">Hủy bỏ</button>
              <button
                onClick={handleConfirmSwap}
                disabled={swapLoading || !selectedRoomId || !swapReason.trim()}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ background: "#1a3a5c" }}
              >
                {swapLoading ? "Đang xử lý..." : "Xác nhận đổi phòng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual cancellation modal */}
      {cancelBookingId && cancelBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hủy đơn đặt phòng
              </h2>
              <button onClick={() => setCancelBookingId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <p className="text-gray-600">
                Bạn đang thực hiện hủy đơn hàng <strong>#{cancelBooking.id.toUpperCase()}</strong> của khách <strong>{cancelBooking.customerName}</strong>.
              </p>

              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkInDate = new Date(cancelBooking.checkIn);
                checkInDate.setHours(0, 0, 0, 0);
                const diffTime = checkInDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 7) {
                  const nights = calcNights(cancelBooking.checkIn, cancelBooking.checkOut) || 1;
                  const oneNightPrice = cancelBooking.totalPrice / nights;
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl space-y-2">
                      <p className="font-semibold text-xs">⚠️ CẢNH BÁO: HỦY ĐẶT PHÒNG MUỘN</p>
                      <p className="text-[11px] leading-relaxed">
                        Thời gian hủy phòng còn lại là {diffDays} ngày (dưới 7 ngày trước check-in). 
                        Theo quy định, phụ thu tiền bằng giá trị đêm đầu tiên: <strong>{formatPrice(oneNightPrice)}</strong>.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer mt-1 pt-1.5 border-t border-red-200">
                        <input type="checkbox" checked={waivePenalty} onChange={e => setWaivePenalty(e.target.checked)} className="accent-red-600" />
                        <span className="font-bold text-xs">Miễn phụ thu tiền cho khách (Lý do bất khả kháng)</span>
                      </label>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                      <p className="font-semibold text-xs">✓ Hủy miễn phí</p>
                      <p className="text-[11px]">Hủy trước 7 ngày. Khách được hoàn trả lại 100% tiền đặt.</p>
                    </div>
                  );
                }
              })()}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lý do hủy đơn *</label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Vui lòng điền lý do chi tiết..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  required
                />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3 bg-gray-50">
              <button onClick={() => setCancelBookingId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">Hủy bỏ</button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelLoading || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-lg text-white text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {cancelLoading ? "Đang hủy..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No-show confirm modal */}
      {noShowBookingId && noShowBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Khách không đến (No-Show)
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Xác nhận khách <strong>{noShowBooking.customerName}</strong> không đến nhận phòng? 
              Đơn hàng sẽ chuyển sang trạng thái Hủy và áp dụng mức phụ thu bằng giá 1 đêm nghỉ đầu tiên.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setNoShowBookingId(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm">Hủy bỏ</button>
              <button
                onClick={handleConfirmNoShow}
                disabled={noShowLoading}
                className="flex-1 py-2 rounded-lg text-white text-sm bg-amber-600 hover:bg-amber-700 font-medium"
              >
                {noShowLoading ? "Đang xử lý..." : "Xác nhận No-show"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dates modal */}
      {editBookingId && editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">Thay đổi ngày lưu trú</h2>
              <button onClick={() => setEditBookingId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <p className="text-gray-500 text-xs">
                Mã đơn: #{editBooking.id.toUpperCase()} · Phòng: {editBooking.roomNumber}
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ngày nhận phòng mới</label>
                <input
                  type="date"
                  value={editCheckIn}
                  min={today}
                  max={maxDate}
                  onChange={e => setEditCheckIn(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ngày trả phòng mới</label>
                <input
                  type="date"
                  value={editCheckOut}
                  min={editCheckIn || today}
                  max={maxDate}
                  onChange={e => setEditCheckOut(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3 bg-gray-50">
              <button onClick={() => setEditBookingId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">Hủy</button>
              <button
                onClick={handleConfirmEditDates}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ background: "#1a3a5c" }}
              >
                {editLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print invoice modal */}
      {printBookingId && printBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:static">
          {/* Printable style block */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #invoice-print-area, #invoice-print-area * {
                visibility: visible !important;
              }
              #invoice-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                padding: 20px !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full print:rounded-none flex flex-col max-h-[90vh] print:max-h-none">
            {/* Modal Header - Hidden in Print */}
            <div className="flex items-center justify-between p-5 border-b print:hidden bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Xem trước hóa đơn thanh toán</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg text-white text-xs bg-blue-900 hover:bg-blue-800 font-bold"
                >
                  In hóa đơn (Ctrl + P)
                </button>
                <button
                  onClick={() => setPrintBookingId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-xs bg-white hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Scrollable container for preview on screen, no scroll on print */}
            <div className="p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0 text-black bg-white" id="invoice-print-area">
              {/* Hotel Header */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-wider">Marriott Hotel</h1>
                  <p className="text-[10px] text-gray-400 mt-0.5">Trải nghiệm đẳng cấp 5 sao quốc tế</p>
                  <p className="text-[10px] text-gray-500 mt-1">Địa chỉ: Hệ thống chi nhánh toàn quốc (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc)</p>
                  <p className="text-[10px] text-gray-500">Hotline: 0902 222 222 | Email: support@marriott.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Hóa Đơn Thanh Toán</h2>
                  <p className="text-xs text-gray-500 mt-1">Mã đặt phòng: <strong className="text-gray-900">#{printBooking.id.toUpperCase()}</strong></p>
                  <p className="text-[10px] text-gray-400">Ngày lập: {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN")}</p>
                </div>
              </div>

              {/* Guest and Booking Info */}
              <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-gray-100 print:bg-transparent print:border-none print:p-0">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Thông tin người đặt</p>
                  <p className="font-bold text-gray-900">{printBooking.customerName}</p>
                  <p className="text-gray-600 mt-1">Số điện thoại: {printBooking.customerPhone}</p>
                  <p className="text-gray-600">Email: {printBooking.customerEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Chi tiết phòng lưu trú</p>
                  <p className="font-bold text-gray-900">Phòng {printBooking.roomNumber} ({roomTypeLabels[printBooking.roomType] || printBooking.roomType})</p>
                  <p className="text-gray-600 mt-1">Nhận phòng: {formatDate(printBooking.checkIn)} (14:00)</p>
                  <p className="text-gray-600">Trả phòng: {formatDate(printBooking.checkOut)} (12:00)</p>
                  <p className="text-gray-600">Số đêm: {calcNights(printBooking.checkIn, printBooking.checkOut)} đêm | Số khách: {printBooking.guests} người</p>
                </div>
              </div>

              {/* Charges details */}
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Chi tiết dịch vụ & tiền phòng</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-gray-500 bg-slate-100/50 print:bg-transparent">
                      <th className="text-left py-2 px-3">Nội dung thanh toán</th>
                      <th className="text-center py-2">Đơn giá / Đêm</th>
                      <th className="text-center py-2">Số lượng</th>
                      <th className="text-right py-2 px-3">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Room charge */}
                    <tr>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-gray-800">Tiền thuê phòng nghỉ</p>
                        <p className="text-[9px] text-gray-400">Phòng {printBooking.roomNumber} · {calcNights(printBooking.checkIn, printBooking.checkOut)} đêm</p>
                      </td>
                      <td className="text-center py-2.5">{formatPrice((printBooking.tongTienPhong || printBooking.totalPrice) / (calcNights(printBooking.checkIn, printBooking.checkOut) || 1))}</td>
                      <td className="text-center py-2.5">{calcNights(printBooking.checkIn, printBooking.checkOut)}</td>
                      <td className="text-right py-2.5 px-3 font-bold text-gray-900">{formatPrice(printBooking.tongTienPhong || printBooking.totalPrice)}</td>
                    </tr>

                    {/* Services */}
                    {(() => {
                      const services = parseServicesFromNotes(printBooking.notes);
                      return services.map((srv, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-gray-800">{srv.name}</p>
                            <p className="text-[9px] text-gray-400">Dịch vụ gia tăng tại khách sạn</p>
                          </td>
                          <td className="text-center py-2.5">{formatPrice(srv.price)}</td>
                          <td className="text-center py-2.5">1</td>
                          <td className="text-right py-2.5 px-3 font-bold text-gray-900">{formatPrice(srv.price)}</td>
                        </tr>
                      ));
                    })()}

                    {/* Late checkout surcharge if present */}
                    {(() => {
                      const isLate = printBooking.notes?.includes("Phụ thu checkout muộn");
                      if (!isLate) return null;
                      
                      const match = printBooking.notes.match(/Phụ thu checkout muộn:\s*\+([\d.,]+)/i);
                      const amount = match ? Number(match[1].replace(/[.,]/g, "")) : 0;
                      
                      return amount > 0 ? (
                        <tr>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-gray-800">Phụ thu trả phòng muộn</p>
                            <p className="text-[9px] text-gray-400">Lưu trú ngoài giờ check-out tiêu chuẩn</p>
                          </td>
                          <td className="text-center py-2.5">{formatPrice(amount)}</td>
                          <td className="text-center py-2.5">1</td>
                          <td className="text-right py-2.5 px-3 font-bold text-gray-900">+{formatPrice(amount)}</td>
                        </tr>
                      ) : null;
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Total calculations */}
              <div className="border-t pt-4 flex flex-col items-end space-y-1.5 text-xs">
                {(() => {
                  const services = parseServicesFromNotes(printBooking.notes);
                  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);
                  const baseRoomCharge = printBooking.tongTienPhong || printBooking.totalPrice;
                  
                  const match = printBooking.notes?.match(/Phụ thu checkout muộn:\s*\+([\d.,]+)/i);
                  const lateSurcharge = match ? Number(match[1].replace(/[.,]/g, "")) : 0;
                  
                  const calculatedSubtotal = baseRoomCharge + servicesTotal + lateSurcharge;
                  const discount = Math.max(0, calculatedSubtotal - printBooking.totalPrice);

                  return (
                    <div className="w-72 space-y-1.5">
                      <div className="flex justify-between text-gray-500">
                        <span>Tiền dịch vụ phát sinh:</span>
                        <span>{formatPrice(servicesTotal + lateSurcharge)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Mã giảm giá áp dụng:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-900">
                        <span>Tổng số tiền thu thực tế:</span>
                        <span className="text-blue-900 text-base">{formatPrice(printBooking.totalPrice)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-dashed text-xs mt-6">
                <div>
                  <p className="font-semibold text-gray-600 uppercase tracking-wide">Người nộp tiền (Khách hàng)</p>
                  <p className="text-[9px] text-gray-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-gray-800">{printBooking.customerName}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 uppercase tracking-wide">Người lập hóa đơn (Thủ quỹ)</p>
                  <p className="text-[9px] text-gray-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-gray-800">Lễ tân Marriott Hotel</p>
                </div>
              </div>

              {/* Footer text */}
              <div className="text-center text-[10px] text-gray-400 pt-8 border-t">
                <p>Cảm ơn Quý khách đã lựa chọn dịch vụ của Marriott Hotel!</p>
                <p>Chúc Quý khách thượng lộ bình an và rất hân hạnh được phục vụ Quý khách lần sau.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Walk-in Booking Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="font-bold text-lg leading-snug">Tạo đơn đặt phòng trực tiếp tại quầy (Walk-in)</h2>
                  <p className="text-xs text-slate-300">Dành cho Lễ tân tiếp đón khách offline đến gặp trực tiếp tại quầy</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Thông tin Khách hàng */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 1. Thông tin Khách hàng (Walk-in)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên khách hàng *</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={walkinName}
                      onChange={e => setWalkinName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="text"
                      placeholder="0912345678"
                      value={walkinPhone}
                      onChange={e => setWalkinPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số CCCD / CMND</label>
                    <input
                      type="text"
                      placeholder="001099xxxxxx"
                      value={walkinCccd}
                      onChange={e => setWalkinCccd(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email (Không bắt buộc)</label>
                    <input
                      type="email"
                      placeholder="khach@gmail.com"
                      value={walkinEmail}
                      onChange={e => setWalkinEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Thời gian & Khách */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 2. Thời gian lưu trú & Số lượng khách
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ngày nhận phòng (Check-in)</label>
                    <input
                      type="date"
                      value={walkinCheckIn}
                      min={today}
                      max={maxDate}
                      onChange={e => setWalkinCheckIn(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ngày trả phòng (Check-out)</label>
                    <input
                      type="date"
                      value={walkinCheckOut}
                      min={walkinCheckIn || today}
                      max={maxDate}
                      onChange={e => setWalkinCheckOut(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số người lớn</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={walkinAdults}
                      onChange={e => setWalkinAdults(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số trẻ em</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={walkinChildren}
                      onChange={e => setWalkinChildren(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Khai báo Khách đi kèm (Khách 2, 3...) khi Số người lớn >= 2 */}
              {walkinAdults >= 2 && (
                <div className="space-y-3 pt-3 border-t bg-purple-50/50 p-4 rounded-xl border border-purple-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-purple-700" /> 👥 Khai báo thông tin Khách đi kèm (Yêu cầu bắt buộc)
                    </h3>
                    <span className="text-[11px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">
                      {walkinAdults - 1} khách đi kèm
                    </span>
                  </div>
                  <p className="text-xs text-purple-700 font-medium">
                    Đơn phòng gồm {walkinAdults} người lớn. Vui lòng khai báo đầy đủ Họ tên và CCCD cho {walkinAdults - 1} khách đi kèm:
                  </p>
                  
                  <div className="space-y-3">
                    {walkinAccompanyingGuests.map((guest, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200 space-y-2.5 shadow-xs">
                        <p className="font-bold text-xs text-purple-900 flex items-center gap-1">
                          👤 Khách đi kèm thứ {idx + 2} *
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Họ và tên đầy đủ (Ví dụ: Nguyễn Văn B) *"
                            value={guest.name}
                            onChange={e => {
                              const updated = [...walkinAccompanyingGuests];
                              updated[idx].name = e.target.value;
                              setWalkinAccompanyingGuests(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                          <input
                            type="text"
                            placeholder="Số CCCD / CMND / Hộ chiếu *"
                            value={guest.idCard}
                            onChange={e => {
                              const updated = [...walkinAccompanyingGuests];
                              updated[idx].idCard = e.target.value;
                              setWalkinAccompanyingGuests(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                          <input
                            type="text"
                            placeholder="SĐT (Không bắt buộc)"
                            value={guest.phone}
                            onChange={e => {
                              const updated = [...walkinAccompanyingGuests];
                              updated[idx].phone = e.target.value;
                              setWalkinAccompanyingGuests(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khai báo Trẻ em đi kèm khi Số trẻ em > 0 */}
              {walkinChildren > 0 && (
                <div className="space-y-3 pt-3 border-t bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" /> 👶 Khai báo thông tin Trẻ em đi kèm (Yêu cầu)
                    </h3>
                    <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      {walkinChildren} trẻ em
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    Vui lòng khai báo Họ tên, Độ tuổi/Năm sinh và Mối quan hệ cho {walkinChildren} trẻ em đi kèm:
                  </p>
                  
                  <div className="space-y-3">
                    {walkinChildrenDetails.map((child, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200 space-y-2.5 shadow-xs">
                        <p className="font-bold text-xs text-amber-900 flex items-center gap-1">
                          👶 Trẻ em thứ {idx + 1} *
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Họ và tên trẻ em (Ví dụ: Nguyễn Minh C) *"
                            value={child.name}
                            onChange={e => {
                              const updated = [...walkinChildrenDetails];
                              updated[idx].name = e.target.value;
                              setWalkinChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                          />
                          <input
                            type="text"
                            placeholder="Độ tuổi / Năm sinh (Ví dụ: 6 tuổi hoặc 2018) *"
                            value={child.ageOrYear}
                            onChange={e => {
                              const updated = [...walkinChildrenDetails];
                              updated[idx].ageOrYear = e.target.value;
                              setWalkinChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                          />
                          <select
                            value={child.relationship}
                            onChange={e => {
                              const updated = [...walkinChildrenDetails];
                              updated[idx].relationship = e.target.value;
                              setWalkinChildrenDetails(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                          >
                            <option value="Con">Mối quan hệ: Con</option>
                            <option value="Cháu">Mối quan hệ: Cháu</option>
                            <option value="Họ hàng">Mối quan hệ: Họ hàng</option>
                            <option value="Khác">Mối quan hệ: Khác</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chọn phòng trống */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" /> 3. Chọn phòng trống khả dụng *
                </h3>
                {loadingRealtimeRooms ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
                    <span>Đang kiểm tra và tải danh sách phòng trống khả dụng theo thời gian thực (Real-time)...</span>
                  </div>
                ) : availableRoomsForWalkin.length > 0 ? (
                  <select
                    value={walkinSelectedRoomId}
                    onChange={e => setWalkinSelectedRoomId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="">-- Chọn phòng trống --</option>
                    {availableRoomsForWalkin.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.number} ({roomTypeLabels[r.type]} - Tầng {r.floor || 1}) — {formatPrice(r.pricePerNight)}/đêm
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    ⚠️ Không có phòng trống khả dụng trong khoảng thời gian đã chọn! Vui lòng điều chỉnh ngày check-in/check-out.
                  </div>
                )}
              </div>

              {/* Hình thức thanh toán */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> 4. Phương thức thanh toán (CSDL quy định VNPAY & OFFLINE)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      walkinPaymentMethod === "OFFLINE"
                        ? "border-blue-900 bg-blue-50/70 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="walkinPay"
                      checked={walkinPaymentMethod === "OFFLINE"}
                      onChange={() => setWalkinPaymentMethod("OFFLINE")}
                      className="mt-1 text-blue-900"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">🏢 OFFLINE (Trực tiếp tại quầy)</p>
                      <p className="text-xs text-gray-500 mt-0.5">Khách trả tiền mặt/quẹt thẻ - Lễ tân trực tiếp thu giữ và chịu trách nhiệm.</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      walkinPaymentMethod === "VNPAY"
                        ? "border-blue-900 bg-blue-50/70 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="walkinPay"
                      checked={walkinPaymentMethod === "VNPAY"}
                      onChange={() => setWalkinPaymentMethod("VNPAY")}
                      className="mt-1 text-blue-900"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">💳 VNPAY (Chuyển khoản QR)</p>
                      <p className="text-xs text-gray-500 mt-0.5">Khách quét mã VNPay QR trực tiếp tại quầy thanh toán trực tuyến.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú thêm (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khách lấy phòng góc quiet, thanh toán tiền mặt đủ..."
                  value={walkinNotes}
                  onChange={e => setWalkinNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              {/* Tổng tiền thu */}
              {selectedWalkinRoom && (
                <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
                  <div>
                    <p className="text-xs text-slate-300">Tổng chi phí thanh toán ({walkinNights} đêm):</p>
                    <p className="text-xs text-amber-400 font-medium">
                      Phòng {selectedWalkinRoom.number} ({formatPrice(selectedWalkinRoom.pricePerNight)}/đêm)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-400">{formatPrice(walkinTotalPrice)}</p>
                    <p className="text-[10px] text-slate-300">
                      Hình thức: <span className="font-bold underline">{walkinPaymentMethod === 'OFFLINE' ? 'OFFLINE (Lễ tân thu)' : 'VNPAY'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowWalkinModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmWalkin}
                disabled={walkinLoading || !walkinSelectedRoomId}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {walkinLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Xác nhận đặt phòng tại quầy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
