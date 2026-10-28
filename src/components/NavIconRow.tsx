"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { buildLoginHref } from "@/lib/auth-redirect";
import { useSession } from "@/hooks/useSession";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const ICON_STROKE = 1.25;

type NavIconRowProps = {
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
  searchHref?: string;
  onSearchClick?: () => void;
};

/** Shared account / wishlist / bag icons used by Navbar desktop row. */
export default function NavIconRow({
  className,
  iconClassName,
  badgeClassName,
  searchHref = "/collection",
  onSearchClick,
}: NavIconRowProps) {
  const { isAuthenticated } = useSession();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const accountHref = isAuthenticated
    ? "/account"
    : buildLoginHref("/account");

  return (
    <div className={className}>
      {onSearchClick ? (
        <button
          type="button"
          aria-label="Search"
          className={iconClassName}
          onClick={onSearchClick}
        >
          <Search size={17} strokeWidth={ICON_STROKE} aria-hidden />
        </button>
      ) : (
        <Link href={searchHref} aria-label="Search" className={iconClassName}>
          <Search size={17} strokeWidth={ICON_STROKE} aria-hidden />
        </Link>
      )}
      <Link
        href="/wishlist"
        aria-label={
          wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"
        }
        className={iconClassName}
      >
        <Heart size={17} strokeWidth={ICON_STROKE} aria-hidden />
        {wishlistCount > 0 ? (
          <span className={badgeClassName}>{wishlistCount}</span>
        ) : null}
      </Link>
      <Link
        href="/cart"
        aria-label={itemCount > 0 ? `Bag, ${itemCount} items` : "Bag"}
        className={iconClassName}
      >
        <ShoppingBag size={17} strokeWidth={ICON_STROKE} aria-hidden />
        {itemCount > 0 ? (
          <span className={badgeClassName}>{itemCount}</span>
        ) : null}
      </Link>
      <Link href={accountHref} aria-label="Account" className={iconClassName}>
        <User size={17} strokeWidth={ICON_STROKE} aria-hidden />
      </Link>
    </div>
  );
}
