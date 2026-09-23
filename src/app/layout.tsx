import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@300;400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-nav: 'Space Mono', monospace;
            --font-room-serif: 'Cormorant Garamond', serif;
            --font-room-sans: 'Jost', sans-serif;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
