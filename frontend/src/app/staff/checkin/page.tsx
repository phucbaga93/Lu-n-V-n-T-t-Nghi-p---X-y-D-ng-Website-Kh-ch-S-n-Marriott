"use client";

import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Search, UserCheck, UserX, Clock, CheckCircle2, XCircle, X, Wrench, ArrowUpCircle, Sparkles, AlertCircle, Check, QrCode, Building2, AlertTriangle } from "lucide-react";
import { bookingStatusLabels, roomTypeLabels, formatPrice, formatDate, calcNights, getLocalToday, getUserAssignedLocation, getBookingLocation } from "../../data/mockData";
import { api } from "../../data/api";

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
function parseAccompanyingGuests(notes?: string) {
  if (!notes) return [];
  const match = notes.match(/Khai báo tạm trú:\s*\[(.*?)\]/i);
  if (!match) return [];
  
  const rawInfo = match[1]; // "Khách 2: Nguyễn Văn A (CCCD: 123456789, SĐT: 0909090909); Khách 3: ..."
  const guestsParts = rawInfo.split(";");
  
  return guestsParts.map(part => {
    const trimmed = part.trim();
    // Khách 2: Nguyễn Văn A (CCCD: 123456789, SĐT: 0909090909)
    const nameMatch = trimmed.match(/Khách \d+:\s*(.*?)\s*\(/i);
    const cccdMatch = trimmed.match(/CCCD:\s*(.*?)(?:,|$|\))/i);
    const phoneMatch = trimmed.match(/SĐT:\s*(.*?)(?:,|$|\))/i);
    
    return {
      label: trimmed.split(":")[0] || "Khách",
      name: nameMatch ? nameMatch[1].trim() : trimmed,
      idCard: cccdMatch ? cccdMatch[1].trim() : "",
      phone: phoneMatch ? phoneMatch[1].trim() : "",
    };
  });
}

function parseDepositFromNotes(notes: string) {
  if (!notes) return 0;
  const match = notes.match(/\[Tiền cọc:\s*(\d+)đ\]/i) || notes.match(/\[Tiền cọc:\s*(\d+)đ\s*\((.*?)\)\]/i);
  return match ? Number(match[1]) : 0;
}

function parseRoomPaidFromNotes(notes: string) {
  if (!notes) return 0;
  const match = notes.match(/\[Tiền phòng đã thu:\s*(\d+)đ\]/i) || notes.match(/\[Tiền phòng đã thu:\s*(\d+)đ\s*\((.*?)\)\]/i);
  return match ? Number(match[1]) : 0;
}

function renderBookingNotes(notes?: string, status?: string) {
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
            💵 Đã thu phòng khi Check-in: {formatPrice(Number(match[1]))} ({match[2]})
          </span>
        );
      }
      return;
    }

    if (trimmed.includes("Khai báo tạm trú:")) {
      // 🛡️ ĐÃ CÓ POPUP MODAL RIÊNG: Bỏ qua không hiển thị badge thô dài dòng này trên thẻ phòng
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

    // Bỏ qua các tag hệ thống [REQUEST:...] và [RESOLVED:...] — đã được render riêng
    if (trimmed.startsWith("[REQUEST:") || trimmed.startsWith("[RESOLVED:")) {
      return;
    }

    if (trimmed) {
      customText += (customText ? " | " : "") + trimmed;
    }
  });

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges}
      {customText && (
        <span className="text-xs text-gray-500 italic block w-full mt-0.5">
          📝 Yêu cầu: {customText}
        </span>
      )}
    </div>
  );
}

export default function CheckInOutPage() {
  const { bookings, updateBooking, rooms, changeRoom, fetchRooms, fetchBookings, currentUser } = useApp();
  const locationInfo = getUserAssignedLocation(currentUser);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");
  const effectiveLocation = locationInfo.isGlobal ? selectedLocationFilter : locationInfo.location;

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"confirmed" | "checked_in" | "checked_out" | "cancelled" | "all">("confirmed");
  const [filterDate, setFilterDate] = useState<string>(getLocalToday());
  const [confirm, setConfirm] = useState<{ id: string; action: "checkin" | "checkout" } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);

  // States cho Check-in (gán phòng & khai báo)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [accompanyingGuests, setAccompanyingGuests] = useState<Array<{ name: string; idCard: string; phone: string }>>([]);
  const [depositAmount, setDepositAmount] = useState<number>(1000000);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<string>("OFFLINE");
  const [waiveLateSurcharge, setWaiveLateSurcharge] = useState<boolean>(false);
  const [waiveEarlyCheckoutFee, setWaiveEarlyCheckoutFee] = useState<boolean>(false);
  const [viewRoomGuestsBooking, setViewRoomGuestsBooking] = useState<any | null>(null);

  // States cho xử lý yêu cầu khách
  const [handleRequestBooking, setHandleRequestBooking] = useState<any | null>(null);
  const [handleRequestIndex, setHandleRequestIndex] = useState<number>(0);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);

  // States cho thêm dịch vụ lưu trú
  const [serviceModalBookingId, setServiceModalBookingId] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("giặt ủi");
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [serviceUnitPrice, setServiceUnitPrice] = useState<number>(100000);
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);

  // Bổ sung useEffect tự động gán phòng trống đầu tiên thuộc chi nhánh khi rooms cập nhật realtime
  useEffect(() => {
    if (confirm && confirm.action === "checkin") {
      const targetBooking = bookings.find(b => b.id === confirm.id);
      if (targetBooking) {
        const assignedRoom = rooms.find(r => String(r.id) === String(targetBooking.roomId));
        const bookingLocation = assignedRoom ? assignedRoom.location : "TP. Hồ Chí Minh";
        const vacantRooms = rooms.filter(r => r.status === "available" && r.type === targetBooking.roomType && r.location === bookingLocation);
        if (vacantRooms.length > 0 && !vacantRooms.some(r => String(r.id) === selectedRoomId)) {
          setSelectedRoomId(String(vacantRooms[0].id));
        }
      }
    }
  }, [confirm, bookings, rooms, selectedRoomId]);

  async function startCheckin(booking: any) {
    // 🛡️ KIỂM TRA NGÀY NHẬN PHÒNG LOCALTIME VIỆT NAM (UTC+7)
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (booking.checkIn > todayStr) {
      alert(`⛔ KHÔNG THỂ NHẬN PHÒNG SỚM!\n\nĐơn đặt phòng này có ngày nhận phòng quy định là ${formatDate(booking.checkIn)}.\n\nHôm nay mới là ${formatDate(todayStr)}.\n\nNếu muốn nhận phòng vui lòng hủy phòng tạo đơn khác!`);
      return;
    }

    if (todayStr > booking.checkOut) {
      alert(`⛔ ĐƠN ĐÃ QUÁ HẠN CHECK-OUT!\n\nĐơn đặt phòng này đã quá ngày trả phòng quy định (${formatDate(booking.checkOut)}).\n\nKhách không đến nhận phòng trong suốt khoảng thời gian này (No-Show). Đơn sẽ chuyển sang trạng thái Hủy đặt.`);
      await updateBooking(booking.id, { status: "cancelled" });
      return;
    }

    // 🛡️ BẢO MẬT & ĐỒNG BỘ REALTIME: Tải dữ liệu phòng trống mới nhất ngay lập tức từ CSDL trước khi gán
    try {
      await fetchRooms();
      await fetchBookings();
    } catch (e) {
      console.error(e);
    }

    const assignedRoom = rooms.find(r => String(r.id) === String(booking.roomId));
    const bookingLocation = assignedRoom ? assignedRoom.location : "TP. Hồ Chí Minh";
    const vacantRooms = rooms.filter(r => r.status === "available" && r.type === booking.roomType && r.location === bookingLocation);
    if (vacantRooms.length > 0) {
      setSelectedRoomId(String(vacantRooms[0].id));
    } else {
      setSelectedRoomId("");
    }

    if (booking.guests >= 2) {
      const arr = [];
      for (let i = 1; i < booking.guests; i++) {
        arr.push({ name: "", idCard: "", phone: "" });
      }
      setAccompanyingGuests(arr);
    } else {
      setAccompanyingGuests([]);
    }

    // Reset cọc mặc định khi mở modal check-in
    setDepositAmount(1000000);
    setDepositPaymentMethod("OFFLINE");

    setConfirm({ id: booking.id, action: "checkin" });
  }

  async function handleConfirmCheckin(booking: any) {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (booking.checkIn > todayStr) {
      alert(`⛔ KHÔNG THỂ NHẬN PHÒNG SỚM!\n\nNgày nhận phòng quy định của đơn này là ${formatDate(booking.checkIn)}.\n\nNếu muốn nhận phòng vui lòng hủy phòng tạo đơn khác!`);
      return;
    }

    if (todayStr > booking.checkOut) {
      alert(`⛔ ĐƠN ĐÃ QUÁ HẠN CHECK-OUT!\n\nĐơn đặt phòng này đã quá ngày trả phòng quy định (${formatDate(booking.checkOut)}).\n\nHệ thống sẽ chuyển đơn sang Hủy đặt (No-Show).`);
      await updateBooking(booking.id, { status: "cancelled" });
      setConfirm(null);
      return;
    }

    if (!selectedRoomId) {
      alert("Hết phòng trống thuộc hạng phòng này! Vui lòng dọn dẹp hoặc chuẩn bị phòng trống trước.");
      return;
    }

    if (booking.guests >= 2) {
      for (let i = 0; i < accompanyingGuests.length; i++) {
        const g = accompanyingGuests[i];
        const trimmedName = g.name.trim();
        const trimmedCccd = g.idCard.trim();
        const trimmedPhone = g.phone ? g.phone.trim() : "";

        if (!trimmedName || !trimmedCccd) {
          alert(`Vui lòng điền đầy đủ Họ tên và CCCD/Hộ chiếu cho khách đi kèm thứ ${i + 2}!`);
          return;
        }

        const nameParts = trimmedName.split(/\s+/).filter(Boolean);
        const nameValid = nameParts.length >= 2 && trimmedName.length >= 3 && !/\d/.test(trimmedName);
        if (!nameValid) {
          alert(`Họ và tên của khách đi kèm thứ ${i + 2} ("${trimmedName}") không hợp lệ! Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 2 từ, ví dụ: Nguyễn Văn A).`);
          return;
        }

        const cccdValid = /^[0-9]{9,12}$/.test(trimmedCccd) || /^[A-Z0-9]{6,12}$/i.test(trimmedCccd);
        if (!cccdValid) {
          alert(`Số CCCD/Hộ chiếu của khách đi kèm thứ ${i + 2} ("${trimmedCccd}") không hợp lệ! Vui lòng nhập đúng 9 hoặc 12 số CCCD/CMND (hoặc mã Hộ chiếu hợp lệ).`);
          return;
        }

        if (trimmedPhone && !/^[0-9]{10}$/.test(trimmedPhone)) {
          alert(`Số điện thoại của khách đi kèm thứ ${i + 2} ("${trimmedPhone}") không hợp lệ! Số điện thoại phải gồm đúng 10 chữ số.`);
          return;
        }
      }
    }

    try {
      if (booking.chiTietId) {
        await changeRoom(booking.id, Number(booking.chiTietId), Number(selectedRoomId));
      }

      // 1. Tạo chuỗi note cọc lưu trú & tiền phòng thu tại quầy
      const paymentMethodText = depositPaymentMethod === "Tien_Mat" ? "Tiền mặt" : "VNPAY";
      let notesAppend = `[Tiền cọc: ${depositAmount}đ (${paymentMethodText})]`;

      const isPrepaid = booking.rawStatus === "Da_Thanh_Toan";
      if (!isPrepaid) {
        const conLaiPhaiThu = Math.max(0, booking.totalPrice - (booking.soTienDaCoc || 0));
        if (conLaiPhaiThu > 0) {
          notesAppend += ` | [Tiền phòng đã thu: ${conLaiPhaiThu}đ (${paymentMethodText})]`;
        }
      }

      // 2. Tạo chuỗi khai báo tạm trú
      if (booking.guests >= 2) {
        notesAppend += ` | Khai báo tạm trú: [` + accompanyingGuests.map((g, idx) => `Khách ${idx + 2}: ${g.name} (CCCD: ${g.idCard}, SĐT: ${g.phone})`).join("; ") + "]";
      }
      
      const originalNotes = booking.notes || "";
      const updatedNotes = originalNotes 
        ? `${originalNotes} | ${notesAppend}`
        : notesAppend;

      await updateBooking(booking.id, {
        status: "checked_in",
        notes: updatedNotes
      });

      alert("Check-in, gán phòng và thu tiền cọc thành công!");
      setConfirm(null);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Đã xảy ra lỗi khi thực hiện check-in!");
    }
  }

  const parseDateOnly = (d: string | undefined) => d ? d.split(" ")[0].split("T")[0] : "";

  function getGroupedCurrentList(list: any[]) {
    // Helper parse timestamp an toan
    const parseTimestamp = (dateStr?: string) => {
      if (!dateStr) return 0;
      const clean = dateStr.replace(" ", "T");
      const t = new Date(clean).getTime();
      return isNaN(t) ? 0 : t;
    };

    // 1. Phân nhóm ưu tiên theo thẻ MaGioHang chính xác
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

    // 2. Với các đơn lẻ chưa có thẻ MaGioHang, chỉ gộp nếu cùng email/sdt VÀ TRÙNG NGÀY LƯU TRÚ (checkIn & checkOut) VÀ thời gian đặt cách nhau dưới 2 phút
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
        const uniqueKey = `SINGLE_${b.id}_${email}_${phone}_${createdTime}_${b.checkIn}_${b.checkOut}`;
        timeGroupedMap.set(uniqueKey, [b]);
      }
    }

    // Tổng hợp tất cả nhóm
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
      totalPrice: number;
      totalDeposit: number;
      totalRemaining: number;
    }[] = [];

    finalGroupMap.forEach((items, key) => {
      const primary = items[0];
      const activeBookings = items.filter(b => b.status !== "cancelled");
      const cancelledBookings = items.filter(b => b.status === "cancelled");
      const isMulti = items.length > 1;

      const totalPrice = activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalDeposit = activeBookings.reduce((sum, b) => sum + (b.soTienDaCoc || 0), 0);
      const totalRemaining = Math.max(0, totalPrice - totalDeposit);

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
        totalPrice,
        totalDeposit,
        totalRemaining,
      });
    });

    return groups;
  }

  const rawCartGroups = getGroupedCurrentList(bookings);

  const allCartGroups = rawCartGroups.filter(grp => {
    if (effectiveLocation !== "all") {
      const locationMatch = grp.bookings.some(b => {
        const bLoc = getBookingLocation(b, rooms);
        return bLoc === "all" || bLoc === effectiveLocation;
      });
      if (!locationMatch) return false;
    }
    return true;
  });

  const totalDateGroups = filterDate ? allCartGroups.filter(grp => grp.bookings.some(b => {
    const cIn = parseDateOnly(b.checkIn);
    const cOut = parseDateOnly(b.checkOut);
    return cIn === filterDate || cOut === filterDate || (cIn <= filterDate && filterDate <= cOut);
  })) : allCartGroups;

  const checkInGroups = allCartGroups.filter(g => g.bookings.some(b => {
    const cIn = parseDateOnly(b.checkIn);
    const isStatus = b.status === "confirmed" || b.status === "pending";
    return isStatus && (!filterDate || cIn === filterDate);
  }));

  const checkOutGroups = allCartGroups.filter(g => g.bookings.some(b => {
    const cIn = parseDateOnly(b.checkIn);
    const cOut = parseDateOnly(b.checkOut);
    const isStatus = b.status === "checked_in";
    return isStatus && (!filterDate || (cIn <= filterDate && filterDate <= cOut));
  }));

  const checkedOutGroups = allCartGroups.filter(g => g.bookings.some(b => {
    const cIn = parseDateOnly(b.checkIn);
    const cOut = parseDateOnly(b.checkOut);
    const isStatus = b.status === "checked_out";
    return isStatus && (!filterDate || cOut === filterDate || cIn === filterDate);
  }));

  const cancelledGroups = allCartGroups.filter(g => g.bookings.some(b => {
    const cIn = parseDateOnly(b.checkIn);
    const cOut = parseDateOnly(b.checkOut);
    const isStatus = b.status === "cancelled";
    return isStatus && (!filterDate || cIn === filterDate || cOut === filterDate);
  }));

  const filteredCartGroups = allCartGroups.filter(grp => {
    let statusMatch = false;
    if (selectedStatus === "all") {
      statusMatch = true;
    } else if (selectedStatus === "confirmed") {
      statusMatch = grp.bookings.some(b => b.status === "confirmed" || b.status === "pending");
    } else {
      statusMatch = grp.bookings.some(b => b.status === selectedStatus);
    }
    if (!statusMatch) return false;

    if (filterDate) {
      const dateMatch = grp.bookings.some(b => {
        const cIn = parseDateOnly(b.checkIn);
        const cOut = parseDateOnly(b.checkOut);
        return cIn === filterDate || cOut === filterDate || (cIn <= filterDate && filterDate <= cOut);
      });
      if (!dateMatch) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const searchMatch = grp.bookings.some(b => 
        (b.customerName || "").toLowerCase().includes(q) ||
        (b.customerPhone || "").includes(q) ||
        (b.roomNumber || "").toLowerCase().includes(q) ||
        (b.id || "").toLowerCase().includes(q)
      );
      if (!searchMatch) return false;
    }

    return true;
  });

  function calculateSurcharge(booking: any) {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(23, 59, 59, 999);
    
    const isLateDate = now.getTime() > checkOutDate.getTime();
    const isCheckoutDay = getLocalToday() === booking.checkOut;
    
    let surchargePct = 0;
    let lateType = "";
    
    if (isCheckoutDay) {
      if (currentHour >= 12 && currentHour < 15) {
        surchargePct = 30;
        lateType = "Trễ dưới 3 tiếng (12:00 - 15:00)";
      } else if (currentHour >= 15 && currentHour < 18) {
        surchargePct = 50;
        lateType = "Trễ 3 - 6 tiếng (15:00 - 18:00)";
      } else if (currentHour >= 18) {
        surchargePct = 100;
        lateType = "Trễ trên 6 tiếng (sau 18:00)";
      }
    } else if (isLateDate) {
      surchargePct = 100;
      lateType = "Trễ quá ngày quy định (> 1 ngày)";
    }
    
    const nights = calcNights(booking.checkIn, booking.checkOut) || 1;
    const roomCharge = booking.tongTienPhong || booking.totalPrice;
    const pricePerNight = roomCharge / nights;
    const surchargeAmount = (pricePerNight * surchargePct) / 100;
    
    return {
      surchargePct,
      surchargeAmount,
      lateType,
      finalPrice: booking.totalPrice + surchargeAmount
    };
  }

  function checkLateCheckinStatus(b: any) {
    if (!b || (b.status !== "confirmed" && b.status !== "pending")) return null;

    const todayStr = getLocalToday();
    const cInStr = parseDateOnly(b.checkIn);
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // Case 1: Past checkIn date (e.g. checkIn was 17/08, today is 18/08)
    if (todayStr > cInStr) {
      const daysLate = Math.floor((new Date(todayStr).getTime() - new Date(cInStr).getTime()) / (1000 * 3600 * 24)) || 1;
      return {
        isLate: true,
        daysLate,
        message: `⚠️ TRỄ CHECK-IN (${daysLate > 0 ? `Trễ ${daysLate} ngày` : 'Quá hạn'})`,
        detail: `Khách đăng ký nhận phòng từ 14:00 ngày ${formatDate(b.checkIn)} (Đã quá ${daysLate > 0 ? `${daysLate} ngày` : 'mốc giờ'} chưa đến nhận phòng)!`,
        severity: "high" as const,
      };
    }

    // Case 2: Same checkIn date, but current hour >= 14:00 PM
    if (todayStr === cInStr && currentHour >= 14) {
      const hoursLate = Math.floor(currentHour - 14);
      return {
        isLate: true,
        daysLate: 0,
        message: `⚠️ TRỄ CHECK-IN (${hoursLate > 0 ? `Trễ ${hoursLate} tiếng` : 'Đã qua 14:00'})`,
        detail: `Giờ nhận phòng quy định là 14:00 ngày hôm nay (${formatDate(b.checkIn)}). Hiện tại là ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}.`,
        severity: "medium" as const,
      };
    }

    return null;
  }

  function getRemainingStayInfo(b: any) {
    if (!b) return null;
    const now = new Date();
    const todayStr = getLocalToday();
    const cOutStr = parseDateOnly(b.checkOut);

    if (todayStr === cOutStr) {
      const checkoutDeadline = new Date();
      checkoutDeadline.setHours(12, 0, 0, 0);

      const diffMs = checkoutDeadline.getTime() - now.getTime();
      if (diffMs > 0) {
        const remainingMinutesTotal = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(remainingMinutesTotal / 60);
        const mins = remainingMinutesTotal % 60;
        const timeStr = hours > 0 ? `${hours} tiếng ${mins} phút` : `${mins} phút`;
        return {
          isCheckoutToday: true,
          hours,
          mins,
          formattedTime: timeStr,
          message: `⏰ CẢNH BÁO LƯU TRÚ: Hôm nay (${formatDate(b.checkOut)}) là ngày trả phòng. Giờ Check-out tiêu chuẩn là 12:00 PM. Khách CHỈ CÒN ${timeStr} sử dụng phòng!`,
        };
      } else {
        return {
          isCheckoutToday: true,
          hours: 0,
          mins: 0,
          formattedTime: "Đã qua 12:00 PM",
          message: `🚨 ĐÃ QUÁ GIỜ CHECK-OUT TIÊU CHUẨN (12:00 PM)! Nếu khách lưu trú tiếp, Lễ tân vui lòng tính phụ thu Trả phòng muộn hoặc làm thủ tục gia hạn phòng.`,
        };
      }
    }

    return null;
  }

  function handleCancelClick(b: any, groupCustomerName?: string) {
    const lateInfo = checkLateCheckinStatus(b);
    const remainingToCollect = Math.max(0, (b.totalPrice || 0) - (b.soTienDaCoc || 0));

    let confirmMsg = "";
    if (lateInfo?.isLate) {
      confirmMsg = `🚨 XÁC NHẬN HỦY ĐƠN TRỄ CHECK-IN (NO-SHOW) - PHÒNG ${b.roomNumber} (Mã #${b.id.toUpperCase()})\n` +
        `----------------------------------------------------------------------\n` +
        `• Khách hàng: ${b.customerName || groupCustomerName || "Khách lưu trú"}\n` +
        `• Tình trạng: Trễ mốc giờ nhận phòng quy định (Lịch check-in: 14:00 ngày ${formatDate(b.checkIn)})\n\n` +
        `📋 XỬ LÝ TÀI CHÍNH & TIỀN CỌC GỒM 3 BƯỚC:\n` +
        `1. TIỀN CỌC ĐÃ NỘP (${formatPrice(b.soTienDaCoc)}): Khấu trừ 100% làm Phụ phí No-Show giữ phòng (KHÔNG HOÀN LẠI CỌC CHO KHÁCH).\n` +
        `2. SỐ TIỀN CÒN LẠI CHƯA THU (${formatPrice(remainingToCollect)}): Hủy bỏ nghĩa vụ thu tiền còn lại, KHÔNG TRUY THU TỪ KHÁCH NỮA.\n` +
        `3. TRẠNG THÁI PHÒNG: Chuyển phòng ${b.roomNumber} về trạng thái TRỐNG / DỌN DẸP để tiếp tục mở bán cho khách mới!\n\n` +
        `Bạn có chắc chắn muốn xác nhận HỦY ĐƠN NO-SHOW này?`;
    } else {
      confirmMsg = `XÁC NHẬN HỦY ĐƠN ĐẶT PHÒNG ${b.roomNumber} (Mã #${b.id.toUpperCase()})\n` +
        `----------------------------------------------------------------------\n` +
        `• Khách hàng: ${b.customerName || groupCustomerName || "Khách lưu trú"}\n` +
        `• Tiền cọc đã nộp: ${formatPrice(b.soTienDaCoc)}\n` +
        `• Xử lý cọc: Theo chính sách hủy phòng quy định của khách sạn.\n\n` +
        `Bạn có chắc chắn muốn xác nhận hủy phòng này?`;
    }

    if (window.confirm(confirmMsg)) {
      handleAction(b.id, "cancel");
    }
  }

  function handleAction(id: string, action: "checkin" | "checkout" | "cancel", finalPrice?: number, notesAppend?: string) {
    if (action === "checkin") {
      const targetBooking = bookings.find(b => b.id === id);
      if (targetBooking) {
        const todayStr = getLocalToday();
        if (targetBooking.checkIn > todayStr) {
          alert(`⛔ KHÔNG THỂ CHECK-IN SỚM TRƯỚC NGÀY QUY ĐỊNH!\n\nĐơn phòng của khách (${targetBooking.customerName}) có ngày nhận phòng quy định là ${targetBooking.checkIn} (hôm nay là ${todayStr}).\n\nNếu muốn thay đổi ngày nhận phòng sớm hơn, vui lòng hủy đơn cũ và khởi tạo đơn đặt phòng mới!`);
          setConfirm(null);
          return;
        }
      }
      updateBooking(id, { status: "checked_in" });
    } else if (action === "cancel") {
      updateBooking(id, { status: "cancelled" });
    } else {
      const updates: any = { status: "checked_out" };
      if (finalPrice !== undefined) updates.totalPrice = finalPrice;
      if (notesAppend) {
        const originalBooking = bookings.find(b => b.id === id);
        const originalNotes = originalBooking?.notes || "";
        updates.notes = originalNotes ? `${originalNotes} | ${notesAppend}` : notesAppend;
      }
      updateBooking(id, updates);
    }
    setConfirm(null);
  }

  const confirmBooking = confirm ? bookings.find(b => b.id === confirm.id) : null;

  return (
    <div>
      {/* 📍 PHÂN QUYỀN VỊ TRÍ / CHI NHÁNH LỄ TÂN */}
      {locationInfo.isGlobal ? (
        <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Building2 className="w-4 h-4 text-amber-400" />
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
            <Building2 className="w-4 h-4 text-blue-300" />
            <span>LỄ TÂN CHI NHÁNH ({currentUser?.name}):</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              📍 Chi nhánh phụ trách: {locationInfo.location}
            </span>
          </div>
          <span className="text-[11px] text-blue-200 font-medium hidden sm:inline">
            Tự động lọc danh sách Check-in / Out thuộc chi nhánh {locationInfo.location}
          </span>
        </div>
      )}

      {/* 📅 BỘ LỌC NGÀY CHO LỄ TÂN & ADMIN CONTROL */}
      <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Clock className="w-5 h-5 text-blue-900" />
          <span>Bộ lọc kiểm soát theo từng ngày:</span>
          {filterDate ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
              {formatDate(filterDate)}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
              Tất cả các ngày
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterDate(getLocalToday())}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterDate === getLocalToday() ? "bg-blue-900 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            📅 Hôm nay ({formatDate(getLocalToday())})
          </button>
          <button
            onClick={() => setFilterDate("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!filterDate ? "bg-blue-900 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            🌐 Tất cả ngày
          </button>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
          />
        </div>
      </div>

      {/* Stats - Clickable as filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div 
          onClick={() => setSelectedStatus("confirmed")}
          className={`bg-white rounded-xl p-3.5 shadow-sm border flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-all ${selectedStatus === "confirmed" ? "ring-2 ring-blue-500 border-transparent shadow-md scale-[1.02]" : "border-blue-100 opacity-80"}`}
        >
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div><p className="text-lg font-bold text-gray-900">{checkInGroups.length}</p><p className="text-[11px] text-gray-500 font-semibold">{filterDate ? "Chờ Check-in" : "Chờ nhận"}</p></div>
        </div>
        <div 
          onClick={() => setSelectedStatus("checked_in")}
          className={`bg-white rounded-xl p-3.5 shadow-sm border flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-all ${selectedStatus === "checked_in" ? "ring-2 ring-green-500 border-transparent shadow-md scale-[1.02]" : "border-green-100 opacity-80"}`}
        >
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div><p className="text-lg font-bold text-gray-900">{checkOutGroups.length}</p><p className="text-[11px] text-gray-500 font-semibold">{filterDate ? "Chờ Check-out" : "Đang ở"}</p></div>
        </div>
        <div 
          onClick={() => setSelectedStatus("checked_out")}
          className={`bg-white rounded-xl p-3.5 shadow-sm border flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-all ${selectedStatus === "checked_out" ? "ring-2 ring-amber-600 border-transparent shadow-md scale-[1.02]" : "border-gray-100 opacity-80"}`}
        >
          <UserCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div><p className="text-lg font-bold text-gray-900">{checkedOutGroups.length}</p><p className="text-[11px] text-gray-500 font-semibold">Đã trả phòng</p></div>
        </div>
        <div 
          onClick={() => setSelectedStatus("cancelled")}
          className={`bg-white rounded-xl p-3.5 shadow-sm border flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-all ${selectedStatus === "cancelled" ? "ring-2 ring-red-500 border-transparent shadow-md scale-[1.02]" : "border-red-100 opacity-80"}`}
        >
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div><p className="text-lg font-bold text-gray-900">{cancelledGroups.length}</p><p className="text-[11px] text-gray-500 font-semibold">Đã hủy</p></div>
        </div>
      </div>



      {/* Search */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên khách, số phòng, mã đặt phòng..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredCartGroups.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>
              {selectedStatus === "all" && "Không tìm thấy dữ liệu đơn đặt phòng nào"}
              {selectedStatus === "confirmed" && "Không có khách chờ nhận phòng"}
              {selectedStatus === "checked_in" && "Không có khách đang lưu trú"}
              {selectedStatus === "checked_out" && "Không có lịch sử đã trả phòng"}
              {selectedStatus === "cancelled" && "Không có lịch sử đơn đặt bị hủy"}
            </p>
          </div>
        )}
        {filteredCartGroups.map(grp => {
          if (!grp.isMulti) {
            const b = grp.primary;
            return (
              <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-bold text-gray-900">{b.customerName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1e40af" }}>
                        #{b.id.toUpperCase()}
                      </span>
                      {(() => {
                        const localDate = new Date();
                        const year = localDate.getFullYear();
                        const month = String(localDate.getMonth() + 1).padStart(2, '0');
                        const day = String(localDate.getDate()).padStart(2, '0');
                        const todayStr = `${year}-${month}-${day}`;

                        if (selectedStatus === "checked_in") {
                          const isLate = todayStr > b.checkOut || (todayStr === b.checkOut && localDate.getHours() >= 12);
                          if (isLate) {
                            return (
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-50 text-red-600 animate-pulse border border-red-200 flex items-center gap-1">
                                ⚠️ Trễ Check-out
                              </span>
                            );
                          }
                        }

                        const lateInfo = checkLateCheckinStatus(b);
                        if (lateInfo) {
                          return (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 border animate-pulse ${
                              lateInfo.severity === 'high' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {lateInfo.message}
                            </span>
                          );
                        }

                        return null;
                      })()}
                    </div>
                    {(() => {
                      const lateInfo = checkLateCheckinStatus(b);
                      if (!lateInfo) return null;
                      return (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>{lateInfo.detail}</span>
                        </div>
                      );
                    })()}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>📞 {b.customerPhone}</span>
                      <span>🛏 Phòng {b.roomNumber} ({roomTypeLabels[b.roomType] || b.roomType})</span>
                      <span>👥 {b.guests} khách</span>
                      <span>📅 {formatDate(b.checkIn)} → {formatDate(b.checkOut)} ({calcNights(b.checkIn, b.checkOut)} đêm)</span>
                    </div>
                    {b.soTienDaCoc > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          🛡️ Đã cọc online VNPay: {formatPrice(b.soTienDaCoc)} ({b.phanTramDatCoc}%)
                        </span>
                        {(b.status === "confirmed" || b.status === "pending") && (b.totalPrice - b.soTienDaCoc > 0) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                            💳 Còn lại phải thu tại quầy khi Check-in: {formatPrice(b.totalPrice - b.soTienDaCoc)}
                          </span>
                        )}
                        {b.status === "checked_in" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Tiền phòng: Đã thu đủ khi Check-in
                          </span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            🚫 Giữ 100% cọc No-Show: {formatPrice(b.soTienDaCoc)} (Khấu trừ phụ thu No-Show)
                          </span>
                        )}
                      </div>
                    )}
                    {renderBookingNotes(b.notes, b.status)}
                    {b.guests >= 2 && (
                      <button 
                        onClick={() => setViewRoomGuestsBooking(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors mt-2.5 shadow-sm"
                      >
                        👥 Xem khách trong phòng ({b.guests})
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: "#1a3a5c" }}>{formatPrice(b.totalPrice)}</p>
                      <p className="text-xs text-gray-400">{calcNights(b.checkIn, b.checkOut)} đêm</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedStatus === "confirmed" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startCheckin(b)}
                            className="px-4 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                            style={{ background: "#22c55e" }}
                          >
                            Nhận phòng
                          </button>
                          <button
                            onClick={() => handleCancelClick(b)}
                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                          >
                            Hủy đặt
                          </button>
                        </div>
                      )}
                      {selectedStatus === "checked_in" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setServiceModalBookingId(b.id);
                              setSelectedServiceType("giặt ủi");
                              setCustomServiceName("");
                              setServiceUnitPrice(100000);
                              setServiceQuantity(1);
                            }}
                            className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-blue-50 transition-colors"
                            style={{ borderColor: "#1a3a5c", color: "#1a3a5c" }}
                          >
                            ✨ Gọi dịch vụ
                          </button>
                          <button
                            onClick={() => setViewInvoice(b)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-xs hover:bg-gray-50 text-gray-700 bg-white font-medium"
                          >
                            📄 Hóa đơn
                          </button>
                          <button
                            onClick={() => {
                              setWaiveLateSurcharge(false);
                              setWaiveEarlyCheckoutFee(false);
                              setConfirm({ id: b.id, action: "checkout" });
                            }}
                            className="px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
                            style={{ background: "#1a3a5c" }}
                          >
                            <UserX className="w-3.5 h-3.5" /> Trả phòng
                          </button>
                        </div>
                      )}
                      {(selectedStatus === "checked_out" || selectedStatus === "cancelled") && (
                        <button
                          onClick={() => setViewInvoice(b)}
                          className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 bg-slate-600"
                        >
                          Xem hóa đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Consolidated Multi-Room Cart Card
          return (
            <div key={grp.key} className="bg-white rounded-xl p-5 shadow-md border-2 border-blue-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-700 text-white flex items-center gap-1.5 shadow-sm">
                      🛒 ĐƠN GIỎ HÀNG ĐOÀN ({grp.bookings.length} PHÒNG)
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-900 border border-blue-300">
                      Mã chính: #{grp.primary.id.toUpperCase()}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      ✓ {grp.activeBookings.length} phòng đang hoạt động
                    </span>
                    {grp.cancelledBookings.length > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-300">
                        🚫 {grp.cancelledBookings.length} phòng đã hủy
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mt-2 flex items-center gap-2 flex-wrap">
                    <span>👤 Trưởng đoàn: {grp.primary.customerName}</span>
                    <span className="text-xs font-normal text-gray-600">📞 {grp.primary.customerPhone} | 📧 {grp.primary.customerEmail}</span>
                  </h3>
                </div>
              </div>

              {/* Group Financial Summary */}
              <div className="my-3 p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px] font-medium">TỔNG ĐƠN BAN ĐẦU ({grp.bookings.length} PHÒNG):</span>
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
                  <span className="text-gray-500 block text-[11px] font-medium">CÒN LẠI THU KHI CHECK-IN ({grp.activeBookings.length} PHÒNG KHẢ DỤNG):</span>
                  <span className="font-extrabold text-red-600 text-sm">{formatPrice(grp.activeRemaining)}</span>
                </div>
              </div>

              {/* Rooms list inside group */}
              <div className="space-y-2.5 mt-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Danh sách chi tiết từng phòng trong đoàn:</p>
                {grp.bookings.map((b, idx) => (
                  <div key={b.id} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${b.status === 'cancelled' ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">Phòng {idx + 1}: {b.roomNumber} ({roomTypeLabels[b.roomType] || b.roomType})</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                          background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'checked_in' ? '#dbeafe' : b.status === 'checked_out' ? '#f1f5f9' : '#ffe4e6',
                          color: b.status === 'confirmed' ? '#166534' : b.status === 'checked_in' ? '#1e40af' : b.status === 'checked_out' ? '#475569' : '#991b1b',
                        }}>
                          {bookingStatusLabels[b.status] || b.status}
                        </span>
                        {(() => {
                          const lateInfo = checkLateCheckinStatus(b);
                          if (!lateInfo) return null;
                          return (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 border animate-pulse ${
                              lateInfo.severity === 'high' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {lateInfo.message}
                            </span>
                          );
                        })()}
                        <span className="text-xs font-medium text-gray-400">Mã đơn phòng: #{b.id}</span>
                      </div>
                      {(() => {
                        const lateInfo = checkLateCheckinStatus(b);
                        if (!lateInfo) return null;
                        return (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span>{lateInfo.detail}</span>
                          </div>
                        );
                      })()}
                      <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          📅 Lưu trú: {formatDate(b.checkIn)} → {formatDate(b.checkOut)} ({calcNights(b.checkIn, b.checkOut)} đêm)
                        </span>
                        <span>Giá phòng: {formatPrice(b.totalPrice)}</span>
                        <span>Đã cọc: {formatPrice(b.soTienDaCoc)}</span>
                        {b.status !== 'cancelled' && (
                          <span className="font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                            💳 Còn thu phòng này: {formatPrice(Math.max(0, (b.totalPrice || 0) - (b.soTienDaCoc || 0)))}
                          </span>
                        )}
                        <span>Sức chứa: {b.guests} khách</span>
                      </div>
                    </div>

                    {/* Action buttons per room */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(b.status === 'confirmed' || b.status === 'pending') && (
                        <>
                          <button
                            onClick={() => startCheckin(b)}
                            className="px-3.5 py-1.5 rounded-lg text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            Nhận phòng
                          </button>
                          <button
                            onClick={() => handleCancelClick(b, grp.primary.customerName)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                          >
                            🔴 Hủy riêng phòng này
                          </button>
                        </>
                      )}
                      {b.status === 'checked_in' && (
                        <>
                          <button
                            onClick={() => setViewInvoice(b)}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs hover:bg-gray-50 text-gray-700 bg-white font-medium"
                          >
                            📄 Hóa đơn
                          </button>
                          <button
                            onClick={() => {
                              setWaiveLateSurcharge(false);
                              setWaiveEarlyCheckoutFee(false);
                              setConfirm({ id: b.id, action: "checkout" });
                            }}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-slate-800 hover:bg-slate-900 transition-colors"
                          >
                            Trả phòng
                          </button>
                        </>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="text-xs text-rose-600 font-bold bg-rose-100/80 px-2.5 py-1 rounded-lg border border-rose-200">
                          🚫 Đã hủy riêng (Trừ cọc {formatPrice(b.soTienDaCoc)})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {/* Confirm modal */}
      {confirm && confirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5" style={{ background: confirm.action === "checkin" ? "#dcfce7" : "#e0f2fe" }}>
                {confirm.action === "checkin" ? <UserCheck className="w-6 h-6 text-green-600" /> : <UserX className="w-6 h-6 text-blue-900" />}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                {confirm.action === "checkin" ? "Thủ tục Nhận phòng (Check-in)" : "Quyết toán & Trả phòng (Check-out)"}
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Khách: <strong className="text-gray-800">{confirmBooking.customerName}</strong> | Phòng: <strong className="text-blue-900">{confirmBooking.roomNumber}</strong> ({roomTypeLabels[confirmBooking.roomType] || confirmBooking.roomType})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 text-sm space-y-4">
              {confirm.action === "checkin" ? (
                <>
                  {(() => {
                    const lateInfo = checkLateCheckinStatus(confirmBooking);
                    if (!lateInfo) return null;
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                        <p className="font-extrabold flex items-center gap-1.5 text-red-700">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          {lateInfo.message}
                        </p>
                        <p className="leading-relaxed font-medium">{lateInfo.detail}</p>
                      </div>
                    );
                  })()}

                  {(() => {
                    const remainingInfo = getRemainingStayInfo(confirmBooking);
                    if (!remainingInfo) return null;
                    return (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1 shadow-xs">
                        <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          {remainingInfo.message}
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                          👉 Lễ tân vui lòng nhắc khách: Giờ trả phòng tiêu chuẩn là <strong>12:00 PM hôm nay ({formatDate(confirmBooking.checkOut)})</strong>. Nếu khách muốn ở thêm, tư vấn khách gia hạn thêm đêm mới hoặc đăng ký Trả phòng muộn (Late Check-out).
                        </p>
                      </div>
                    );
                  })()}

                  {/* Gán phòng vật lý */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
                    <p className="font-bold text-gray-800 border-b pb-1.5">1. Phân phòng vật lý</p>
                    {(() => {
                      const assignedRoom = rooms.find(r => String(r.id) === String(confirmBooking.roomId));
                      const bookingLocation = assignedRoom ? assignedRoom.location : "TP. Hồ Chí Minh";
                      const vacantRooms = rooms.filter(r => r.status === "available" && r.type === confirmBooking.roomType && r.location === bookingLocation);
                      if (vacantRooms.length === 0) {
                        return (
                          <p className="text-red-500 font-semibold text-xs py-1">
                            ⚠️ Hết phòng trống thuộc hạng này tại chi nhánh {bookingLocation}! Vui lòng chuẩn bị phòng trống trước.
                          </p>
                        );
                      }
                      return (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Chi nhánh: <strong className="text-blue-900">{bookingLocation}</strong></p>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Chọn phòng trống</label>
                          <select
                            value={selectedRoomId}
                            onChange={e => setSelectedRoomId(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
                          >
                            {vacantRooms.map(r => (
                              <option key={r.id} value={r.id}>
                                Phòng {r.number} (Tầng {r.floor} · {r.area}m²)
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Khai báo hành khách đi kèm nếu >= 2 khách */}
                  {confirmBooking.guests >= 2 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
                      <p className="font-bold text-gray-800 border-b pb-1.5">2. Khai báo hành khách đi kèm (Yêu cầu)</p>
                      <p className="text-xs text-gray-400">Đơn đặt gồm {confirmBooking.guests} khách. Vui lòng khai báo thông tin cho {confirmBooking.guests - 1} khách đi kèm:</p>
                      
                      <div className="space-y-3 divide-y divide-gray-200">
                        {accompanyingGuests.map((guest, idx) => (
                          <div key={idx} className="pt-3 space-y-2.5 first:pt-0 first:divide-none">
                            <p className="font-semibold text-xs text-blue-900">Khách đi kèm thứ {idx + 2}</p>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <input
                                  type="text"
                                  placeholder="Họ và tên đầy đủ (Ví dụ: Nguyễn Văn B)..."
                                  value={guest.name}
                                  onChange={e => {
                                    const updated = [...accompanyingGuests];
                                    updated[idx].name = e.target.value;
                                    setAccompanyingGuests(updated);
                                  }}
                                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors ${
                                    guest.name.trim() !== "" && (guest.name.trim().split(/\s+/).filter(Boolean).length < 2 || /\d/.test(guest.name))
                                      ? "border-red-400 bg-red-50/20 text-red-900"
                                      : "border-gray-200"
                                  }`}
                                />
                                {guest.name.trim() !== "" && (guest.name.trim().split(/\s+/).filter(Boolean).length < 2 || /\d/.test(guest.name)) && (
                                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 2 từ, không chứa số).</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="CCCD/Hộ chiếu (9-12 số)..."
                                    value={guest.idCard}
                                    onChange={e => {
                                      const updated = [...accompanyingGuests];
                                      updated[idx].idCard = e.target.value;
                                      setAccompanyingGuests(updated);
                                    }}
                                    className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors ${
                                      guest.idCard.trim() !== "" && !(/^[0-9]{9,12}$/.test(guest.idCard.trim()) || /^[A-Z0-9]{6,12}$/i.test(guest.idCard.trim()))
                                        ? "border-red-400 bg-red-50/20 text-red-900"
                                        : "border-gray-200"
                                    }`}
                                  />
                                  {guest.idCard.trim() !== "" && !(/^[0-9]{9,12}$/.test(guest.idCard.trim()) || /^[A-Z0-9]{6,12}$/i.test(guest.idCard.trim())) && (
                                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ CCCD phải gồm 9-12 số hoặc Hộ chiếu hợp lệ.</p>
                                  )}
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="SĐT liên lạc (10 số)..."
                                    value={guest.phone}
                                    onChange={e => {
                                      const updated = [...accompanyingGuests];
                                      updated[idx].phone = e.target.value;
                                      setAccompanyingGuests(updated);
                                    }}
                                    className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors ${
                                      guest.phone.trim() !== "" && !/^[0-9]{10}$/.test(guest.phone.trim())
                                        ? "border-red-400 bg-red-50/20 text-red-900"
                                        : "border-gray-200"
                                    }`}
                                  />
                                  {guest.phone.trim() !== "" && !/^[0-9]{10}$/.test(guest.phone.trim()) && (
                                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ SĐT phải gồm đúng 10 số.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thanh toán & Đặt cọc lúc Check-in */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
                    <p className="font-bold text-gray-800 border-b pb-1.5 flex items-center justify-between">
                      <span>3. Bảng quyết toán & Thu tiền Check-in</span>
                      {(() => {
                        const lateInfo = checkLateCheckinStatus(confirmBooking);
                        if (lateInfo?.isLate) {
                          return <span className="text-[11px] font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">⚠️ ĐƠN TRỄ CHECK-IN 1 NGÀY</span>;
                        }
                        return null;
                      })()}
                    </p>
                    {(() => {
                      const isPrepaid = confirmBooking.rawStatus === "Da_Thanh_Toan";
                      const daCoc = confirmBooking.soTienDaCoc || 0;
                      const conLaiPhaiThu = Math.max(0, confirmBooking.totalPrice - daCoc);
                      const lateInfo = checkLateCheckinStatus(confirmBooking);

                      return (
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-150">
                            <span className="font-semibold text-gray-500">Trạng thái thanh toán:</span>
                            {isPrepaid ? (
                              <span className="px-2 py-0.5 rounded-md font-bold text-green-700 bg-green-50 border border-green-200">ĐÃ THANH TOÁN 100% (ONLINE)</span>
                            ) : daCoc > 0 ? (
                              <span className="px-2 py-0.5 rounded-md font-bold text-amber-700 bg-amber-50 border border-amber-200">ĐÃ CỌC ONLINE ({confirmBooking.phanTramDatCoc || 50}%)</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md font-bold text-orange-600 bg-orange-50 border border-orange-200">CHƯA THANH TOÁN</span>
                            )}
                          </div>

                          {!isPrepaid && (
                            <div className="space-y-2 bg-red-50/70 p-3.5 rounded-xl border border-red-200">
                              <div className="flex justify-between text-gray-700 font-medium">
                                <span>Tổng tiền phòng hợp đồng ({calcNights(confirmBooking.checkIn, confirmBooking.checkOut)} đêm):</span>
                                <span className="font-bold text-gray-900">{formatPrice(confirmBooking.totalPrice)}</span>
                              </div>

                              {daCoc > 0 && (
                                <div className="flex justify-between text-emerald-700 font-bold">
                                  <span>Đã cọc online VNPay ({confirmBooking.phanTramDatCoc || 50}%):</span>
                                  <span>-{formatPrice(daCoc)}</span>
                                </div>
                              )}

                              {lateInfo?.isLate && (
                                <div className="p-2 bg-white rounded-lg border border-red-200 text-[11px] text-red-800 space-y-0.5">
                                  <p className="font-bold text-red-900">📌 Ghi chú lưu trú trễ:</p>
                                  <p>Khách nhận phòng trễ 1 ngày (Đêm {formatDate(confirmBooking.checkIn)} khách sạn đã giữ phòng và tính 100% tiền phòng theo đúng hợp đồng). Không phát sinh phí phạt thêm.</p>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2 border-t border-red-200 text-red-950 font-extrabold text-sm">
                                <span className="text-red-900">💳 CẦN THU TẠI QUẦY KHI CHECK-IN:</span>
                                <span className="text-red-600 text-lg">{formatPrice(conLaiPhaiThu)}</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-500">Tiền cọc minibar/phát sinh (đ)</label>
                            <input
                              type="number"
                              value={depositAmount}
                              onChange={e => setDepositAmount(Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            />
                            <p className="text-[10px] text-gray-400 italic">Đặt cọc dự phòng để trừ các dịch vụ gia tăng hoặc phụ thu checkout muộn.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-500">Phương thức thanh toán</label>
                            <select
                              value={depositPaymentMethod}
                              onChange={e => setDepositPaymentMethod(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                              <option value="OFFLINE">Trực tiếp tại quầy (OFFLINE - Lễ tân thu)</option>
                              <option value="VNPAY">VNPAY (Chuyển khoản QR)</option>
                            </select>
                          </div>

                          {depositPaymentMethod === "VNPAY" && (() => {
                            const tongThuAtQuay = conLaiPhaiThu + depositAmount;
                            const roomCode = confirmBooking.roomNumber || 'SG0101';
                            const codeClean = (confirmBooking.id || 'BOOKING').substring(0, 6).toUpperCase();
                            const memoText = encodeURIComponent(`TT PHONG ${roomCode} ${codeClean}`);
                            const qrUrl = `https://img.vietqr.io/image/MB-0901111222-compact2.png?amount=${tongThuAtQuay}&addInfo=${memoText}&accountName=KHACH%20SAN%20MARRIOTT`;

                            return (
                              <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-xl space-y-3 text-center animate-fadeIn mt-3 shadow-xs">
                                <p className="text-xs font-bold text-blue-950 flex items-center justify-center gap-1.5">
                                  <QrCode className="w-4 h-4 text-blue-900" /> Mã QR Thanh Toán VNPay / VietQR Trực Tiếp
                                </p>
                                <div className="bg-white p-3 rounded-xl border border-blue-100 inline-block shadow-sm">
                                  <img 
                                    src={qrUrl} 
                                    alt="Mã QR VietQR/VNPay" 
                                    className="w-44 h-44 object-contain mx-auto rounded-lg"
                                  />
                                  <p className="text-[10px] text-gray-500 mt-1.5 font-semibold">MB Bank · STK: <strong className="text-gray-900">0901111222</strong></p>
                                  <p className="text-[10px] text-blue-900 font-bold">Chủ tài khoản: KHACH SAN MARRIOTT</p>
                                </div>
                                <div className="text-xs text-blue-900 font-medium space-y-1 bg-white p-2.5 rounded-lg border border-blue-100 text-left">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Số tiền cần quét QR:</span>
                                    <strong className="text-red-600 font-extrabold text-sm">{formatPrice(tongThuAtQuay)}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Nội dung chuyển khoản:</span>
                                    <strong className="text-blue-950 font-mono text-[11px]">TT PHONG {roomCode} #{codeClean}</strong>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-500 italic">
                                  Lễ tân hướng dẫn khách dùng App Ngân hàng hoặc Ví VNPay quét mã QR trên để hoàn tất thanh toán.
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                /* Checkout surcharge calculations */
                (() => {
                  const baseSurcharge = calculateSurcharge(confirmBooking);
                  const surchargeAmount = waiveLateSurcharge ? 0 : baseSurcharge.surchargeAmount;
                  const lateType = baseSurcharge.lateType;
                  
                  const localDate = new Date();
                  const yyyy = localDate.getFullYear();
                  const mm = String(localDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(localDate.getDate()).padStart(2, '0');
                  const todayStr = `${yyyy}-${mm}-${dd}`;

                  const originalNights = calcNights(confirmBooking.checkIn, confirmBooking.checkOut) || 1;
                  const isEarlyCheckout = todayStr < confirmBooking.checkOut;
                  const actualNights = isEarlyCheckout ? (calcNights(confirmBooking.checkIn, todayStr) || 1) : originalNights;
                  const earlyNights = Math.max(0, originalNights - actualNights);

                  const roomChargeOriginal = confirmBooking.tongTienPhong || confirmBooking.totalPrice;
                  const pricePerNight = roomChargeOriginal / originalNights;

                  const actualRoomCharge = isEarlyCheckout ? (pricePerNight * actualNights) : roomChargeOriginal;
                  // 🛡️ CHỈ TÍNH PHỤ THU NẾU CÒN ĐÊM CHƯA Ở (earlyNights > 0) VÀ KHÔNG VƯỢT QUÁ GIÁ NGUYÊN BẢN
                  const earlyDeparturePenaltyFee = (isEarlyCheckout && earlyNights > 0 && !waiveEarlyCheckoutFee) ? pricePerNight : 0;
                  const roomChargeFinal = (isEarlyCheckout && earlyNights > 0) ? Math.min(roomChargeOriginal, actualRoomCharge + earlyDeparturePenaltyFee) : roomChargeOriginal;

                  const servicesList = parseServicesFromNotes(confirmBooking.notes);
                  const servicesTotal = servicesList.reduce((sum: number, s: any) => sum + s.price, 0);

                  const checkinDeposit = parseDepositFromNotes(confirmBooking.notes);
                  const roomPaidAtCheckin = parseRoomPaidFromNotes(confirmBooking.notes);
                  const onlineDeposit = confirmBooking.soTienDaCoc || 0;

                  let totalRoomPaid = onlineDeposit;
                  if (roomPaidAtCheckin > 0) {
                    if (roomPaidAtCheckin >= roomChargeOriginal) {
                      totalRoomPaid = roomPaidAtCheckin;
                    } else {
                      totalRoomPaid = onlineDeposit + roomPaidAtCheckin;
                    }
                  } else if (confirmBooking.rawStatus === "Da_Thanh_Toan" || confirmBooking.status === "checked_in") {
                    totalRoomPaid = roomChargeOriginal;
                  }

                  const totalDepositPaid = totalRoomPaid + checkinDeposit;

                  const totalBillFinal = roomChargeFinal + servicesTotal + surchargeAmount;
                  const netPayable = totalBillFinal - totalDepositPaid;

                  return (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-2">
                      <p className="font-bold text-gray-800 border-b pb-1.5 mb-2">Chi tiết thanh toán Trả phòng</p>
                      
                      {isEarlyCheckout && earlyNights > 0 ? (
                        <div className="space-y-1.5 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                          <p className="font-bold text-blue-900 text-xs uppercase flex items-center gap-1">
                            ⚡ Trả phòng sớm ({actualNights} đêm thực ở / Hủy trễ {earlyNights} đêm)
                          </p>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Tiền phòng {actualNights} đêm thực ở ({formatDate(confirmBooking.checkIn)} → {formatDate(todayStr)}):</span>
                            <span className="font-semibold text-gray-900">{formatPrice(actualRoomCharge)}</span>
                          </div>
                          <div className="pt-1 border-t border-blue-200/60">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id="waiveEarlyFee"
                                checked={waiveEarlyCheckoutFee} 
                                onChange={e => setWaiveEarlyCheckoutFee(e.target.checked)} 
                                className="accent-blue-900"
                              />
                              <label htmlFor="waiveEarlyFee" className="text-xs font-semibold text-blue-950 cursor-pointer">
                                Miễn phụ thu trả phòng sớm (1 đêm)
                              </label>
                            </div>
                            {!waiveEarlyCheckoutFee ? (
                              <div className="flex justify-between text-red-600 font-semibold text-xs mt-1">
                                <span>Phụ thu trả phòng sớm sát giờ (1 đêm):</span>
                                <span>+{formatPrice(pricePerNight)}</span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-green-600 font-semibold mt-0.5">✓ Đã miễn trừ phụ thu trả phòng sớm</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tiền phòng ({originalNights} đêm):</span>
                          <span className="font-medium text-gray-950">{formatPrice(roomChargeOriginal)}</span>
                        </div>
                      )}

                      {servicesList.length > 0 && (
                        <div className="space-y-1 pl-3 border-l-2 border-blue-100 my-1 bg-white/50 p-2 rounded-lg">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dịch vụ phát sinh:</p>
                          {servicesList.map((srv: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-500">{srv.name}</span>
                              <span className="text-gray-700 font-medium">{formatPrice(srv.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {baseSurcharge.surchargeAmount > 0 && (
                        <div className="pt-2 border-t border-dashed space-y-2">
                          <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <input 
                              type="checkbox" 
                              id="waiveLateCheckbox"
                              checked={waiveLateSurcharge} 
                              onChange={e => setWaiveLateSurcharge(e.target.checked)} 
                              className="accent-blue-900"
                            />
                            <label htmlFor="waiveLateCheckbox" className="text-xs font-semibold text-amber-900 cursor-pointer">
                              Miễn phụ thu checkout trễ
                            </label>
                          </div>
                          
                          {!waiveLateSurcharge ? (
                            <div>
                              <div className="flex justify-between text-red-600 font-semibold">
                                <span>Phụ thu trễ ({baseSurcharge.surchargePct}%):</span>
                                <span>+{formatPrice(baseSurcharge.surchargeAmount)}</span>
                              </div>
                              <p className="text-[11px] text-red-500 italic mt-0.5">Lý do: {lateType}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-green-600 font-semibold">✓ Đã miễn trừ phụ thu trễ theo yêu cầu</p>
                          )}
                        </div>
                      )}

                      {baseSurcharge.surchargeAmount === 0 && (
                        <div className="py-1">
                          <p className="text-xs text-green-600 font-semibold">✓ Đúng giờ (miễn phụ thu checkout trễ)</p>
                        </div>
                      )}

                      <div className="space-y-1 border-t border-dashed pt-2 text-xs">
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Tiền phòng đã thanh toán (Online + Lúc Check-in):</span>
                          <span>-{formatPrice(totalRoomPaid)}</span>
                        </div>
                        {checkinDeposit > 0 && (
                          <div className="flex justify-between text-blue-700 font-semibold">
                            <span>Tiền cọc minibar/phát sinh (lúc Check-in):</span>
                            <span>-{formatPrice(checkinDeposit)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between border-t-2 pt-2 mt-2 font-bold text-gray-950 text-base">
                        <span>Tổng tiền hóa đơn cuối:</span>
                        <span style={{ color: "#1a3a5c" }}>{formatPrice(totalBillFinal)}</span>
                      </div>

                      <div className={`p-3 rounded-lg flex justify-between font-bold text-xs mt-3 border ${
                        netPayable >= 0 ? "bg-blue-50 border-blue-200" : "bg-emerald-50 border-emerald-200"
                      }`}>
                        {netPayable >= 0 ? (
                          <>
                            <span className="text-blue-900">Khách cần thanh toán thêm tại quầy:</span>
                            <span className="text-blue-950 text-base">{formatPrice(netPayable)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-800">Hoàn trả tiền cọc thừa cho khách:</span>
                            <span className="text-emerald-950 text-base">{formatPrice(Math.abs(netPayable))}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium">Hủy</button>
              <button
                onClick={() => {
                  if (confirm.action === "checkout") {
                    const baseSurcharge = calculateSurcharge(confirmBooking);
                    const surchargeAmount = waiveLateSurcharge ? 0 : baseSurcharge.surchargeAmount;
                    const lateType = baseSurcharge.lateType;
                    const servicesList = parseServicesFromNotes(confirmBooking.notes);
                    const servicesTotal = servicesList.reduce((sum, s) => sum + s.price, 0);

                    const localDate = new Date();
                    const yyyy = localDate.getFullYear();
                    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(localDate.getDate()).padStart(2, '0');
                    const todayStr = `${yyyy}-${mm}-${dd}`;

                    const originalNights = calcNights(confirmBooking.checkIn, confirmBooking.checkOut) || 1;
                    const isEarlyCheckout = todayStr < confirmBooking.checkOut;
                    const actualNights = isEarlyCheckout ? (calcNights(confirmBooking.checkIn, todayStr) || 1) : originalNights;
                    const earlyNights = Math.max(0, originalNights - actualNights);

                    const roomChargeOriginal = confirmBooking.tongTienPhong || confirmBooking.totalPrice;
                    const pricePerNight = roomChargeOriginal / originalNights;

                    const actualRoomCharge = isEarlyCheckout ? (pricePerNight * actualNights) : roomChargeOriginal;
                    const earlyDeparturePenaltyFee = (isEarlyCheckout && earlyNights > 0 && !waiveEarlyCheckoutFee) ? pricePerNight : 0;
                    const roomChargeFinal = (isEarlyCheckout && earlyNights > 0) ? Math.min(roomChargeOriginal, actualRoomCharge + earlyDeparturePenaltyFee) : roomChargeOriginal;

                    const totalBillFinal = roomChargeFinal + servicesTotal + surchargeAmount;
                    const checkinDeposit = parseDepositFromNotes(confirmBooking.notes);
                    const roomPaidAtCheckin = parseRoomPaidFromNotes(confirmBooking.notes);
                    const onlineDeposit = confirmBooking.soTienDaCoc || 0;

                    let totalRoomPaid = onlineDeposit;
                    if (roomPaidAtCheckin > 0) {
                      if (roomPaidAtCheckin >= roomChargeOriginal) {
                        totalRoomPaid = roomPaidAtCheckin;
                      } else {
                        totalRoomPaid = onlineDeposit + roomPaidAtCheckin;
                      }
                    } else if (confirmBooking.rawStatus === "Da_Thanh_Toan" || confirmBooking.status === "checked_in") {
                      totalRoomPaid = roomChargeOriginal;
                    }

                    const totalDepositPaid = totalRoomPaid + checkinDeposit;
                    const netPayable = totalBillFinal - totalDepositPaid;

                    const staffName = currentUser?.name || "Lễ tân";
                    let checkoutNote = `[Check-out: ${netPayable >= 0 ? `Khách thanh toán thêm tại quầy ${formatPrice(netPayable)}` : `Hoàn trả cọc thừa ${formatPrice(Math.abs(netPayable))}`} | NV Check-out: ${staffName}]`;
                    if (isEarlyCheckout && earlyNights > 0) {
                      checkoutNote += ` | [Trả phòng sớm: Ở ${actualNights}/${originalNights} đêm${earlyDeparturePenaltyFee > 0 ? `, Phụ thu 1 đêm: ${formatPrice(earlyDeparturePenaltyFee)}` : ' (Miễn phụ thu)'}]`;
                    }
                    if (waiveLateSurcharge && baseSurcharge.surchargeAmount > 0) {
                      checkoutNote += ` | [Miễn phụ thu checkout trễ: ${formatPrice(baseSurcharge.surchargeAmount)}]`;
                    }

                    handleAction(
                      confirm.id,
                      confirm.action,
                      totalBillFinal,
                      surchargeAmount > 0 ? `Phụ thu checkout muộn: +${formatPrice(surchargeAmount)} (${lateType}) | ${checkoutNote}` : checkoutNote
                    );
                  } else {
                    handleConfirmCheckin(confirmBooking);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-bold shadow-md hover:opacity-95 transition-all"
                style={{ background: confirm.action === "checkin" ? "#22c55e" : "#1a3a5c" }}
              >
                {confirm.action === "checkin" ? "Xác nhận nhận phòng" : "Xác nhận trả phòng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">HÓA ĐƠN CHI TIẾT</h3>
              <button onClick={() => setViewInvoice(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
              <div className="text-center pb-2 border-b border-dashed border-gray-200">
                <p className="font-bold text-base text-gray-800">KHÁCH SẠN MARRIOTT</p>
                <p className="text-xs text-gray-500">Nhiều vị trí đắc địa trên toàn quốc</p>
                <p className="text-xs text-gray-500 mt-1">Mã hóa đơn: #{viewInvoice.id.toUpperCase()}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3 border-gray-100">
                <div>
                  <p className="text-gray-400">Khách hàng:</p>
                  <p className="font-semibold text-gray-800">{viewInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Điện thoại:</p>
                  <p className="font-semibold text-gray-800">{viewInvoice.customerPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Thời gian lưu trú:</p>
                  <p className="font-semibold text-gray-800">
                    Phòng {viewInvoice.roomNumber} ({roomTypeLabels[viewInvoice.roomType] || viewInvoice.roomType}) <br />
                    {formatDate(viewInvoice.checkIn)} → {formatDate(viewInvoice.checkOut)} ({calcNights(viewInvoice.checkIn, viewInvoice.checkOut)} đêm)
                  </p>
                </div>
              </div>

              {(() => {
                const nights = calcNights(viewInvoice.checkIn, viewInvoice.checkOut) || 1;
                const roomCharge = viewInvoice.tongTienPhong || viewInvoice.totalPrice;
                const servicesList = parseServicesFromNotes(viewInvoice.notes);
                const servicesTotal = servicesList.reduce((sum: number, s: any) => sum + s.price, 0);
                const discountAmount = Math.max(0, (viewInvoice.tongTienPhong ? (viewInvoice.tongTienPhong + servicesTotal - viewInvoice.totalPrice) : 0));
                
                let surchargeAmount = 0;
                let lateReason = "";
                if (viewInvoice.notes) {
                  const match = viewInvoice.notes.match(/Phụ thu checkout muộn:\s*\+([\d.,]+)\s*₫\s*\(([^)]+)\)/i);
                  if (match) {
                    surchargeAmount = Number(match[1].replace(/[.,]/g, ""));
                    lateReason = match[2];
                  }
                }

                const finalAmount = viewInvoice.totalPrice + surchargeAmount;
                const daCoc = viewInvoice.soTienDaCoc || 0;
                const conLaiTruocCheckout = Math.max(0, finalAmount - daCoc);

                // Extract checkout notes (settlement & early checkout)
                const checkoutMatch = viewInvoice.notes ? viewInvoice.notes.match(/\[Check-out:\s*(.*?)\]/i) : null;
                const checkoutSettlementNote = checkoutMatch ? checkoutMatch[1] : null;

                const staffMatch = viewInvoice.notes ? viewInvoice.notes.match(/NV Check-out:\s*(.*?)(?:\]|$|\|)/i) : null;
                const checkoutStaffName = staffMatch ? staffMatch[1].trim() : (viewInvoice.staffName || null);

                const earlyMatch = viewInvoice.notes ? viewInvoice.notes.match(/\[Trả phòng sớm:\s*(.*?)\]/i) : null;
                const earlyCheckoutNote = earlyMatch ? earlyMatch[1] : null;

                return (
                  <div className="space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tiền phòng ({nights} đêm):</span>
                        <span className="font-semibold text-gray-900">{formatPrice(roomCharge)}</span>
                      </div>

                      {earlyCheckoutNote && (
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-900 text-[11px] font-medium">
                          ⚡ Ghi nhận Trả phòng sớm: {earlyCheckoutNote}
                        </div>
                      )}
                      
                      {servicesList.length > 0 && (
                        <div className="space-y-1 pl-3 border-l-2 border-blue-100 bg-gray-50 p-2 rounded-lg text-xs">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dịch vụ đã sử dụng:</p>
                          {servicesList.map((srv: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-gray-500">{srv.name}</span>
                              <span className="text-gray-700 font-semibold">{formatPrice(srv.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 text-xs">
                          <span>Chiết khấu khuyến mãi:</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}

                      {surchargeAmount > 0 && (
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-red-600 text-xs font-semibold">
                            <span>Phụ thu checkout trễ:</span>
                            <span>+{formatPrice(surchargeAmount)}</span>
                          </div>
                          <p className="text-[10px] text-red-500 italic text-right">Lý do: {lateReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-dashed pt-3 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-gray-900 text-sm">
                        <span>TỔNG GIÁ TRỊ HÓA ĐƠN:</span>
                        <span style={{ color: "#1a3a5c" }}>{formatPrice(finalAmount)}</span>
                      </div>

                      {daCoc > 0 ? (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Số tiền đã đặt cọc trước ({viewInvoice.phanTramDatCoc || 50}%):</span>
                          <span>-{formatPrice(daCoc)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-gray-500 italic">
                          <span>Tiền đặt cọc trước:</span>
                          <span>0 đ (Thanh toán 100% khi Check-in / Check-out)</span>
                        </div>
                      )}

                      {viewInvoice.status === "cancelled" ? (
                        <div className="bg-red-50 p-3 rounded-xl border border-red-200 space-y-1.5 text-red-900 mt-2">
                          <p className="font-bold text-xs uppercase flex items-center gap-1 text-red-800 border-b border-red-200 pb-1">
                            ✕ ĐƠN ĐẶT PHÒNG ĐÃ HỦY
                          </p>
                          <div className="flex justify-between text-xs">
                            <span>Mức phụ thu hủy phòng:</span>
                            <span className="font-semibold text-green-700">0 đ (Miễn 100% phụ thu)</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1.5 border-t border-red-200">
                            <span>Số tiền hoàn cọc cho khách:</span>
                            <span>{formatPrice(daCoc > 0 ? daCoc : viewInvoice.totalPrice)}</span>
                          </div>
                          <p className="text-[10px] text-red-600 italic">Trạng thái: Đã hoàn tất thủ tục hoàn tiền cọc cho khách hàng.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1.5">
                            <p className="font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 border-b border-emerald-200/80 pb-1">
                              ✓ NỘI DUNG QUYẾT TOÁN THANH TOÁN / HOÀN CỌC
                            </p>
                            {checkoutSettlementNote ? (
                              <p className="font-bold text-emerald-900">{checkoutSettlementNote}</p>
                            ) : daCoc > 0 ? (
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-gray-600">
                                  <span>Đã cọc online (VNPay 50%):</span>
                                  <span className="font-semibold text-emerald-700">{formatPrice(daCoc)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-900 pt-1 border-t border-emerald-200/60">
                                  <span>Đã thu bổ sung tại quầy khi Checkout:</span>
                                  <span>{formatPrice(Math.max(0, finalAmount - daCoc))}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between font-bold text-emerald-900 text-xs">
                                <span>Đã thanh toán 100% tại quầy khi Checkout:</span>
                                <span>{formatPrice(finalAmount)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-center font-bold text-xs uppercase tracking-wider shadow-sm">
                            ✓ ĐÃ THANH TOÁN & HOÀN TẤT QUYẾT TOÁN HÓA ĐƠN
                          </div>
                          {checkoutStaffName && (
                            <p className="text-[11px] text-gray-500 italic text-center mt-1">
                              👤 Lễ tân / NV thực hiện Check-out: <strong className="text-gray-800 font-semibold">{checkoutStaffName}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-xs hover:bg-gray-50 font-medium"
              >
                🖨️ In hóa đơn
              </button>
              <button
                onClick={() => setViewInvoice(null)}
                className="flex-1 py-2 rounded-lg text-white text-xs font-semibold"
                style={{ background: "#1a3a5c" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service modal */}
      {serviceModalBookingId && (() => {
        const targetBooking = bookings.find(b => b.id === serviceModalBookingId);
        if (!targetBooking) return null;

        const defaultPrices: Record<string, number> = {
          "giặt ủi": 100000,
          "massage": 500000,
          "ăn uống": 250000,
          "xe đưa đón": 300000,
          "khác": 200000
        };

        const handleTypeChange = (type: string) => {
          setSelectedServiceType(type);
          setServiceUnitPrice(defaultPrices[type] || 200000);
        };

        const handleAddServiceConfirm = async () => {
          const finalName = selectedServiceType === "khác" ? customServiceName.trim() : selectedServiceType.toUpperCase();
          if (selectedServiceType === "khác" && !finalName) {
            alert("Vui lòng nhập tên dịch vụ!");
            return;
          }

          const price = serviceUnitPrice * serviceQuantity;
          const serviceText = `Dịch vụ thêm: ${finalName} (${price}đ)`;
          
          const originalNotes = targetBooking.notes || "";
          const updatedNotes = originalNotes ? `${originalNotes} | ${serviceText}` : serviceText;
          const newTotalPrice = targetBooking.totalPrice + price;

          try {
            await updateBooking(targetBooking.id, {
              notes: updatedNotes,
              totalPrice: newTotalPrice
            });
            alert(`Đã thêm dịch vụ và cộng thêm ${formatPrice(price)} vào tổng hóa đơn!`);
            setServiceModalBookingId(null);
          } catch (err) {
            console.error(err);
            alert("Không thể thêm dịch vụ!");
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Gọi dịch vụ lưu trú</h3>
              <p className="text-sm text-gray-500">Khách: <strong>{targetBooking.customerName}</strong> (Phòng {targetBooking.roomNumber})</p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Loại dịch vụ</label>
                  <select
                    value={selectedServiceType}
                    onChange={e => handleTypeChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="giặt ủi">Giặt ủi cấp tốc (100.000đ)</option>
                    <option value="massage">Massage & Spa (500.000đ)</option>
                    <option value="ăn uống">Ăn tại phòng - Room Service (250.000đ)</option>
                    <option value="xe đưa đón">Xe đưa đón sân bay (300.000đ)</option>
                    <option value="khác">Dịch vụ khác...</option>
                  </select>
                </div>

                {selectedServiceType === "khác" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tên dịch vụ khác</label>
                    <input
                      type="text"
                      placeholder="Nhập tên dịch vụ..."
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Đơn giá (đ)</label>
                    <input
                      type="number"
                      value={serviceUnitPrice}
                      onChange={e => setServiceUnitPrice(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng</label>
                    <input
                      type="number"
                      min={1}
                      value={serviceQuantity}
                      onChange={e => setServiceQuantity(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between font-bold text-blue-900 mt-2">
                  <span>Tổng tiền dịch vụ:</span>
                  <span>{formatPrice(serviceUnitPrice * serviceQuantity)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setServiceModalBookingId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddServiceConfirm}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold"
                  style={{ background: "#1a3a5c" }}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Accompanying Guests Detail Modal */}
      {viewRoomGuestsBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                👥 Khách lưu trú - Phòng {viewRoomGuestsBooking.roomNumber}
              </h3>
              <button onClick={() => setViewRoomGuestsBooking(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Khách chính */}
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1">Khách chính (Người đặt đơn)</p>
                <p className="font-bold text-gray-900 text-base">{viewRoomGuestsBooking.customerName}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                  <p>📞 SĐT: <strong className="text-gray-800">{viewRoomGuestsBooking.customerPhone}</strong></p>
                  <p>📧 Email: <strong className="text-gray-800">{viewRoomGuestsBooking.customerEmail || "(Không có)"}</strong></p>
                </div>
              </div>

              {/* Khách đi kèm */}
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Khách đi kèm (Khai báo tạm trú)</p>
                {(() => {
                  const accGuests = parseAccompanyingGuests(viewRoomGuestsBooking.notes);
                  if (accGuests.length === 0) {
                    return (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-150">
                        Chưa có thông tin khai báo khách đi kèm.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {accGuests.map((g, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-150 p-3 rounded-xl">
                          <p className="font-bold text-gray-800">{g.label}: {g.name}</p>
                          <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-gray-600">
                            <p>🪪 CCCD: <strong className="text-gray-800">{g.idCard}</strong></p>
                            <p>📞 SĐT: <strong className="text-gray-800">{g.phone || "(Không có)"}</strong></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button 
                onClick={() => setViewRoomGuestsBooking(null)} 
                className="px-5 py-2 rounded-xl text-white text-xs font-bold bg-slate-600 hover:bg-slate-700"
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
