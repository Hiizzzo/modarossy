import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DevModeToggle from "@/components/DevModeToggle";
import AnnouncementBar from "@/components/AnnouncementBar";
import PageAnimator from "@/components/PageAnimator";
import CartDrawer from "@/components/CartDrawer";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "modarossy",
  description: "Modarossy. Juan Manuel de Rosas 715, Chascomús.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F55A96",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={barlow.variable}>
      <body className="min-h-screen bg-white font-sans text-tinta antialiased">
        <Navbar />
        <main className="pb-14 pt-12 sm:pt-16">
          <PageAnimator>{children}</PageAnimator>
        </main>
        <AnnouncementBar />
        <CartDrawer />
        <DevModeToggle />
      </body>
    </html>
  );
}
