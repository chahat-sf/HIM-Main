"use client";

import Image from "next/image";

const lookbooks = [
  {
    image: "/lookbook/Where-The-Sun-Settles.webp",
    date: "29.05.26",
    title: "WHERE THE SUN SETTLES",
    description:
      "Shot in Lisbon, our second drop of summer is built for long days in the sun. Inspired by coastal living and vintage travel culture, the collection combines lightweight fabrics, washed textures and summer-ready colourways designed for the season ahead...",
  },
  {
    image: "/lookbook/On-Set-Lane-Splitters.webp",
    date: "24.04.26",
    title: "ON SET: LANE SPLITTERS",
    description:
      "Join us on set as we shoot our first instalment of summer — a meeting of studio and the open road, inspired by the golden era of film. Mid-century silhouettes, elevated bowling shirts, and nostalgic detailing come together in motion, capturing the spirit of the season as it unfolds...",
  },
  {
    image: "/lookbook/Archives-from-Brooklyn.webp",
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
  return (
    <section className="lookbook-section">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="lookbook-header">
        <div className="lookbook-header-title">VIEW LOOKBOOKS</div>

        <a href="#lookbooks" className="lookbook-header-link">
          <span>VIEW LOOKBOOK</span>
          <Arrow />
        </a>
      </div>

      {/* =========================================================
          LOOKBOOK GRID
      ========================================================= */}
      <div id="lookbooks" className="lookbook-grid">
        {lookbooks.map((lookbook, index) => (
          <article className="lookbook-card" key={lookbook.title}>
            {/* IMAGE */}
            <div className="lookbook-image">
              <Image
                src={lookbook.image}
                alt={lookbook.title}
                fill
                priority={index === 0}
                quality={90}
                sizes="(max-width: 768px) 100vw, 33.33vw"
                className="lookbook-image-element"
              />
            </div>

            {/* CONTENT */}
            <div className="lookbook-content">
              <h2>{lookbook.title}</h2>

              <p className="lookbook-description">
                <span>{lookbook.date}</span> | {lookbook.description}
              </p>

              <a href="#" className="lookbook-read-more">
                <span>VIEW LOOKBOOK</span>
                <Arrow />
              </a>
            </div>
          </article>
        ))}
        <div className="review-bar">
          <div className="review-bar-inner">
            <span className="review-stars">★★★★★</span>
            <span className="review-text">4.8/5 STARS ON REVIEWS.IO</span>
          </div>
        </div>
      </div>
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
            <h2>WHERE THE SUN SETTLES</h2>

            <p>
              Shot in Lisbon, our second drop of summer is built for long days in the
              sun. Inspired by coastal living and vintage travel culture, the
              collection combines lightweight fabrics, washed textures and
              summer-ready colourways designed for the season ahead.
            </p>

            <a href="#" className="summer-feature-link">
              <span>VIEW THE LOOKBOOK</span>
              <Arrow />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          STYLES
      ========================================================= */}
      <style jsx>{`
        .lookbook-section {
          width: 100%;
          background: #0b0502;
          color: #f4eee5;
          border-left: 1px solid rgba(255, 255, 255, 0.35);
          border-right: 1px solid rgba(255, 255, 255, 0.35);
          overflow: hidden;
        }

        /* =========================
           HEADER
        ========================= */

        .lookbook-header {
          height: 48px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
          background: #0b0502;
        }

        .lookbook-header-title {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.25px;
          text-transform: uppercase;
          color: #f5eee5;
        }

        .lookbook-header-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(245, 238, 229, 0.72);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 7px;
          font-weight: 400;
          line-height: 1;
          text-decoration: none;
          text-transform: uppercase;
          transition: opacity 180ms ease;
        }

        .lookbook-header-link:hover {
          opacity: 0.55;
        }

        /* =========================
           GRID
        ========================= */

        .lookbook-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        /* =========================
           CARD
        ========================= */

        .lookbook-card {
          min-width: 0;
          background: #0b0502;
          border-right: 1px solid rgba(255, 255, 255, 0.35);
        }

        .lookbook-card:last-child {
          border-right: none;
        }

        /* =========================
           IMAGE
        ========================= */

        .lookbook-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 0.97;
          overflow: hidden;
          background: #21140e;
        }

        .lookbook-image-element {
          object-fit: cover;
          object-position: center center;
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .lookbook-card:hover .lookbook-image-element {
          transform: scale(1.025);
        }

        /* =========================
           CONTENT
        ========================= */

        .lookbook-content {
          min-height: 170px;
          padding: 18px 13px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.35);
        }

        .lookbook-content h2 {
          margin: 0;
          color: #f4eee5;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: 0.45px;
          text-transform: uppercase;
        }

        .lookbook-description {
          margin: 17px 0 0;
          max-width: 285px;
          color: rgba(244, 238, 229, 0.68);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 400;
          line-height: 1.35;
        }

        .lookbook-description span {
          color: rgba(244, 238, 229, 0.72);
        }

        /* =========================
           READ MORE
        ========================= */

        .lookbook-read-more {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 20px;
          color: rgba(244, 238, 229, 0.72);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 7px;
          font-weight: 400;
          line-height: 1;
          text-decoration: none;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(244, 238, 229, 0.38);
          padding-bottom: 3px;
          transition:
            color 180ms ease,
            opacity 180ms ease;
        }

        .lookbook-read-more:hover {
          color: #fff;
          opacity: 0.8;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {
          .lookbook-header {
            padding: 0 16px;
          }

          .lookbook-content {
            min-height: 185px;
            padding: 16px 11px 18px;
          }

          .lookbook-description {
            font-size: 7.5px;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 640px) {
          .lookbook-header {
            height: 46px;
            padding: 0 13px;
          }

          .lookbook-header-title {
            font-size: 8px;
          }

          .lookbook-header-link {
            font-size: 6.5px;
          }

          .lookbook-grid {
            grid-template-columns: 1fr;
          }

          .lookbook-card {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          }

          .lookbook-card:last-child {
            border-bottom: none;
          }

          .lookbook-image {
            aspect-ratio: 1.45 / 1;
          }

          .lookbook-content {
            min-height: auto;
            padding: 16px 14px 20px;
          }

          .lookbook-content h2 {
            font-size: 9px;
          }

          .lookbook-description {
            max-width: 100%;
            font-size: 8px;
            line-height: 1.4;
            margin-top: 14px;
          }

          .lookbook-read-more {
            margin-top: 17px;
          }
        }

        /* =====================================================
   FEATURE SECTION
===================================================== */

.summer-feature {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
}

.summer-feature-media {
  position: relative;
  height: 420px;
  overflow: hidden;
  background: #111;
}

.summer-feature-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.summer-feature-content {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 80px 50px;
}

.summer-feature-inner {
  max-width: 420px;
  text-align: center;
}

.summer-feature-inner h2 {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #202020;
}

.summer-feature-inner p {
  margin: 22px 0 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #666;
}

.summer-feature-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  color: #9d8464;
  text-decoration: none;
  text-transform: uppercase;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(157, 132, 100, 0.4);
  padding-bottom: 4px;
  transition: opacity 0.2s ease;
}

.summer-feature-link:hover {
  opacity: 0.7;
}

/* =====================================================
   TABLET
===================================================== */

@media (max-width: 1024px) {
  .summer-feature-media {
    height: 600px;
  }

  .summer-feature-content {
    padding: 60px 40px;
  }

  .summer-feature-inner h2 {
    font-size: 26px;
  }
}

/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 768px) {
  .summer-feature {
    grid-template-columns: 1fr;
  }

  .summer-feature-media {
    height: 450px;
  }

  .summer-feature-content {
    padding: 45px 24px;
  }

  .summer-feature-inner {
    max-width: 100%;
  }

  .summer-feature-inner h2 {
    font-size: 22px;
  }

  .summer-feature-inner p {
    font-size: 13px;
    line-height: 1.7;
  }
}

/* =====================================================
   REVIEW BAR
===================================================== */

.review-bar {
  grid-column: 1 / -1;
  width: 100%;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;

  background: #0b0502;

  border-top: 1px solid rgba(255, 255, 255, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.review-bar-inner {
  display: flex;
  align-items: center;
  gap: 10px;

  color: #a88b64;

  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;

}

.review-stars {
  color: #b8986b;
  font-size: 10px;
  letter-spacing: 1px;
  line-height: 1;
}

.review-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 8px;
  line-height: 1;
}
      `}</style>
    </section>
  );
}