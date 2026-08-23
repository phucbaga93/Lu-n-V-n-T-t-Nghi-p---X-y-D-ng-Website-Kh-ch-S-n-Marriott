"use client";

import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Plus, Pencil, Trash2, BedDouble, X, Save, Settings, Sparkles, AlertTriangle, LayoutGrid, List } from "lucide-react";
import { Room, RoomType, RoomStatus, roomTypeLabels, roomStatusLabels, formatPrice } from "../../data/mockData";
import { mapTenLoaiPhong } from "../../data/api";

const roomTypeSpecs: Record<RoomType, { capacity: number; area: number; pricePerNight: number }> = {
  standard: { capacity: 2, area: 38, pricePerNight: 4800000 },
  superior: { capacity: 2, area: 38, pricePerNight: 6200000 },
  deluxe: { capacity: 3, area: 76, pricePerNight: 9800000 },
  suite: { capacity: 4, area: 160, pricePerNight: 26000000 },
  family: { capacity: 5, area: 95, pricePerNight: 15000000 },
};
import { api } from "../../data/api";

const statusColors: Record<RoomStatus, string> = {
  available: "#22c55e",
  occupied: "#ef4444",
  maintenance: "#f59e0b",
  reserved: "#3b82f6",
  cleaning: "#8b5cf6",
};

const emptyRoom: Omit<Room, "id"> = {
  number: "",
  type: "standard",
  loai_phong_id: 0,
  floor: 1,
  capacity: 2,
  pricePerNight: 800000,
  status: "available",
  amenities: [],
  description: "",
  imageUrl: "",
  area: 25,
  images: [],
};

export default function RoomManagementPage() {
  const { rooms, addRoom, updateRoom, deleteRoom, bookings, currentUser, fetchRooms } = useApp();
  const isStaff = currentUser?.role === "staff";
  const [activeTab, setActiveTab] = useState<"rooms" | "types" | "amenities" | "services">("rooms");
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ loai_phong_id: 0, ten_loai_phong: "", gia_theo_dem: 0, dien_tich_m2: 0, so_giuong: 0, so_khach_toi_da: 0, mo_ta: "" });

  function handleOpenEditType(rt: any) {
    setTypeForm({
      loai_phong_id: rt.loai_phong_id,
      ten_loai_phong: rt.ten_loai_phong,
      gia_theo_dem: Number(rt.gia_theo_dem),
      dien_tich_m2: rt.dien_tich_m2,
      so_giuong: rt.so_giuong,
      so_khach_toi_da: rt.so_khach_toi_da,
      mo_ta: rt.mo_ta || ""
    });
    setShowTypeModal(true);
  }

  function handleOpenAddType() {
    setTypeForm({
      loai_phong_id: 0,
      ten_loai_phong: "",
      gia_theo_dem: 0,
      dien_tich_m2: 0,
      so_giuong: 1,
      so_khach_toi_da: 2,
      mo_ta: ""
    });
    setShowTypeModal(true);
  }

  async function handleSaveRoomType() {
    try {
      if (typeForm.loai_phong_id === 0) {
        await api.createRoomType(typeForm);
        alert("Thêm hạng phòng thành công!");
      } else {
        await api.updateRoomType(typeForm.loai_phong_id, typeForm);
        alert("Cập nhật hạng phòng thành công!");
      }
      setShowTypeModal(false);
      fetchRoomTypes();
      fetchRooms();
    } catch (e: any) {
      alert(e.message || "Lỗi lưu hạng phòng.");
    }
  }

  async function handleDeleteRoomType(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa hạng phòng này?")) return;
    try {
      const res = await api.deleteRoomType(id);
      alert("Xóa hạng phòng thành công!");
      fetchRoomTypes();
      fetchRooms();
    } catch (e: any) {
      alert(e.message || "Không thể xóa hạng phòng này (có thể do đang có phòng thuộc hạng này).");
    }
  }

  // Rooms State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Room, "id">>(emptyRoom);
  const [amenityInput, setAmenityInput] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [filterType, setFilterType] = useState<"all" | RoomType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | RoomStatus>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [imageUploading, setImageUploading] = useState(false);

  // Maintenance/Cleaning helper states
  const [maintReason, setMaintReason] = useState("");
  const [maintDuration, setMaintDuration] = useState("");
  const [cleaningDuration, setCleaningDuration] = useState("30");

  // Amenities State
  const [dbAmenities, setDbAmenities] = useState<any[]>([]);
  const [newAmenityName, setNewAmenityName] = useState("");
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);

  // Services State
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", type: "Spa", price: 100000, description: "" });
  const [selectedServiceRoomTypes, setSelectedServiceRoomTypes] = useState<Array<{ loai_phong_id: number, included: boolean }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  // Room Types State (For dynamic included services)
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const filteredRooms = rooms.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterLocation !== "all" && r.location !== filterLocation) return false;
    return true;
  });

  // Load services, amenities, and room types
  useEffect(() => {
    fetchAmenities();
    fetchServices();
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (activeTab === "amenities") {
      fetchAmenities();
    } else if (activeTab === "services") {
      fetchServices();
    }
  }, [activeTab]);

  async function fetchRoomTypes() {
    try {
      const data = await api.getRoomTypes();
      setRoomTypes(data);
    } catch (e) {
      console.error("Failed to fetch room types:", e);
    }
  }

  async function fetchAmenities() {
    setAmenitiesLoading(true);
    try {
      const data = await api.getAmenities();
      setDbAmenities(data);
    } finally {
      setAmenitiesLoading(false);
    }
  }

  async function fetchServices() {
    setServicesLoading(true);
    try {
      const data = await api.getServices();
      setDbServices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setServicesLoading(false);
    }
  }

  // Room CRUD logic
  function openAdd() {
    setEditId(null);
    setMaintReason("");
    setMaintDuration("");
    setCleaningDuration("30");
    const stdType = roomTypes.find((rt: any) => rt.ten_loai_phong.toLowerCase().includes("std") || rt.ten_loai_phong.toLowerCase().includes("standard")) || roomTypes[0];
    setForm({
      ...emptyRoom,
      loai_phong_id: stdType ? stdType.loai_phong_id : 0,
      type: stdType ? mapTenLoaiPhong(stdType.ten_loai_phong) : "standard",
      capacity: stdType ? stdType.so_khach_toi_da : 2,
      area: stdType ? stdType.dien_tich_m2 : 25,
      pricePerNight: stdType ? Number(stdType.gia_theo_dem) : 800000,
    });
    setAmenityInput("");
    setShowModal(true);
  }

  function openEdit(room: Room) {
    setEditId(room.id);
    let reason = "";
    let duration = "";
    let cleanDur = "30";

    if (room.status === "maintenance") {
      const matchReason = room.description.match(/Lý do:\s*([^.|]+)/i);
      const matchDuration = room.description.match(/Dự kiến:\s*([^.|]+)/i);
      if (matchReason) reason = matchReason[1].trim();
      if (matchDuration) duration = matchDuration[1].trim();
    } else if (room.status === "cleaning") {
      const matchClean = room.description.match(/Thời lượng:\s*(\d+)/i);
      if (matchClean) cleanDur = matchClean[1];
    }

    setMaintReason(reason);
    setMaintDuration(duration);
    setCleaningDuration(cleanDur);

    setForm({ number: room.number, type: room.type, loai_phong_id: room.loai_phong_id || 0, floor: room.floor, capacity: room.capacity, pricePerNight: room.pricePerNight, status: room.status, amenities: [...room.amenities], description: room.description, imageUrl: room.imageUrl, area: room.area, images: room.images ? [...room.images] : [] });
    setAmenityInput("");
    setNewImageUrl("");
    setShowModal(true);
  }

  function handleAddImageUrl() {
    if (!newImageUrl.trim()) return;
    setForm(f => {
      const newImages = [...(f.images || []), newImageUrl.trim()];
      return {
        ...f,
        imageUrl: f.imageUrl || newImageUrl.trim(),
        images: newImages
      };
    });
    setNewImageUrl("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.uploadImage(formData);
      setForm(f => {
        const newImages = [...(f.images || []), res.url];
        return {
          ...f,
          imageUrl: f.imageUrl || res.url,
          images: newImages
        };
      });
    } catch (err: any) {
      alert(err.message || "Tải ảnh lên thất bại.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSave() {
    if (!form.number) {
      alert("Vui lòng nhập số phòng.");
      return;
    }

    const roomNumber = form.number.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{4}$/.test(roomNumber)) {
      alert("Định dạng số phòng không đúng! Số phòng phải gồm 2 chữ cái chi nhánh + 4 chữ số (ví dụ: SG0101, HN0102).");
      return;
    }

    const floor = parseInt(roomNumber.substring(2, 4), 10);
    const roomVal = parseInt(roomNumber.substring(4, 6), 10);

    if (floor === 0) {
      alert("Lỗi: Số tầng không thể là 00 (ví dụ: SG0101 ở tầng 1).");
      return;
    }
    if (roomVal === 0) {
      alert("Lỗi: Số phòng không thể là 0 (2 chữ số cuối không được là 00).");
      return;
    }

    if (form.status === "maintenance" && editId) {
      // Validate future bookings constraint
      const today = new Date().toISOString().split("T")[0];
      const hasFutureBookings = bookings.some(b => 
        b.roomId === editId && 
        b.status !== "cancelled" && 
        b.status !== "checked_out" && 
        b.checkOut >= today
      );

      if (hasFutureBookings) {
        alert("Lỗi: Không thể chuyển phòng này sang Bảo trì do đang có đơn đặt lịch hoạt động trong tương lai! Vui lòng điều chuyển các đơn đặt đó sang phòng khác trước.");
        return;
      }
    }

    let finalForm = { 
      ...form, 
      number: roomNumber,
      floor: floor 
    };

    if (newImageUrl.trim()) {
      const trimmedUrl = newImageUrl.trim();
      const newImages = [...(finalForm.images || []), trimmedUrl];
      finalForm = {
        ...finalForm,
        imageUrl: finalForm.imageUrl || trimmedUrl,
        images: newImages
      };
      setNewImageUrl("");
    }

    try {
      if (editId) {
        await updateRoom(editId, finalForm);
        alert("Cập nhật phòng thành công!");
      } else {
        await addRoom({ ...finalForm, id: "r" + Date.now() });
        alert("Thêm phòng mới thành công!");
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi lưu thông tin phòng.");
    }
  }

  function addAmenity() {
    if (!amenityInput.trim()) return;
    setForm(f => ({ ...f, amenities: [...f.amenities, amenityInput.trim()] }));
    setAmenityInput("");
  }

  function removeAmenity(a: string) {
    setForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }));
  }

  function handleDelete(id: string) {
    deleteRoom(id);
    setDeleteConfirm(null);
  }

  // Amenity CRUD logic
  async function handleAddAmenity() {
    if (!newAmenityName.trim()) return;
    try {
      await api.addAmenity({ ten_tien_nghi: newAmenityName.trim() });
      setNewAmenityName("");
      fetchAmenities();
    } catch (e: any) {
      alert(e.message || "Không thể thêm tiện nghi.");
    }
  }

  async function handleDeleteAmenity(id: string) {
    try {
      await api.deleteAmenity(id);
      fetchAmenities();
    } catch (e: any) {
      alert(e.message || "Không thể xóa tiện nghi do đang được gán cho một số phòng.");
    }
  }

  // Service CRUD logic
  function openAddService() {
    setEditServiceId(null);
    setServiceForm({ name: "", type: "Spa", price: 100000, description: "" });
    setSelectedServiceRoomTypes([]);
    setShowServiceModal(true);
  }

  function openEditService(service: any) {
    setEditServiceId(service.id);
    setServiceForm({ name: srvName(service.name), type: service.type || "Spa", price: service.price, description: service.description || "" });
    setSelectedServiceRoomTypes(service.room_types ? service.room_types.map((rt: any) => ({ loai_phong_id: rt.loai_phong_id, included: rt.included })) : []);
    setShowServiceModal(true);
  }

  // Helper to ensure name is correct string type
  function srvName(val: any): string {
    return typeof val === "string" ? val : String(val || "");
  }

  async function handleSaveService() {
    if (!serviceForm.name.trim()) return;
    try {
      const payload = {
        ...serviceForm,
        room_types: selectedServiceRoomTypes
      };
      if (editServiceId) {
        await api.updateService(editServiceId, payload);
      } else {
        await api.addService(payload);
      }
      setShowServiceModal(false);
      fetchServices();
    } catch (e: any) {
      alert(e.message || "Lỗi lưu dịch vụ.");
    }
  }

  async function handleDeleteService(id: string) {
    try {
      await api.deleteService(id);
      setDeleteServiceId(null);
      fetchServices();
    } catch (e: any) {
      alert(e.message || "Không thể xóa dịch vụ này vì đang được áp dụng cho một số hạng phòng.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài nguyên</h1>
          <p className="text-gray-500 text-sm mt-1">Cấu hình phòng nghỉ, tiện nghi và dịch vụ gia tăng</p>
        </div>
        {activeTab === "rooms" && !isStaff && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm" style={{ background: "#1a3a5c" }}>
            <Plus className="w-4 h-4" /> Thêm phòng
          </button>
        )}
        {activeTab === "services" && (
          <button onClick={openAddService} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm" style={{ background: "#1a3a5c" }}>
            <Plus className="w-4 h-4" /> Thêm dịch vụ
          </button>
        )}
      </div>

      {/* Tabs */}
      {!isStaff ? (
        <div className="flex gap-2 border-b border-gray-200 pb-px mb-6">
          <button
            onClick={() => setActiveTab("rooms")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={activeTab === "rooms" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <BedDouble className="w-4 h-4" />
            Phòng nghỉ
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={activeTab === "types" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <Settings className="w-4 h-4" />
            Hạng phòng
          </button>
          <button
            onClick={() => setActiveTab("amenities")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={activeTab === "amenities" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <Settings className="w-4 h-4" />
            Tiện nghi phòng
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={activeTab === "services" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <Sparkles className="w-4 h-4" />
            Dịch vụ đi kèm
          </button>
        </div>
      ) : (
        <div className="border-b border-gray-200 pb-px mb-6">
          <div
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2"
            style={{ borderColor: "#1a3a5c", color: "#1a3a5c", width: "fit-content" }}
          >
            <BedDouble className="w-4 h-4" />
            Sơ đồ phòng nghỉ
          </div>
        </div>
      )}

      {/* TAB 1: ROOMS */}
      {activeTab === "rooms" && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
              <option value="all">Tất cả vị trí</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Phú Quốc">Phú Quốc</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
              <option value="all">Tất cả hạng phòng</option>
              {(["standard", "superior", "deluxe", "suite", "family"] as const).map(t => <option key={t} value={t}>{roomTypeLabels[t]}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
              <option value="all">Tất cả trạng thái</option>
              {(["available", "occupied", "maintenance", "reserved", "cleaning"] as const).map(s => <option key={s} value={s}>{roomStatusLabels[s]}</option>)}
            </select>

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Danh sách
              </button>
            </div>

            <span className="text-xs text-gray-400 font-medium">{filteredRooms.length} phòng</span>
          </div>

          {/* ── GRID VIEW ── */}
          {viewMode === "grid" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map(room => (
                <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="relative h-36 overflow-hidden">
                      <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button onClick={() => openEdit(room)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white" title={isStaff ? "Cập nhật trạng thái" : "Chỉnh sửa"}><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
                        {!isStaff && (
                          <button onClick={() => setDeleteConfirm(room.id)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50" title="Xóa phòng"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        )}
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white flex items-center gap-1" style={{ background: statusColors[room.status] }}>
                        {roomStatusLabels[room.status]}
                        {room.status === "cleaning" && room.thoiGianConLaiDonDep && ` (${room.thoiGianConLaiDonDep})`}
                        {room.status === "maintenance" && room.thoiGianBaoTri && ` (${room.thoiGianBaoTri})`}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900">Phòng {room.number}</p>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{roomTypeLabels[room.type]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Tầng {room.floor} · {room.capacity} khách · {room.area}m²</p>
                      <p className="text-sm font-bold" style={{ color: "#1a3a5c" }}>{formatPrice(room.pricePerNight)}<span className="text-xs font-normal text-gray-400">/đêm</span></p>

                      {room.status === "maintenance" && (
                        <div className="mt-2.5 p-2 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-800 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Đang bảo trì
                          </div>
                          {(() => {
                            const text = room.thoiGianBaoTri || "";
                            const elapsedMatch = text.match(/^(Đã bảo trì [^(-]+)/i);
                            const expectedMatch = text.match(/Dự kiến:\s*([^)]+)/i);
                            const reasonMatch = text.match(/Lý do:\s*(.+)$/i);
                            const elapsed = elapsedMatch ? elapsedMatch[1].trim() : "Đang bảo trì";
                            const expected = expectedMatch ? expectedMatch[1].trim() : null;
                            const reason = reasonMatch ? reasonMatch[1].trim() : null;
                            return (
                              <div className="space-y-0.5 leading-normal mt-0.5">
                                <p><span className="font-semibold text-amber-950">Thời gian:</span> {elapsed}</p>
                                {expected && <p><span className="font-semibold text-amber-950">Dự kiến:</span> {expected}</p>}
                                {reason && <p><span className="font-semibold text-amber-950">Lý do:</span> {reason}</p>}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {room.status === "cleaning" && (
                        <div className="mt-2.5 p-2 rounded-lg border border-purple-200 bg-purple-50 text-[11px] text-purple-800 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-purple-900">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" /> Đang dọn dẹp
                          </div>
                          {(() => {
                            const text = room.thoiGianConLaiDonDep || "Còn 30 phút";
                            const totalMatch = room.description?.match(/Thời lượng:\s*(\d+)/i);
                            const total = totalMatch ? `${totalMatch[1]} phút` : "30 phút";
                            return (
                              <div className="space-y-0.5 leading-normal mt-0.5">
                                <p><span className="font-semibold text-purple-950">Còn lại:</span> {text}</p>
                                <p><span className="font-semibold text-purple-950">Tổng thời lượng:</span> {total}</p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {viewMode === "list" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Phòng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Hạng phòng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Vị trí / Tầng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Sức chứa</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Diện tích</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Giá / đêm</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ghi chú</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRooms.map((room, idx) => {
                    const maintText = room.thoiGianBaoTri || "";
                    const reasonMatch = maintText.match(/Lý do:\s*(.+)$/i);
                    const expectedMatch = maintText.match(/Dự kiến:\s*([^)]+)/i);
                    const noteText =
                      room.status === "maintenance"
                        ? `${reasonMatch ? reasonMatch[1].trim() : ""}${expectedMatch ? " · Dự kiến: " + expectedMatch[1].trim() : ""}`
                        : room.status === "cleaning"
                        ? `Còn lại: ${room.thoiGianConLaiDonDep || "~30 phút"}`
                        : "—";

                    return (
                      <tr
                        key={room.id}
                        className={`transition-colors hover:bg-blue-50/30 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                        }`}
                      >
                        {/* Room number + thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                              {room.imageUrl ? (
                                <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <BedDouble className="w-5 h-5 m-auto mt-2.5 text-gray-300" />
                              )}
                            </div>
                            <span className="font-bold text-gray-900">{room.number}</span>
                          </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium whitespace-nowrap">
                            {roomTypeLabels[room.type]}
                          </span>
                        </td>
                        {/* Location / Floor */}
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {room.location ? <span className="block text-[11px] text-gray-400">{room.location}</span> : null}
                          Tầng {room.floor}
                        </td>
                        {/* Capacity */}
                        <td className="px-4 py-3 text-xs text-gray-700">{room.capacity} khách</td>
                        {/* Area */}
                        <td className="px-4 py-3 text-xs text-gray-700">{room.area} m²</td>
                        {/* Price */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-[13px]" style={{ color: "#1a3a5c" }}>
                            {formatPrice(room.pricePerNight)}
                          </span>
                        </td>
                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white whitespace-nowrap"
                            style={{ background: statusColors[room.status] }}
                          >
                            {roomStatusLabels[room.status]}
                          </span>
                        </td>
                        {/* Note */}
                        <td className="px-4 py-3 text-[11px] text-gray-500 max-w-[180px] truncate" title={noteText}>
                          {noteText}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(room)}
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              title={isStaff ? "Cập nhật trạng thái" : "Chỉnh sửa"}
                            >
                              <Pencil className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            {!isStaff && (
                              <button
                                onClick={() => setDeleteConfirm(room.id)}
                                className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                                title="Xóa phòng"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRooms.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <BedDouble className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Không tìm thấy phòng nào phù hợp</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: AMENITIES */}
      {/* TAB 4: ROOM TYPES */}
      {activeTab === "types" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-base">Danh mục hạng phòng</h2>
            <button
              onClick={handleOpenAddType}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
              style={{ background: "#1a3a5c" }}
            >
              <Plus className="w-4 h-4" /> Thêm hạng phòng
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ background: "#f8fafc" }}>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tên hạng phòng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Đơn giá / Đêm</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Diện tích</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sức chứa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Số giường</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mô tả</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomTypes.map((rt: any) => (
                  <tr key={rt.loai_phong_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{rt.ten_loai_phong}</td>
                    <td className="px-4 py-3 text-blue-900 font-bold">{formatPrice(Number(rt.gia_theo_dem))}</td>
                    <td className="px-4 py-3 text-gray-700">{rt.dien_tich_m2} m²</td>
                    <td className="px-4 py-3 text-gray-700">{rt.so_khach_toi_da} khách</td>
                    <td className="px-4 py-3 text-gray-700">{rt.so_giuong} giường</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={rt.mo_ta}>{rt.mo_ta}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleOpenEditType(rt)}
                        className="inline-flex items-center gap-1 text-blue-900 hover:text-blue-700 font-semibold text-xs border border-blue-200 hover:border-blue-300 bg-blue-50/30 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRoomType(rt.loai_phong_id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs border border-red-200 hover:border-red-300 bg-red-50/30 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              {roomTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 italic">Đang tải danh sách hạng phòng...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === "amenities" && (
        <div className="max-w-xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="font-bold text-gray-800 text-base">Danh mục tiện nghi hiện tại</h2>
          <div className="flex gap-2">
            <input
              value={newAmenityName}
              onChange={e => setNewAmenityName(e.target.value)}
              placeholder="Tên tiện nghi mới (Ví dụ: Bồn tắm massage)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
            />
            <button onClick={handleAddAmenity} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: "#1a3a5c" }}>
              Thêm mới
            </button>
          </div>

          {amenitiesLoading ? (
            <p className="text-gray-400 text-xs italic">Đang tải danh sách...</p>
          ) : (
            <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
              {dbAmenities.map(am => (
                <div key={am.tien_nghi_id} className="flex justify-between items-center p-3 hover:bg-gray-50 text-sm">
                  <span className="font-medium text-gray-800">{am.ten_tien_nghi}</span>
                  <button onClick={() => handleDeleteAmenity(am.tien_nghi_id)} className="text-red-500 p-1.5 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {dbAmenities.length === 0 && (
                <p className="p-4 text-center text-xs text-gray-400">Không có dữ liệu tiện nghi nào.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
          {servicesLoading ? (
            <p className="p-6 text-gray-400 italic">Đang tải danh sách dịch vụ...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ background: "#f8fafc" }}>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tên dịch vụ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại dịch vụ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Đơn giá</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mô tả</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Áp dụng cho hạng phòng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dbServices.map(srv => (
                  <tr key={srv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{srv.name}</td>
                    <td className="px-4 py-3 text-gray-600">{srv.type}</td>
                    <td className="px-4 py-3 font-medium text-blue-900">{formatPrice(srv.price)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{srv.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {srv.room_types && srv.room_types.length > 0 ? (
                          srv.room_types.map((rt: any) => {
                            const name = rt.ten_loai_phong;
                            return (
                              <span key={rt.loai_phong_id} className={`px-2 py-0.5 rounded text-[10px] font-bold ${rt.included ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`} title={rt.included ? "Miễn phí đi kèm" : "Dịch vụ tính phí thêm"}>
                                {name.split(" ")[0]} {rt.included ? "(Miễn phí)" : ""}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-gray-400 italic">Không áp dụng (Chỉ gọi thêm)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditService(srv)} className="p-1 rounded text-gray-500 hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteServiceId(srv.id)} className="p-1 rounded text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dbServices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">Chưa cấu hình dịch vụ nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Room Type Edit Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{typeForm.loai_phong_id === 0 ? "Thêm hạng phòng mới" : "Chỉnh sửa hạng phòng"}</h2>
              <button onClick={() => setShowTypeModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên hạng phòng *</label>
                <input
                  value={typeForm.ten_loai_phong}
                  onChange={e => setTypeForm(s => ({ ...s, ten_loai_phong: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Ví dụ: Deluxe Suite Room"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giá theo đêm (VND) *</label>
                  <input
                    type="number"
                    value={typeForm.gia_theo_dem}
                    onChange={e => setTypeForm(s => ({ ...s, gia_theo_dem: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Diện tích (m²) *</label>
                  <input
                    type="number"
                    value={typeForm.dien_tich_m2}
                    onChange={e => setTypeForm(s => ({ ...s, dien_tich_m2: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Số khách tối đa *</label>
                  <input
                    type="number"
                    value={typeForm.so_khach_toi_da}
                    onChange={e => setTypeForm(s => ({ ...s, so_khach_toi_da: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Số giường *</label>
                  <input
                    type="number"
                    value={typeForm.so_giuong}
                    onChange={e => setTypeForm(s => ({ ...s, so_giuong: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả chi tiết</label>
                <textarea
                  value={typeForm.mo_ta}
                  onChange={e => setTypeForm(s => ({ ...s, mo_ta: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none h-20 resize-none"
                  placeholder="Mô tả các đặc quyền, dịch vụ, trang thiết bị..."
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowTypeModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white">Hủy</button>
              <button onClick={handleSaveRoomType} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: "#1a3a5c" }}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{editId ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Số phòng *</label>
                <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-gray-900 disabled:text-gray-500" placeholder="Mã chi nhánh + 4 chữ số (ví dụ: SG0101)" disabled={isStaff} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loại phòng</label>
                  <select
                    value={form.loai_phong_id || ""}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const selectedTypeObj = roomTypes.find((rt: any) => rt.loai_phong_id === id);
                      if (selectedTypeObj) {
                        setForm(f => ({
                          ...f,
                          loai_phong_id: id,
                          type: mapTenLoaiPhong(selectedTypeObj.ten_loai_phong),
                          capacity: selectedTypeObj.so_khach_toi_da,
                          area: selectedTypeObj.dien_tich_m2,
                          pricePerNight: Number(selectedTypeObj.gia_theo_dem)
                        }));
                      }
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-gray-900"
                    disabled={isStaff}
                  >
                    <option value="" disabled>-- Chọn loại phòng --</option>
                    {roomTypes.map((rt: any) => (
                      <option key={rt.loai_phong_id} value={rt.loai_phong_id}>{rt.ten_loai_phong}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RoomStatus }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {(["available", "occupied", "maintenance", "reserved", "cleaning"] as const).map(s => <option key={s} value={s}>{roomStatusLabels[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sức chứa</label>
                  <input type="number" value={form.capacity} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-gray-100 text-gray-500" disabled />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Diện tích (m²)</label>
                  <input type="number" value={form.area} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-gray-100 text-gray-500" disabled />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá/đêm (VND)</label>
                  <input type="number" value={form.pricePerNight} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-gray-100 text-gray-500" disabled />
                </div>
              </div>
              {form.status === "maintenance" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">Lý do bảo trì *</label>
                    <input value={maintReason} onChange={e => {
                      const val = e.target.value;
                      setMaintReason(val);
                      setForm(f => ({ ...f, description: `[Bảo trì] Lý do: ${val}. Dự kiến: ${maintDuration}.` }));
                    }} className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none" placeholder="Hỏng điều hòa, sửa điện..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">Thời hạn dự kiến *</label>
                    <input value={maintDuration} onChange={e => {
                      const val = e.target.value;
                      setMaintDuration(val);
                      setForm(f => ({ ...f, description: `[Bảo trì] Lý do: ${maintReason}. Dự kiến: ${val}.` }));
                    }} className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none" placeholder="3 giờ, 2 ngày..." />
                  </div>
                </div>
              )}

              {form.status === "cleaning" && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <label className="block text-xs font-semibold text-purple-800 mb-1">Thời lượng dọn dẹp dự kiến</label>
                  <select value={cleaningDuration} onChange={e => {
                    const val = e.target.value;
                    setCleaningDuration(val);
                    setForm(f => ({ ...f, description: `[Dọn dẹp] Thời lượng: ${val} phút.` }));
                  }} className="w-full border border-purple-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
                    <option value="15">15 phút</option>
                    <option value="30">30 phút (Mặc định)</option>
                    <option value="45">45 phút</option>
                    <option value="60">60 phút (1 giờ)</option>
                    <option value="120">120 phút (2 giờ)</option>
                  </select>
                </div>
              )}
              {form.status !== "maintenance" && form.status !== "cleaning" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none bg-gray-50 disabled:text-gray-500" placeholder="Mô tả chi tiết..." disabled={isStaff} />
                </div>
              )}
              {!isStaff && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hình ảnh phòng (Thư viện ảnh)</label>
                    <div className="flex flex-col gap-2 border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          className="hidden"
                          id="room-image-file"
                        />
                        <label
                          htmlFor="room-image-file"
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {imageUploading ? "Đang tải lên..." : "Chọn ảnh từ máy tính"}
                        </label>
                        <span className="text-[10px] text-gray-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 2MB)</span>
                      </div>
                      
                      <div className="relative flex items-center justify-center my-1">
                        <span className="text-[10px] text-gray-400 bg-slate-50 px-2 z-10">HOẶC DÁN URL</span>
                        <hr className="absolute w-full border-gray-200" />
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          value={newImageUrl}
                          onChange={e => setNewImageUrl(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                          placeholder="Dán URL hình ảnh mới..."
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-opacity-95 transition-all"
                          style={{ background: "#1a3a5c" }}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                    
                    {form.images && form.images.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Danh sách ảnh đã thêm ({form.images.length}):</p>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                              <img src={img} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setForm(f => ({ ...f, imageUrl: img }))}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold text-white transition-all ${form.imageUrl === img ? "bg-green-600" : "bg-blue-900 hover:bg-opacity-90"}`}
                                  style={form.imageUrl === img ? {} : { background: "#1a3a5c" }}
                                >
                                  {form.imageUrl === img ? "Ảnh chính" : "Làm ảnh chính"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(f => {
                                    const nextImgs = f.images ? f.images.filter((_, i) => i !== idx) : [];
                                    const isCurrentMainDeleted = f.imageUrl === img;
                                    return {
                                      ...f,
                                      imageUrl: isCurrentMainDeleted ? (nextImgs[0] || "") : f.imageUrl,
                                      images: nextImgs
                                    };
                                  })}
                                  className="w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center hover:bg-red-700 text-xs font-bold"
                                  title="Xóa"
                                >
                                  ×
                                </button>
                              </div>
                              {form.imageUrl === img && (
                                <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-green-600 text-white text-[8px] font-bold leading-none shadow-sm">
                                  Ảnh chính
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
                  {/* Dịch vụ đi kèm dựa trên Loại phòng */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dịch vụ đi kèm mặc định (Theo loại phòng)</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                      {(() => {
                        const matchedType = roomTypes.find(rt => {
                          const name = rt.ten_loai_phong.toLowerCase();
                          if (form.type === "standard") return name.includes("std") || name.includes("standard");
                          if (form.type === "deluxe") return name.includes("dlx") || name.includes("deluxe");
                          if (form.type === "suite") return name.includes("sut") || name.includes("suite");
                          if (form.type === "family") return name.includes("family");
                          return false;
                        });
                        const includedServices = matchedType?.dich_vu?.filter((sv: any) => sv.pivot?.included === 1) || [];
                        if (includedServices.length === 0) {
                          return <span className="text-xs text-gray-500 italic">Không có dịch vụ miễn phí đi kèm cho hạng phòng này</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {includedServices.map((sv: any) => (
                              <span key={sv.dich_vu_id} className="px-2.5 py-1 rounded-lg text-xs bg-green-50 border border-green-200 text-green-800 font-medium">
                                ✓ {sv.ten_dich_vu}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiện nghi phòng</label>
                    {!isStaff && (
                      <div className="flex gap-2 mb-2">
                        <input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAmenity())} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" placeholder="Nhập tiện nghi rồi nhấn Thêm" />
                        <button onClick={addAmenity} className="px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: "#1a3a5c" }}>Thêm</button>
                      </div>
                    )}
                    
                    {/* Hộp gợi ý nhanh từ Database */}
                    {!isStaff && (
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        <span className="text-[10px] text-gray-400 w-full mb-0.5 font-medium">Gợi ý tiện nghi từ Cơ sở dữ liệu:</span>
                        {(() => {
                          const suggestions = dbAmenities.length > 0
                            ? dbAmenities.map(am => am.ten_tien_nghi)
                            : ["High-Speed Wifi", "Smart TV 4K", "Minibar & Snack", "Bồn tắm nằm", "Điều hòa 2 chiều"];
                          return suggestions.map(suggestion => {
                            const exists = form.amenities.includes(suggestion);
                            return (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  if (!exists) {
                                    setForm(f => ({ ...f, amenities: [...f.amenities, suggestion] }));
                                  }
                                }}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${exists ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-50/50 border-blue-200 text-blue-800 hover:bg-blue-50"}`}
                                disabled={exists}
                              >
                                + {suggestion}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {form.amenities.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Chưa cập nhật danh sách tiện nghi</span>
                      ) : (
                        form.amenities.map(a => (
                          <span key={a} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                            {a}{!isStaff && <button onClick={() => removeAmenity(a)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-white text-sm flex items-center justify-center gap-2 font-medium" style={{ background: "#1a3a5c" }}>
                <Save className="w-4 h-4" />{editId ? "Lưu thay đổi" : "Thêm phòng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{editServiceId ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h2>
              <button onClick={() => setShowServiceModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên dịch vụ *</label>
                <input value={serviceForm.name} onChange={e => setServiceForm(s => ({ ...s, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Buffet sáng, Spa massage..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Loại dịch vụ</label>
                <input value={serviceForm.type} onChange={e => setServiceForm(s => ({ ...s, type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Dining, Spa, Bar..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Đơn giá (VND) *</label>
                <input type="number" value={serviceForm.price} onChange={e => setServiceForm(s => ({ ...s, price: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả chi tiết</label>
                <textarea value={serviceForm.description} onChange={e => setServiceForm(s => ({ ...s, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" placeholder="Chi tiết thời gian, hình thức phục vụ..." />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Áp dụng cho các hạng phòng</label>
                <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                  {roomTypes.map(rt => {
                    const association = selectedServiceRoomTypes.find(x => x.loai_phong_id === rt.loai_phong_id);
                    const isChecked = !!association;
                    const isIncluded = association ? association.included : false;
                    
                    return (
                      <div key={rt.loai_phong_id} className="flex items-center justify-between gap-4 py-1">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServiceRoomTypes(prev => [...prev, { loai_phong_id: rt.loai_phong_id, included: false }]);
                              } else {
                                setSelectedServiceRoomTypes(prev => prev.filter(x => x.loai_phong_id !== rt.loai_phong_id));
                              }
                            }}
                            className="rounded accent-blue-800"
                          />
                          <span>{rt.ten_loai_phong}</span>
                        </label>
                        
                        {isChecked && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Hình thức:</span>
                            <select
                              value={isIncluded ? "free" : "paid"}
                              onChange={(e) => {
                                const val = e.target.value === "free";
                                setSelectedServiceRoomTypes(prev => prev.map(x => x.loai_phong_id === rt.loai_phong_id ? { ...x, included: val } : x));
                              }}
                              className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none bg-white font-medium"
                            >
                              <option value="paid">Tính phí thêm</option>
                              <option value="free">Miễn phí đi kèm</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {roomTypes.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Đang tải danh sách hạng phòng...</span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 bg-gray-50">
              <button onClick={() => setShowServiceModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700">Hủy</button>
              <button onClick={handleSaveService} disabled={!serviceForm.name} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: "#1a3a5c" }}>
                Lưu dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Xác nhận xóa phòng</h3>
            <p className="text-gray-500 text-sm mb-5">Bạn có chắc muốn xóa phòng này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-lg text-white text-sm bg-red-500">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirm */}
      {deleteServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Xác nhận xóa dịch vụ</h3>
            <p className="text-gray-500 text-sm mb-5">Bạn có chắc muốn xóa dịch vụ này khỏi danh sách khách sạn?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteServiceId(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm">Hủy</button>
              <button onClick={() => handleDeleteService(deleteServiceId)} className="flex-1 py-2 rounded-lg text-white text-sm bg-red-500">Xóa dịch vụ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
