import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DevModeToggle from "@/components/DevModeToggle";
import AnnouncementBar from "@/components/AnnouncementBar";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "modarossy",
  description: "Tienda de ropa Rossi. Juan Manuel de Rosas 720, Chascomús.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4FA8D8",
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
        <main className="pb-10 pt-14 sm:pt-16">
          {children}
        </main>
        <AnnouncementBar />
        <DevModeToggle />
      </body>
    </html>
  );
}
