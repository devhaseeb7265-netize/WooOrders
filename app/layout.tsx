import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";

export const metadata: Metadata = {
  title: "WooOrders | Multi-Site WooCommerce Management",
  description: "Secure, real-time multi-store WooCommerce order orchestration and operational hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-[#F4F5F7] text-zinc-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-800"
    >
      <body suppressHydrationWarning className="min-h-screen bg-[#F4F5F7] text-zinc-900">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
