"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Save, Tag, Calendar, Percent, Gift, Search, Info, AlertCircle } from "lucide-react";
import { api } from "../../data/api";
import { formatPrice } from "../../data/mockData";
import { useApp } from "../../context/AppContext";

interface Promotion {
  code: string;
  description: string;
  discount_percent: number;
  max_discount: number;
  min_booking_amount?: number;
  max_uses?: number;
  used_count?: number;
  start_date: string;
  end_date: string;
  stay_start_date?: string;
  stay_end_date?: string;
  is_active: boolean;
}

const emptyPromo = {
  code: "",
  description: "",
  discount_percent: 10,
  max_discount: 100000,
  min_booking_amount: 0,
  max_uses: 100,
  used_count: 0,
  start_date: "",
  end_date: "",
  stay_start_date: "",
  stay_end_date: "",
};

export default function PromotionsPage() {
  const { currentUser } = useApp();
  const isStaff = currentUser?.role === "staff";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  if (isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-gray-500 text-sm max-w-md">Tài khoản Nhân viên Lễ tân không được phép truy cập hoặc thay đổi các chương trình khuyến mãi và ưu đãi.</p>
      </div>
    );
  }
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(emptyPromo);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    setLoading(true);
    try {
      const data = await api.getAdminPromotions();
      setPromotions(data);
    } catch (e) {
      console.error("Lỗi lấy danh sách khuyến mãi:", e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(promo: Promotion) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    end.setHours(23, 59, 59, 999);

    const maxUses = promo.max_uses ?? 100;
    const usedCount = promo.used_count ?? 0;
    const isFull = maxUses > 0 && usedCount >= maxUses;

    if (isFull) {
      return { text: "Hết lượt", color: "bg-red-50 text-red-700 border-red-200" };
    } else if (end < today) {
      return { text: "Hết hạn", color: "bg-gray-50 text-gray-700 border-gray-200" };
    } else if (start > today) {
      return { text: "Chưa diễn ra", color: "bg-blue-50 text-blue-700 border-blue-200" };
    } else {
      return { text: "Hoạt động", color: "bg-green-50 text-green-700 border-green-200" };
    }
  }

  function formatDateString(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function openAdd() {
    setIsEdit(false);
    setForm({
      code: "",
      description: "",
      discount_percent: 10,
      max_discount: 100000,
      min_booking_amount: 0,
      max_uses: 100,
      used_count: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      stay_start_date: "",
      stay_end_date: "",
    });
    setSubmitError("");
    setShowModal(true);
  }

  function openEdit(promo: Promotion) {
    setIsEdit(true);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discount_percent: promo.discount_percent,
      max_discount: promo.max_discount,
      min_booking_amount: promo.min_booking_amount ?? 0,
      max_uses: promo.max_uses ?? 100,
      used_count: promo.used_count ?? 0,
      start_date: promo.start_date.substring(0, 10),
      end_date: promo.end_date.substring(0, 10),
      stay_start_date: promo.stay_start_date ? promo.stay_start_date.substring(0, 10) : "",
      stay_end_date: promo.stay_end_date ? promo.stay_end_date.substring(0, 10) : "",
    });
    setSubmitError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSubmitError("");
    if (!form.code.trim()) {
      setSubmitError("Vui lòng nhập mã khuyến mãi.");
      return;
    }
    if (!form.start_date || !form.end_date) {
      setSubmitError("Vui lòng chọn ngày bắt đầu và kết thúc đặt phòng.");
      return;
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      setSubmitError("Ngày kết thúc đặt phòng phải sau ngày bắt đầu.");
      return;
    }
    if (form.stay_start_date && form.stay_end_date && new Date(form.stay_start_date) > new Date(form.stay_end_date)) {
      setSubmitError("Ngày kết thúc kỳ lưu trú phải sau ngày bắt đầu lưu trú.");
      return;
    }
    if (form.discount_percent < 1 || form.discount_percent > 100) {
      setSubmitError("Tỉ lệ giảm giá phải từ 1% đến 100%.");
      return;
    }

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_percent: Number(form.discount_percent),
        max_discount: Number(form.max_discount),
        min_booking_amount: Number(form.min_booking_amount || 0),
        max_uses: Number(form.max_uses ?? 100),
        start_date: form.start_date,
        end_date: form.end_date,
        stay_start_date: form.stay_start_date || null,
        stay_end_date: form.stay_end_date || null,
      };

      if (isEdit) {
        await api.updatePromotion(form.code, payload);
      } else {
        await api.addPromotion(payload);
      }
      
      setShowModal(false);
      fetchPromotions();
    } catch (err: any) {
      setSubmitError(err.message || "Không thể lưu thông tin khuyến mãi.");
    }
  }

  async function handleDelete(code: string) {
    try {
      await api.deletePromotion(code);
      setDeleteConfirm(null);
      fetchPromotions();
    } catch (e: any) {
      alert(e.message || "Xóa khuyến mãi thất bại.");
    }
  }

  const filtered = promotions.filter(promo => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return promo.code.toLowerCase().includes(q) || (promo.description || "").toLowerCase().includes(q);
  });

  // Calculate Stats
  const activeCount = promotions.filter(p => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    end.setHours(23, 59, 59, 999);
    const maxUses = p.max_uses ?? 100;
    const usedCount = p.used_count ?? 0;
    const isFull = maxUses > 0 && usedCount >= maxUses;
    return start <= today && end >= today && !isFull;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chương trình khuyến mãi</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo và cấu hình các mã giảm giá cho khách hàng đặt phòng trực tuyến</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all shadow-sm"
          style={{ background: "#1a3a5c" }}
        >
          <Plus className="w-4 h-4" /> Thêm mã KM
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tổng số mã</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{promotions.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Hết hạn / Sắp diễn ra</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{promotions.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-3 bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm mã KM hoặc mô tả..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="p-12 text-center text-gray-400 italic">Đang tải danh sách khuyến mãi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            Không tìm thấy chương trình khuyến mãi nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 text-xs font-semibold uppercase text-gray-500 bg-slate-50">
                  <th className="px-6 py-4">Mã KM</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Mức giảm</th>
                  <th className="px-6 py-4">Giảm tối đa</th>
                  <th className="px-6 py-4">Lượt dùng</th>
                  <th className="px-6 py-4">Thời gian hiệu lực</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(promo => {
                  const status = getStatusLabel(promo);
                  const maxUses = promo.max_uses ?? 100;
                  const usedCount = promo.used_count ?? 0;
                  const isFull = maxUses > 0 && usedCount >= maxUses;
                  return (
                    <tr key={promo.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 tracking-wider select-all">
                        {promo.code}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {promo.description || "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-blue-900">
                        {promo.discount_percent}%
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {promo.max_discount > 0 ? formatPrice(promo.max_discount) : "Không giới hạn"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${isFull ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-800"}`}>
                          👥 {usedCount} / {maxUses > 0 ? maxUses : "∞"}
                          {isFull && " (Hết lượt)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span>Từ: {formatDateString(promo.start_date)}</span>
                          <span>Đến: {formatDateString(promo.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            title="Sửa thông tin"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(promo.code)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                            title="Xóa voucher"
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
          </div>
        )}
      </div>

      {/* Promotion Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{isEdit ? "Chỉnh sửa mã khuyến mãi" : "Thêm mã khuyến mãi mới"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mã khuyến mãi (Code) *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  disabled={isEdit}
                  placeholder="Ví dụ: MARRIOTT2026, SUMMER50..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase font-bold tracking-wider placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả chương trình</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Nhập thông tin mô tả chi tiết chương trình..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phần trăm giảm (%) *</label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.discount_percent}
                      onChange={e => setForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giảm tối đa (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_discount}
                    onChange={e => setForm(f => ({ ...f, max_discount: Number(e.target.value) }))}
                    placeholder="0 nếu không giới hạn"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giới hạn lượt dùng *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses ?? 100}
                    onChange={e => setForm(f => ({ ...f, max_uses: Number(e.target.value) }))}
                    placeholder="100 lượt..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Đơn tối thiểu (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_booking_amount ?? 0}
                    onChange={e => setForm(f => ({ ...f, min_booking_amount: Number(e.target.value) }))}
                    placeholder="0 = Không giới hạn"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-400">💡 <strong>Tránh lỗ vốn:</strong> Đơn tối thiểu giúp khống chế chỉ giảm giá cho đơn phòng giá trị cao.</p>
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-900" />
                  Thời gian mở đặt phòng (Booking Window)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày bắt đầu đặt *</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày kết thúc đặt *</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>


            </div>

            <div className="p-5 border-t flex gap-3 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                style={{ background: "#1a3a5c" }}
              >
                <Save className="w-4 h-4" /> Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-gray-900 mb-2 text-base">Xác nhận xóa khuyến mãi</h3>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Bạn có chắc muốn xóa mã khuyến mãi <span className="font-bold text-gray-800">{deleteConfirm}</span>? Hành động này sẽ vô hiệu hóa việc đặt phòng áp dụng mã này trong tương lai.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg text-white text-sm bg-red-600 hover:bg-red-700 font-semibold"
              >
                Xóa bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
