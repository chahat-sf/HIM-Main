"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./PdpNavbar.module.css";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

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

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-3.8 3.1-5.8 6.5-5.8s5.7 2 6.5 5.8" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M5 8.5h14l-1 12H6l-1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={styles.link}>
      {label}
    </Link>
  );
}

export default function PdpNavbar() {
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.row}>
        <ul className={`${styles.links} ${styles.desktopLinks}`}>
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
          <ul className={`${styles.links} ${styles.desktopLinks}`}>
            {rightLinks.map((link) => (
              <li key={link.label}>
                <NavLink {...link} />
              </li>
            ))}
          </ul>

          <div className={styles.icons}>
            <Link href="/collection" aria-label="Search" className={styles.icon}>
              <SearchIcon />
            </Link>
            <Link
              href="/wishlist"
              aria-label={
                wishlistCount > 0
                  ? `Wishlist, ${wishlistCount} items`
                  : "Wishlist"
              }
              className={`${styles.icon} ${styles.cartIcon}`}
            >
              <WishlistIcon />
              {wishlistCount > 0 && (
                <span className={styles.cartCount} aria-hidden="true">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/login" aria-label="Account" className={styles.icon}>
              <UserIcon />
            </Link>
            <Link
              href="/cart"
              aria-label={
                itemCount > 0
                  ? `Shopping bag, ${itemCount} items`
                  : "Shopping bag"
              }
              className={`${styles.icon} ${styles.cartIcon}`}
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className={styles.cartCount} aria-hidden="true">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <ul className={styles.mobileLinks}>
        {[...leftLinks, ...rightLinks].map((link) => (
          <li key={link.label}>
            <NavLink {...link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
