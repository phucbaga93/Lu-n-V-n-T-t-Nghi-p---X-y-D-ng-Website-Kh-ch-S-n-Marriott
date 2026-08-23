"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { BedDouble, BookOpen, Users, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatPrice, roomTypeLabels } from "../../data/mockData";

export default function DashboardPage() {
  const router = useRouter();
  const { rooms, bookings, users, currentUser } = useApp();
  const isStaff = currentUser?.role === "staff";

  const [revenueMode, setRevenueMode] = useState<"month" | "day">("month");
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default August 2026

  useEffect(() => {
    if (isStaff) {
      router.replace("/staff/rooms");
    }
  }, [isStaff, router]);

  if (isStaff) {
    return null;
  }

  const customers = users.filter(u => u.role === "customer");
  const availableRooms = rooms.filter(r => r.status === "available").length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const todayBookings = bookings.filter(b => b.status === "confirmed" || b.status === "checked_in").length;
  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.totalPrice, 0);

  const stats = [
    { label: "Tổng phòng", value: rooms.length, sub: `${availableRooms} phòng trống`, icon: BedDouble, color: "#1a3a5c" },
    { label: "Đang hoạt động", value: todayBookings, sub: "Đặt phòng hiện tại", icon: BookOpen, color: "#c9a227" },
    { label: "Khách hàng", value: customers.length, sub: "Đã đăng ký", icon: Users, color: "#6366f1" },
    { label: "Doanh thu", value: formatPrice(totalRevenue), sub: "Tổng tất cả", icon: TrendingUp, color: "#22c55e" },
  ];

  const roomTypeData = (["standard", "superior", "deluxe", "suite", "family"] as const).map(t => {
    const fullName = roomTypeLabels[t];
    let shortName = fullName;
    if (t === "standard") shortName = "Standard (STD)";
    else if (t === "superior") shortName = "Superior (SUP)";
    else if (t === "deluxe") shortName = "Deluxe (DLX)";
    else if (t === "suite") shortName = "Suite (SUT)";
    else if (t === "family") shortName = "Family (FAM)";
    return {
      name: fullName,
      shortName,
      count: rooms.filter(r => r.type === t).length,
      revenue: bookings.filter(b => b.roomType === t && b.status !== "cancelled").reduce((s, b) => s + b.totalPrice, 0),
    };
  });

  const statusData = [
    { name: "Trống", value: rooms.filter(r => r.status === "available").length, color: "#22c55e" },
    { name: "Đang dùng", value: rooms.filter(r => r.status === "occupied").length, color: "#ef4444" },
    { name: "Đã đặt", value: rooms.filter(r => r.status === "reserved").length, color: "#3b82f6" },
    { name: "Bảo trì", value: rooms.filter(r => r.status === "maintenance").length, color: "#f59e0b" },
    { name: "Dọn dẹp", value: rooms.filter(r => r.status === "cleaning").length, color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  function parseBookingDate(b: any) {
    const dateStr = b.checkIn || b.createdAt;
    if (!dateStr) return { year: 2026, month: 8, day: 1 };
    const cleanStr = String(dateStr).split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    const dObj = new Date(dateStr);
    if (!isNaN(dObj.getTime())) {
      return { year: dObj.getFullYear(), month: dObj.getMonth() + 1, day: dObj.getDate() };
    }
    return { year: 2026, month: 8, day: 1 };
  }

  const currentSysYear = 2026; // Match system dataset year 2026

  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthBookings = bookings.filter(b => {
      if (b.status === "cancelled") return false;
      const { year, month } = parseBookingDate(b);
      return year === currentSysYear && month === monthNum;
    });
    const realRev = monthBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    return {
      month: `Thg ${monthNum}`,
      shortMonth: `T${monthNum}`,
      revenue: realRev,
      bookingCount: monthBookings.length,
    };
  });

  const daysInMonth = new Date(currentSysYear, selectedMonth, 0).getDate();
  const revenueByDay = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const allDayBookings = bookings.filter(b => {
      const { year, month, day } = parseBookingDate(b);
      return year === currentSysYear && month === selectedMonth && day === dayNum;
    });
    const validBookings = allDayBookings.filter(b => b.status !== "cancelled");
    const cancelledBookings = allDayBookings.filter(b => b.status === "cancelled");
    const realRev = validBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    return {
      day: `N${dayNum}`,
      fullDay: `${dayNum}/${selectedMonth}`,
      revenue: realRev,
      bookingCount: validBookings.length,
      cancelledCount: cancelledBookings.length,
    };
  });

  const bookingStatusCounts = [
    { label: "Chờ xác nhận", count: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "#f59e0b" },
    { label: "Đã xác nhận", count: bookings.filter(b => b.status === "confirmed").length, icon: CheckCircle, color: "#3b82f6" },
    { label: "Đang lưu trú", count: bookings.filter(b => b.status === "checked_in").length, icon: CheckCircle, color: "#22c55e" },
    { label: "Đã hủy", count: bookings.filter(b => b.status === "cancelled").length, icon: XCircle, color: "#ef4444" },
  ];

  const recentBookings = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const statusColors: Record<string, string> = { pending: "#f59e0b", confirmed: "#3b82f6", checked_in: "#22c55e", checked_out: "#6b7280", cancelled: "#ef4444" };
  const statusLabels: Record<string, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", checked_in: "Đang lưu trú", checked_out: "Đã trả phòng", cancelled: "Đã hủy" };

  // Pending requests from guests
  const pendingRequests = bookings
    .filter(b => b.status === "checked_in" && b.notes && b.notes.includes("[REQUEST:"))
    .flatMap(b => {
      const parts = (b.notes || "").split("|").filter(p => p.includes("[REQUEST:"));
      return parts.map(req => {
        const typeMatch = req.match(/\[REQUEST:(\w+):/);
        const timeMatch = req.match(/\[REQUEST:\w+:([^\]]+)\]/);
        const contentMatch = req.match(/\]: (.+)$/);
        const typeMap: Record<string, { label: string; color: string; emoji: string }> = {
          room_issue: { label: "Sự cố phòng", color: "#ef4444", emoji: "🔧" },
          upgrade:    { label: "Nâng cấp phòng", color: "#3b82f6", emoji: "⬆️" },
          service:    { label: "Dịch vụ đặc biệt", color: "#8b5cf6", emoji: "✨" },
          complaint:  { label: "Khiếu nại", color: "#f59e0b", emoji: "⚠️" },
        };
        const type = typeMatch ? typeMatch[1] : "complaint";
        const info = typeMap[type] || typeMap.complaint;
        return {
          bookingId: b.id,
          customerName: b.customerName,
          roomNumber: b.roomNumber,
          type,
          label: info.label,
          color: info.color,
          emoji: info.emoji,
          time: timeMatch ? timeMatch[1] : "",
          content: contentMatch ? contentMatch[1].trim() : req.trim(),
        };
      });
    });

  function handleExportExcel() {
    const csvRows = [
      ["--- BÁO CÁO DOANH THU THEO HẠNG PHÒNG ---"],
      ["Hạng Phòng", "Số Lượng Phòng", "Doanh Thu"],
      ...roomTypeData.map(d => [
        d.name,
        rooms.filter(r => roomTypeLabels[r.type] === d.name).length,
        d.revenue
      ]),
      [""],
      ["--- BÁO CÁO DOANH THU THEO THÁNG (2026) ---"],
      ["Tháng", "Số Đơn Hàng", "Doanh Thu"],
      ...revenueByMonth.map(m => [
        m.month,
        m.bookingCount,
        m.revenue
      ]),
      [""],
      [`--- BÁO CÁO DOANH THU THEO NGÀY (THÁNG ${selectedMonth}/2026) ---`],
      ["Ngày", "Số Đơn Thành Công", "Số Đơn Hủy", "Doanh Thu (VNĐ)"],
      ...revenueByDay.map(d => [
        d.fullDay,
        d.bookingCount,
        d.cancelledCount,
        d.revenue
      ])
    ];

    const csvContent = "\uFEFF" + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_Marriott_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-gray-500 text-sm mt-1">Chào mừng trở lại! Đây là báo cáo hôm nay.</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-sm hover:opacity-90"
          style={{ background: "#1a3a5c" }}
        >
          Xuất báo cáo Excel
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.color + "20" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Booking status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bookingStatusCounts.map((b, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <b.icon className="w-5 h-5 flex-shrink-0" style={{ color: b.color }} />
            <div>
              <p className="text-lg font-bold text-gray-900">{b.count}</p>
              <p className="text-xs text-gray-500">{b.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🟢 WIDGET: NHÂN VIÊN XỬ LÝ PHÒNG HÔM NAY */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        const staffUsers = users.filter(u => u.role === "staff" || u.role === "admin");
        const todayActivity = bookings.filter(b =>
          (b.checkIn === today && b.status === "checked_in") ||
          (b.checkOut === today && b.status === "checked_out")
        );
        if (todayActivity.length === 0) return null;
        const statusAction: Record<string, string> = { checked_in: "Check-in", checked_out: "Check-out" };
        const statusColor: Record<string, string>  = { checked_in: "#22c55e", checked_out: "#6366f1" };
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <h3 className="font-bold text-gray-900 text-sm">👤 Hoạt động nhân viên hôm nay</h3>
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-green-500">{todayActivity.length}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date().toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-2.5 text-left">Phòng</th>
                    <th className="px-5 py-2.5 text-left">Khách lưu trú</th>
                    <th className="px-5 py-2.5 text-left">Thao tác</th>
                    <th className="px-5 py-2.5 text-left">Nhân viên xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayActivity.slice(0, 8).map((b, i) => {
                    const action = b.status === "checked_in" ? "checked_in" : "checked_out";
                    const sv = staffUsers[i % Math.max(staffUsers.length, 1)];
                    const handlerName = sv?.name ?? "—";
                    const handlerEmail = sv?.email ?? "";
                    const branchMatch = handlerEmail.match(/\.([A-Z]{2,6})@hotel\.com$/);
                    const branch = branchMatch ? branchMatch[1] : null;
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-gray-900">{b.roomNumber}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900 text-xs">{b.customerName}</p>
                          <p className="text-[10px] text-gray-400">{b.checkIn} → {b.checkOut}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: statusColor[action] }}>
                            {statusAction[action]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "#c9a227" }}>
                              {handlerName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{handlerName}</p>
                              {branch && <span className="text-[10px] px-1.5 rounded-full bg-blue-50 text-blue-600 font-bold">📍{branch}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {todayActivity.length > 8 && (
                <p className="text-xs text-center text-gray-400 py-2.5">... và {todayActivity.length - 8} hoạt động khác</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pending Guest Requests widget */}
      {pendingRequests.length > 0 && (


        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-100" style={{ background: "#fff8f0" }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="font-bold text-orange-900 text-sm">⚠️ Yêu cầu / Khiếu nại chờ xử lý</h3>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-orange-500">{pendingRequests.length}</span>
            </div>
            <span className="text-xs text-orange-600">Từ khách đang lưu trú</span>
          </div>
          <div className="divide-y divide-orange-50">
            {pendingRequests.slice(0, 5).map((req, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-orange-50/30 transition-colors">
                <span className="text-lg mt-0.5 flex-shrink-0">{req.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{req.customerName}</span>
                    <span className="text-xs text-gray-400">Phòng {req.roomNumber} · #{req.bookingId.toUpperCase()}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: req.color }}>{req.label}</span>
                    {req.time && <span className="text-[10px] text-gray-400">{req.time}</span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{req.content}</p>
                </div>
              </div>
            ))}
            {pendingRequests.length > 5 && (
              <p className="text-xs text-center text-gray-400 py-2.5">... và {pendingRequests.length - 5} yêu cầu khác</p>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-gray-900 text-base">
                  {revenueMode === "month" ? "Doanh thu theo tháng (2026)" : `Doanh thu theo ngày (Tháng ${selectedMonth}/2026)`}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {revenueMode === "month"
                  ? `Tổng doanh thu 12 tháng: ${formatPrice(revenueByMonth.reduce((s, m) => s + m.revenue, 0))}`
                  : `Tổng doanh thu Tháng ${selectedMonth}: ${formatPrice(revenueByDay.reduce((s, d) => s + d.revenue, 0))}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {revenueMode === "day" && (
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-gray-50 text-gray-800 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
              )}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setRevenueMode("month")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${revenueMode === "month" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Theo tháng
                </button>
                <button
                  onClick={() => setRevenueMode("day")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${revenueMode === "day" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Theo ngày
                </button>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            {revenueMode === "month" ? (
              <BarChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={v => `${(v / 1000000).toFixed(0)}Tr`} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), "Doanh thu"]}
                  labelFormatter={(label, items) => {
                    const item = items?.[0]?.payload;
                    return item ? `Tháng ${item.shortMonth.replace('T','')}` : label;
                  }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="revenue" fill="#1a3a5c" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            ) : (
              <BarChart data={revenueByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#475569" }} interval={1} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={v => `${(v / 1000000).toFixed(1)}Tr`} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip
                  formatter={(v: number, name: string, item: any) => {
                    const p = item?.payload;
                    if (p) {
                      return [
                        `${formatPrice(v)} (${p.bookingCount} đơn thành công, ${p.cancelledCount} đơn hủy)`,
                        "Doanh thu"
                      ];
                    }
                    return [formatPrice(v), "Doanh thu"];
                  }}
                  labelFormatter={(label, items) => {
                    const item = items?.[0]?.payload;
                    return item ? `Ngày ${item.fullDay}` : label;
                  }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} barSize={12} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Room status pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Trạng thái phòng</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by room type + recent bookings */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Doanh thu theo loại phòng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roomTypeData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v / 1000000}M`} />
              <YAxis dataKey="shortName" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => [formatPrice(v), "Doanh thu"]} />
              <Bar dataKey="revenue" fill="#c9a227" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Đặt phòng gần đây</h3>
          <div className="space-y-3">
            {recentBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{b.customerName}</p>
                  <p className="text-xs text-gray-500">Phòng {b.roomNumber} · {b.checkIn}</p>
                  <p className="text-[11px] text-blue-800 mt-0.5 flex items-center gap-1 font-medium">
                    👤 Lễ tân: {b.staffName || "Lê Minh Hoàng (Lễ tân)"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: statusColors[b.status] }}>
                    {statusLabels[b.status]}
                  </span>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{formatPrice(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
