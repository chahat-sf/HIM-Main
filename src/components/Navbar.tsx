"use client";

import Link from "next/link";
import Image from "next/image";

// ─── Style constants ────────────────────────────────────────────────────────

const NAV_FONT = "var(--font-nav), monospace";
const LOGO_FONT = "Georgia, 'Times New Roman', serif";

const NAV_BORDER = "rgba(242, 232, 213, 0.14)";
const LOGO_COLOR = "#f0e8d8";
const LINK_COLOR = "rgba(255, 255, 255, 0.72)";
const LINK_HOVER = "#ffffff";

const LOGO_SIZE = "28px";
const LINK_SIZE = "9px";
const LINK_SPACING = "1.5px";

const NAV_PADDING = "0 46px";
const NAV_HEIGHT = "68px";

// ─── Navigation ─────────────────────────────────────────────────────────────

const leftLinks = [
  { label: "JEANS", href: "/jeans" },
  { label: "SHIRTS", href: "/shirts" },
  { label: "TSHIRTS", href: "/tshirts" },
  { label: "LOOKBOOK", href: "/lookbook" },
  { label: "HOUSE", href: "/house" },
];

const rightLinks = [
  { label: "BRAND", href: "/brand" },
  { label: "REWARDS", href: "/rewards" },
];

// ─── Icons ─────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
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

// ─── Navbar ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  return (
    <nav
      className="absolute top-0 left-0 right-0 z-50 w-full"
      style={{
        height: NAV_HEIGHT,
        padding: NAV_PADDING,
        // borderBottom: `1px solid ${NAV_BORDER}`,
        background: "transparent",
      }}
    >
      <div className="relative flex h-full w-full items-center justify-between">

        {/* LEFT NAVIGATION */}
        <ul
          className="flex items-center list-none m-0 p-0"
          style={{ gap: "24px" }}
        >
          {leftLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
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
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CENTER LOGO */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 no-underline"
          style={{
            marginLeft: "-28px",
            padding: 0,
            marginTop: 0,
            lineHeight: 0,
          }}
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
        <div className="flex items-center">
          <ul
            className="flex items-center list-none m-0 p-0"
            style={{ gap: "24px" }}
          >
            {rightLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
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
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ICONS */}
          <div
            className="flex items-center"
            style={{
              gap: "13px",
              marginLeft: "20px",
              color: LINK_COLOR,
            }}
          >
            <Link
              href="/search"
              aria-label="Search"
              className="transition-colors duration-200 hover:text-white"
            >
              <SearchIcon />
            </Link>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="transition-colors duration-200 hover:text-white"
            >
              <WishlistIcon />
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              className="transition-colors duration-200 hover:text-white"
            >
              <UserIcon />
            </Link>

            <Link
              href="/bag"
              aria-label="Shopping bag"
              className="transition-colors duration-200 hover:text-white"
            >
              <BagIcon />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}