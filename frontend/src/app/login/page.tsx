"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Hotel, Eye, EyeOff, User, Shield } from "lucide-react";
import { api } from "../data/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, logout } = useApp();
  const [role, setRole] = useState<"customer" | "staff">("customer");
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Registration state fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCccd, setRegCccd] = useState("");
  const [regEmailCheckResult, setRegEmailCheckResult] = useState<{ exists: boolean; is_member: boolean } | null>(null);

  const handleRegEmailCheck = async (val: string) => {
    const trimmed = val.trim();
    if (trimmed && trimmed.includes("@") && trimmed.includes(".")) {
      try {
        const res = await api.checkEmail(trimmed);
        setRegEmailCheckResult(res);
      } catch (e) {
        console.error(e);
      }
    } else {
      setRegEmailCheckResult(null);
    }
  };

  const defaultCredentials = {
    customer: { email: "khach1@gmail.com", password: "12345678" },
    staff: { email: "nhanvien@hotel.com", password: "12345678" },
  };

  function handleRoleChange(r: "customer" | "staff") {
    setRole(r);
    setMode("login"); // Reset to login mode when switching roles
    setEmail("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const user = await login(email, password);
      
      // Enforce role check
      if (role === "customer" && (user.role === "staff" || user.role === "admin")) {
        logout();
        setLoading(false);
        setError("Tài khoản của bạn là Nhân viên / Quản trị viên. Vui lòng đăng nhập bên mục Nhân viên.");
        return;
      }
      
      if (role === "staff" && user.role === "customer") {
        logout();
        setLoading(false);
        setError("Tài khoản của bạn là Khách hàng. Vui lòng đăng nhập bên mục Khách hàng.");
        return;
      }

      setLoading(false);
      if (user.role === "customer") router.push("/customer/home");
      else if (user.role === "staff") router.push("/staff/rooms");
      else router.push("/staff/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const user = await register({
        name: regName,
        email,
        phone: regPhone,
        idNumber: regCccd,
        password,
      });
      setLoading(false);
      if (user) {
        router.push("/customer/home");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForgotSuccess("");
    setLoading(true);
    try {
      const response = await api.forgotPassword(email);
      setForgotSuccess(response.message || "Hệ thống đã gửi hướng dẫn đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư!");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi gửi yêu cầu khôi phục mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 50%, #1a3a5c 100%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full" style={{ background: "#c9a227" }} />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full" style={{ background: "#c9a227" }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full" style={{ background: "#c9a227" }} />
        </div>
        <img
          src="https://images.unsplash.com/photo-1724230758718-406bab979e67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
          alt="Hotel lobby"
          className="w-full max-w-md rounded-2xl object-cover shadow-2xl"
          style={{ height: 420 }}
        />
        <div className="mt-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Chào mừng đến với</h2>
          <h1 className="text-4xl font-bold" style={{ color: "#c9a227" }}>MARRIOTT HOTEL</h1>
          <p className="mt-3 text-blue-200">Trải nghiệm đẳng cấp 5 sao - Dịch vụ hoàn hảo</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-5">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all flex items-center gap-1"
            >
              ← Quay lại trang chủ
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#1a3a5c" }}>
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "forgot" ? "Quên mật khẩu" : mode === "login" ? "Đăng nhập hệ thống" : "Đăng ký tài khoản"}
            </h1>
            <p className="text-gray-500 mt-1">Marriott Hotel Management</p>
          </div>

          {/* Role selector (only in login mode) */}
          {mode === "login" && (
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 transition-all"
                style={role === "customer" ? { background: "#1a3a5c", color: "#fff" } : { background: "#f8f8f8", color: "#555" }}
                onClick={() => handleRoleChange("customer")}
                type="button"
              >
                <User className="w-4 h-4" />
                <span>Khách hàng</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 transition-all"
                style={role === "staff" ? { background: "#1a3a5c", color: "#fff" } : { background: "#f8f8f8", color: "#555" }}
                onClick={() => handleRoleChange("staff")}
                type="button"
              >
                <Shield className="w-4 h-4" />
                <span>Nhân viên</span>
              </button>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 transition-all"
                  style={{ focusRingColor: "#1a3a5c" } as React.CSSProperties}
                  placeholder="Nhập email của bạn"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 transition-all pr-12"
                    placeholder="Nhập mật khẩu"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setForgotSuccess(""); }}
                    className="text-xs font-medium hover:underline text-gray-500"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-medium transition-all disabled:opacity-60"
                style={{ background: loading ? "#999" : "#1a3a5c" }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

              {role === "customer" && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); }}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#1a3a5c" }}
                  >
                    Chưa có tài khoản? Đăng ký ngay
                  </button>
                </div>
              )}
            </form>
          ) : mode === "forgot" ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email tài khoản</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 transition-all text-sm"
                  placeholder="Nhập email đã đăng ký"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {forgotSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-medium transition-all disabled:opacity-60 text-sm"
                style={{ background: loading ? "#999" : "#1a3a5c" }}
              >
                {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu đặt lại mật khẩu"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setForgotSuccess(""); }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#1a3a5c" }}
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 text-sm"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    const val = e.target.value;
                    setEmail(val);
                    handleRegEmailCheck(val);
                  }}
                  onBlur={e => handleRegEmailCheck(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 text-sm"
                  placeholder="email@gmail.com"
                  required
                />
                {regEmailCheckResult?.exists && (
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 animate-fadeIn">
                    <p className="font-bold text-blue-950 text-[11px] mb-0.5">💡 Email này đã có thông tin trên hệ thống!</p>
                    <p className="text-blue-800 text-[10.5px] leading-relaxed">
                      Quý khách vui lòng nhập <strong>ĐÚNG Họ và tên, SĐT và CCCD chính chủ</strong> để đăng ký/chuyển đổi tài khoản thành viên.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 text-sm"
                    placeholder="0901234567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CCCD / CMND *</label>
                  <input
                    type="text"
                    value={regCccd}
                    onChange={e => setRegCccd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 text-sm"
                    placeholder="079201001234"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 text-sm"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-60 text-sm mt-2"
                style={{ background: loading ? "#999" : "#1a3a5c" }}
              >
                {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-xs font-medium hover:underline text-gray-500"
                >
                  Đã có tài khoản? Đăng nhập ngay
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
