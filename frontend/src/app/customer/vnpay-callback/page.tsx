"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../../data/api";

function VNPayCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("Đang xác thực giao dịch...");
  const [bookingId, setBookingId] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    // Convert searchParams to standard object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (Object.keys(params).length === 0) {
      setStatus("error");
      setMessage("Không tìm thấy thông tin giao dịch thanh toán.");
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const data = await api.verifyVNPay(params);

        if (data && data.success) {
          setStatus("success");
          setMessage("Giao dịch thanh toán thành công!");
          setBookingId(data.booking_id || params["vnp_TxnRef"] || "");
          
          // Kích hoạt bắn pháo hoa ăn mừng
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          setStatus("error");
          setMessage(data.message || "Giao dịch không thành công hoặc đã bị hủy.");
        }
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage(err.message || "Lỗi kết nối máy chủ để xác minh giao dịch.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Đang xử lý kết quả thanh toán</h2>
        <p className="text-gray-500 mt-2">Vui lòng không tắt hoặc tải lại trang web lúc này...</p>
      </div>
    );
  }

  if (status === "success") {
    const formattedAmount = Number(searchParams.get("vnp_Amount")) / 100;

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#dcfce7" }}>
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {bookingId && (
          <p className="text-sm text-gray-500 mb-6">Mã đặt phòng của bạn: <strong className="text-gray-800">#{bookingId.toUpperCase()}</strong></p>
        )}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left mb-6">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Thông tin giao dịch</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Ngân hàng</span><span className="font-medium text-gray-800">{searchParams.get("vnp_BankCode")}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Số tiền</span><span className="font-bold text-green-600">{formattedAmount ? formattedAmount.toLocaleString("vi-VN") + " đ" : ""}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Mã giao dịch</span><span className="font-medium text-gray-800">{searchParams.get("vnp_TransactionNo")}</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <button 
            onClick={() => {
              const contact = (typeof window !== "undefined" ? (sessionStorage.getItem("last_booking_contact") || sessionStorage.getItem("last_booking_email") || sessionStorage.getItem("last_booking_phone") || localStorage.getItem("last_booking_contact")) : "") || "";
              router.push(`/customer/lookup?bookingId=${bookingId}${contact ? `&contact=${encodeURIComponent(contact)}` : ''}`);
            }} 
            className="w-full py-3 rounded-xl text-white font-bold hover:opacity-95 transition-opacity shadow-md flex items-center justify-center gap-2" 
            style={{ background: "#1a3a5c" }}
          >
            🔍 Tra cứu chi tiết đơn đặt phòng này
          </button>
          <div className="flex gap-2">
            <button onClick={() => router.push("/customer/my-bookings")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-xs hover:bg-gray-50">Tất cả đơn đặt của tôi</button>
            <button onClick={() => router.push("/customer/home")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-xs hover:bg-gray-50">Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#fee2e2" }}>
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => router.push("/customer/rooms")} className="flex-1 py-3 rounded-xl text-white font-medium bg-red-600 hover:bg-red-700 transition-colors">Đặt phòng mới</button>
        <button onClick={() => router.push("/customer/home")} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Quay lại trang chủ</button>
      </div>
    </div>
  );
}

export default function VNPayCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Đang chuẩn bị xác thực...</h2>
      </div>
    }>
      <SuspenseWrapper />
    </Suspense>
  );
}

function SuspenseWrapper() {
  return <VNPayCallbackContent />;
}
