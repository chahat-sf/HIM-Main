"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./PdpNavbar.module.css";

const leftLinks = [
  { label: "JEANS", href: "/collection" },
  { label: "SHIRTS", href: "/collection" },
  { label: "TSHIRTS", href: "/collection" },
  { label: "LOOKBOOK", href: "/collection" },
  { label: "HOUSE", href: "/house" },
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
            <Link href="/collection" aria-label="Wishlist" className={styles.icon}>
              <WishlistIcon />
            </Link>
            <Link href="/collection" aria-label="Account" className={styles.icon}>
              <UserIcon />
            </Link>
            <Link href="/collection" aria-label="Shopping bag" className={styles.icon}>
              <BagIcon />
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
