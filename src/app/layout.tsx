import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
  description: "Sistema de gestión integral para natatorios. Control de clientes, asistencia, pagos y más.",
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

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  } catch (e) {}
})()
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Anti-flash: aplica tema antes del primer paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SessionProvider>
          <ThemeProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}