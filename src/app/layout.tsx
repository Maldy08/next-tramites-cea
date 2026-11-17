import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/shared/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trámites CEA",
  description: "Sistema de Trámites - Comisión Estatal del Agua de Baja California",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="es" className="h-full antialiased">
        <body className={`${inter.className} min-h-full`}>{children}</body>
      </html>
    </AuthProvider>
  );
}
