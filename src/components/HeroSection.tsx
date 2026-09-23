"use client";

import Image from "next/image";
import Navbar from "./Navbar";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">

      {/* Hero Image */}
      <Image
        src="/homepage/him-home.webp"
        alt="HIM — Luxury wood-panelled corridor"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
        style={{
          transform: "scale(1.16)",
          objectPosition: "center center",
        }}
      />

      {/* Overall subtle dark overlay */}
      <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

      {/* Bottom shade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: "35%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Navbar */}
      <Navbar />

      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body {
          height: 100%;
          background: #000;
          color: #fff;
        }
      `}</style>
    </section>
  );
}