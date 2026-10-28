"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import styles from "./PdpNavbar.module.css";
import NavIconRow from "@/components/NavIconRow";
import { buildLoginHref } from "@/lib/auth-redirect";
import { useSession } from "@/hooks/useSession";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const leftLinks = [{ label: "EXPLORE", href: "/collection" }];
const ICON_STROKE = 1.25;

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={styles.link}>
      {label}
    </Link>
  );
}

export default function PdpNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useSession();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const accountHref = isAuthenticated
    ? "/account"
    : buildLoginHref("/account");

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

  const closeMenu = () => setMenuOpen(false);

  const menuItems = [
    { href: "/collection", label: "Explore" },
    {
      href: "/collection",
      label: "Search",
      icon: <Search size={15} strokeWidth={ICON_STROKE} aria-hidden />,
    },
    {
      href: "/wishlist",
      label: "Wishlist",
      icon: <Heart size={15} strokeWidth={ICON_STROKE} aria-hidden />,
      badge: wishlistCount,
    },
    {
      href: "/cart",
      label: "Bag",
      icon: <ShoppingBag size={15} strokeWidth={ICON_STROKE} aria-hidden />,
      badge: itemCount,
    },
    {
      href: accountHref,
      label: "Account",
      icon: <User size={15} strokeWidth={ICON_STROKE} aria-hidden />,
    },
  ] as const;

  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.row}>
        <ul className={`${styles.links} ${styles.desktopOnlyFlex}`}>
          {leftLinks.map((link) => (
            <li key={link.label}>
              <NavLink {...link} />
            </li>
          ))}
        </ul>

        <Link href="/" className={styles.logo} aria-label="HIM home">
          <Image
            src="/homepage/him-logo.webp"
            alt="HIM"
            width={100}
            height={35}
            priority
            className={styles.logoImg}
          />
        </Link>

        <div className={styles.right}>
          <NavIconRow
            className={`${styles.icons} ${styles.desktopOnlyFlex}`}
            iconClassName={`${styles.icon} ${styles.cartIcon}`}
            badgeClassName={styles.cartCount}
          />

          <div
            className={`${styles.mobileMenu}${menuOpen ? ` ${styles.menuOpen}` : ""}`}
            ref={menuRef}
          >
            <button
              type="button"
              className={styles.menuBtn}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={styles.burger} aria-hidden>
                <span className={styles.burgerBar} />
                <span className={styles.burgerBar} />
                <span className={styles.burgerBar} />
              </span>
              {(itemCount > 0 || wishlistCount > 0) && !menuOpen ? (
                <span className={styles.menuDot} />
              ) : null}
            </button>

            <div
              id={menuId}
              className={styles.menuPanel}
              role="menu"
              aria-hidden={!menuOpen}
            >
              {menuItems.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={styles.menuItem}
                  role="menuitem"
                  tabIndex={menuOpen ? 0 : -1}
                  style={{ ["--i" as string]: i }}
                  onClick={closeMenu}
                >
                  {"icon" in item ? item.icon : null}
                  {item.label}
                  {"badge" in item && item.badge > 0 ? (
                    <span className={styles.menuBadge}>{item.badge}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
