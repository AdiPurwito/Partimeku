import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Partimeku — Lowongan Part-time #1 untuk Mahasiswa Indonesia",
  description:
    "Platform lowongan kerja paruh waktu terbaik untuk mahasiswa Indonesia. Temukan pekerjaan sampingan yang fleksibel dan sesuai jadwal kuliahmu.",
  keywords: ["part-time", "lowongan kerja", "mahasiswa", "kerja sampingan", "Indonesia"],
  verification: {
    google: "ob9f9UTCnETabOmGwOLtJr4VR8PMuIzNGX82iIuhAxY",
  },
  openGraph: {
    title: "Partimeku — Lowongan Part-time #1 untuk Mahasiswa Indonesia",
    description:
      "Platform lowongan kerja paruh waktu terbaik untuk mahasiswa Indonesia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/30 selection:text-blue-900">
        <TooltipProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" closeButton richColors />
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
