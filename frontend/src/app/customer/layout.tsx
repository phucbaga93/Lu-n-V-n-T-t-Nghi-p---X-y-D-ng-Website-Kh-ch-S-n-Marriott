"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { Hotel, Home, BedDouble, BookOpen, User, LogOut, Menu, X, Bell, Info, Sparkles, ShoppingCart, Search, LayoutDashboard } from "lucide-react";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, cart } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const navItems = [
    { path: "/", label: "Trang chủ", icon: Home },
    { path: "/customer/rooms", label: "Phòng", icon: BedDouble },
    { path: "/customer/about", label: "Giới thiệu", icon: Info },
    { path: "/customer/services", label: "Dịch vụ", icon: Sparkles },
    ...(currentUser ? [
      { path: "/customer/my-bookings", label: "Đặt phòng của tôi", icon: BookOpen },
      { path: "/customer/profile", label: "Tài khoản", icon: User },
    ] : []),
    { path: "/customer/lookup", label: "Tra cứu đặt phòng", icon: Search },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#1a3a5c" }}>
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold leading-tight whitespace-nowrap" style={{ color: "#1a3a5c" }}>MARRIOTT HOTEL</p>
                <p className="text-xs text-gray-400 leading-tight whitespace-nowrap">5 Star Experience</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm transition-all whitespace-nowrap flex-shrink-0"
                  style={isActive(item.path)
                    ? { background: "#1a3a5c", color: "#fff" }
                    : { color: "#555" }
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
              <Link href="/customer/cart" className="relative p-2 text-gray-500 hover:text-gray-700 flex-shrink-0">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {cart.length}
                  </span>
                )}
              </Link>
              <button className="relative p-2 text-gray-500 hover:text-gray-700 flex-shrink-0">
                <Bell className="w-5 h-5" />
              </button>
              {currentUser && (currentUser.role === "admin" || currentUser.role === "staff") && (
                <Link
                  href={currentUser.role === "staff" ? "/staff/rooms" : "/staff/dashboard"}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-semibold transition-all shadow-sm whitespace-nowrap flex-shrink-0"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              {currentUser ? (
                <>
                  <div className="hidden lg:flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs xl:text-sm font-bold flex-shrink-0" style={{ background: "#c9a227" }}>
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="text-xs xl:text-sm font-medium text-gray-700 whitespace-nowrap">{currentUser.name}</span>
                  </div>
                  <button onClick={handleLogout} className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm text-red-600 hover:bg-red-50 transition-all whitespace-nowrap flex-shrink-0 font-medium">
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link href="/login" className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs xl:text-sm text-white font-medium transition-all whitespace-nowrap flex-shrink-0" style={{ background: "#1a3a5c" }}>
                  Đăng nhập
                </Link>
              )}
              <button className="lg:hidden p-2" onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white py-2 px-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg my-0.5 text-sm"
                style={isActive(item.path) ? { background: "#1a3a5c", color: "#fff" } : { color: "#555" }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {currentUser && (currentUser.role === "admin" || currentUser.role === "staff") && (
              <Link
                href={currentUser.role === "staff" ? "/staff/rooms" : "/staff/dashboard"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg my-0.5 text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-100"
              >
                <LayoutDashboard className="w-4 h-4" />
                Vào Dashboard
              </Link>
            )}
            {currentUser ? (
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm text-red-600 mt-1">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm text-white font-medium mt-1 justify-center" style={{ background: "#1a3a5c" }}>
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </nav>

      <main>
        {children}
      </main>

      <footer className="mt-12 py-8 text-center text-sm text-gray-400 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Hotel className="w-4 h-4" style={{ color: "#1a3a5c" }} />
          <span className="font-bold" style={{ color: "#1a3a5c" }}>MARRIOTT HOTEL</span>
        </div>
        <p>Hệ thống chi nhánh toàn quốc (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc) | ☎ 028 3823 4567 | ✉ info@marriotthotel.vn</p>
        <p className="mt-1">© 2026 Marriott Hotel. All rights reserved.</p>
      </footer>
    </div>
  );
}
