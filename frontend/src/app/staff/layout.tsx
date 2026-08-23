"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { Hotel, LayoutDashboard, BedDouble, BookOpen, Users, LogOut, Menu, X, UserCheck, Tag, Globe } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const isStaff = currentUser?.role === "staff";
  const navItems = [
    ...(isStaff ? [] : [{ path: "/staff/dashboard", label: "Tổng quan", icon: LayoutDashboard }]),
    { path: "/staff/rooms", label: isStaff ? "Sơ đồ phòng" : "Quản lý phòng", icon: BedDouble },
    { path: "/staff/bookings", label: "Đặt phòng", icon: BookOpen },
    { path: "/staff/checkin", label: "Check-in / Out", icon: UserCheck },
    { path: "/staff/customers", label: "Khách hàng", icon: Users },
    ...(isStaff ? [] : [{ path: "/staff/promotions", label: "Khuyến mãi", icon: Tag }]),
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ background: "#f1f5f9" }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen flex-shrink-0`} style={{ background: "#1a3a5c" }}>
        <div className="h-16 flex items-center px-6 gap-2.5 border-b border-blue-950/40 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <Hotel className="w-4.5 h-4.5" style={{ color: "#1a3a5c" }} />
          </div>
          <div>
            <p className="font-bold text-white leading-tight text-sm tracking-wide">MARRIOTT STAFF</p>
            <p className="text-[10px] text-blue-300 leading-tight">Quản trị hệ thống</p>
          </div>
          <button className="lg:hidden ml-auto text-blue-200" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={isActive(item.path)
                ? { background: "#c9a227", color: "#fff" }
                : { color: "#cbd5e1" }
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-950/40 flex-shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm text-red-200 hover:bg-red-950/20 transition-all">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button className="lg:hidden p-1 text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-medium text-gray-500">
              {navItems.find(n => isActive(n.path))?.label || "Hệ thống quản lý"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-600 hover:text-blue-900 border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              Xem Website
            </Link>
            <div className="h-4 w-[1px] bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1a3a5c" }}>
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <span className="hidden sm:inline">{currentUser?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
