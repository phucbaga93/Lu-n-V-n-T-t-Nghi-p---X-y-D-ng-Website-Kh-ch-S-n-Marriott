export type RoomType = "standard" | "superior" | "deluxe" | "suite" | "family";
export type RoomStatus = "available" | "occupied" | "maintenance" | "reserved" | "cleaning";
export type BookingStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled" | "pending";
export type UserRole = "customer" | "staff" | "admin";
export interface Room {
  id: string;
  number: string;
  type: RoomType;
  loai_phong_id?: number;
  floor: number;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  amenities: string[];
  description: string;
  imageUrl: string;
  area: number;
  typeName?: string;
  thoiGianConLaiDonDep?: string;
  thoiGianBaoTri?: string;
  services?: Array<{ name: string; type: string; price: number; included: boolean }>;
  images?: string[];
  location?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  avatar?: string;
  address?: string;
  idNumber?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
  staffId?: string;
  staffName?: string;
  maKhuyenMaiId?: string;
  tongTienPhong?: number;
  chiTietId?: number;
  createdAtFull?: string;
  rawStatus?: string;
  phanTramDatCoc?: number;
  soTienDaCoc?: number;
  payment_method?: string;
  chi_tiet_dat_phongs?: any[];
  lichSuHuyDons?: any[];
}

export const roomTypeLabels: Record<RoomType, string> = {
  standard: "Deluxe City View Room (STD)",
  superior: "Club Deluxe Premium View (SUP)",
  deluxe: "Executive Studio Suite (DLX)",
  suite: "Presidential Penthouse Suite (SUT)",
  family: "Family Premium Suite (FAM)",
};

export const maxChildrenPerRoomType: Record<RoomType, number> = {
  standard: 1,
  superior: 1,
  deluxe: 2,
  suite: 2,
  family: 3,
};

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã nhận phòng",
  checked_out: "Đã trả phòng",
  cancelled: "Đã hủy",
};

export function getUserAssignedLocation(user: any): { isGlobal: boolean; location: string; branchCode: string } {
  if (!user || user.role === "admin" || user.email === "admin@hotel.com" || user.email === "nhanvien@hotel.com") {
    return { isGlobal: true, location: "all", branchCode: "ALL" };
  }

  const email = (user.email || "").toUpperCase();
  if (email.includes(".DN@") || email.endsWith(".DN@HOTEL.COM")) {
    return { isGlobal: false, location: "Đà Nẵng", branchCode: "DN" };
  }
  if (email.includes(".PQ@") || email.endsWith(".PQ@HOTEL.COM")) {
    return { isGlobal: false, location: "Phú Quốc", branchCode: "PQ" };
  }
  if (email.includes(".HN@") || email.endsWith(".HN@HOTEL.COM")) {
    return { isGlobal: false, location: "Hà Nội", branchCode: "HN" };
  }
  if (email.includes(".SG@") || email.endsWith(".SG@HOTEL.COM")) {
    return { isGlobal: false, location: "TP. Hồ Chí Minh", branchCode: "SG" };
  }

  return { isGlobal: true, location: "all", branchCode: "ALL" };
}

export function getBookingLocation(b: any, rooms: any[]): string {
  if (!b) return "all";
  const byId = rooms.find(r => String(r.id) === String(b.roomId));
  if (byId && byId.location) return byId.location;

  if (b.roomNumber) {
    const byNum = rooms.find(r => String(r.number) === String(b.roomNumber));
    if (byNum && byNum.location) return byNum.location;
  }

  if (b.roomType) {
    const byType = rooms.find(r => r.type === b.roomType);
    if (byType && byType.location) return byType.location;
  }

  return "all";
}

export const roomStatusLabels: Record<RoomStatus, string> = {
  available: "Trống",
  occupied: "Đang sử dụng",
  maintenance: "Bảo trì",
  reserved: "Đã đặt",
  cleaning: "Dọn dẹp",
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 <= d1) return 0;
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getLocalToday(): string {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CartItem {
  id: string; // unique item id
  roomId: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  imageUrl: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  promoCode?: string;
  appliedPromo?: {
    code: string;
    discountAmount: number;
    description: string;
  };
}

export interface AvailablePromo {
  code: string;
  title: string;
  subtitle: string;
  badge: string;
  expiry: string;
  tagColor?: string;
}

export const AVAILABLE_PROMOTIONS: AvailablePromo[] = [
  {
    code: "SUMMER2026",
    title: "Nhập mã SUMMER2026 giảm ngay 100.000đ khi đặt phòng hôm nay!",
    subtitle: "Áp dụng cho mọi loại phòng, giảm trực tiếp 100k vào đơn đặt.",
    badge: "Giảm 100K",
    expiry: "31/12/2026",
    tagColor: "bg-amber-500 text-white"
  },
  {
    code: "HELLOSUMMER",
    title: "Ưu đãi mùa hè - Giảm ngay 10% tổng giá trị phòng",
    subtitle: "Chào hè rực rỡ giảm 10% tổng tiền phòng, tối đa 1.000.000đ.",
    badge: "Giảm 10%",
    expiry: "31/12/2026",
    tagColor: "bg-red-500 text-white"
  },
  {
    code: "WELCOME",
    title: "Chào mừng thành viên mới - Ưu đãi 50.000đ",
    subtitle: "Dành riêng cho khách hàng trải nghiệm đặt phòng lần đầu.",
    badge: "Giảm 50K",
    expiry: "31/12/2026",
    tagColor: "bg-blue-600 text-white"
  },
  {
    code: "SUITE20",
    title: "Ưu đãi đặc biệt phòng Suite - Giảm 200.000đ",
    subtitle: "Áp dụng cho các hạng phòng cao cấp (Executive Studio Suite & Penthouse).",
    badge: "Giảm 200K",
    expiry: "31/12/2026",
    tagColor: "bg-purple-600 text-white"
  },
  {
    code: "JWVIP20",
    title: "Ưu đãi tri ân thành viên VIP - Giảm 20% tiền phòng",
    subtitle: "Giảm tối đa 3.000.000đ cho khách hàng thành viên VIP.",
    badge: "Giảm 20%",
    expiry: "31/12/2026",
    tagColor: "bg-emerald-600 text-white"
  }
];

