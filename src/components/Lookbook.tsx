
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const lookbooks = [
  {
    image: "/lookbook/man-on-lunch.webp",
    date: "29.05.26",
    title: "WHERE THE SUN SETTLES",
    description:
      "Shot in Lisbon, our second drop of summer is built for long days in the sun. Inspired by coastal living and vintage travel culture, the collection combines lightweight fabrics, washed textures and summer-ready colourways designed for the season ahead...",
  },
  {
    image: "/lookbook/man-on-bike.webp",
    date: "24.04.26",
    title: "ON SET: LANE SPLITTERS",
    description:
      "Join us on set as we shoot our first instalment of summer — a meeting of studio and the open road, inspired by the golden era of film. Mid-century silhouettes, elevated bowling shirts, and nostalgic detailing come together in motion, capturing the spirit of the season as it unfolds...",
  },
  {
    image: "/lookbook/man-on-car.webp",
    date: "27.03.26",
    title: "ARCHIVES FROM BROOKLYN",
    description:
      "The final instalment of spring, this collection celebrates the versatility of heritage workwear fabrics — herringbone, chunky stripe, and classic denim. Featuring classic fits and transitional styling, from spring through to summer, this collection features raw hems, heavy fabrics, experimental prints & washes...",
  },
];

function Arrow() {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 5H12.5M8.5 1L12.5 5L8.5 9"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Lookbook() {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => {
    setOpen((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <section className="lookbook-section">
      {/* STORIES HEADER */}

      <div className="lookbook-header">
        <div className="lookbook-header-title">STORIES</div>

        <a href="#lookbooks" className="lookbook-header-link">
          <span>VIEW ALL</span>
          <Arrow />
        </a>
      </div>

      {/* STORY CARDS — GRID ON DESKTOP, SLIDER ON MOBILE */}

      <div id="lookbooks" className="lookbook-grid">
        {lookbooks.map((lookbook, index) => (
          <article className="lookbook-card" key={lookbook.title}>
            <div className="lookbook-image">
              <div className="lookbook-image-reveal">
                <div className="lookbook-image-frame">
                  <Image
                    src={lookbook.image}
                    alt={lookbook.title}
                    fill
                    priority={index === 0}
                    quality={90}
                    sizes="(max-width: 640px) 84vw, (max-width: 900px) 50vw, 33vw"
                    className="lookbook-image-element"
                  />
                </div>
              </div>
            </div>

            <div className="lookbook-content">
              <p className="lookbook-category">
                {index === 0
                  ? "PEOPLE"
                  : index === 1
                    ? "JOURNEYS"
                    : "CULTURE"}
              </p>

              <h2>{lookbook.title}</h2>

              <p
                className={`lookbook-description${open[lookbook.title] ? " is-open" : ""
                  }`}
              >
                {lookbook.description}
              </p>

              <button
                type="button"
                className="lookbook-read-more"
                onClick={() => toggle(lookbook.title)}
                aria-expanded={!!open[lookbook.title]}
              >
                <span>
                  {open[lookbook.title] ? "READ LESS" : "READ MORE"}
                </span>
                <Arrow />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* LOWER VIDEO FEATURE */}

      <section className="summer-feature">
        <div className="summer-feature-media">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="summer-feature-video"
          >
            <source src="/videos/footer-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="summer-feature-content">
          <div className="summer-feature-inner">
            <span className="summer-feature-label">OUR APPROACH</span>

            <h2>WHERE THE DAY UNFOLDS</h2>

            <p>
              Him is about clothes that live with you — in the routine,
              the detours and everything in between. Designed for comfort,
              movement and a more considered tomorrow.
            </p>

            <Link href="/collection" className="summer-feature-link">
              <span>OUR BRAND</span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* STYLES */}

      <style jsx>{`
        .lookbook-section {
          width: 100%;
          background: #121212;
          color: #f4eee5;
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        /* STORIES HEADER */

        .lookbook-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px clamp(20px, 5.6vw, 80px) 20px;
          background: #121212;
        }

        .lookbook-header-title {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #f5eee5;
        }

        .lookbook-header-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(245, 238, 229, 0.9);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          text-decoration: none;
          text-transform: uppercase;
          transition: opacity 180ms ease;
        }

        .lookbook-header-link:hover,
        .lookbook-read-more:hover {
          opacity: 0.6;
        }

        /* DESKTOP STORY GRID */

        .lookbook-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          column-gap: 18px;
          row-gap: 0;
          padding: 0 clamp(20px, 5.6vw, 80px);
          box-sizing: border-box;
        }

        .lookbook-card {
          position: relative;
          min-width: 0;
          background: transparent;
          border: none;
        }

        /* IMAGE REVEAL */

        .lookbook-image {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          container-type: inline-size;
          --shift: 25cqw;
        }

        .lookbook-image-reveal {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 62.5cqw;
          overflow: hidden;
          background: #121212;
          transition: height 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .lookbook-image-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          margin-top: calc(var(--shift) * -1);
          transition: margin-top 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .lookbook-image-frame :global(.lookbook-image-element) {
          object-fit: cover;
          object-position: center;
        }

        // @media (hover: hover) and (min-width: 641px) {
        //   .lookbook-image:hover {
        //     z-index: 5;
        //   }

        //   .lookbook-image:hover .lookbook-image-reveal {
        //     height: 133.34cqw;
        //   }

        //   .lookbook-image:hover .lookbook-image-frame {
        //     margin-top: 0;
        //   }
        }

        /* STORY CONTENT */

        .lookbook-content {
          min-height: 0;
          padding: 15px 0 24px;
          border: none;
        }

        .lookbook-category {
          margin: 12 0 9px;
          color: rgba(244, 238, 229, 0.45);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 350;
          line-height: 1;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .lookbook-content h2 {
          margin: 0;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.1px;
          text-transform: uppercase;
        }

        .lookbook-description {
          margin: 9px 0 0;
          max-width: 100%;
          color: rgba(244, 238, 229, 0.58);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 400;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lookbook-description.is-open {
          display: block;
          overflow: visible;
          -webkit-line-clamp: unset;
        }

        .lookbook-read-more {
          background: none;
          border: 0;
          padding-bottom: 12;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          color: rgba(244, 238, 229, 0.85);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 600;
          line-height: 1;
          text-decoration: none;
          text-transform: uppercase;
          transition: opacity 180ms ease;
        }

        /* LOWER VIDEO FEATURE */

        .summer-feature {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1.23fr;
          min-height: 480px;
          border-top: 1px solid rgba(255, 255, 255, 0.25);
        }

        .summer-feature-media {
          position: relative;
          min-width: 0;
          height: 480px;
          overflow: hidden;
          background: #17120e;
        }

        .summer-feature-video {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .summer-feature-content {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          min-width: 0;
          background: #fafafa;
          color: #222;
          padding: 36px clamp(28px, 5.5vw, 80px);
        }

        .summer-feature-inner {
          width: 100%;
          max-width: 390px;
          text-align: left;
        }

        .summer-feature-label {
          display: block;
          margin-bottom: 12px;
          color: #777;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.8px;
        }

        .summer-feature-inner h2 {
          margin: 0;
          color: #292724;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(28px, 2.3vw, 36px);
          font-weight: 400;
          line-height: 0.98;
          letter-spacing: -0.6px;
          text-transform: uppercase;
          max-width: 360px;
        }

        .summer-feature-inner p {
          margin: 14px 0 0;
          max-width: 360px;
          color: #777;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 400;
          line-height: 1.55;
        }

        .summer-feature-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding-bottom: 3px;
          border-bottom: 1px solid #292724;
          color: #292724;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.3px;
          text-decoration: none;
          text-transform: uppercase;
          transition: opacity 180ms ease;
        }

        .summer-feature-link:hover {
          opacity: 0.6;
        }

        /* TABLET */

        @media (max-width: 1024px) {
          .summer-feature {
            grid-template-columns: 1fr 1fr;
          }

          .summer-feature-media {
            height: 280px;
          }

          .summer-feature-content {
            padding: 28px;
          }

          .summer-feature-inner h2 {
            font-size: clamp(25px, 3vw, 32px);
          }
        }

        /* MOBILE SLIDER */

        @media (max-width: 640px) {
          .lookbook-header {
            padding: 26px 16px 16px;
          }

          .lookbook-header-title {
            font-size: 8px;
          }

          .lookbook-header-link {
            font-size: 7px;
          }

          .lookbook-grid {
            display: grid;
            grid-template-columns: none;
            grid-auto-columns: 84%;
            grid-auto-flow: column;
            gap: 14px;
            padding: 0 16px 16px;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            scroll-padding-left: 16px;
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .lookbook-grid::-webkit-scrollbar {
            display: none;
          }

          .lookbook-card {
            width: 100%;
            min-width: 0;
            scroll-snap-align: start;
            scroll-snap-stop: always;
            border: none;
          }

          /* Full portrait images on mobile */

          .lookbook-image {
            width: 100%;
            aspect-ratio: 3 / 4;
            --shift: 0cqw;
          }

          .lookbook-image-reveal {
            height: 133.34cqw;
          }

          .lookbook-image-frame {
            margin-top: 0;
          }

          .lookbook-content {
            min-height: auto;
            padding: 12px 0 16px;
          }

          .lookbook-category {
            font-size: 9px;
          }

          .lookbook-content h2 {
            font-size: 11px;
          }

          .lookbook-description {
            max-width: 100%;
            font-size: 9px;
            line-height: 1.5;
            margin-top: 9px;
          }

          .lookbook-read-more {
            margin-top: 12px;
          }

          /* Video feature */

          .summer-feature {
            grid-template-columns: 1fr;
          }

          .summer-feature-media {
            height: 260px;
          }

          .summer-feature-content {
            padding: 36px 24px;
          }

          .summer-feature-inner {
            max-width: 100%;
          }

          .summer-feature-inner h2 {
            font-size: 32px;
            max-width: 320px;
          }

          .summer-feature-inner p {
            font-size: 11px;
            line-height: 1.65;
          }
        }

        /* SMALL MOBILE */

        @media (max-width: 380px) {
          .lookbook-grid {
            grid-auto-columns: 88%;
            gap: 12px;
            padding-left: 12px;
            padding-right: 12px;
          }

          .lookbook-header {
            padding-left: 12px;
            padding-right: 12px;
          }

          .summer-feature-content {
            padding: 32px 18px;
          }

          .summer-feature-inner h2 {
            font-size: 29px;
          }
        }
      `}</style>
    </section>
  );
}
