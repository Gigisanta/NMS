import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NMS - Natatory Management System",
  description: "Sistema de gestión integral para natatorios. Control de clientes, asistencias, pagos y más.",
  keywords: ["natatorio", "gestión", "clientes", "asistencias", "pagos", "natación"],
  authors: [{ name: "NMS Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "NMS - Natatory Management System",
    description: "Sistema de gestión integral para natatorios",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
