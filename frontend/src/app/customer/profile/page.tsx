"use client";

import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../data/api";
import { User, Phone, Mail, MapPin, CreditCard, Save, CheckCircle2, KeyRound, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, updateUser, changePassword } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // State quản lý form Thông tin cá nhân
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    idNumber: currentUser?.idNumber || "",
  });

  // 🟢 TỰ ĐỘNG ĐỒNG BỘ THÔNG TIN HỒ SƠ TỪ CSDL BẰNG APIgetProfile() KHI LOAD TRANG
  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        idNumber: currentUser.idNumber || "",
      });

      api.getProfile(currentUser.id)
        .then(profile => {
          if (profile) {
            setForm({
              name: profile.name || "",
              phone: profile.phone || "",
              address: profile.address || "",
              idNumber: profile.idNumber || "",
            });
            // 🟢 NÂNG CẤP: Đồng bộ ngược lại vào AppContext & sessionStorage để DevTools và màn hình khớp 100%
            updateUser(currentUser.id, profile);
          }
        })
        .catch(err => console.error("Không thể lấy thông tin chi tiết hồ sơ:", err));
    }
  }, [currentUser?.id]);

  // State quản lý Form Đổi mật khẩu
  const [changingPassword, setChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");

  if (!currentUser) return null;

  // 🟢 NGHIỆP VỤ: LƯU THAY ĐỔI THÔNG TIN CÁ NHÂN
  function handleSave() {
    updateUser(currentUser!.id, form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // 🟢 NGHIỆP VỤ: ĐỔI MẬT KHẨU CÁ NHÂN VÀ GỌI API BACKEND
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    // Validate dữ liệu phía Frontend trước khi gửi
    if (!oldPassword) {
      setPwdError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    try {
      setPwdLoading(true);
      // Gọi hàm changePassword từ Context -> api.ts -> Backend Laravel
      const res = await changePassword(oldPassword, newPassword);
      setPwdSuccess(res?.message || "Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
      setTimeout(() => setPwdSuccess(""), 5000);
    } catch (err: any) {
      // Bắt thông báo lỗi từ Backend trả về (Ví dụ: "Mật khẩu cũ không chính xác")
      setPwdError(err.message || "Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại!");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>

      {/* Thông báo cập nhật thông tin thành công */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Cập nhật thông tin cá nhân thành công!
        </div>
      )}

      {/* Card 1: Avatar và Tên tài khoản */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: "#1a3a5c" }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: currentUser.role === "admin" ? "#c9a227" : "#1a3a5c" }}>
              {currentUser.role === "customer" ? "Khách hàng" : currentUser.role === "staff" ? "Nhân viên" : "Quản trị viên"}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Thông tin cá nhân */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Thông tin cá nhân</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm px-4 py-1.5 rounded-lg border font-medium transition-colors hover:bg-gray-50" style={{ borderColor: "#1a3a5c", color: "#1a3a5c" }}>
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} className="text-sm px-4 py-1.5 rounded-lg text-white flex items-center gap-1 font-medium" style={{ background: "#1a3a5c" }}>
                <Save className="w-3.5 h-3.5" /> Lưu
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {[
            { icon: User, label: "Họ và tên", field: "name" as const, type: "text" },
            { icon: Phone, label: "Số điện thoại", field: "phone" as const, type: "tel" },
            { icon: MapPin, label: "Địa chỉ", field: "address" as const, type: "text" },
            { icon: CreditCard, label: "CCCD / CMND", field: "idNumber" as const, type: "text" },
          ].map(({ icon: Icon, label, field, type }) => (
            <div key={field} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0ece2" }}>
                <Icon className="w-4 h-4" style={{ color: "#1a3a5c" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                {editing ? (
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                ) : (
                  <p className="font-medium text-gray-800 text-sm">{form[field] || <span className="text-gray-400">Chưa cập nhật</span>}</p>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0ece2" }}>
              <Mail className="w-4 h-4" style={{ color: "#1a3a5c" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="font-medium text-gray-800 text-sm">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Bảo mật tài khoản (Đổi mật khẩu) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0ece2" }}>
              <KeyRound className="w-4 h-4" style={{ color: "#1a3a5c" }} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Bảo mật tài khoản</h3>
              <p className="text-xs text-gray-500">Đổi mật khẩu đăng nhập cá nhân</p>
            </div>
          </div>
          {!changingPassword && (
            <button
              onClick={() => { setChangingPassword(true); setPwdError(""); setPwdSuccess(""); }}
              className="text-sm px-4 py-1.5 rounded-lg border font-medium transition-colors hover:bg-gray-50 flex items-center gap-1.5"
              style={{ borderColor: "#1a3a5c", color: "#1a3a5c" }}
            >
              <Lock className="w-3.5 h-3.5" />
              Đổi mật khẩu
            </button>
          )}
        </div>

        {/* 🟢 HỘP THÔNG BÁO XANH (THÀNH CÔNG) HIỂN THỊ TRONG THẺ BẢO MẬT */}
        {pwdSuccess && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {pwdSuccess}
          </div>
        )}

        {changingPassword && (
          <form onSubmit={handleChangePassword} className="mt-5 pt-5 border-t border-gray-100 space-y-4">
            {/* 🔴 HỘP THÔNG BÁO ĐỎ (LỖI) HIỂN THỊ TRỰC TIẾP TRÊN FORM */}
            {pwdError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {pwdError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu hiện tại *</label>
              <div className="relative">
                <input
                  type={showOldPwd ? "text" : "password"}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPwd(!showOldPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới *</label>
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới *</label>
              <input
                type={showNewPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPwdError("");
                }}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                disabled={pwdLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="text-sm px-5 py-2 rounded-lg text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "#1a3a5c" }}
                disabled={pwdLoading}
              >
                {pwdLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Card 4: Thông tin tài khoản */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Thông tin tài khoản</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-400 text-xs">Ngày tham gia</p><p className="font-medium">{currentUser.createdAt}</p></div>
          <div className="p-3 rounded-lg bg-gray-50"><p className="text-gray-400 text-xs">Loại tài khoản</p><p className="font-medium capitalize">{currentUser.role === "customer" ? "Khách hàng" : "Nhân viên"}</p></div>
        </div>
      </div>
    </div>
  );
}
