"use client";

import CustomerLayout from "./customer/layout";
import HomePage from "./customer/home/page";

export default function RootPage() {
  return (
    <CustomerLayout>
      <HomePage />
    </CustomerLayout>
  );
}
