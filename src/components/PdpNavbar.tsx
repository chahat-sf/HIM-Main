"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import styles from "./PdpNavbar.module.css";
import { buildLoginHref } from "@/lib/auth-redirect";
import { useSession } from "@/hooks/useSession";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const leftLinks = [{ label: "EXPLORE", href: "/collection" }];

const rightLinks: { label: string; href: string }[] = [];

const ICON_STROKE = 1.25;

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={styles.link}>
      {label}
    </Link>
  );
}

export default function PdpNavbar() {
  const { isAuthenticated } = useSession();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const accountHref = isAuthenticated
    ? "/account"
    : buildLoginHref("/account");

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
          {rightLinks.length > 0 && (
            <ul className={`${styles.links} ${styles.desktopLinks}`}>
              {rightLinks.map((link) => (
                <li key={link.label}>
                  <NavLink {...link} />
                </li>
              ))}
            </ul>
          )}

          <div className={styles.icons}>
            <Link href="/collection" aria-label="Search" className={styles.icon}>
              <Search size={17} strokeWidth={ICON_STROKE} aria-hidden />
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
              <Heart size={17} strokeWidth={ICON_STROKE} aria-hidden />
              {wishlistCount > 0 && (
                <span className={styles.cartCount} aria-hidden="true">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link href={accountHref} aria-label="Account" className={styles.icon}>
              <User size={17} strokeWidth={ICON_STROKE} aria-hidden />
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
              <ShoppingBag size={17} strokeWidth={ICON_STROKE} aria-hidden />
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
