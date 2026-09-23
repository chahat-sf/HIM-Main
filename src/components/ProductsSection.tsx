"use client";

import Image from "next/image";

import { useEffect, useRef, useState } from "react";

// Shared black <-> white scroll-turn colors, used by the 3-item section's
// transition below.
const BG_DARK = "#0a0806";
const BG_LIGHT = "#f4f1ea";
const TEXT_LIGHT = "#f7f3ea";
const TEXT_DARK = "#17140f";

// Linear-interpolates between two hex colors by t (0–1).
function lerpColor(hexA: string, hexB: string, t: number): string {
  const clampT = Math.max(0, Math.min(1, t));

  const a = [
    parseInt(hexA.slice(1, 3), 16),
    parseInt(hexA.slice(3, 5), 16),
    parseInt(hexA.slice(5, 7), 16),
  ];

  const b = [
    parseInt(hexB.slice(1, 3), 16),
    parseInt(hexB.slice(3, 5), 16),
    parseInt(hexB.slice(5, 7), 16),
  ];

  const r = Math.round(a[0] + (b[0] - a[0]) * clampT);
  const g = Math.round(a[1] + (b[1] - a[1]) * clampT);
  const bl = Math.round(a[2] + (b[2] - a[2]) * clampT);

  return `rgb(${r}, ${g}, ${bl})`;
}

/* =====================================================================
   EXISTING SECTION — UNCHANGED
===================================================================== */

const products = [
  {
    name: "DELON KNITTED POLO - BROWN",
    price: "£98",
    image: "/products/item-4.webp",
    badges: ["NEW", "PRE-ORDER"],
    swatches: [],
  },
  {
    name: "FOUNDERS ARTIST SMOCK - WASHED YELLOW",
    price: "£118",
    image: "/products/item-6.webp",
    badges: ["NEW", "TRENDING"],
    swatches: ["#171513", "#b8a47d", "#b25d25"],
    extra: "+1",
  },
  {
    name: "JONI BOW-TIE KNITTED VEST - ECRU",
    price: "£75",
    image: "/products/item-8.webp",
    badges: ["NEW"],
    swatches: ["#ddd5c2", "#504b42"],
  },
];

function WishlistIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
    </svg>
  );
}

function ExistingProductsGrid() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;

        const section = sectionRef.current;
        const header = headerRef.current;
        const heading = headingRef.current;

        if (!section || !header || !heading) return;

        const rect = section.getBoundingClientRect();
        const viewportH = window.innerHeight || 1;

        const turnStart = viewportH;
        const turnEnd = viewportH * 0.3;

        const turnProgress =
          (turnStart - rect.top) / (turnStart - turnEnd);

        const t = Math.max(0, Math.min(1, turnProgress));

        section.style.backgroundColor = lerpColor(
          BG_DARK,
          BG_LIGHT,
          t
        );

        section.style.borderLeftColor = lerpColor(
          "#000000",
          BG_LIGHT,
          t
        );

        section.style.borderRightColor = lerpColor(
          "#000000",
          BG_LIGHT,
          t
        );

        header.style.backgroundColor = lerpColor(
          "#0b0705",
          BG_LIGHT,
          t
        );

        header.style.borderTopColor = `rgba(${Math.round(
          255 * (1 - t)
        )}, ${Math.round(255 * (1 - t))}, ${Math.round(
          255 * (1 - t)
        )}, 0.18)`;

        header.style.borderBottomColor = `rgba(${Math.round(
          255 * (1 - t)
        )}, ${Math.round(255 * (1 - t))}, ${Math.round(
          255 * (1 - t)
        )}, 0.22)`;

        heading.style.color = lerpColor(
          TEXT_LIGHT,
          TEXT_DARK,
          t
        );
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full"
      style={{
        backgroundColor: "#080604",
        borderLeft: "25px solid #000",
        borderRight: "25px solid #000",
      }}
    >
      {/* SECTION HEADER */}

      <div
        ref={headerRef}
        className="flex items-center"
        style={{
          height: "58px",
          padding: "0 24px",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          borderBottom: "1px solid rgba(255,255,255,0.22)",
          backgroundColor: "#0b0705",
        }}
      >
        <h2
          ref={headingRef}
          style={{
            margin: 0,
            color: "#f4eee3",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
          }}
        >
          NEW ARRIVALS
        </h2>
      </div>

      {/* PRODUCT GRID */}

      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          borderLeft: "1px solid #000",
          borderRight: "1px solid #000",
        }}
      >
        {products.map((product, index) => (
          <article
            key={product.name}
            className="group relative"
            style={{
              background: "#f4f4f2",
              borderRight:
                index < products.length - 1
                  ? "1px solid #000"
                  : "none",
            }}
          >
            {/* IMAGE */}

            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "1 / 1.13",
                background: "#ddd",
              }}
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority={index < 3}
                quality={95}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              />

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.04), transparent 25%, rgba(0,0,0,0.03))",
                }}
              />

              {/* BADGES */}

              <div
                className="absolute left-3 top-3 flex items-center"
                style={{ gap: "4px" }}
              >
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "15px",
                      padding: "0 6px",
                      border:
                        "1px solid rgba(40,40,35,0.55)",
                      background:
                        "rgba(245,243,235,0.78)",
                      color: "#33322e",
                      fontFamily:
                        "Arial, Helvetica, sans-serif",
                      fontSize: "6px",
                      fontWeight: 500,
                      letterSpacing: "0.4px",
                      lineHeight: 1,
                      textTransform: "uppercase",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* WISHLIST */}

              <button
                type="button"
                aria-label={`Add ${product.name} to wishlist`}
                className="absolute right-3 top-3 flex items-center justify-center transition-opacity duration-200 hover:opacity-60"
                style={{
                  width: "26px",
                  height: "26px",
                  padding: 0,
                  border:
                    "1px solid rgba(40,40,40,0.55)",
                  borderRadius: "50%",
                  background:
                    "rgba(245,243,235,0.72)",
                  color: "#292722",
                }}
              >
                <WishlistIcon />
              </button>
            </div>

            {/* PRODUCT INFORMATION */}

            <div
              style={{
                height: "72px",
                padding: "10px 7px 8px",
                background: "#f4f4f2",
                color: "#252421",
                display: "flex",
                flexDirection: "column",
                borderBottom: "1px solid #000",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily:
                    "Arial, Helvetica, sans-serif",
                  fontSize: "8px",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  letterSpacing: "0.35px",
                  color: "#272623",
                  textTransform: "uppercase",
                }}
              >
                {product.name}
              </p>

              <div
                className="flex items-center"
                style={{
                  height: "13px",
                  gap: "5px",
                  marginTop: "5px",
                }}
              >
                {product.swatches.length > 0 &&
                  product.swatches.map(
                    (swatch, swatchIndex) => (
                      <span
                        key={`${swatch}-${swatchIndex}`}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: swatch,
                          border:
                            "1px solid rgba(30,30,30,0.35)",
                          display: "inline-block",
                        }}
                      />
                    )
                  )}

                {product.extra && (
                  <span
                    style={{
                      marginLeft: "1px",
                      fontFamily:
                        "Arial, Helvetica, sans-serif",
                      fontSize: "8px",
                      color: "#6b6964",
                    }}
                  >
                    {product.extra}
                  </span>
                )}
              </div>

              <div
                className="flex items-center justify-between"
                style={{
                  marginTop: "7px",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
                    fontSize: "9px",
                    fontWeight: 400,
                    color: "#34322e",
                    lineHeight: 1,
                  }}
                >
                  {product.price}
                </span>

                <button
                  type="button"
                  style={{
                    border: 0,
                    borderBottom:
                      "1px solid rgba(50,50,45,0.45)",
                    background: "transparent",
                    padding: "0 0 1px",
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
                    fontSize: "7px",
                    fontWeight: 400,
                    color: "#55524c",
                    cursor: "pointer",
                    letterSpacing: "0.2px",
                    lineHeight: 1,
                  }}
                >
                  + ADD
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   EDITORIAL FLOATING COLLAGE
===================================================================== */

interface CollageImage {
  src: string;
  alt: string;
  height: string;
  offsetTop: string;
  priority?: boolean;
}

const ROW_MOTION = [
  { duration: "10s", delay: "-2s", magnitude: "46px" },
  { duration: "12.5s", delay: "-4s", magnitude: "50px" },
  { duration: "9s", delay: "-1s", magnitude: "32px" },
  { duration: "11.5s", delay: "-5s", magnitude: "42px" },
  { duration: "10.5s", delay: "-3s", magnitude: "38px" },
  { duration: "9.5s", delay: "-2s", magnitude: "28px" },
];

const COLLAGE_IMAGES: CollageImage[] = [
  {
    src: "/products/man-image-1.webp",
    alt: "Man leaning out of a car window",
    height: "clamp(220px, 26vw, 360px)",
    offsetTop: "0px",
    priority: true,
  },
  {
    src: "/products/man-image-2.webp",
    alt: "Man in a trucker cap",
    height: "clamp(190px, 21vw, 290px)",
    offsetTop: "96px",
    priority: true,
  },
  {
    src: "/products/dice-image-3.webp",
    alt: "Dice and a matchbook on a table",
    height: "clamp(140px, 15vw, 210px)",
    offsetTop: "0px",
    priority: true,
  },
  {
    src: "/products/man-image-4.webp",
    alt: "Man in white outfit beside a car",
    height: "clamp(220px, 23vw, 320px)",
    offsetTop: "150px",
  },
  {
    src: "/products/man-image-5.webp",
    alt: "Man on a red sofa",
    height: "clamp(190px, 20vw, 270px)",
    offsetTop: "24px",
  },
  {
    src: "/products/man-image-6.webp",
    alt: "Man playing guitar reclined",
    height: "clamp(230px, 27vw, 360px)",
    offsetTop: "12px",
  },
  {
    src: "/products/man-image-7.webp",
    alt: "Couple against a blue sky",
    height: "clamp(230px, 25vw, 340px)",
    offsetTop: "24px",
  },
  {
    src: "/products/billboard-image-8.webp",
    alt: "Roadside billboard sign reading him",
    height: "clamp(170px, 19vw, 240px)",
    offsetTop: "24px",
  },
  {
    src: "/products/man-image-9.webp",
    alt: "Man against a stone wall",
    height: "clamp(210px, 23vw, 300px)",
    offsetTop: "36px",
  },
  {
    src: "/products/man-image-10.webp",
    alt: "Wide leg trousers, man walking",
    height: "clamp(230px, 27vw, 340px)",
    offsetTop: "12px",
  },
  {
    src: "/products/man-image-11.webp",
    alt: "Man in shirt on a motorbike",
    height: "clamp(210px, 23vw, 300px)",
    offsetTop: "36px",
  },
  {
    src: "/products/man-image-12.webp",
    alt: "Close portrait with sunglasses",
    height: "clamp(210px, 23vw, 300px)",
    offsetTop: "24px",
  },
];

function useResponsiveColumnCount() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const computeColumns = () => {
      const width = window.innerWidth;

      if (width < 640) return 2;
      if (width < 1024) return 3;

      return 4;
    };

    const update = () => setColumns(computeColumns());

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

function EditorialCollage() {
  const columns = useResponsiveColumnCount();

  const sectionRef = useRef<HTMLElement | null>(null);

  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const parallaxFactors = [0.02, -0.016, 0.024, -0.02];

    let frame = 0;

    const onScroll = () => {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;

        const section = sectionRef.current;

        if (!section) return;

        const rect = section.getBoundingClientRect();

        const viewportH = window.innerHeight || 1;

        const progress =
          (viewportH - rect.top) /
          (viewportH + rect.height);

        const clamped = Math.max(
          -1,
          Math.min(1, progress)
        );

        columnRefs.current.forEach((col, i) => {
          if (!col) return;

          const factor =
            parallaxFactors[i % parallaxFactors.length];

          const offset =
            clamped * factor * rect.height;

          col.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
      });
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  const columnGroups: CollageImage[][] = Array.from(
    { length: columns },
    () => []
  );

  COLLAGE_IMAGES.forEach((img, i) => {
    columnGroups[i % columns].push(img);
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: BG_DARK,
        minHeight: "120vh",
        padding: "0 25px",
      }}
    >
      {/* TYPOGRAPHY OVERLAY */}

      <div
        className="absolute left-0 top-0 z-20 w-full"
        style={{
          padding: "28px 34px 0",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "1.4px",
            color: TEXT_LIGHT,
            textTransform: "uppercase",
            border:
              "1px solid rgba(244,238,227,0.5)",
            padding: "3px 8px",
          }}
        >
          Him World
        </span>

        <h2
          style={{
            margin: "14px 0 0",
            color: TEXT_LIGHT,
            fontFamily:
              "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(34px, 8vw, 88px)",
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Too Loud
        </h2>
      </div>

      <div
        className="absolute bottom-0 left-0 z-20 w-full"
        style={{
          padding: "0 34px 34px",
          pointerEvents: "none",
          textAlign: "right",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: TEXT_LIGHT,
            fontFamily:
              "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(34px, 8vw, 88px)",
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          To Stay Still
        </h2>
      </div>

      {/* FLOATING COLLAGE GRID */}

      <div
        className="relative z-10 flex h-full w-full"
        style={{
          gap: "8px",
          padding: "70px 0",
        }}
      >
        {columnGroups.map((group, colIndex) => (
          <div
            key={colIndex}
            ref={(el) => {
              columnRefs.current[colIndex] = el;
            }}
            className="flex flex-1 flex-col"
            style={{
              gap: "8px",
              willChange: "transform",
            }}
          >
            {group.map((img, imgIndex) => {
              const row =
                ROW_MOTION[
                imgIndex % ROW_MOTION.length
                ];

              const rowGoesUp =
                imgIndex % 2 === 0;

              const magnitudeNum = parseFloat(
                row.magnitude
              );

              const signedDistance = `${rowGoesUp ? "-" : ""
                }${row.magnitude}`;

              const reservedTop = rowGoesUp
                ? magnitudeNum
                : 0;

              const reservedBottom = rowGoesUp
                ? 0
                : magnitudeNum;

              return (
                <div
                  key={img.src}
                  className="collage-float relative w-full overflow-hidden"
                  style={
                    {
                      height: img.height,

                      marginTop:
                        imgIndex === 0
                          ? `calc(${img.offsetTop} + ${reservedTop}px)`
                          : `${reservedTop}px`,

                      marginBottom: `${reservedBottom}px`,

                      background: "#1a1712",

                      willChange: "transform",

                      animationDuration:
                        row.duration,

                      animationDelay: row.delay,

                      animationDirection:
                        "alternate",

                      animationName:
                        "collageFloat",

                      animationTimingFunction:
                        "ease-in-out",

                      animationIterationCount:
                        "infinite",

                      ["--float-distance" as string]:
                        signedDistance,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    priority={img.priority}
                    quality={90}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes collageFloat {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(
              0,
              var(--float-distance, 40px),
              0
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .collage-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* =====================================================================
   NEW LAST SECTION — RED MAN / HIM PROVISIONS
===================================================================== */

function ProvisionsSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: "#090504",
      }}
    >
      {/* IMAGE */}

      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "clamp(420px, 41vw, 610px)",
          minHeight: "420px",
        }}
      >
        <Image
          src="/products/red-man-image.webp"
          alt="Him Provisions"
          fill
          priority={false}
          quality={95}
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* DARK OVERLAY */}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.24) 38%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0.08) 100%)",
          }}
        />

        {/* TEXT CONTENT */}

        <div
          className="absolute left-0 top-0 z-10 flex h-full w-full items-center"
          style={{
            padding:
              "clamp(28px, 5vw, 52px)",
          }}
        >
          <div
            style={{
              width: "min(560px, 58%)",
              marginTop: "-2px",
            }}
          >
            {/* SMALL LABEL */}

            <div
              style={{
                marginBottom: "10px",
                color: "rgba(255,255,255,0.72)",
                fontFamily:
                  "Arial, Helvetica, sans-serif",
                fontSize: "10px",
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "0.2px",
              }}
            >
              Food and Beer
            </div>

            {/* MAIN HEADING */}

            <h2
              style={{
                margin: 0,
                color: "#FFF",
                fontFamily: '"Akira Expanded", sans-serif',
                fontSize: "clamp(34px, 4.15vw, 64px)",
                fontStyle: "normal",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                maxWidth: "760px",
              }}
            >
              RECHARGE WITH
              <br />
              HIM PROVISIONS
            </h2>

            {/* DESCRIPTION */}

            <p
              style={{
                margin: "14px 0 0 0",
                alignSelf: "stretch",
                maxWidth: "480px",
                color: "#FFF",
                fontFamily: '"Segoe UI", sans-serif',
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 100,
                lineHeight: "24px",
              }}
            >
              Him Provisions is a step toward a new kind of future; one filled with
              flavourful, nutritious foods that help to restore, rather than deplete,
              our planet.
            </p>

            {/* BUTTON */}

            <button
              type="button"
              style={{
                marginTop: "14px",
                height: "32px",
                padding: "0 20px",
                border: "none",
                borderRadius: "999px",
                background: "#ffffff",
                color: "#27221e",
                fontFamily:
                  "Arial, Helvetica, sans-serif",
                fontSize: "9px",
                fontWeight: 400,
                lineHeight: 1,
                cursor: "pointer",
                transition:
                  "transform 200ms ease, background 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-1px)";
                e.currentTarget.style.background =
                  "#f1eee9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.background =
                  "#ffffff";
              }}
            >
              Shop Food &amp; Beer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   DEFAULT EXPORT
===================================================================== */

export default function ProductsSection() {
  return (
    <>
      <ExistingProductsGrid />

      <EditorialCollage />

      {/* LAST SECTION */}
      <ProvisionsSection />
    </>
  );
}