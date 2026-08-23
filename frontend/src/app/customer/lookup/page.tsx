"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, FileText, CheckCircle2, Calendar, Users, Phone, Mail, ArrowLeft, Printer, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "../../data/api";
import { roomTypeLabels, bookingStatusLabels, formatPrice, formatDate, calcNights } from "../../data/mockData";

function LookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const bId = (searchParams.get("bookingId") || searchParams.get("id") || "").trim();
    let contact = (searchParams.get("contact") || searchParams.get("phone") || searchParams.get("email") || "").trim();

    if (typeof window !== "undefined") {
      // Dọn dẹp dữ liệu cũ ở localStorage nếu có để tránh lưu thông tin vĩnh viễn sau khi tắt máy/đóng trình duyệt
      localStorage.removeItem("last_booking_contact");
      localStorage.removeItem("last_booking_email");
      localStorage.removeItem("last_booking_phone");

      if (!contact) {
        contact = (
          sessionStorage.getItem("last_booking_contact") ||
          sessionStorage.getItem("last_booking_email") ||
          sessionStorage.getItem("last_booking_phone") ||
          ""
        ).trim();
      }
    }

    if (bId) setBookingId(bId);
    if (contact) setEmailOrPhone(contact);

    if (bId && contact) {
      setLoading(true);
      setError(null);
      api.lookupBooking(bId, contact)
        .then(res => setBooking(res))
        .catch(err => setError(err.message || "Không tìm thấy đơn đặt phòng. Vui lòng kiểm tra lại thông tin."))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  async function handleLookup(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanId = bookingId.trim();
    const cleanContact = emailOrPhone.trim();

    if (!cleanId || !cleanContact) return;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_booking_contact", cleanContact);
      localStorage.removeItem("last_booking_contact");
    }

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const res = await api.lookupBooking(cleanId, cleanContact);
      setBooking(res);
    } catch (err: any) {
      setError(err.message || "Không tìm thấy đơn đặt phòng. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking() {
    if (!booking) return;
    const confirmCancel = window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${booking.id.toUpperCase()} không?`);
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      await api.cancelBooking(booking.id);
      alert("Hủy đơn đặt phòng thành công!");
      const res = await api.lookupBooking(bookingId.trim(), emailOrPhone.trim());
      setBooking(res);
    } catch (err: any) {
      alert("Lỗi khi hủy đơn: " + (err.message || "Không thể hủy đơn đặt phòng này."));
    } finally {
      setCancelling(false);
    }
  }

  function parseServicesFromNotes(notes: string) {
    if (!notes) return [];
    const services: { name: string; price: number }[] = [];
    const parts = notes.split("|");
    for (const part of parts) {
      if (part.includes("Dịch vụ thêm:") || part.includes("Dịch vụ:") || part.includes("Dịch vụ riêng:")) {
        const serviceStr = part.replace(/Dịch vụ thêm:|Dịch vụ:|Dịch vụ riêng:/g, "").trim();
        const items = serviceStr.split(/,\s*/);
        for (const item of items) {
          const match = item.match(/(.+?)\s*\(([\d.,]+)\s*[₫đVND]*\)/i);
          if (match) {
            const name = match[1].trim();
            const price = Number(match[2].replace(/[.,]/g, ""));
            services.push({ name, price });
          }
        }
      }
    }
    return services;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Về trang chủ
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900" style={{ color: "#1a3a5c" }}>Tra cứu đơn đặt phòng</h1>
        <p className="text-gray-500 text-sm mt-1">Dành cho khách vãng lai và khách hàng muốn theo dõi trạng thái đặt phòng</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Lookup form */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 md:col-span-1">
          <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-900" />
            Nhập thông tin
          </h3>
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mã đặt phòng *</label>
              <input
                type="text"
                required
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                placeholder="Ví dụ: #15 hoặc 15"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email hoặc SĐT đặt phòng *</label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder="example@gmail.com hoặc 090..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "#1a3a5c" }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Tra cứu ngay"}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}
        </div>

        {/* Display details */}
        <div className="md:col-span-2">
          {booking ? (
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn đặt phòng #{booking.id.toUpperCase()}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Ngày đặt đơn: {booking.createdAt}</p>
                </div>
                {/* Status Badge */}
                {(() => {
                  const details = booking.chi_tiet_dat_phongs || [];
                  const totalR = details.length || 1;
                  const cancelledR = details.filter((ct: any) => ct.trang_thai === 'cancelled' || ct.trang_thai_don_goc === 'Da_Huy').length;
                  const checkedInR = details.filter((ct: any) => ct.trang_thai === 'checked_in' || ct.trang_thai_don_goc === 'Dang_O').length;

                  if (totalR > 0 && cancelledR === totalR) {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-50 border-red-200 text-red-700">
                        🔴 Đơn đặt đã hủy
                      </span>
                    );
                  }
                  if (cancelledR > 0) {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 border-amber-200 text-amber-800">
                        ⚠️ Đơn giỏ hàng ({totalR - cancelledR}/{totalR} phòng hoạt động, {cancelledR} phòng đã hủy)
                      </span>
                    );
                  }
                  if (checkedInR > 0 || booking.status === 'checked_in') {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-50 border-orange-200 text-orange-700">
                        🟠 Đang lưu trú
                      </span>
                    );
                  }
                  if (booking.status === 'checked_out') {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-50 border-gray-200 text-gray-700">
                        ⚪ Đã trả phòng (Thành công)
                      </span>
                    );
                  }
                  return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-50 border-green-200 text-green-700">
                      🟢 Đã xác nhận (Chờ nhận phòng)
                    </span>
                  );
                })()}
              </div>

              {/* Guest Details */}
              <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Thông tin khách đặt</p>
                  <p className="font-bold text-gray-800 mt-1">{booking.customerName}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3 text-blue-900" /> {booking.customerPhone}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Mail className="w-3 h-3 text-blue-900" /> {booking.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">
                    Thông tin phòng nghỉ {booking.chi_tiet_dat_phongs && booking.chi_tiet_dat_phongs.length > 1 ? `(${booking.chi_tiet_dat_phongs.length} phòng trong đoàn)` : ""}
                  </p>
                  {booking.chi_tiet_dat_phongs && booking.chi_tiet_dat_phongs.length > 0 ? (
                    <div className="mt-1.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {booking.chi_tiet_dat_phongs.map((ct: any, idx: number) => {
                        const ctSt = ct.trang_thai || 'booked';
                        const isCancelled = ctSt === 'cancelled' || ct.trang_thai_don_goc === 'Da_Huy';
                        const isCheckedIn = ctSt === 'checked_in' || ct.trang_thai_don_goc === 'Dang_O';
                        const isCheckedOut = ctSt === 'checked_out' || ct.trang_thai_don_goc === 'Da_Tra_Phong';

                        let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                        let badgeText = "Chờ nhận phòng";
                        let containerBg = "bg-white border-gray-200";

                        if (isCancelled) {
                          badgeColor = "bg-red-50 text-red-700 border-red-200";
                          badgeText = "Đã hủy phòng";
                          containerBg = "bg-red-50/50 border-red-200";
                        } else if (isCheckedOut) {
                          badgeColor = "bg-gray-100 text-gray-700 border-gray-200";
                          badgeText = "Đã trả phòng";
                          containerBg = "bg-gray-50 border-gray-200";
                        } else if (isCheckedIn) {
                          badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                          badgeText = "Đã nhận phòng";
                          containerBg = "bg-emerald-50/30 border-emerald-200";
                        }

                        return (
                          <div key={idx} className={`text-xs p-2.5 rounded-lg border ${containerBg} flex justify-between items-center gap-2 shadow-sm`}>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                <span>Phòng {idx + 1}: {ct.phong?.loai_phong?.ten_loai_phong || "Hạng phòng Tiêu chuẩn"}</span>
                                {ct.phong?.so_phong && (isCheckedIn || isCheckedOut) ? (
                                  <span className="text-blue-900 font-extrabold">({ct.phong.so_phong})</span>
                                ) : null}
                              </div>
                              <span className="text-gray-500 block mt-0.5">Đơn giá: {formatPrice(ct.gia_ap_dung || (booking.tongTienPhong ? booking.tongTienPhong / (booking.chi_tiet_dat_phongs.length || 1) : booking.totalPrice))} / đêm</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {booking.status === 'checked_in' || booking.status === 'checked_out' ? (
                        <p className="font-bold text-gray-800 mt-1">Phòng {booking.roomNumber}</p>
                      ) : null}
                      <p className="text-xs text-gray-500 mt-1">Hạng phòng: {roomTypeLabels[booking.roomType as keyof typeof roomTypeLabels] || booking.roomType}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-2 font-medium">Lưu trú: {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({calcNights(booking.checkIn, booking.checkOut)} đêm)</p>
                </div>
              </div>

              {/* Billing / Receipt details */}
              {(() => {
                const nights = calcNights(booking.checkIn, booking.checkOut) || 1;
                const roomCharge = booking.tongTienPhong || booking.totalPrice;
                const servicesList = parseServicesFromNotes(booking.notes);
                const servicesTotal = servicesList.reduce((sum: number, s: any) => sum + s.price, 0);
                const discountAmount = Math.max(0, (booking.tongTienPhong ? (booking.tongTienPhong + servicesTotal - booking.totalPrice) : 0));
                
                let surchargeAmount = 0;
                let lateReason = "";
                if (booking.notes) {
                  const match = booking.notes.match(/Phụ thu checkout muộn:\s*\+([\d.,]+)\s*₫\s*\(([^)]+)\)/i);
                  if (match) {
                    surchargeAmount = Number(match[1].replace(/[.,]/g, ""));
                    lateReason = match[2];
                  }
                }

                const finalAmount = booking.totalPrice + surchargeAmount;
                const details = booking.chi_tiet_dat_phongs || [];
                const totalR = details.length || 1;
                const cancelledR = details.filter((ct: any) => ct.trang_thai === 'cancelled' || ct.trang_thai_don_goc === 'Da_Huy').length;
                const activeR = totalR - cancelledR;
                const hasCancelled = cancelledR > 0;

                return (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm">Chi tiết thanh toán hóa đơn</h3>
                    <div className="space-y-2.5 text-sm border-t border-gray-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tiền phòng ({nights} đêm - {totalR} phòng):</span>
                        <span className="font-semibold text-gray-900">{formatPrice(roomCharge)}</span>
                      </div>

                      {servicesList.length > 0 && (
                        <div className="space-y-1 pl-3 border-l-2 border-blue-200 bg-gray-50 p-2.5 rounded-lg text-xs">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dịch vụ đi kèm:</p>
                          {servicesList.map((srv, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-gray-500">{srv.name}</span>
                              <span className="text-gray-700 font-semibold">{formatPrice(srv.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 text-xs">
                          <span>Chiết khấu khuyến mãi:</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}

                      {surchargeAmount > 0 && (
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-red-600 text-xs font-semibold">
                            <span>Phụ thu trễ checkout:</span>
                            <span>+{formatPrice(surchargeAmount)}</span>
                          </div>
                          <p className="text-[10px] text-red-500 italic text-right">Lý do: {lateReason}</p>
                        </div>
                      )}

                      {(() => {
                        const pct = booking.phanTramDatCoc ?? 100;
                        const daCoc = booking.soTienDaCoc && booking.soTienDaCoc > 0 ? booking.soTienDaCoc : (finalAmount * pct / 100);

                        // Tính phân bổ cho phòng hoạt động vs phòng hủy
                        const activeRatio = totalR > 0 ? (activeR / totalR) : 0;
                        const activeRoomCharge = finalAmount * activeRatio;
                        const activeDaCoc = daCoc * activeRatio;
                        const activeConLai = Math.max(0, activeRoomCharge - activeDaCoc);

                        const cancelledRatio = totalR > 0 ? (cancelledR / totalR) : 0;
                        const daCocHuy = daCoc * cancelledRatio;

                        // Kiểm tra lịch sử hủy nếu có
                        let refundAmount = daCocHuy;
                        let penaltyAmount = 0;
                        if (booking.lichSuHuyDons && booking.lichSuHuyDons.length > 0) {
                          const totalRefundFromLogs = booking.lichSuHuyDons.reduce((sum: number, log: any) => sum + Number(log.so_tien_hoan || 0), 0);
                          const totalPenaltyFromLogs = booking.lichSuHuyDons.reduce((sum: number, log: any) => sum + Number(log.so_tien_phat || 0), 0);
                          if (totalRefundFromLogs > 0) refundAmount = totalRefundFromLogs;
                          if (totalPenaltyFromLogs > 0) penaltyAmount = totalPenaltyFromLogs;
                        }

                        return (
                          <>
                            <div className="border-t border-dashed pt-3 flex justify-between font-bold text-gray-900 text-sm">
                              <span>TỔNG GIÁ TRỊ ĐƠN GIỎ HÀNG BAN ĐẦU:</span>
                              <span style={{ color: "#1a3a5c" }}>{formatPrice(finalAmount)}</span>
                            </div>

                            <div className="flex justify-between text-xs font-semibold text-emerald-700">
                              <span>Tổng số tiền đã đặt cọc trước ({pct}%):</span>
                              <span>{formatPrice(daCoc)}</span>
                            </div>

                            {/* Khối hiển thị số tiền CÒN LẠI phải thanh toán cho phòng HOẠT ĐỘNG */}
                            {activeR > 0 && (
                              <div className="mt-3 p-3.5 rounded-xl border space-y-1.5 bg-blue-50/60 border-blue-200">
                                <div className="flex justify-between text-xs font-bold text-blue-900 border-b border-blue-200/60 pb-1.5">
                                  <span>🏠 Phòng đang hoạt động ({activeR}/{totalR} phòng):</span>
                                  <span>Tổng giá trị: {formatPrice(activeRoomCharge)} (Đã cọc: {formatPrice(activeDaCoc)})</span>
                                </div>
                                {activeConLai > 0 ? (
                                  <>
                                    <div className="flex justify-between font-bold text-blue-950 text-xs sm:text-sm pt-1">
                                      <span>💳 Số tiền còn lại cần thu khi Check-in/out:</span>
                                      <span className="text-red-600 font-extrabold">{formatPrice(activeConLai)}</span>
                                    </div>
                                    <p className="text-[11px] text-blue-800 leading-relaxed">
                                      📌 Khách hàng vui lòng thanh toán số tiền còn lại <strong>{formatPrice(activeConLai)}</strong> cho {activeR} phòng đang hoạt động trực tiếp tại quầy Lễ tân (Tiền mặt / Thẻ / VNPay) + tiền dịch vụ phát sinh ngoài gói (nếu có).
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between font-bold text-emerald-900 text-xs sm:text-sm pt-1">
                                      <span>✅ Trạng thái tiền phòng hoạt động:</span>
                                      <span className="text-emerald-700 font-extrabold">Đã thanh toán đủ 100% (0đ còn lại)</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                                      🎉 Phòng đang hoạt động đã được thanh toán hoàn tất 100%. Quý khách không cần thanh toán thêm tiền phòng khi Check-in.
                                    </p>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Khối HƯỚNG DẪN HOÀN TIỀN CỌC cho các PHÒNG HỦY */}
                            {hasCancelled && (
                              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-xs space-y-2.5">
                                <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                  Xác nhận hủy phòng & Hướng dẫn hoàn tiền cọc ({cancelledR}/{totalR} phòng đã hủy)
                                </div>
                                <p className="text-red-800 leading-relaxed">
                                  Trong đơn giỏ hàng của quý khách có <strong>{cancelledR}/{totalR} phòng</strong> đã được HỦY thành công. Bộ phận Lễ tân / Kế toán Marriott Hotel sẽ chủ động liên hệ qua SĐT <span className="font-bold text-red-950">{booking.customerPhone}</span> hoặc Email <span className="font-bold text-red-950">{booking.customerEmail}</span> để hỗ trợ quy trình hoàn tiền cọc cho các phòng hủy trong vòng 24h - 48h làm việc.
                                </p>
                                
                                {daCocHuy > 0 && (
                                  <div className="pt-2 border-t border-red-200 space-y-1">
                                    <div className="flex justify-between font-medium text-red-900 text-xs">
                                      <span>Số tiền cọc đã nộp cho {cancelledR} phòng hủy:</span>
                                      <span>{formatPrice(daCocHuy)}</span>
                                    </div>
                                    {penaltyAmount > 0 && (
                                      <div className="flex justify-between text-red-700 text-[11px]">
                                        <span>Phụ thu phí hủy phòng (nếu có theo quy định):</span>
                                        <span>-{formatPrice(penaltyAmount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-bold text-red-950 text-xs pt-1 border-t border-red-200/60">
                                      <span>Số tiền cọc hoàn lại dự kiến cho {cancelledR} phòng hủy:</span>
                                      <span className="text-emerald-700 text-sm">{formatPrice(refundAmount)}</span>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 flex items-center justify-between">
                                  <a href="tel:02838234567" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg border border-red-300 transition-colors">
                                    📞 Hotline Lễ tân hỗ trợ hoàn cọc: 028 3823 4567
                                  </a>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs hover:bg-gray-50 font-medium flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" /> In hóa đơn này
                      </button>

                      {(() => {
                        const localDate = new Date();
                        const yyyy = localDate.getFullYear();
                        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(localDate.getDate()).padStart(2, '0');
                        const todayStr = `${yyyy}-${mm}-${dd}`;
                        const isPastOrTodayCheckin = booking.checkIn <= todayStr;

                        if (booking.status !== "pending" && booking.status !== "confirmed") return null;

                        if (isPastOrTodayCheckin) {
                          return (
                            <div className="flex-1 py-2 px-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold text-center flex items-center justify-center">
                              📞 Đã đến thời gian nhận phòng. Quý khách vui lòng liên hệ Hotline Lễ tân 028 3823 4567 để được hỗ trợ trực tiếp.
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={handleCancelBooking}
                            disabled={cancelling}
                            className="flex-1 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold border border-red-200 transition-all flex items-center justify-center gap-1.5"
                          >
                            {cancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Hủy đơn đặt phòng này"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-30 text-blue-900" />
              <p className="text-sm font-medium">Chưa có thông tin tra cứu</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">Nhập mã đơn đặt và email/SĐT ở cột bên trái để theo dõi trạng thái đơn phòng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingLookupPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-900 mb-3" />
        <p className="text-sm font-semibold text-gray-600">Đang tải trang tra cứu đơn đặt phòng...</p>
      </div>
    }>
      <LookupContent />
    </Suspense>
  );
}
