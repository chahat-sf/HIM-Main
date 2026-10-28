"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Heart,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { buildLoginHref } from "@/lib/auth-redirect";
import { useSession } from "@/hooks/useSession";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { CatalogProduct } from "@/lib/catalog-types";
import { toCardImage } from "@/lib/card-image";

const ICON_STROKE = 1.25;

// ─── Style constants ────────────────────────────────────────────────────────

const NAV_FONT = "var(--font-nav), monospace";
const SERIF = 'var(--font-room-serif, "Cormorant Garamond"), Georgia, serif';

const LINK_COLOR = "rgba(255, 255, 255, 0.72)";
const LINK_HOVER = "#ffffff";

const LINK_SIZE = "9px";
const LINK_SPACING = "1.5px";

// ─── Navigation ─────────────────────────────────────────────────────────────

const leftLinks = [
  { label: "EXPLORE", href: "/collection" },
];

const rightLinks: { label: string; href: string }[] = [];

// ─── Search popup content (edit these) ──────────────────────────────────────

type SearchProduct = {
  slug: string;
  name: string;
  price: string;
  image: string;
  colors: string[];
};

const POPULAR_COUNT = 4;

function toSearchProduct(p: CatalogProduct): SearchProduct {
  return {
    slug: p.slug,
    name: p.name,
    price: `₹${p.price.replace(/\.00$/, "")}`,
    image: p.image,
    colors: p.swatches,
  };
}



// Banner at the bottom of the popup. Swap the image for your own "edit" photo.
const EDIT_IMAGE = "/homepage/navbar-image.webp";
const EDIT_LINK = "/collection";

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
  const { isAuthenticated } = useSession();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const accountHref = isAuthenticated
    ? "/account"
    : buildLoginHref("/account");

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);

  // Load catalog only when search opens (avoids /api/products on every page).
  useEffect(() => {
    if (!searchOpen || searchProducts.length > 0) return;
    let cancelled = false;
    void fetch("/api/products")
      .then((res) => res.json())
      .then((body: { items?: CatalogProduct[] }) => {
        if (!cancelled) {
          setSearchProducts((body.items ?? []).map(toSearchProduct));
        }
      })
      .catch(() => {
        if (!cancelled) setSearchProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [searchOpen, searchProducts.length]);

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
    if (!trimmed) return searchProducts.slice(0, POPULAR_COUNT);
    return searchProducts.filter((p) =>
      p.name.toLowerCase().includes(trimmed),
    );
  }, [trimmed, searchProducts]);

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
            <Search size={14} strokeWidth={ICON_STROKE} aria-hidden />
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
            <X size={12} strokeWidth={1.6} aria-hidden />
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
                <div className="him-sp-card-img him-card-media">
                  <Image
                    src={toCardImage(p.image)}
                    alt={p.name}
                    fill
                    quality={90}
                    sizes="(max-width: 768px) 45vw, 22vw"
                    className="object-cover object-top"
                    style={{ objectFit: "cover", objectPosition: "top center" }}
                  />
                  <span className="him-sp-plus" aria-hidden="true">
                    <Plus size={9} strokeWidth={ICON_STROKE} aria-hidden />
                  </span>
                </div>
                <p className="him-sp-card-name">{p.name}</p>
                <p className="him-sp-card-price">{p.price}</p>
                {p.colors.length > 0 && (
                  <div className="him-sp-dots">
                    {p.colors.map((c, i) => (
                      <span key={`${c}-${i}`} style={{ background: c }} />
                    ))}
                  </div>
                )}
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
              EXPLORE NOW <ArrowRight size={12} strokeWidth={1.6} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className="him-nav absolute top-0 left-0 right-0 z-50 w-full"
      style={{ background: "transparent" }}
    >
      {/* TOP ROW — desktop: explore / logo / icons.  Phone: logo left + hamburger */}
      <div className="him-nav-row relative flex w-full items-center justify-between">
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

        <Link
          href="/"
          className="him-nav-logo"
          aria-label="HIM home"
        >
          <Image
            src="/homepage/him-logo.webp"
            alt="HIM"
            width={100}
            height={35}
            priority
            className="him-nav-logo-img"
          />
        </Link>

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
              <Search size={17} strokeWidth={ICON_STROKE} aria-hidden />
            </button>

            <Link
              href="/wishlist"
              aria-label={
                wishlistCount > 0
                  ? `Wishlist, ${wishlistCount} items`
                  : "Wishlist"
              }
              className="him-icon-btn him-cart-btn"
            >
              <Heart size={17} strokeWidth={ICON_STROKE} aria-hidden />
              {wishlistCount > 0 && (
                <span className="him-cart-count" aria-hidden="true">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link href={accountHref} aria-label="Account" className="him-icon-btn">
              <User size={17} strokeWidth={ICON_STROKE} aria-hidden />
            </Link>

            <Link
              href="/cart"
              aria-label={
                itemCount > 0
                  ? `Shopping bag, ${itemCount} items`
                  : "Shopping bag"
              }
              className="him-icon-btn him-cart-btn"
            >
              <ShoppingBag size={17} strokeWidth={ICON_STROKE} aria-hidden />
              {itemCount > 0 && (
                <span className="him-cart-count" aria-hidden="true">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>

          <div
            className={`him-nav-mobile-menu${menuOpen ? " is-open" : ""}`}
            ref={menuRef}
          >
            <button
              type="button"
              className="him-nav-menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="him-home-nav-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="him-nav-burger" aria-hidden>
                <span className="him-nav-burger-bar" />
                <span className="him-nav-burger-bar" />
                <span className="him-nav-burger-bar" />
              </span>
              {(itemCount > 0 || wishlistCount > 0) && !menuOpen ? (
                <span className="him-nav-menu-dot" />
              ) : null}
            </button>

            <div
              id="him-home-nav-menu"
              className="him-nav-menu-panel"
              role="menu"
              aria-hidden={!menuOpen}
            >
              <Link
                href="/collection"
                className="him-nav-menu-item"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                style={{ ["--i" as string]: 0 }}
                onClick={closeMenu}
              >
                Explore
              </Link>
              <button
                type="button"
                className="him-nav-menu-item"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                style={{ ["--i" as string]: 1 }}
                onClick={() => {
                  closeMenu();
                  setSearchOpen(true);
                }}
              >
                <Search size={15} strokeWidth={ICON_STROKE} aria-hidden />
                Search
              </button>
              <Link
                href="/wishlist"
                className="him-nav-menu-item"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                style={{ ["--i" as string]: 2 }}
                onClick={closeMenu}
              >
                <Heart size={15} strokeWidth={ICON_STROKE} aria-hidden />
                Wishlist
                {wishlistCount > 0 ? (
                  <span className="him-nav-menu-badge">{wishlistCount}</span>
                ) : null}
              </Link>
              <Link
                href="/cart"
                className="him-nav-menu-item"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                style={{ ["--i" as string]: 3 }}
                onClick={closeMenu}
              >
                <ShoppingBag size={15} strokeWidth={ICON_STROKE} aria-hidden />
                Bag
                {itemCount > 0 ? (
                  <span className="him-nav-menu-badge">{itemCount}</span>
                ) : null}
              </Link>
              <Link
                href={accountHref}
                className="him-nav-menu-item"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                style={{ ["--i" as string]: 4 }}
                onClick={closeMenu}
              >
                <User size={15} strokeWidth={ICON_STROKE} aria-hidden />
                Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search popup — rendered on <body> so it always sits above everything */}
      {mounted && createPortal(popup, document.body)}

      <style jsx global>{`
        /* ───────── Desktop (unchanged values) ───────── */

        .him-nav-row {
          height: 68px;
          padding: 0 46px;
        }

        .him-nav-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 2;
          transform: translate(-50%, -50%);
          margin: 0;
          padding: 0;
          line-height: 0;
          text-decoration: none;
        }

        .him-nav-logo-img {
          display: block;
          width: 100px;
          height: auto;
          object-fit: contain;
        }

        .him-nav-icons {
          gap: 13px;
          margin-left: 20px;
        }

        .him-nav-mobile-menu {
          display: none;
          position: relative;
        }

        .him-nav-menu-btn {
          position: relative;
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: none;
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .him-nav-menu-btn:active {
          transform: scale(0.92);
        }

        .him-nav-burger {
          position: relative;
          display: block;
          width: 18px;
          height: 12px;
        }

        .him-nav-burger-bar {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: currentColor;
          border-radius: 1px;
          transition:
            transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 180ms ease,
            top 280ms cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: center;
        }

        .him-nav-burger-bar:nth-child(1) {
          top: 0;
        }

        .him-nav-burger-bar:nth-child(2) {
          top: 5.25px;
        }

        .him-nav-burger-bar:nth-child(3) {
          top: 10.5px;
        }

        .him-nav-mobile-menu.is-open .him-nav-burger-bar:nth-child(1) {
          top: 5.25px;
          transform: rotate(45deg);
        }

        .him-nav-mobile-menu.is-open .him-nav-burger-bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0.4);
        }

        .him-nav-mobile-menu.is-open .him-nav-burger-bar:nth-child(3) {
          top: 5.25px;
          transform: rotate(-45deg);
        }

        .him-nav-menu-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c4a574;
          box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.35);
        }

        .him-nav-menu-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 196px;
          padding: 8px 0;
          background: rgba(12, 10, 8, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
          z-index: 60;
          transform-origin: top right;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-6px) scale(0.96);
          transition:
            opacity 200ms ease,
            transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0ms linear 200ms;
        }

        .him-nav-mobile-menu.is-open .him-nav-menu-panel {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
          transition:
            opacity 220ms ease,
            transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0ms linear 0ms;
        }

        .him-nav-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          box-sizing: border-box;
          font-family: var(--font-nav), monospace;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.88);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          opacity: 0;
          transform: translateY(6px);
          transition:
            background 150ms ease,
            color 150ms ease,
            opacity 240ms ease,
            transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: 0ms;
        }

        .him-nav-mobile-menu.is-open .him-nav-menu-item {
          opacity: 1;
          transform: translateY(0);
          transition-delay: calc(40ms + var(--i, 0) * 45ms);
        }

        .him-nav-menu-item:hover,
        .him-nav-menu-item:focus-visible {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          outline: none;
        }

        .him-nav-menu-badge {
          margin-left: auto;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #c4a574;
          color: #111;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 10px;
          font-weight: 600;
          line-height: 18px;
          text-align: center;
          letter-spacing: 0;
          box-sizing: border-box;
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

        .him-cart-btn {
          position: relative;
        }

        .him-cart-count {
          position: absolute;
          top: -6px;
          right: -9px;
          min-width: 15px;
          height: 15px;
          padding: 0 4px;
          border-radius: 999px;
          background: #c4a574;
          color: #111;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 9px;
          font-weight: 600;
          line-height: 15px;
          text-align: center;
          letter-spacing: 0;
          box-sizing: border-box;
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

        /* Hover zoom handled by global .him-card-media */

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
          .him-sp-backdrop,
          .him-nav-menu-btn,
          .him-nav-burger-bar,
          .him-nav-menu-panel,
          .him-nav-menu-item {
            transition: none !important;
            animation: none !important;
          }

          .him-nav-menu-panel,
          .him-nav-menu-item {
            transform: none;
          }

          .him-nav-mobile-menu.is-open .him-nav-menu-item {
            opacity: 1;
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

          .him-nav-desktop-links,
          .him-nav-icons {
            display: none;
          }

          .him-nav-mobile-menu {
            display: block;
          }

          /* Hamburger layout: logo left, menu right */
          .him-nav-logo {
            position: relative;
            top: auto;
            left: auto;
            transform: none;
            flex: 0 0 auto;
          }

          .him-nav-logo-img {
            width: 84px;
            height: auto;
          }

          .him-nav-right {
            margin-left: auto;
            z-index: 2;
          }
        }
      `}</style>
    </nav>
  );
}