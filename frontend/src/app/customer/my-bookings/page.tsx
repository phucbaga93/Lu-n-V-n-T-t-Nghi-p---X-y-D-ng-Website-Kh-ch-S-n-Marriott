"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { BookOpen, Calendar, BedDouble, XCircle, ChevronDown, ChevronUp, Star, MessageSquarePlus, Wrench, ArrowUpCircle, Sparkles, AlertCircle, CheckCircle2, Clock, X } from "lucide-react";
import { roomTypeLabels, bookingStatusLabels, formatPrice, formatDate, calcNights } from "../../data/mockData";
import { api } from "../../data/api";

export default function MyBookingsPage() {
  const { bookings, currentUser, cancelBooking, submitReview, updateBooking } = useApp();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Request / Complaint state
  const [requestBooking, setRequestBooking] = useState<any | null>(null);
  const [requestType, setRequestType] = useState<"room_issue" | "upgrade" | "service" | "complaint" | "">("room_issue");
  const [requestContent, setRequestContent] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Late Check-in Note state
  const [lateCheckinBooking, setLateCheckinBooking] = useState<any | null>(null);
  const [lateCheckinNote, setLateCheckinNote] = useState("");
  const [lateCheckinLoading, setLateCheckinLoading] = useState(false);

  async function handleSaveLateCheckinNote() {
    if (!lateCheckinBooking || !lateCheckinNote.trim()) return;
    setLateCheckinLoading(true);
    try {
      const originalNotes = lateCheckinBooking.notes || "";
      const noteContent = `[Khách báo Check-in muộn: ${lateCheckinNote.trim()}]`;
      const updatedNotes = originalNotes
        ? `${originalNotes} | ${noteContent}`
        : noteContent;
      await updateBooking(lateCheckinBooking.id, { notes: updatedNotes });
      alert("✅ Đã gửi lời nhắn Check-in muộn tới Lễ tân Marriott Hotel thành công! Lễ tân sẽ cập nhật sơ đồ giữ phòng cho bạn.");
      setLateCheckinBooking(null);
      setLateCheckinNote("");
    } catch (err: any) {
      alert(err.message || "Gửi lời nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setLateCheckinLoading(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewLoading(true);
    setReviewError("");
    
    let loai_phong_id = (reviewBooking as any).loai_phong_id || 1;
    if (reviewBooking.roomType === "superior") loai_phong_id = 2;
    else if (reviewBooking.roomType === "deluxe") loai_phong_id = 3;
    else if (reviewBooking.roomType === "suite") loai_phong_id = 4;
    else if (reviewBooking.roomType === "family") loai_phong_id = 5;
    
    try {
      await submitReview({
        customerId: reviewBooking.customerId,
        roomTypeId: loai_phong_id,
        stars: reviewStars,
        comment: reviewComment,
      });
      alert("Cảm ơn bạn đã gửi đánh giá trải nghiệm!");
      setReviewBooking(null);
      setReviewComment("");
      setReviewStars(5);
    } catch (err: any) {
      setReviewError(err.message || "Gửi đánh giá thất bại.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!requestBooking || !requestType || !requestContent.trim()) return;
    setRequestLoading(true);
    const typeLabels: Record<string, string> = {
      room_issue: "Sự cố phòng",
      upgrade: "Yêu cầu nâng cấp phòng",
      service: "Yêu cầu dịch vụ đặc biệt",
      complaint: "Khiếu nại / Góp ý",
    };
    const tag = `[REQUEST:${requestType}:${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}] ${typeLabels[requestType]}: ${requestContent.trim()}`;
    try {
      const currentNotes = requestBooking.notes || "";
      await api.updateBooking(requestBooking.id, {
        notes: currentNotes ? `${currentNotes} | ${tag}` : tag,
      } as any);
      setRequestSent(true);
    } catch (err: any) {
      alert("Gửi yêu cầu thất bại: " + (err.message || "Lỗi kết nối."));
    } finally {
      setRequestLoading(false);
    }
  }

  function getGroupedCustomerBookings(list: any[]) {
    const parseTimestamp = (dateStr?: string) => {
      if (!dateStr) return 0;
      const clean = dateStr.replace(" ", "T");
      const t = new Date(clean).getTime();
      return isNaN(t) ? 0 : t;
    };

    const cartMap = new Map<string, any[]>();
    const unmapped: any[] = [];

    for (const b of list) {
      let cartTag = "";
      if (b.notes && b.notes.includes("[MaGioHang: GH")) {
        const match = b.notes.match(/\[MaGioHang:\s*(GH\d+)\]/i);
        if (match) cartTag = match[1];
      }

      if (cartTag) {
        if (!cartMap.has(cartTag)) cartMap.set(cartTag, []);
        cartMap.get(cartTag)!.push(b);
      } else {
        unmapped.push(b);
      }
    }

    const timeGroupedMap = new Map<string, any[]>();
    for (const b of unmapped) {
      const email = (b.customerEmail || "").toLowerCase().trim();
      const phone = (b.customerPhone || "").trim();
      const createdTime = parseTimestamp(b.createdAtFull || b.createdAt);
      let placedInExistingGroup = false;

      if (email || phone) {
        for (const [key, items] of timeGroupedMap.entries()) {
          const firstItem = items[0];
          const firstEmail = (firstItem.customerEmail || "").toLowerCase().trim();
          const firstPhone = (firstItem.customerPhone || "").trim();
          const firstTime = parseTimestamp(firstItem.createdAtFull || firstItem.createdAt);

          const sameCustomer = (email && email === firstEmail) || (phone && phone === firstPhone);
          const sameStayPeriod = (b.checkIn === firstItem.checkIn) && (b.checkOut === firstItem.checkOut);
          const sameSessionTime = createdTime > 0 && firstTime > 0 && Math.abs(createdTime - firstTime) <= 120000;

          if (sameCustomer && sameStayPeriod && sameSessionTime) {
            items.push(b);
            placedInExistingGroup = true;
            break;
          }
        }
      }

      if (!placedInExistingGroup) {
        const uniqueKey = `SINGLE_${b.id}_${createdTime}`;
        timeGroupedMap.set(uniqueKey, [b]);
      }
    }

    const finalGroupMap = new Map<string, any[]>();
    cartMap.forEach((val, k) => finalGroupMap.set(k, val));
    timeGroupedMap.forEach((val, k) => finalGroupMap.set(k, val));

    const groups: {
      key: string;
      isMulti: boolean;
      primary: any;
      bookings: any[];
      activeBookings: any[];
      cancelledBookings: any[];
      initialTotalPrice: number;
      initialTotalDeposit: number;
      activeTotalPrice: number;
      activeTotalDeposit: number;
      activeRemaining: number;
      cancelledTotalDeposit: number;
    }[] = [];

    finalGroupMap.forEach((items, key) => {
      const primary = items[0];
      const activeBookings = items.filter(b => b.status !== "cancelled");
      const cancelledBookings = items.filter(b => b.status === "cancelled");
      const isMulti = items.length > 1;

      groups.push({
        key,
        isMulti,
        primary,
        bookings: items,
        activeBookings,
        cancelledBookings,
        initialTotalPrice: items.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        initialTotalDeposit: items.reduce((sum, b) => sum + (b.soTienDaCoc || 0), 0),
        activeTotalPrice: activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        activeTotalDeposit: activeBookings.reduce((sum, b) => sum + (b.soTienDaCoc || 0), 0),
        activeRemaining: Math.max(0, activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) - activeBookings.reduce((sum, b) => sum + (b.soTienDaCoc || 0), 0)),
        cancelledTotalDeposit: cancelledBookings.reduce((sum, b) => sum + (b.soTienDaCoc || 0), 0),
      });
    });

    return groups;
  }

  const myBookings = bookings.filter(b => b.customerId === currentUser?.id);
  const groupedBookings = getGroupedCustomerBookings(myBookings);
  const filteredGroups = groupedBookings.filter(grp => {
    if (filterStatus === "all") return true;
    return grp.bookings.some(b => b.status === filterStatus);
  });

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#fef9c3", text: "#854d0e" },
    confirmed: { bg: "#dbeafe", text: "#1e40af" },
    checked_in: { bg: "#dcfce7", text: "#166534" },
    checked_out: { bg: "#f3f4f6", text: "#374151" },
    cancelled: { bg: "#fee2e2", text: "#991b1b" },
  };

  function getCancellationInfo(booking: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function calculateCustomerSurcharge(booking: any) {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(23, 59, 59, 999);
    
    const isLateDate = now.getTime() > checkOutDate.getTime();
    const isCheckoutDay = now.toISOString().split("T")[0] === booking.checkOut;
    
    let surchargePct = 0;
    let lateType = "";
    
    if (isCheckoutDay) {
      if (currentHour >= 12 && currentHour < 15) {
        surchargePct = 30;
        lateType = "Trễ check-out dưới 3 tiếng (12:00 - 15:00)";
      } else if (currentHour >= 15 && currentHour < 18) {
        surchargePct = 50;
        lateType = "Trễ check-out 3 - 6 tiếng (15:00 - 18:00)";
      } else if (currentHour >= 18) {
        surchargePct = 100;
        lateType = "Trễ check-out trên 6 tiếng (sau 18:00)";
      }
    } else if (isLateDate) {
      surchargePct = 100;
      lateType = "Trễ trả phòng quá ngày quy định (> 1 ngày)";
    }
    
    const nights = calcNights(booking.checkIn, booking.checkOut) || 1;
    const roomCharge = booking.tongTienPhong || booking.totalPrice;
    const pricePerNight = roomCharge / nights;
    const surchargeAmount = (pricePerNight * surchargePct) / 100;
    
    return {
      surchargePct,
      surchargeAmount,
      lateType,
      isLate: surchargePct > 0
    };
  }

  function renderCustomerNotes(notes?: string) {
    if (!notes) return null;
    const parts = notes.split("|");
    const userNotes: string[] = [];
    const requestItems: React.ReactNode[] = [];

    parts.forEach((part, i) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("[REQUEST:")) {
        const typeMatch = trimmed.match(/\[REQUEST:(\w+):([^\]]+)\]\s*(.+)$/);
        if (typeMatch) {
          const [, type, time, content] = typeMatch;
          requestItems.push(
            <div key={`req-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
              <span>💬 Yêu cầu đã gửi ({time}):</span>
              <strong className="font-semibold">{content}</strong>
            </div>
          );
        }
        return;
      }

      // Hide RESOLVED internal staff notes completely from customer view
      if (trimmed.startsWith("[RESOLVED:")) {
        return;
      }

      // Filter out internal system logs from customer view
      if (
        trimmed.startsWith("[Tiền cọc:") ||
        trimmed.startsWith("[Tiền phòng đã thu:") ||
        trimmed.includes("Khai báo tạm trú:") ||
        trimmed.includes("Đổi phòng nội bộ") ||
        trimmed.includes("Nâng cấp sang Phòng")
      ) {
        return;
      }

      userNotes.push(trimmed);
    });

    if (userNotes.length === 0 && requestItems.length === 0) return null;

    return (
      <div className="sm:col-span-2 space-y-2 mt-2 border-t pt-2">
        {userNotes.length > 0 && (
          <div>
            <p className="text-gray-400 mb-1 text-xs">Ghi chú đặt phòng</p>
            <p className="font-medium text-gray-800">{userNotes.join(" | ")}</p>
          </div>
        )}
        {requestItems.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-gray-400 text-xs">Yêu cầu đã gửi tới Lễ tân</p>
            <div className="flex flex-wrap gap-2">{requestItems}</div>
          </div>
        )}
      </div>
    );
  }

  function handleCancel(booking: any) {
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((checkInDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
    
    // Kiểm tra xem đơn hàng có phải mới được đặt gần đây không (trong vòng 60 phút)
    let isRecentlyCreated = false;
    if (booking.createdAtFull) {
      const dateStr = booking.createdAtFull.replace('T', ' ').replace(/Z$/, '').split('.')[0];
      const createdTime = new Date(dateStr).getTime();
      const diffMinutes = (Date.now() - createdTime) / (1000 * 60);
      isRecentlyCreated = diffMinutes <= 60;
    }

    let penaltyPct = 0;
    if (!isRecentlyCreated) {
      if (diffDays >= 14) {
        penaltyPct = 0;   // Hủy trước từ 14 ngày trở lên: Miễn 100% phụ thu
      } else if (diffDays >= 7) {
        penaltyPct = 30;  // Hủy trước 7 - 13 ngày: Phụ thu 30% cọc
      } else if (diffDays >= 3) {
        penaltyPct = 50;  // Hủy trước 3 - 6 ngày: Phụ thu 50% cọc
      } else if (diffDays >= 1) {
        penaltyPct = 70;  // Hủy trước 1 - 2 ngày: Phụ thu 70% cọc
      } else {
        penaltyPct = 100; // Hủy trong ngày Check-in / No-Show: Phụ thu 100% cọc
      }
    }

    const depositPaid = booking.soTienDaCoc && booking.soTienDaCoc > 0 ? booking.soTienDaCoc : booking.totalPrice;
    const penaltyAmount = (depositPaid * penaltyPct) / 100;
    const refundAmount = Math.max(0, depositPaid - penaltyAmount);

    const conditionText = isRecentlyCreated
      ? "Hủy trong vòng 60 phút sau khi đặt (Miễn 100% phụ thu)"
      : diffDays >= 14
      ? `Hủy trước ${diffDays} ngày (>= 14 ngày: Miễn 100% phụ thu)`
      : diffDays >= 7
      ? `Hủy trước ${diffDays} ngày (7 - 13 ngày: Phụ thu 30% cọc)`
      : diffDays >= 3
      ? `Hủy trước ${diffDays} ngày (3 - 6 ngày: Phụ thu 50% cọc)`
      : diffDays >= 1
      ? `Hủy trước ${diffDays} ngày (1 - 2 ngày: Phụ thu 70% cọc)`
      : `Hủy sát giờ trong ngày Check-in / No-Show (Phụ thu 100% cọc)`;

    const msg = `Chính sách Hủy phòng & Hoàn cọc áp dụng:\n` +
      `- Điều kiện áp dụng: ${conditionText}\n` +
      `- Mức phụ thu hủy phòng: ${penaltyPct}% cọc (${formatPrice(penaltyAmount)})\n` +
      `- Số tiền cọc hoàn lại: ${formatPrice(refundAmount)}\n\n` +
      `Bạn có chắc chắn muốn hủy đặt phòng này không?`;

    if (window.confirm(msg)) {
      cancelBooking(booking.id);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đặt phòng của tôi</h1>
          <p className="text-gray-500 mt-1">{myBookings.length} lần đặt phòng</p>
        </div>
        <button onClick={() => router.push("/customer/rooms")} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#1a3a5c" }}>
          Đặt phòng mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {[
          { val: "all", label: "Tất cả" },
          { val: "pending", label: "Chờ xác nhận" },
          { val: "confirmed", label: "Đã xác nhận" },
          { val: "checked_in", label: "Đang lưu trú" },
          { val: "checked_out", label: "Đã trả phòng" },
          { val: "cancelled", label: "Đã hủy" },
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => setFilterStatus(tab.val)}
            className="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all"
            style={filterStatus === tab.val ? { background: "#1a3a5c", color: "#fff" } : { background: "#fff", color: "#555", border: "1px solid #e5e7eb" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Không có đặt phòng nào</p>
          <button onClick={() => router.push("/customer/rooms")} className="mt-4 text-sm px-5 py-2.5 rounded-lg text-white" style={{ background: "#1a3a5c" }}>
            Đặt phòng ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(grp => {
            if (grp.isMulti) {
              return (
                <div key={grp.key} className="bg-white rounded-2xl shadow-md border-2 border-blue-300 overflow-hidden mb-4">
                  {/* Group Header */}
                  <div className="p-5 bg-gradient-to-r from-blue-50/80 to-slate-50 border-b border-blue-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-900 text-white flex items-center gap-1.5 shadow-xs">
                          🛒 ĐƠN GIỎ HÀNG ĐOÀN ({grp.bookings.length} PHÒNG)
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white text-blue-900 border border-blue-200">
                          Mã chính: #{grp.primary.id.toUpperCase()}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {grp.activeBookings.length} phòng đang hoạt động
                        </span>
                        {grp.cancelledBookings.length > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            🚫 {grp.cancelledBookings.length} phòng đã hủy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Financial Summary Bar */}
                    <div className="mt-4 p-3.5 bg-white rounded-xl border border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-xs">
                      <div>
                        <span className="text-gray-500 block text-[11px] font-medium">TỔNG ĐƠN BAN ĐẦU:</span>
                        <span className="font-extrabold text-blue-950 text-sm">{formatPrice(grp.initialTotalPrice)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[11px] font-medium">TỔNG ĐÃ CỌC KHÁCH NỘP:</span>
                        <span className="font-extrabold text-amber-700 text-sm">{formatPrice(grp.initialTotalDeposit)}</span>
                      </div>
                      {grp.cancelledBookings.length > 0 && (
                        <div>
                          <span className="text-rose-700 block text-[11px] font-bold">CỌC PHÒNG HỦY CẦN HOÀN:</span>
                          <span className="font-extrabold text-rose-700 text-sm">{formatPrice(grp.cancelledTotalDeposit)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 block text-[11px] font-medium">CÒN LẠI THU KHI CHECK-IN/OUT:</span>
                        <span className="font-extrabold text-red-600 text-sm">{formatPrice(grp.activeRemaining)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rooms list inside group */}
                  <div className="p-4 space-y-3 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider px-1">Danh sách chi tiết các phòng trong đơn đoàn này:</p>
                    {grp.bookings.map((booking: any, idx: number) => {
                      const isExpanded = expanded === booking.id;
                      const nights = calcNights(booking.checkIn, booking.checkOut);
                      const sc = statusColors[booking.status] || statusColors.pending;
                      const showRoomNumber = booking.status === "checked_in" || booking.status === "checked_out";
                      const roomRemaining = Math.max(0, (booking.totalPrice || 0) - (booking.soTienDaCoc || 0));

                      return (
                        <div key={booking.id} className={`bg-white rounded-xl shadow-xs border transition-all ${booking.status === 'cancelled' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                          <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : booking.id)}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 text-sm">
                                    Phòng {idx + 1}: {roomTypeLabels[booking.roomType]}
                                    {showRoomNumber ? ` (${booking.roomNumber})` : ""}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: sc.bg, color: sc.text }}>
                                    {bookingStatusLabels[booking.status]}
                                  </span>
                                  <span className="text-xs font-mono text-gray-400">#{booking.id.toUpperCase()}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-900" />{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({nights} đêm)</span>
                                  <span>Giá: {formatPrice(booking.totalPrice)}</span>
                                  <span>Đã cọc: {formatPrice(booking.soTienDaCoc)}</span>
                                  {booking.status !== 'cancelled' && (
                                    <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                      💳 Còn thu phòng này: {formatPrice(roomRemaining)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-bold text-sm" style={{ color: "#1a3a5c" }}>{formatPrice(booking.totalPrice)}</p>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-1" />}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50 text-xs rounded-b-xl space-y-3">
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div><p className="text-gray-400">Ngày đặt đơn</p><p className="font-medium">{formatDate(booking.createdAt)}</p></div>
                                <div><p className="text-gray-400">Số lượng khách</p><p className="font-medium">{booking.guests} người</p></div>
                                <div><p className="text-gray-400">Giá phòng tổng</p><p className="font-bold text-slate-800">{formatPrice(booking.totalPrice)}</p></div>
                                <div>
                                  <p className="text-gray-400">Trạng thái thanh toán phòng này</p>
                                  {booking.status === 'cancelled' ? (
                                    <p className="font-bold text-rose-700">Đã hủy phòng (Cọc hoàn: {formatPrice(booking.soTienDaCoc)})</p>
                                  ) : (
                                    <p className="font-bold text-blue-900">Đã cọc {formatPrice(booking.soTienDaCoc)} (Còn thu: {formatPrice(roomRemaining)})</p>
                                  )}
                                </div>
                                {renderCustomerNotes(booking.notes)}
                              </div>

                              {booking.status === "confirmed" && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => { setLateCheckinBooking(booking); setLateCheckinNote(""); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-semibold"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-700" /> Báo Check-in muộn
                                  </button>
                                  <button onClick={() => handleCancel(booking)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 text-xs font-semibold">
                                    <XCircle className="w-3.5 h-3.5" /> Hủy phòng này
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Single booking card
            const booking = grp.primary;
            const isExpanded = expanded === booking.id;
            const nights = calcNights(booking.checkIn, booking.checkOut);
            const sc = statusColors[booking.status] || statusColors.pending;
            const showRoomNumber = booking.status === "checked_in" || booking.status === "checked_out";

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">
                          {roomTypeLabels[booking.roomType]}
                          {showRoomNumber ? ` (Phòng ${booking.roomNumber})` : ""}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>
                          {bookingStatusLabels[booking.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{roomTypeLabels[booking.roomType]}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</span>
                        <span>{nights} đêm · {booking.guests} khách</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(booking.totalPrice)}</p>
                      <p className="text-xs text-gray-400 mt-1">Mã: #{booking.id.toUpperCase()}</p>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto mt-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-2" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                      <div><p className="text-gray-400 mb-1">Ngày đặt</p><p className="font-medium">{formatDate(booking.createdAt)}</p></div>
                      <div><p className="text-gray-400 mb-1">Số đêm</p><p className="font-medium">{nights} đêm</p></div>
                      <div>
                        <p className="text-gray-400 mb-1">Giá/đêm (trung bình)</p>
                        <p className="font-medium">
                          {formatPrice(Math.round((booking.tongTienPhong || booking.totalPrice) / nights))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Tổng tiền thanh toán</p>
                        <p className="font-bold" style={{ color: "#1a3a5c" }}>
                          {formatPrice(booking.totalPrice)}
                          {booking.tongTienPhong && booking.tongTienPhong > booking.totalPrice && (
                            <span className="block text-[11px] text-green-600 font-normal mt-0.5">
                              (Đã áp dụng mã giảm giá: -{formatPrice(booking.tongTienPhong - booking.totalPrice)})
                            </span>
                          )}
                        </p>
                      </div>
                      {renderCustomerNotes(booking.notes)}
                    </div>

                    {booking.status === "checked_in" && (() => {
                      const { surchargePct, surchargeAmount, lateType, isLate } = calculateCustomerSurcharge(booking);
                      return (
                        <div className="mt-4 p-4 rounded-xl border text-sm mb-4" style={isLate ? { background: "#fff5f5", borderColor: "#fecaca" } : { background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                          {isLate ? (
                            <div>
                              <p className="font-bold text-red-700 flex items-center gap-1.5 mb-1">
                                ⚠️ Cảnh báo trễ giờ trả phòng (Late Check-out)
                              </p>
                              <p className="text-gray-600 mb-3">
                                Đã quá hạn check-out tiêu chuẩn (12:00 trưa). Hệ thống ghi nhận mức phụ thu **{lateType}**: 
                                Phụ thu **{surchargePct}%** tiền phòng/đêm, số tiền phát sinh cần thanh toán: <strong className="text-red-600">{formatPrice(surchargeAmount)}</strong>.
                              </p>
                              <button 
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`http://localhost:8000/api/v1/payments/vnpay-url`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json", "Accept": "application/json" },
                                      body: JSON.stringify({ booking_id: booking.id })
                                    }).then(r => r.json());
                                    if (res.payment_url) {
                                      window.location.href = res.payment_url;
                                    }
                                  } catch (e) {
                                    alert("Lỗi kết nối đến cổng VNPay.");
                                  }
                                }}
                                className="px-4 py-2 rounded-lg text-white font-medium text-xs hover:bg-red-700 transition-all flex items-center gap-1.5"
                                style={{ background: "#ef4444" }}
                              >
                                💳 Thanh toán phụ thu trực tuyến qua VNPay
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-700">
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                              <span>📅 Hạn trả phòng (Check-out): Trước 12:00 trưa ngày {formatDate(booking.checkOut)}.</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                      {(booking.status === "confirmed" || booking.status === "pending") && (
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={() => {
                              setLateCheckinBooking(booking);
                              setLateCheckinNote("");
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-sm font-semibold transition-all shadow-sm"
                          >
                            <Clock className="w-4 h-4 text-amber-700" />
                            💬 Báo Check-in muộn / Thêm lời nhắn cho Lễ tân
                          </button>

                          {(() => {
                            const diffDays = getCancellationInfo(booking);
                            let isRecentlyCreated = false;
                            if (booking.createdAtFull) {
                              const dateStr = booking.createdAtFull.replace('T', ' ').replace(/Z$/, '').split('.')[0];
                              const createdTime = new Date(dateStr).getTime();
                              const diffMinutes = (Date.now() - createdTime) / (1000 * 60);
                              isRecentlyCreated = diffMinutes >= -10 && diffMinutes <= 30;
                            }

                            if (diffDays <= 0 && !isRecentlyCreated) {
                              return (
                                <p className="text-red-500 text-xs mt-2 italic font-medium">
                                  Không thể tự hủy đặt phòng trực tuyến vào hoặc sau ngày nhận phòng. Vui lòng liên hệ hotline để được hỗ trợ.
                                </p>
                              );
                            }
                            return (
                              <button onClick={() => handleCancel(booking)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 text-sm">
                                <XCircle className="w-4 h-4" />
                                Hủy đặt phòng {isRecentlyCreated && <span className="text-[10px] text-red-500 ml-1 font-bold">(Mới đặt nhầm - Hủy miễn phí)</span>}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                     {(booking.status === "checked_in" || booking.status === "checked_out") && (
                       <button onClick={() => setReviewBooking(booking)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-yellow-600 border border-yellow-200 hover:bg-yellow-50 text-sm mt-3">
                         <Star className="w-4 h-4 fill-current" />
                         Đánh giá hạng phòng
                       </button>
                     )}
                     {booking.status === "checked_in" && (
                       <button
                         onClick={() => { setRequestBooking(booking); setRequestType("room_issue"); setRequestContent(""); setRequestSent(false); }}
                         className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm mt-2"
                       >
                         <MessageSquarePlus className="w-4 h-4" />
                         Gửi yêu cầu / Khiếu nại
                       </button>
                     )}
                   </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Đánh giá phòng {reviewBooking.roomNumber}</h3>
            <p className="text-xs text-gray-500 mb-4">Loại phòng: {roomTypeLabels[reviewBooking.roomType]}</p>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số sao đánh giá (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewStars(n)}
                      className="text-yellow-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${n <= reviewStars ? "fill-current" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bình luận chi tiết</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  required
                />
              </div>

              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
                  {reviewError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setReviewBooking(null); setReviewError(""); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ background: "#1a3a5c" }}
                >
                  {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request / Complaint Modal */}
      {requestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Gửi Yêu cầu / Khiếu nại</h3>
                <p className="text-xs text-gray-500 mt-0.5">Phòng {requestBooking.roomNumber} · Đơn #{requestBooking.id.toUpperCase()}</p>
              </div>
              <button onClick={() => { setRequestBooking(null); setRequestSent(false); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5">
              {requestSent ? (
                /* Success state */
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Đã gửi thành công!</h4>
                  <p className="text-sm text-gray-500 mb-6">Lễ tân sẽ tiếp nhận và xử lý yêu cầu của bạn trong thời gian sớm nhất.</p>
                  <button
                    onClick={() => { setRequestBooking(null); setRequestSent(false); }}
                    className="px-6 py-2.5 rounded-xl text-white font-medium text-sm"
                    style={{ background: "#1a3a5c" }}
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Request type selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2.5">Loại yêu cầu</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { val: "room_issue", icon: <Wrench className="w-4 h-4" />, label: "Sự cố phòng", desc: "Hỏng điều hòa, thiết bị..." },
                        { val: "upgrade", icon: <ArrowUpCircle className="w-4 h-4" />, label: "Nâng cấp phòng", desc: "Yêu cầu phòng cao hơn" },
                        { val: "service", icon: <Sparkles className="w-4 h-4" />, label: "Dịch vụ đặc biệt", desc: "Thêm gối, dịn phòng..." },
                        { val: "complaint", icon: <AlertCircle className="w-4 h-4" />, label: "Khiếu nại / Góp ý", desc: "Vấn đề khác" },
                      ] as const).map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setRequestType(opt.val)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            requestType === opt.val
                              ? "border-blue-900 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`flex items-center gap-1.5 font-semibold text-xs mb-0.5 ${
                            requestType === opt.val ? "text-blue-900" : "text-gray-700"
                          }`}>
                            {opt.icon} {opt.label}
                          </div>
                          <p className="text-[10px] text-gray-400">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mô tả chi tiết *</label>
                    <textarea
                      value={requestContent}
                      onChange={e => setRequestContent(e.target.value)}
                      placeholder={
                        requestType === "room_issue" ? "Ví dụ: Điều hòa phòng không lành, nước nóng không có..." :
                        requestType === "upgrade" ? "Ví dụ: Muốn đổi sang phòng có view biển, tầng cao hơn..." :
                        requestType === "service" ? "Ví dụ: Cần thêm chăn, yêu cầu dịn phòng lúc 14h..." :
                        "Ví dụ: Hành lang có tiếng ồn lớn vào buổi đêm..."
                      }
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900/30 resize-none"
                    />
                  </div>

                  {requestType === "upgrade" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      ⚠️ <strong>Lưu ý:</strong> Upgrade phòng do khách yêu cầu sẽ được lễ tân liên hệ xác nhận và tính chệnh lệch giá cho các đêm còn lại.
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { setRequestBooking(null); setRequestSent(false); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSendRequest}
                      disabled={requestLoading || !requestContent.trim()}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
                      style={{ background: "#1a3a5c" }}
                    >
                      {requestLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Báo Check-in Muộn cho Khách hàng */}
      {lateCheckinBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Báo Check-in muộn / Gửi lời nhắn</h3>
              </div>
              <button
                onClick={() => setLateCheckinBooking(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">📌 Đơn đặt phòng #{lateCheckinBooking.id.toUpperCase()}</p>
              <p>Lịch lưu trú: <strong>{formatDate(lateCheckinBooking.checkIn)} → {formatDate(lateCheckinBooking.checkOut)}</strong></p>
              <p className="text-amber-800 leading-relaxed">
                Lời nhắn của bạn sẽ được gửi thẳng tới màn hình Lễ tân khách sạn để cập nhật sơ đồ giữ phòng, đảm bảo phòng của bạn không bị hủy nhầm khi bạn tới trễ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">💡 Gợi ý lời nhắn nhanh:</label>
              <div className="space-y-1.5 mb-3">
                {[
                  `Khách báo Check-in muộn ngày ${formatDate(lateCheckinBooking.checkIn)} do trễ chuyến bay. Vui lòng giữ phòng!`,
                  `Khách gặp sự cố giao thông, sẽ đến muộn sau 18:00 ngày ${formatDate(lateCheckinBooking.checkIn)}. Vui lòng giữ phòng!`,
                  `Khách đến nhận phòng muộn vào buổi tối muộn ngày ${formatDate(lateCheckinBooking.checkIn)}. Đã cọc đủ.`,
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLateCheckinNote(tpl)}
                    className="w-full text-left text-xs p-2 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 text-gray-700 transition-all"
                  >
                    + {tpl}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nội dung ghi chú chi tiết *</label>
              <textarea
                value={lateCheckinNote}
                onChange={e => setLateCheckinNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do đến muộn của bạn..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setLateCheckinBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveLateCheckinNote}
                disabled={lateCheckinLoading || !lateCheckinNote.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: "#1a3a5c" }}
              >
                {lateCheckinLoading ? "Đang gửi..." : "Gửi lời nhắn tới Lễ tân"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
