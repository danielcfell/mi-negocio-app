import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunito = localFont({
  src: "../fonts/nunito.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

const playfair = localFont({
  src: "../fonts/playfair.woff2",
  variable: "--font-playfair",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mi Negocio",
  description: "Controla tus compras, ventas y ganancias reales.",
};

export const viewport: Viewport = {
  themeColor: "#9163c9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
