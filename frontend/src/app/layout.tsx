import type { Metadata } from "next";
import { AppProvider } from "./context/AppContext";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Marriott Hotel",
  description: "5 Star Experience - Marriott Hotel Booking System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
