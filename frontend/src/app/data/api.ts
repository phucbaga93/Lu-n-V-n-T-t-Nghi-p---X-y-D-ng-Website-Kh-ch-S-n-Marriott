import { Room, User, Booking, RoomType, RoomStatus, BookingStatus } from "./mockData";

const API_BASE = "http://localhost:8000/api/v1";

export function translateErrorMessage(rawMsg: string, errorData?: any): string {
  let msg = rawMsg || "";
  if (errorData && errorData.errors && typeof errorData.errors === "object") {
    const firstKey = Object.keys(errorData.errors)[0];
    if (firstKey && Array.isArray(errorData.errors[firstKey]) && errorData.errors[firstKey][0]) {
      msg = errorData.errors[firstKey][0];
    }
  }

  if (!msg) return "Đã xảy ra lỗi hệ thống. Vui lòng thử lại.";

  const lower = msg.toLowerCase();
  if (lower.includes("guest email") || lower.includes("guest_email")) {
    if (lower.includes("valid email") || lower.includes("email address")) return "Địa chỉ Email không hợp lệ. Vui lòng kiểm tra lại (ví dụ: ten@gmail.com).";
    if (lower.includes("required")) return "Vui lòng nhập địa chỉ Email khách hàng.";
  }
  if (lower.includes("guest phone") || lower.includes("guest_phone")) {
    if (lower.includes("required")) return "Vui lòng nhập số điện thoại liên hệ.";
    if (lower.includes("format") || lower.includes("regex") || lower.includes("invalid")) return "Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số.";
  }
  if (lower.includes("guest cccd") || lower.includes("guest_cccd") || lower.includes("id_card")) {
    if (lower.includes("required")) return "Vui lòng nhập số CCCD/CMND.";
  }
  if (lower.includes("guest name") || lower.includes("guest_name") || lower.includes("name field")) {
    if (lower.includes("required")) return "Vui lòng nhập đầy đủ họ và tên.";
  }
  if (lower.includes("ngay checkin") || lower.includes("checkin_date") || lower.includes("ngay_checkin")) {
    if (lower.includes("after or equal") || lower.includes("today")) return "Ngày nhận phòng (Check-in) không được nằm trong quá khứ.";
    if (lower.includes("before or equal")) return "Khách sạn chỉ hỗ trợ đặt phòng trước tối đa 6 tháng.";
    if (lower.includes("required")) return "Vui lòng chọn ngày nhận phòng (Check-in).";
  }
  if (lower.includes("ngay checkout") || lower.includes("checkout_date") || lower.includes("ngay_checkout")) {
    if (lower.includes("after")) return "Ngày trả phòng (Check-out) phải sau ngày nhận phòng.";
    if (lower.includes("required")) return "Vui lòng chọn ngày trả phòng (Check-out).";
  }
  if (lower.includes("selected ma code") || lower.includes("ma_khuyen_mai_id")) {
    return "Mã khuyến mãi không hợp lệ hoặc đã bị vô hiệu hóa.";
  }
  if (lower.includes("selected loai_phong_id") || lower.includes("loai_phong_id")) {
    return "Hạng phòng được chọn không khả dụng.";
  }
  if (lower.includes("email field must be a valid email")) {
    return "Địa chỉ Email không hợp lệ. Vui lòng kiểm tra lại (ví dụ: ten@gmail.com).";
  }

  return msg;
}

// Helper for HTTP requests
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const friendlyMsg = translateErrorMessage(errorData.message, errorData);
    throw new Error(friendlyMsg);
  }

  return response.json();
}

// Map Backend Room Category to UI RoomType
export function mapTenLoaiPhong(ten: string): RoomType {
  if (!ten) return "standard";
  const name = ten.toLowerCase();
  if (name.includes("fam") || name.includes("family")) return "family";
  if (name.includes("std") || name.includes("standard")) return "standard";
  if (name.includes("sup") || name.includes("superior")) return "superior";
  if (name.includes("dlx") || name.includes("deluxe")) return "deluxe";
  if (name.includes("sut") || name.includes("suite")) return "suite";
  return "standard";
}

// Map Backend Room Status to UI RoomStatus
function mapTrangThaiPhong(status: number): RoomStatus {
  switch (status) {
    case 0: return "available"; // Trong
    case 1: return "occupied";  // Dang su dung
    case 2: return "cleaning";  // Don dep
    case 3: return "maintenance"; // Bao tri
    default: return "available";
  }
}

// Default images & amenities based on RoomType
const defaultImages: Record<RoomType, string> = {
  standard: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80",
  superior: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80",
  deluxe: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&q=80",
  suite: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
  family: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
};

const defaultAmenities: Record<RoomType, string[]> = {
  standard: ["WiFi", "TV", "Điều hòa", "Tủ lạnh", "Tắm vòi hoa sen"],
  superior: ["WiFi", "TV", "Điều hòa", "Tủ lạnh", "Minibar", "Tắm vòi hoa sen"],
  deluxe: ["WiFi", "Smart TV", "Điều hòa", "Minibar", "Bồn tắm", "Ban công"],
  suite: ["WiFi", "Smart TV 65\"", "Điều hòa", "Minibar cao cấp", "Bồn spa", "Ban công rộng", "Phòng khách"],
  family: ["WiFi", "Smart TV", "Điều hòa", "Minibar", "2 Phòng ngủ", "Phòng khách"],
};

export const defaultGalleryImages: Record<RoomType, string[]> = {
  standard: [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&q=80"
  ],
  superior: [
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80",
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80"
  ],
  deluxe: [
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1200&q=80",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80"
  ],
  suite: [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"
  ],
  family: [
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80"
  ]
};

// Map Backend Phong Model to UI Room Model
export function mapPhongToRoom(phong: any): Room {
  const type = mapTenLoaiPhong(phong.loai_phong?.ten_loai_phong);
  const backendImages = phong.hinh_anh ? phong.hinh_anh.map((img: any) => img.url_hinh_anh || img.duong_dan_hinh_anh) : [];
  const roomImages = backendImages.length >= 3 ? backendImages : (backendImages.length > 0 ? [...backendImages, ...defaultGalleryImages[type]].slice(0, 3) : defaultGalleryImages[type]);

  return {
    id: String(phong.phong_id),
    number: phong.so_phong,
    type,
    floor: Math.floor(Number(phong.so_phong) / 100) || phong.tang || 1,
    capacity: phong.loai_phong?.so_khach_toi_da ?? 2,
    pricePerNight: Number(phong.loai_phong?.gia_theo_dem ?? 0),
    status: mapTrangThaiPhong(phong.trang_thai_hien_tai),
    loai_phong_id: phong.loai_phong_id,
    amenities: phong.danh_sach_tien_nghi || defaultAmenities[type],
    description: phong.mo_ta || phong.loai_phong?.mo_ta || "",
    imageUrl: roomImages[0],
    images: roomImages,
    area: phong.loai_phong?.dien_tich_m2 ?? 25,
    thoiGianConLaiDonDep: phong.thoi_gian_con_lai_don_dep || undefined,
    thoiGianBaoTri: phong.thoi_gian_bao_tri || undefined,
    services: phong.loai_phong?.dich_vu ? phong.loai_phong.dich_vu.map((d: any) => ({
      name: d.ten_dich_vu,
      type: d.loai_dich_vu,
      price: Number(d.gia_mac_dinh),
      included: !!d.pivot?.included,
    })) : [],
    location: phong.vi_tri || "TP. Hồ Chí Minh",
  };
}

// Map Backend User model to UI User Model
// =========================================================================
// MAPPING VAI TRÒ (Backend → Frontend):
//   'Admin'      → 'admin'    (quản trị viên toàn quyền)
//   'Le_Tan'     → 'staff'    (nhân viên lễ tân)
//   'Khach_Hang' → 'customer' (khách đặt phòng)
// =========================================================================
export function mapNguoiDungToUser(user: any): User {
  const email = user.email || "";
  const vaiTro = user.vai_tro || user.role || "";
  
  // Map trực tiếp từ vai_tro trong DB — không dùng email hack nữa
  let role: "customer" | "staff" | "admin" = "customer";
  if (vaiTro === "Admin" || vaiTro === "admin") {
    role = "admin";
  } else if (vaiTro === "Le_Tan" || vaiTro === "staff") {
    role = "staff";
  }

  return {
    id: String(user.nguoi_dung_id || user.id),
    name: user.ho_ten || user.name || "User",
    email,
    phone: user.so_dien_thoai || user.phone || "",
    role,
    password: user.mat_khau || user.password || "12345678",
    address: user.dia_chi || user.address || "",
    idNumber: user.cccd || user.id_card || "",
    createdAt: user.created_at ? user.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
  };
}


// Map Backend Booking Model to UI Booking Model
export function mapDonToBooking(don: any): Booking {
  const detail = don.chi_tiet_dat_phongs?.[0] || don.chi_tiet_dat_phong?.[0];
  let status: BookingStatus = "pending";
  const bs = don.trang_thai_don || don.status;
  if (bs === "Cho_Xac_Nhan" || bs === "pending") status = "pending";
  else if (bs === "Da_Xac_Nhan" || bs === "Da_Thanh_Toan" || bs === "confirmed") status = "confirmed";
  else if (bs === "Dang_O" || bs === "checked_in") status = "checked_in";
  else if (bs === "Da_Tra_Phong" || bs === "checked_out") status = "checked_out";
  else if (bs === "Da_Huy" || bs === "No_Show" || bs === "cancelled") status = "cancelled";

  return {
    id: String(don.don_dat_id || don.id),
    customerId: String(don.khach_hang_id),
    customerName: don.khach_hang?.ho_ten || don.customerName || "Khách hàng",
    customerPhone: don.khach_hang?.so_dien_thoai || don.customerPhone || "",
    customerEmail: don.khach_hang?.email || don.customerEmail || "",
    roomId: detail ? String(detail.phong_id) : "",
    roomNumber: detail?.phong?.so_phong || don.room_numbers || "Unassigned",
    roomType: detail?.phong?.loai_phong ? mapTenLoaiPhong(detail.phong.loai_phong.ten_loai_phong) : "standard",
    checkIn: (don.ngay_checkin || don.check_in || "").split(" ")[0].split("T")[0],
    checkOut: (don.ngay_checkout || don.check_out || "").split(" ")[0].split("T")[0],
    guests: (don.so_nguoi_lon ?? 1) + (don.so_tre_em ?? 0),
    totalPrice: Number(don.thanh_tien_cuoi ?? don.total_amount ?? 0),
    status,
    createdAt: don.ngay_dat_don ? don.ngay_dat_don.split(" ")[0] : (don.created_at ? don.created_at.split("T")[0] : ""),
    createdAtFull: don.ngay_dat_don || don.created_at || "",
    notes: don.ghi_chu_dac_biet || don.notes || "",
    staffId: don.nguoi_tao_don ? String(don.nguoi_tao_don) : undefined,
    staffName: don.hoa_don_thanh_toan?.nhan_vien_tao?.ho_ten || 
               don.hoa_don_thanh_toan?.nhan_vien?.ho_ten || 
               don.hoa_don_thanh_toan_rel?.nhan_vien_tao?.ho_ten || 
               don.nguoi_tao_don_rel?.ho_ten || 
               don.nguoi_tao_don_info?.ho_ten || 
               don.nguoi_tao_don?.ho_ten || 
               don.staffName || 
               undefined,
    tongTienPhong: Number(don.tong_tien_phong ?? don.totalPrice ?? 0),
    maKhuyenMaiId: don.ma_khuyen_mai_id || undefined,
    chiTietId: detail ? detail.chi_tiet_dat_phong_id : undefined,
    rawStatus: don.trang_thai_don || don.status || "",
    phanTramDatCoc: don.phan_tram_dat_coc ?? 100,
    soTienDaCoc: Number(don.so_tien_da_coc ?? 0),
    chi_tiet_dat_phongs: don.chi_tiet_dat_phongs || don.chi_tiet_dat_phong || [],
    lichSuHuyDons: don.lich_su_huy_dons || don.lichSuHuyDons || [],
  };
}

// API Functions
export const api = {
  // 🟢 NGHIỆP VỤ: ĐĂNG NHẬP KHÁCH HÀNG / QUẢN TRỊ VIÊN
  async login(email: string, mat_khau: string): Promise<User> {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, mat_khau }),
    });
    return mapNguoiDungToUser(data.user);
  },

  // 🟢 NGHIỆP VỤ: KHÔI PHỤC MẬT KHẨU TẠM QUA GMAIL
  async forgotPassword(email: string): Promise<any> {
    return await request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // 🟢 NGHIỆP VỤ: KIỂM TRA EMAIL ĐÃ CÓ TÀI KHOẢN TRÊN HỆ THỐNG CHƯA
  async checkEmail(email: string): Promise<{ exists: boolean; is_member: boolean }> {
    const data = await request("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return {
      exists: !!data.exists,
      is_member: !!data.is_member
    };
  },

  // 🟢 NGHIỆP VỤ: ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG MỚI
  async register(user: any): Promise<User> {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ho_ten: user.name,
        email: user.email,
        so_dien_thoai: user.phone,
        cccd: user.idNumber,
        mat_khau: user.password,
      }),
    });
    return mapNguoiDungToUser(data.user);
  },

  // 🟢 NGHIỆP VỤ: LẤY THÔNG TIN HỒ SƠ TÀI KHOẢN TỪ BACKEND
  async getProfile(userId: string): Promise<User> {
    const data = await request(`/profile?user_id=${userId}`);
    return mapNguoiDungToUser(data);
  },

  // 🟢 NGHIỆP VỤ: CẬP NHẬT THÔNG TIN HỒ SƠ CÁ NHÂN
  async updateProfile(userId: string, profile: Partial<User>): Promise<User> {
    const data = await request(`/profile?user_id=${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        ho_ten: profile.name,
        so_dien_thoai: profile.phone,
        dia_chi: profile.address,
        cccd: profile.idNumber,
      }),
    });
    return mapNguoiDungToUser(data.user);
  },

  // 🟢 NGHIỆP VỤ: ĐỔI MẬT KHẨU CÁ NHÂN VỚI BACKEND API
  async changePassword(userId: string, old_password: string, new_password: string): Promise<any> {
    return await request(`/profile/change-password?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify({
        old_password,
        new_password,
        new_password_confirmation: new_password,
      }),
    });
  },

  // Rooms
  async getRooms(checkIn?: string, checkOut?: string, location?: string): Promise<Room[]> {
    let path = "/rooms";
    const params = new URLSearchParams();
    if (checkIn) params.append("check_in", checkIn);
    if (checkOut) params.append("check_out", checkOut);
    if (location && location !== "all") params.append("vi_tri", location);
    
    const queryString = params.toString();
    if (queryString) path += `?${queryString}`;
    
    const data = await request(path);
    return data.map(mapPhongToRoom);
  },

  async addRoom(room: Omit<Room, "id">): Promise<Room> {
    let loai_phong_id = 1;
    if (room.type === "superior") loai_phong_id = 2;
    else if (room.type === "deluxe") loai_phong_id = 3;
    else if (room.type === "suite") loai_phong_id = 4;
    else if (room.type === "family") loai_phong_id = 5;

    const data = await request("/admin/rooms", {
      method: "POST",
      body: JSON.stringify({
        so_phong: room.number,
        loai_phong_id: room.loai_phong_id,
        tang: room.floor !== undefined ? Number(room.floor) : Math.floor(Number(room.number) / 100),
        trang_thai_hien_tai: room.status === "available" ? 0 : room.status === "occupied" ? 1 : room.status === "cleaning" ? 2 : 3,
        mo_ta: room.description,
        url_hinh_anh: room.imageUrl,
        images: room.images || [],
        amenities: room.amenities || [],
      }),
    });
    return mapPhongToRoom(data.room);
  },

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const body: any = {};
    if (updates.number) body.so_phong = updates.number;
    if (updates.status) {
      body.trang_thai_hien_tai = updates.status === "available" ? 0 : updates.status === "occupied" ? 1 : updates.status === "cleaning" ? 2 : 3;
    }
    if (updates.description !== undefined) body.mo_ta = updates.description;
    if (updates.imageUrl !== undefined) body.url_hinh_anh = updates.imageUrl;
    if (updates.images !== undefined) body.images = updates.images;
    if (updates.floor !== undefined) body.tang = Number(updates.floor);
    if (updates.amenities !== undefined) body.amenities = updates.amenities;
    if (updates.loai_phong_id !== undefined) body.loai_phong_id = updates.loai_phong_id;

    const data = await request(`/admin/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapPhongToRoom(data.room);
  },

  async deleteRoom(id: string): Promise<void> {
    await request(`/admin/rooms/${id}`, {
      method: "DELETE",
    });
  },

  // Bookings
  async getMyBookings(userId: string): Promise<Booking[]> {
    const data = await request(`/bookings/my-bookings?user_id=${userId}`);
    return data.map(mapDonToBooking);
  },

  async getAllBookings(): Promise<Booking[]> {
    const data = await request("/admin/bookings");
    return data.map(mapDonToBooking);
  },

  async createBooking(booking: Omit<Booking, "id">): Promise<Booking> {
    let loai_phong_id = 1;
    if (booking.roomType === "superior") loai_phong_id = 2;
    else if (booking.roomType === "deluxe") loai_phong_id = 3;
    else if (booking.roomType === "suite") loai_phong_id = 4;
    else if (booking.roomType === "family") loai_phong_id = 5;

    const data = await request("/bookings", {
      method: "POST",
      body: JSON.stringify({
        khach_hang_id: Number(booking.customerId),
        ngay_checkin: booking.checkIn,
        ngay_checkout: booking.checkOut,
        loai_phong_id,
        so_nguoi_lon: booking.guests > 1 ? 2 : 1,
        so_tre_em: booking.guests > 2 ? booking.guests - 2 : 0,
        tong_tien_phong: booking.tongTienPhong ?? booking.totalPrice,
        thanh_tien_cuoi: booking.totalPrice,
        ghi_chu_dac_biet: booking.notes,
        ma_khuyen_mai_id: booking.maKhuyenMaiId || null,
        phan_tram_dat_coc: booking.phanTramDatCoc ?? 100,
        payment_method: (booking as any).payment_method || (booking as any).payMethod || "counter",
      }),
    });
    return mapDonToBooking(data.booking);
  },
  async createWalkinBooking(payload: {
    khach_hang_id?: number;
    ho_ten?: string;
    so_dien_thoai?: string;
    email?: string;
    so_cmnd?: string;
    ngay_checkin: string;
    ngay_checkout: string;
    so_nguoi_lon: number;
    so_tre_em?: number;
    room_id: number;
    thanh_tien_cuoi: number;
    payment_method?: string;
    ghi_chu_dac_biet?: string;
  }): Promise<Booking> {
    const data = await request("/admin/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapDonToBooking(data.booking);
  },

  async quickBooking(booking: any): Promise<Booking> {
    let loai_phong_id = 1;
    if (booking.roomType === "superior") loai_phong_id = 2;
    else if (booking.roomType === "deluxe") loai_phong_id = 3;
    else if (booking.roomType === "suite") loai_phong_id = 4;
    else if (booking.roomType === "family") loai_phong_id = 5;

    const data = await request("/bookings/quick", {
      method: "POST",
      body: JSON.stringify({
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        guest_cccd: booking.guest_cccd,
        ngay_checkin: booking.checkIn,
        ngay_checkout: booking.checkOut,
        loai_phong_id,
        so_nguoi_lon: booking.guests > 1 ? 2 : 1,
        so_tre_em: booking.guests > 2 ? booking.guests - 2 : 0,
        tong_tien_phong: booking.tongTienPhong ?? booking.totalPrice,
        thanh_tien_cuoi: booking.totalPrice,
        gia_ap_dung: booking.totalPrice,
        ma_khuyen_mai_id: booking.maKhuyenMaiId || null,
        phan_tram_dat_coc: booking.phanTramDatCoc ?? 100,
        payment_method: booking.payment_method || booking.payMethod || "counter",
      }),
    });
    return mapDonToBooking(data.booking);
  },

  async lookupBooking(bookingId: string, emailOrPhone: string): Promise<Booking> {
    const data = await request("/bookings/lookup", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId, email_or_phone: emailOrPhone }),
    });
    return mapDonToBooking(data);
  },

  async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
    let trang_thai_don = "Cho_Xac_Nhan";
    if (status === "confirmed") trang_thai_don = "Da_Xac_Nhan";
    else if (status === "checked_in") trang_thai_don = "Dang_O";
    else if (status === "checked_out") trang_thai_don = "Da_Tra_Phong";
    else if (status === "cancelled") trang_thai_don = "Da_Huy";

    await request(`/admin/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ trang_thai_don }),
    });
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    let trang_thai_don: string | undefined;
    if (updates.status) {
      if (updates.status === "pending") trang_thai_don = "Cho_Xac_Nhan";
      else if (updates.status === "confirmed") trang_thai_don = "Da_Xac_Nhan";
      else if (updates.status === "checked_in") trang_thai_don = "Dang_O";
      else if (updates.status === "checked_out") trang_thai_don = "Da_Tra_Phong";
      else if (updates.status === "cancelled") trang_thai_don = "Da_Huy";
    }

    const body: any = {};
    if (trang_thai_don) body.trang_thai_don = trang_thai_don;
    if (updates.notes !== undefined) body.ghi_chu_dac_biet = updates.notes;
    if (updates.totalPrice !== undefined) body.thanh_tien_cuoi = updates.totalPrice;
    if (updates.checkIn) body.ngay_checkin = updates.checkIn;
    if (updates.checkOut) body.ngay_checkout = updates.checkOut;

    const data = await request(`/admin/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapDonToBooking(data.booking);
  },

  async cancelBooking(id: string): Promise<void> {
    await request(`/bookings/my-bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ ly_do: "Khách hủy trực tuyến" }),
    });
  },

  async changeRoom(
    id: string,
    arg2: number | { chi_tiet_dat_phong_id: number; phong_moi_id: number; ly_do?: string; phu_thu?: number },
    roomNewId?: number
  ): Promise<any> {
    if (typeof arg2 === "object") {
      return await request(`/admin/bookings/${id}/change-room`, {
        method: "POST",
        body: JSON.stringify(arg2),
      });
    } else {
      return await request(`/admin/bookings/${id}/change-room`, {
        method: "POST",
        body: JSON.stringify({
          chi_tiet_dat_phong_id: arg2,
          phong_moi_id: roomNewId,
        }),
      });
    }
  },  async adminCancelBooking(id: string, reason: string, waivePenalty: boolean): Promise<any> {
    return await request(`/admin/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        ly_do: reason,
        waive_penalty: waivePenalty
      }),
    });
  },
  async validatePromo(code: string, amount: number): Promise<any> {
    return await request("/promotions/validate", {
      method: "POST",
      body: JSON.stringify({ ma_code: code, amount }),
    });
  },

  // Customers (Admin)
  async getCustomers(): Promise<User[]> {
    const data = await request("/admin/customers");
    return data.map(mapNguoiDungToUser);
  },

  async addCustomer(customer: Omit<User, "id">): Promise<User> {
    const data = await request("/admin/customers", {
      method: "POST",
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        password: customer.password || "12345678",
        role: customer.role === "admin" ? "admin" : customer.role === "staff" ? "staff" : "customer",
        id_card: customer.idNumber,
        address: customer.address,
      }),
    });
    return mapNguoiDungToUser(data.data);
  },

  async updateCustomer(id: string, updates: Partial<User>): Promise<void> {
    const body: any = {};
    if (updates.name) body.name = updates.name;
    if (updates.email) body.email = updates.email;
    if (updates.phone) body.phone = updates.phone;
    if (updates.idNumber) body.id_card = updates.idNumber;
    if (updates.address) body.address = updates.address;
    if (updates.role) body.role = updates.role === "admin" ? "admin" : updates.role === "staff" ? "staff" : "customer";
    
    await request(`/admin/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  async deleteCustomer(id: string): Promise<any> {
    return await request(`/admin/customers/${id}`, {
      method: "DELETE",
    });
  },

  async getRoomReviews(roomTypeId: number): Promise<any[]> {
    return await request(`/reviews/room-type/${roomTypeId}`);
  },

  async submitReview(review: { customerId: string; roomTypeId: number; stars: number; comment: string }): Promise<any> {
    return await request("/reviews", {
      method: "POST",
      body: JSON.stringify({
        khach_hang_id: Number(review.customerId),
        loai_phong_id: review.roomTypeId,
        so_sao: review.stars,
        binh_luan: review.comment,
      }),
    });
  },



  // Services
  async getServices(): Promise<any[]> {
    return await request("/admin/services");
  },
  async addService(service: any): Promise<any> {
    return await request("/admin/services", {
      method: "POST",
      body: JSON.stringify(service),
    });
  },
  async updateService(id: string, updates: any): Promise<any> {
    return await request(`/admin/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  async deleteService(id: string): Promise<void> {
    await request(`/admin/services/${id}`, {
      method: "DELETE",
    });
  },

  // Room Types
  async getRoomTypes(): Promise<any[]> {
    return await request("/admin/room-types");
  },
  async updateRoomType(id: number, data: any): Promise<any> {
    return await request(`/admin/room-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  async createRoomType(data: any): Promise<any> {
    return await request("/admin/room-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async deleteRoomType(id: number): Promise<any> {
    return await request(`/admin/room-types/${id}`, {
      method: "DELETE",
    });
  },

  // Amenities
  async getAmenities(): Promise<any[]> {
    return await request("/admin/amenities");
  },
  async addAmenity(amenity: any): Promise<any> {
    return await request("/admin/amenities", {
      method: "POST",
      body: JSON.stringify(amenity),
    });
  },
  async deleteAmenity(id: string): Promise<void> {
    await request(`/admin/amenities/${id}`, {
      method: "DELETE",
    });
  },

  async uploadImage(formData: FormData): Promise<{ url: string }> {
    const url = `${API_BASE}/admin/rooms/upload-image`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi tải ảnh lên.");
    }
    return response.json();
  },

  async getVNPayUrl(bookingId: string, amount: number): Promise<{ payment_url: string }> {
    return await request("/payments/vnpay-url", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId, amount }),
    });
  },

  async verifyVNPay(params: Record<string, string>): Promise<any> {
    return await request("/payments/vnpay-verify", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Promotions
  async getPublicPromotions(): Promise<any[]> {
    return await request("/promotions");
  },
  async getAdminPromotions(): Promise<any[]> {
    return await request("/admin/promotions");
  },
  async addPromotion(promo: any): Promise<any> {
    return await request("/admin/promotions", {
      method: "POST",
      body: JSON.stringify(promo),
    });
  },
  async updatePromotion(code: string, updates: any): Promise<any> {
    return await request(`/admin/promotions/${code}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  async deletePromotion(code: string): Promise<void> {
    await request(`/admin/promotions/${code}`, {
      method: "DELETE",
    });
  }
};
