"use client";

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, User, Phone, Mail, CreditCard, Plus, Eye, X, ShieldCheck, ShieldAlert, Award, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../../data/mockData";

export default function CustomerManagementPage() {
  const { users, bookings, addUser, updateUser, deleteUser, currentUser } = useApp();
  const isStaff = currentUser?.role === "staff";
  const [activeTab, setActiveTab] = useState<"customers" | "staff">("customers");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", idNumber: "", role: "customer" });
  const [error, setError] = useState("");

  const [customerFilter, setCustomerFilter] = useState<"all" | "member" | "walkin">("all");

  // 1. Khách hàng thực sự ĐÃ ĐĂNG KÝ TÀI KHOẢN THÀNH VIÊN (có mật khẩu thực sự)
  const memberCustomers = users
    .filter(u => u.role === "customer" && u.password !== "GUEST_NO_ACCOUNT" && (u as any).mat_khau !== "GUEST_NO_ACCOUNT")
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address || "",
      idNumber: u.idNumber || "",
      createdAt: u.createdAt,
      isMember: true,
      rawUser: u,
    }));

  const memberEmails = new Set(memberCustomers.map(m => (m.email || "").toLowerCase().trim()).filter(Boolean));
  const memberPhones = new Set(memberCustomers.map(m => (m.phone || "").trim()).filter(Boolean));

  // 2. Khách vãng lai:
  const walkinMap = new Map<string, any>();

  // a) Thêm các tài khoản tạm tạo cho khách vãng lai (mat_khau: GUEST_NO_ACCOUNT)
  users
    .filter(u => u.role === "customer" && (u.password === "GUEST_NO_ACCOUNT" || (u as any).mat_khau === "GUEST_NO_ACCOUNT"))
    .forEach(u => {
      const email = (u.email || "").toLowerCase().trim();
      const phone = (u.phone || "").trim();
      const name = u.name || "Khách vãng lai";
      const key = phone ? `phone_${phone}` : (email ? `email_${email}` : `user_${u.id}`);
      walkinMap.set(key, {
        id: u.id,
        name: name,
        email: email || "Chưa đăng ký",
        phone: phone || "Chưa đăng ký",
        address: u.address || "",
        idNumber: u.idNumber || "",
        createdAt: u.createdAt || "—",
        isMember: false,
        rawUser: u,
      });
    });

  // b) Thêm các đơn đặt từ bookings chưa có tài khoản thành viên
  for (const b of bookings) {
    const email = (b.customerEmail || "").toLowerCase().trim();
    const phone = (b.customerPhone || "").trim();
    const name = b.customerName || "Khách vãng lai";

    const isMember = (email && memberEmails.has(email)) || (phone && memberPhones.has(phone));
    if (!isMember && (email || phone || name)) {
      const key = phone ? `phone_${phone}` : (email ? `email_${email}` : `name_${name}`);
      if (!walkinMap.has(key)) {
        walkinMap.set(key, {
          id: `guest_${key}`,
          name: name,
          email: email || "Chưa đăng ký",
          phone: phone || "Chưa đăng ký",
          address: "",
          idNumber: (b as any).customerCccd || (b as any).cccd || "",
          createdAt: b.createdAt || "—",
          isMember: false,
          rawUser: null,
        });
      }
    }
  }

  const walkinCustomers = Array.from(walkinMap.values());
  const allCustomerList = [...memberCustomers, ...walkinCustomers];

  const filteredCustomers = allCustomerList.filter(c => {
    if (customerFilter === "member" && !c.isMember) return false;
    if (customerFilter === "walkin" && c.isMember) return false;

    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const staffList = users.filter(u => u.role === "staff" || u.role === "admin");

  const filteredStaff = staffList.filter(s => {
    const q = search.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const detailCustomer = detail ? allCustomerList.find(c => c.id === detail) || users.find(u => u.id === detail) : null;
  const detailUser: any = detailCustomer;
  const userBookings = detailCustomer ? bookings.filter(b => {
    if (detailCustomer.isMember || (detailCustomer as any).role) {
      return b.customerId === detailCustomer.id || (detailCustomer.email && (b.customerEmail || "").toLowerCase().trim() === detailCustomer.email.toLowerCase().trim()) || (detailCustomer.phone && (b.customerPhone || "").trim() === detailCustomer.phone.trim());
    } else {
      return (detailCustomer.email && detailCustomer.email !== "Chưa đăng ký" && (b.customerEmail || "").toLowerCase().trim() === detailCustomer.email.toLowerCase().trim()) || (detailCustomer.phone && detailCustomer.phone !== "Chưa đăng ký" && (b.customerPhone || "").trim() === detailCustomer.phone.trim()) || b.customerName === detailCustomer.name;
    }
  }) : [];

  function openAddModal() {
    setError("");
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      idNumber: "",
      role: activeTab === "customers" ? "customer" : "staff",
    });
    setShowAdd(true);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (users.find(u => u.email === form.email)) {
      setError("Email đã tồn tại trong hệ thống");
      return;
    }

    // 🟢 VALIDATE EMAIL NHÂN VIÊN: phải theo format ten.CHINHANH@hotel.com
    if (form.role === "staff" || form.role === "admin") {
      const staffEmailRegex = /^[a-zA-Z]+\.[A-Z]{2,6}@hotel\.com$/;
      if (!staffEmailRegex.test(form.email)) {
        setError("Email nhân viên phải theo định dạng: ten.CHINHANH@hotel.com (VD: toan.SG@hotel.com, lan.HN@hotel.com)");
        return;
      }
    }

    addUser({
      id: "u" + Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      idNumber: form.idNumber,
      role: form.role as "customer" | "staff" | "admin",
      password: "12345678", // default password
      createdAt: new Date().toISOString().split("T")[0],
    });
    
    setShowAdd(false);
    setError("");
  }

  function openEditModal(user: any) {
    setError("");
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || "",
      idNumber: user.idNumber || "",
      role: user.role,
    });
    setShowEdit(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;

    // 🟢 VALIDATE EMAIL NHÂN VIÊN khi edit
    if (form.role === "staff" || form.role === "admin") {
      const staffEmailRegex = /^[a-zA-Z]+\.[A-Z]{2,6}@hotel\.com$/;
      if (!staffEmailRegex.test(form.email)) {
        setError("Email nhân viên phải theo định dạng: ten.CHINHANH@hotel.com (VD: toan.SG@hotel.com, lan.HN@hotel.com)");
        return;
      }
    }

    try {
      await updateUser(editId, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        idNumber: form.idNumber,
        role: form.role as any,
      });
      setShowEdit(false);
      setEditId(null);
      setError("");
    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật thông tin người dùng.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      await deleteUser(id);
      alert("Xóa tài khoản thành công!");
    } catch (err: any) {
      alert(err.message || "Lỗi khi xóa tài khoản.");
    }
  }

  const statusColors: Record<string, string> = { pending: "#f59e0b", confirmed: "#3b82f6", checked_in: "#22c55e", checked_out: "#6b7280", cancelled: "#ef4444" };
  const statusLabels: Record<string, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", checked_in: "Đang lưu trú", checked_out: "Đã trả phòng", cancelled: "Đã hủy" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === "customers" ? "Quản lý khách hàng" : "Quản lý tài khoản nhân sự"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === "customers"
              ? "Danh sách tổng hợp khách hàng thành viên có tài khoản & khách vãng lai tại khách sạn"
              : "Danh sách tài khoản nội bộ (Nhân viên lễ tân và Quản trị viên hệ thống)"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-all"
          style={{ background: "#1a3a5c" }}
        >
          <Plus className="w-4 h-4" /> {activeTab === "customers" ? "Thêm khách hàng" : "Thêm nhân sự"}
        </button>
      </div>

      {/* Primary Tabs Layout */}
      {!isStaff && (
        <div className="flex gap-2 border-b border-gray-200 pb-px">
          <button
            onClick={() => { setActiveTab("customers"); setSearch(""); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-all"
            style={activeTab === "customers" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <User className="w-4 h-4" />
            Khách hàng ({allCustomerList.length})
          </button>
          <button
            onClick={() => { setActiveTab("staff"); setSearch(""); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-all"
            style={activeTab === "staff" ? { borderColor: "#1a3a5c", color: "#1a3a5c" } : { borderColor: "transparent", color: "#64748b" }}
          >
            <ShieldCheck className="w-4 h-4" />
            Nhân sự & Admin ({staffList.length})
          </button>
        </div>
      )}

      {/* Sub-filter tabs for Customer classification (Member vs Walk-in) */}
      {activeTab === "customers" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setCustomerFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              customerFilter === "all"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tất cả khách hàng ({allCustomerList.length})
          </button>
          <button
            onClick={() => setCustomerFilter("member")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              customerFilter === "member"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            🟢 Khách đã có tài khoản ({memberCustomers.length})
          </button>
          <button
            onClick={() => setCustomerFilter("walkin")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              customerFilter === "walkin"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100"
            }`}
          >
            👤 Khách vãng lai ({walkinCustomers.length})
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={activeTab === "customers" ? "Tìm theo tên khách, email, số điện thoại..." : "Tìm nhân sự theo tên, email..."}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === "customers" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 text-xs font-semibold uppercase text-gray-500 bg-slate-50">
                  <th className="px-6 py-3.5">Khách hàng</th>
                  <th className="px-6 py-3.5">Phân loại</th>
                  <th className="px-6 py-3.5">Liên hệ</th>
                  <th className="px-6 py-3.5">CCCD</th>
                  <th className="px-6 py-3.5">Ngày tham gia / Đặt đầu</th>
                  <th className="px-6 py-3.5">Số lần đặt</th>
                  <th className="px-6 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(c => {
                  const cBookings = bookings.filter(b => {
                    if (c.isMember) {
                      return b.customerId === c.id || (c.email && (b.customerEmail || "").toLowerCase().trim() === c.email.toLowerCase().trim()) || (c.phone && (b.customerPhone || "").trim() === c.phone.trim());
                    } else {
                      return (c.email && c.email !== "Chưa đăng ký" && (b.customerEmail || "").toLowerCase().trim() === c.email.toLowerCase().trim()) || (c.phone && c.phone !== "Chưa đăng ký" && (b.customerPhone || "").trim() === c.phone.trim()) || b.customerName === c.name;
                    }
                  });

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: c.isMember ? "#1a3a5c" : "#d97706" }}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-955">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.isMember ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            🟢 Có tài khoản
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                            👤 Khách vãng lai
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{c.phone}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs font-mono">{c.idNumber || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#dbeafe", color: "#1e40af" }}>
                          {cBookings.length} lần
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setDetail(c.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            title="Xem hồ sơ & Lịch sử đặt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.isMember && (
                            <>
                              <button
                                onClick={() => openEditModal(c.rawUser || c)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                                title="Sửa thông tin tài khoản"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy khách hàng nào.</div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 text-xs font-semibold uppercase text-gray-500 bg-slate-50">
                  <th className="px-6 py-3.5">Nhân viên / Admin</th>
                  <th className="px-6 py-3.5">Liên hệ</th>
                  <th className="px-6 py-3.5">Vai trò</th>
                  <th className="px-6 py-3.5">Chi nhánh</th>
                  <th className="px-6 py-3.5">Ngày tạo tài khoản</th>
                  <th className="px-6 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map(s => {
                  // 🟢 Tích chi nhánh từ email: toan.SG@hotel.com → SG
                  const branchMatch = s.email.match(/\.([A-Z]{2,6})@hotel\.com$/);
                  const branch = branchMatch ? branchMatch[1] : null;
                  return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: s.role === "admin" ? "#991b1b" : "#c9a227" }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-955">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{s.phone || "—"}</td>
                    <td className="px-6 py-4">
                      {s.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                          <ShieldAlert className="w-3 h-3" /> Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Award className="w-3 h-3" /> Nhân viên lễ tân
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {branch ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          📍 {branch}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-650">{formatDate(s.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setDetail(s.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                          title="Xem chi tiết nhân sự"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                          title="Sửa nhân sự"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                          title="Xóa nhân sự"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStaff.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy tài khoản nhân viên nào.</div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">
                {detailUser.role === "customer" ? "Thông tin khách hàng" : "Thông tin tài khoản nhân sự"}
              </h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: detailUser.role === "admin" ? "#991b1b" : "#1a3a5c" }}>
                  {detailUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{detailUser.name}</p>
                  <p className="text-sm text-gray-600">{detailUser.email}</p>
                  <p className="text-xs text-gray-500">Ngày gia nhập: {formatDate(detailUser.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Điện thoại</p>
                  <p className="font-medium">{detailUser.phone || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">CCCD / CMND</p>
                  <p className="font-medium">{detailUser.idNumber || "Chưa cập nhật"}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Vai trò quyền hạn</p>
                  <p className="font-medium uppercase text-xs">
                    {detailUser.role === "admin" ? "Quản trị viên (Admin)" : detailUser.role === "staff" ? "Nhân viên Lễ tân" : "Khách hàng"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Địa chỉ</p>
                  <p className="font-medium text-xs truncate" title={detailUser.address}>{detailUser.address || "Chưa cập nhật"}</p>
                </div>
              </div>

              {detailUser.role === "customer" ? (
                <>
                  <h3 className="font-bold text-gray-900 mb-3">Lịch sử đặt phòng ({userBookings.length})</h3>
                  {userBookings.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Chưa có lịch sử đặt phòng</p>
                  ) : (
                    <div className="space-y-2">
                      {userBookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900">Phòng {b.roomNumber}</p>
                            <p className="text-xs text-gray-500">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: statusColors[b.status] }}>{statusLabels[b.status]}</span>
                            <p className="text-xs font-semibold text-gray-700 mt-1">{b.totalPrice.toLocaleString("vi-VN")}đ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-xs text-blue-800 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold mb-0.5">Tài khoản quản lý hệ thống</p>
                    <p className="leading-relaxed">Tài khoản nhân sự dùng để quản lý sơ đồ phòng nghỉ, thiết lập khuyến mãi và tiếp đón khách check-in tại quầy, không có dữ liệu đặt lịch lưu trú cá nhân.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">
                {activeTab === "customers" ? "Thêm khách hàng mới" : "Thêm tài khoản nhân sự"}
              </h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 font-medium">{error}</p>}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Họ và tên *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder={activeTab === "customers" ? "customer@email.com" : "ten.CHINHANH@hotel.com"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                {(form.role === "staff" || form.role === "admin") && (
                  <span className="text-[10px] text-amber-600 mt-1 block">
                    💡 Email nhân viên theo định dạng: <b>ten.CHINHANH@hotel.com</b><br/>
                    Ví dụ: <b>toan.SG@hotel.com</b> (SG = chi nhánh Sài Gòn), <b>lan.HN@hotel.com</b> (HN = Hà Nội)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901234567" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>

              {activeTab === "staff" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Vai trò nhân sự *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="staff">Nhân viên Lễ tân (Staff)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CCCD / CMND</label>
                <input type="text" value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} placeholder="079201001234" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ thường trú</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, Quận 1, TP.HCM" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-gray-400">
                Mật khẩu đăng nhập mặc định: <b>12345678</b>. Tài khoản nhân sự có thể đăng nhập bằng tài khoản này và thực hiện đổi mật khẩu sau.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#1a3a5c" }}>
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">
                Cập nhật thông tin tài khoản
              </h2>
              <button onClick={() => setShowEdit(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 font-medium">{error}</p>}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Họ và tên *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email đăng nhập *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                {form.role === "staff" && (
                  <span className="text-[10px] text-amber-600 mt-1 block">Email nhân viên bắt buộc có chứa từ khóa <b>'staff'</b> hoặc <b>'nhanvien'</b>.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901234567" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>

              {form.role !== "customer" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Vai trò nhân sự *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="staff">Nhân viên Lễ tân (Staff)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CCCD / CMND</label>
                <input type="text" value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} placeholder="079201001234" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ thường trú</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, Quận 1, TP.HCM" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#1a3a5c" }}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple helper icon placeholder mapping
function Info({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
