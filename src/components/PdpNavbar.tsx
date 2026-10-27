"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./PdpNavbar.module.css";
import NavIconRow from "@/components/NavIconRow";

const leftLinks = [{ label: "EXPLORE", href: "/collection" }];

const rightLinks: { label: string; href: string }[] = [];

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
          {rightLinks.length > 0 && (
            <ul className={`${styles.links} ${styles.desktopLinks}`}>
              {rightLinks.map((link) => (
                <li key={link.label}>
                  <NavLink {...link} />
                </li>
              ))}
            </ul>
          )}

          <NavIconRow
            className={styles.icons}
            iconClassName={`${styles.icon} ${styles.cartIcon}`}
            badgeClassName={styles.cartCount}
          />
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
