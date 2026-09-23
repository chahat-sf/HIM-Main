import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Space_Mono } from "next/font/google";
import "./globals.css";

// Fonts must be loaded in a Server Component (layout.tsx)
// They are exposed as CSS variables and consumed in any component
const spaceMono = Space_Mono({
  variable: "--font-nav",   // ← change this name here to remap everywhere
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-room-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-room-sans",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIM",
  description: "HIM — Luxury Menswear",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
