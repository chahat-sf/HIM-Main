"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Style constants ────────────────────────────────────────────────────────

const NAV_FONT = "var(--font-nav), monospace";
const SERIF = 'var(--font-room-serif, "Cormorant Garamond"), Georgia, serif';

const LINK_COLOR = "rgba(255, 255, 255, 0.72)";
const LINK_HOVER = "#ffffff";

const LINK_SIZE = "9px";
const LINK_SPACING = "1.5px";

// ─── Navigation ─────────────────────────────────────────────────────────────

const leftLinks = [
  { label: "JEANS", href: "/collection?category=JEANS" },
  { label: "SHIRTS", href: "/collection?category=SHIRTS" },
  { label: "TSHIRTS", href: "/collection?category=TSHIRTS" },
  { label: "LOOKBOOK", href: "/collection" },
];

const rightLinks = [
  { label: "BRAND", href: "/" },
  { label: "REWARDS", href: "/" },
];

// ─── Search popup content (edit these) ──────────────────────────────────────

const CREAM = "#f3ead2";
const TAN = "#5a4a38";
const INK = "#2a2623";
const BLUE = "#3a5aa8";

type SearchProduct = {
  slug: string;
  name: string;
  price: string;
  image: string;
  colors: string[];
};

// The first 4 show as "Popular products". Typing in the box filters all of them.
const SEARCH_PRODUCTS: SearchProduct[] = [
  { slug: "textured-thermal-white-7",  name: "Double-Breasted Blazer",        price: "₹38,000", image: "/bestseller/bs-image-1.webp", colors: [CREAM, TAN, INK] },
  { slug: "textured-thermal-white-8",  name: "Midnight Slim Blazer",          price: "₹36,000", image: "/bestseller/bs-image-2.webp", colors: [CREAM, BLUE, INK] },
  { slug: "textured-thermal-white-9",  name: "Tailored Single-Breasted Coat", price: "₹42,000", image: "/bestseller/bs-image-3.webp", colors: [CREAM, TAN, INK] },
  { slug: "textured-thermal-white-10", name: "Velvet Trim Evening Jacket",    price: "₹44,000", image: "/bestseller/bs-image-4.webp", colors: [CREAM, TAN, INK] },
  { slug: "textured-thermal-white-11", name: "Heritage Overcoat",             price: "₹52,000", image: "/bestseller/bs-image-5.webp", colors: [CREAM, TAN, INK] },
  { slug: "textured-thermal-white-12", name: "Midnight Slim Blazer II",       price: "₹36,000", image: "/bestseller/bs-image-2.webp", colors: [CREAM, BLUE, INK] },
];
const POPULAR_COUNT = 4;

// Banner at the bottom of the popup. Swap the image for your own "edit" photo.
const EDIT_IMAGE = "/homepage/navbar-image.webp";
const EDIT_LINK = "/collection";

// ─── Icons ─────────────────────────────────────────────────────────────────

function SearchIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-3.8 3.1-5.8 6.5-5.8s5.7 2 6.5 5.8" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M5 8.5h14l-1 12H6l-1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

// ─── Single nav link (shared by desktop and phone lists) ───────────────────

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="uppercase no-underline transition-colors duration-200"
      style={{
        fontFamily: NAV_FONT,
        fontSize: LINK_SIZE,
        letterSpacing: LINK_SPACING,
        fontWeight: 400,
        color: LINK_COLOR,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = LINK_HOVER;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = LINK_COLOR;
      }}
    >
      {label}
    </Link>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const close = () => setSearchOpen(false);

  // Cursor in the box when it opens
  useEffect(() => {
    if (!searchOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [searchOpen]);

  // Esc closes, and the page behind does not scroll while the popup is open
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return SEARCH_PRODUCTS.slice(0, POPULAR_COUNT);
    return SEARCH_PRODUCTS.filter((p) => p.name.toLowerCase().includes(trimmed));
  }, [trimmed]);

  const popup = (
    <div
      className={`him-sp${searchOpen ? " open" : ""}`}
      aria-hidden={!searchOpen}
    >
      {/* dim backdrop — click anywhere outside the panel to close */}
      <div className="him-sp-backdrop" onClick={close} />

      <div className="him-sp-panel" role="dialog" aria-label="Search">
        {/* SEARCH ROW */}
        <form
          className="him-sp-bar"
          role="search"
          onSubmit={(e) => e.preventDefault()} // no redirect
        >
          <span className="him-sp-bar-icon" aria-hidden="true">
            <SearchIcon size={14} />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, stories"
            aria-label="Search products, categories, stories"
            tabIndex={searchOpen ? 0 : -1}
            autoComplete="off"
            className="him-sp-input"
          />

          <button
            type="button"
            className="him-sp-esc"
            tabIndex={searchOpen ? 0 : -1}
            onClick={close}
            aria-label="Close search"
          >
            <span>ESC</span>
            <CloseIcon />
          </button>
        </form>

        {/* PRODUCTS */}
        <p className="him-sp-label">{trimmed ? "RESULTS" : "POPULAR PRODUCTS"}</p>

        {results.length > 0 ? (
          <div className="him-sp-grid">
            {results.map((p) => (
              <Link
                key={p.slug}
                href={`/collection/${p.slug}`}
                className="him-sp-card"
                tabIndex={searchOpen ? 0 : -1}
                onClick={close}
              >
                <div className="him-sp-card-img">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    quality={80}
                    sizes="(max-width: 768px) 45vw, 22vw"
                    className="object-cover"
                    style={{ objectPosition: "center 18%" }}
                  />
                  <span className="him-sp-plus" aria-hidden="true">
                    <PlusIcon />
                  </span>
                </div>
                <p className="him-sp-card-name">{p.name}</p>
                <p className="him-sp-card-price">{p.price}</p>
                <div className="him-sp-dots">
                  {p.colors.map((c, i) => (
                    <span key={`${c}-${i}`} style={{ background: c }} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="him-sp-empty">No products found for “{query.trim()}”.</p>
        )}

        {/* THE EDIT BANNER */}
        <div className="him-sp-edit">
          <Image
            src={EDIT_IMAGE}
            alt=""
            fill
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="him-sp-edit-shade" />
          <div className="him-sp-edit-copy">
            <p className="him-sp-edit-tag">THE EDIT</p>
            <h3 className="him-sp-edit-title">
              The Everyday
              <br />
              Edit
            </h3>
            <p className="him-sp-edit-sub">
              Refined pieces for a more considered you.
            </p>
            <Link
              href={EDIT_LINK}
              className="him-sp-edit-btn"
              tabIndex={searchOpen ? 0 : -1}
              onClick={close}
            >
              EXPLORE NOW <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <nav
      className="him-nav absolute top-0 left-0 right-0 z-50 w-full"
      style={{ background: "transparent" }}
    >
      {/* TOP ROW — desktop: links / logo / links + icons.  Phone: logo + icons */}
      <div className="him-nav-row relative flex w-full items-center justify-between">
        {/* LEFT NAVIGATION (desktop only) */}
        <ul
          className="him-nav-desktop-links flex items-center list-none m-0 p-0"
          style={{ gap: "24px" }}
        >
          {leftLinks.map((link) => (
            <li key={link.label}>
              <NavLink {...link} />
            </li>
          ))}
        </ul>

        {/* CENTER LOGO */}
        <Link
          href="/"
          className="him-nav-logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 no-underline"
          style={{ padding: 0, marginTop: 0, lineHeight: 0 }}
        >
          <Image
            src="/homepage/him-logo.webp"
            alt="HIM"
            width={100}
            height={35}
            priority
            className="block object-contain"
          />
        </Link>

        {/* RIGHT NAVIGATION */}
        <div className="him-nav-right flex items-center">
          <ul
            className="him-nav-desktop-links flex items-center list-none m-0 p-0"
            style={{ gap: "24px" }}
          >
            {rightLinks.map((link) => (
              <li key={link.label}>
                <NavLink {...link} />
              </li>
            ))}
          </ul>

          {/* ICONS — buttons, so nothing redirects */}
          <div
            className="him-nav-icons flex items-center"
            style={{ color: LINK_COLOR }}
          >
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              className="him-icon-btn"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </button>

            <button type="button" aria-label="Wishlist" className="him-icon-btn">
              <WishlistIcon />
            </button>

            <Link href="/account" aria-label="Account" className="him-icon-btn">
              <UserIcon />
            </Link>

            <Link href="/cart" aria-label="Shopping bag" className="him-icon-btn">
              <BagIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* PHONE LINKS ROW — hidden on desktop */}
      <ul className="him-nav-mobile-links list-none m-0 p-0">
        {[...leftLinks, ...rightLinks].map((link) => (
          <li key={link.label}>
            <NavLink {...link} />
          </li>
        ))}
      </ul>

      {/* Search popup — rendered on <body> so it always sits above everything */}
      {mounted && createPortal(popup, document.body)}

      <style jsx global>{`
        /* ───────── Desktop (unchanged values) ───────── */

        .him-nav-row {
          height: 68px;
          padding: 0 46px;
        }

        .him-nav-logo {
          margin-left: -28px;
        }

        .him-nav-icons {
          gap: 13px;
          margin-left: 20px;
        }

        .him-nav-mobile-links {
          display: none;
        }

        /* Icon buttons look exactly like the old icon links */
        .him-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transition: color 200ms;
          text-decoration: none;
        }

        .him-icon-btn:hover {
          color: #fff;
        }

        /* ───────── Search popup ───────── */

        .him-sp {
          position: fixed;
          inset: 0;
          z-index: 1000;
          visibility: hidden;
          pointer-events: none;
          transition: visibility 0s linear 350ms;
        }

        .him-sp.open {
          visibility: visible;
          pointer-events: auto;
          transition-delay: 0s;
        }

        .him-sp-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .him-sp.open .him-sp-backdrop {
          opacity: 1;
        }

        .him-sp-panel {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          max-height: 100dvh;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 0 46px 36px;
          background: #0b0605;
          color: #fff;
          opacity: 0;
          transform: translateY(-14px);
          transition:
            opacity 300ms ease,
            transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
          scrollbar-width: none;
        }

        .him-sp-panel::-webkit-scrollbar {
          display: none;
        }

        .him-sp.open .him-sp-panel {
          opacity: 1;
          transform: none;
        }

        /* search row */
        .him-sp-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          height: 82px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.75);
        }

        .him-sp-bar-icon {
          display: flex;
          flex: 0 0 auto;
        }

        .him-sp-input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          font-family: ${SERIF};
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .him-sp-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .him-sp-esc {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          font-family: ${NAV_FONT};
          font-size: 8px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: color 200ms;
        }

        .him-sp-esc:hover {
          color: #fff;
        }

        .him-sp-label {
          margin: 34px 0 18px;
          font-family: ${NAV_FONT};
          font-size: 8px;
          letter-spacing: 1.8px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* products */
        .him-sp-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .him-sp-card {
          display: block;
          color: #fff;
          text-decoration: none;
        }

        .him-sp-card-img {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #101a2e;
        }

        .him-sp-card-img img {
          transition: transform 700ms ease-out;
        }

        .him-sp-card:hover .him-sp-card-img img {
          transform: scale(1.04);
        }

        .him-sp-plus {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 50%;
          color: #fff;
          background: rgba(0, 0, 0, 0.25);
        }

        .him-sp-card-name {
          margin: 14px 0 0;
          font-family: ${NAV_FONT};
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .him-sp-card-price {
          margin: 6px 0 0;
          font-family: ${NAV_FONT};
          font-size: 8px;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.7);
        }

        .him-sp-dots {
          display: flex;
          gap: 5px;
          margin-top: 10px;
        }

        .him-sp-dots span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .him-sp-empty {
          margin: 0;
          padding: 40px 0;
          font-family: ${SERIF};
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* the edit banner */
        .him-sp-edit {
  position: relative;
  margin-top: 40px;
  height: 300px;
  width: 100%;
  overflow: hidden;
  background: #101a2e;
}

        .him-sp-edit-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.35) 45%,
            rgba(0, 0, 0, 0.05) 100%
          );
        }

        .him-sp-edit-copy {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 30px;
        }

        .him-sp-edit-tag {
          margin: 0 0 10px;
          font-family: ${NAV_FONT};
          font-size: 8px;
          letter-spacing: 1.8px;
          color: rgba(255, 255, 255, 0.85);
        }

        .him-sp-edit-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(30px, 3.4vw, 46px);
          font-weight: 400;
          line-height: 1.02;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: #fff;
        }

        .him-sp-edit-sub {
          margin: 12px 0 0;
          font-family: ${SERIF};
          font-size: 13px;
          font-style: italic;
          color: rgba(255, 255, 255, 0.85);
        }

        .him-sp-edit-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          height: 32px;
          padding: 0 18px;
          background: #fff;
          color: #111;
          font-family: ${NAV_FONT};
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-decoration: none;
          transition: background 200ms ease, transform 200ms ease;
        }

        .him-sp-edit-btn:hover {
          background: #f1eee9;
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .him-sp-panel,
          .him-sp-backdrop {
            transition: none;
          }
        }

        /* ───────── Phone / small tablet ───────── */

        @media (max-width: 768px) {
          .him-nav-row {
            height: 56px;
            padding: 0 16px;
          }

          .him-sp-panel {
            padding: 0 16px 24px;
          }

          .him-sp-bar {
            height: 64px;
          }

          .him-sp-input {
            font-size: 15px;
          }

          .him-sp-label {
            margin: 24px 0 14px;
          }

          .him-sp-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .him-sp-edit {
            margin-top: 28px;
            height: 190px;
          }

          .him-sp-edit-copy {
            padding: 0 18px;
          }

          /* logo sits dead-centre on its own, no more overlap with links */
          .him-nav-logo {
            margin-left: 0;
          }

          .him-nav-logo img {
            width: 84px;
            height: auto;
          }

          /* links move to the second row */
          .him-nav-desktop-links {
            display: none;
          }

          /* icons stay on the right of the top row */
          .him-nav-right {
            margin-left: auto;
          }

          .him-nav-icons {
            gap: 12px;
            margin-left: 0;
          }

          .him-nav-icons svg {
            width: 16px;
            height: 16px;
          }

          .him-nav-mobile-links {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 22px;
            padding: 4px 16px 14px 5px;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
          }

          .him-nav-mobile-links::-webkit-scrollbar {
            display: none;
          }

          .him-nav-mobile-links li {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </nav>
  );
}