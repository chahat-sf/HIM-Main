"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const INK = "#eee6da";
const MUTED = "#a99d8f";
const RULE = "#30271f";
const DARK_BG = "#0d0c0b";
const PANEL = "#100c09";

type CartItem = {
  id: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  image: string;
  swatches: string[];
};

const INITIAL_CART: CartItem[] = [
  {
    id: "1",
    slug: "textured-thermal-white-7",
    name: "LINEN SHIRT",
    size: "M",
    color: "Ivory",
    price: 4080,
    qty: 1,
    image: "/products/man-image-100.webp",
    swatches: ["#111111", "#a3a3a3"],
  },
  {
    id: "2",
    slug: "textured-thermal-white-8",
    name: "WIDE LEG TROUSERS",
    size: "32",
    color: "Oatmeal",
    price: 5840,
    qty: 1,
    image: "/products/man-image-101.webp",
    swatches: ["#a3a3a3", "#7a1420"],
  },
  {
    id: "3",
    slug: "textured-thermal-white-9",
    name: "DENIM JACKET",
    size: "M",
    color: "Indigo",
    price: 6960,
    qty: 1,
    image: "/products/man-image-102.webp",
    swatches: ["#3a5aa8", "#111111"],
  },
];

const YOU_MAY_LIKE = [
  {
    slug: "textured-thermal-white-10",
    name: "KNIT POLO",
    price: 4080,
    image: "/products/man-image-103.webp",
    swatches: ["#111111", "#a3a3a3"],
  },
  {
    slug: "textured-thermal-white-11",
    name: "SIMON JACKET",
    price: 7880,
    image: "/products/man-image-104.webp",
    swatches: ["#111111", "#7a1420"],
  },
  {
    slug: "textured-thermal-white-12",
    name: "EVERYDAY TROUSERS",
    price: 5440,
    image: "/bestseller/bs-image-2.webp",
    swatches: ["#a3a3a3", "#111111", "#7a1420"],
  },
];

function fmt(amount: number) {
  return "₹ " + amount.toLocaleString("en-IN");
}

function CloseIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 6h8" />
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
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M6 2v8M2 6h8" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

function Stepper({
  qty,
  onMinus,
  onPlus,
}: {
  qty: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="cart-stepper">
      <button
        type="button"
        onClick={onMinus}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>

      <span>{qty}</span>

      <button
        type="button"
        onClick={onPlus}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: string;
}) {
  return (
    <div className="cart-section-heading">
      <p>{title}</p>
      {count && <span>{count}</span>}
    </div>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [promo, setPromo] = useState("");
  const [giftMsg, setGiftMsg] = useState(false);
  const [giftText, setGiftText] = useState("");

  const updateQty = (id: string, delta: number) => {
    setCart((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const shipping = 0;
  const tax = Math.round(subtotal * 0.07);
  const total = subtotal + shipping + tax;

  const itemCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  return (
    <>
      <Navbar />

      <main className="him-cart-page">
        {/* HERO — KEEP THE LARGE MY CART IMAGE */}
        <section className="cart-hero">
          <Image
            src="/products/man-image-104.webp"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="cart-hero-image"
          />

          <div className="cart-hero-overlay" />

          <div className="cart-hero-content">
            <p className="cart-hero-eyebrow">ENTERING BAG</p>

            <h1>MY CART</h1>

            <p className="cart-hero-caption">
              A CONSIDERED SELECTION,
              <br />
              READY FOR CHECKOUT.
            </p>
          </div>
        </section>

        {/* CART BODY */}
        <div className="cart-container">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Your bag is empty.</p>

              <Link
                href="/collection"
                className="cart-primary-button"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              {/* LEFT — CART ITEMS */}
              <section className="cart-items-section">
                <SectionHeading
                  title="CART ITEMS"
                  count={`${itemCount} ${itemCount === 1 ? "ITEM" : "ITEMS"
                    }`}
                />

                <div className="cart-items-panel">
                  {cart.map((item, index) => (
                    <article
                      className="cart-item"
                      key={item.id}
                    >
                      <Link
                        href={`/collection/${item.slug}`}
                        className="cart-item-image"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          quality={75}
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      </Link>

                      <div className="cart-item-details">
                        <Link
                          href={`/collection/${item.slug}`}
                          className="cart-item-name"
                        >
                          {item.name}
                        </Link>

                        <p className="cart-item-variant">
                          Size {item.size}
                          <span>|</span>
                          {item.color}
                        </p>

                        <div className="cart-swatches">
                          {item.swatches.map((color, i) => (
                            <span
                              key={`${color}-${i}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <Stepper
                          qty={item.qty}
                          onMinus={() => updateQty(item.id, -1)}
                          onPlus={() => updateQty(item.id, 1)}
                        />
                      </div>

                      <div className="cart-item-right">
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <CloseIcon />
                        </button>

                        <p className="cart-item-price">
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                {/* GIFT MESSAGE */}
                <div className="cart-gift-panel">
                  <button
                    type="button"
                    className="cart-gift-toggle"
                    onClick={() =>
                      setGiftMsg((previous) => !previous)
                    }
                  >
                    <span>
                      Add a note or gift message (optional)
                    </span>

                    <span className="cart-gift-symbol">
                      {giftMsg ? "−" : "+"}
                    </span>
                  </button>

                  {giftMsg && (
                    <div className="cart-gift-content">
                      <textarea
                        value={giftText}
                        onChange={(event) =>
                          setGiftText(event.target.value)
                        }
                        placeholder="Write your message here..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* RIGHT — ORDER SUMMARY */}
              <aside className="cart-summary">
                <h2>ORDER SUMMARY</h2>

                <div className="cart-summary-lines">
                  <div>
                    <span>Subtotal ({itemCount} items)</span>
                    <span>{fmt(subtotal)}</span>
                  </div>

                  <div>
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? "Free" : fmt(shipping)}
                    </span>
                  </div>

                  <div>
                    <span>Estimated Tax</span>
                    <span>{fmt(tax)}</span>
                  </div>
                </div>

                <div className="cart-total">
                  <span>Total</span>
                  <strong>{fmt(total)}</strong>
                </div>

                <label
                  htmlFor="cart-promo"
                  className="cart-promo-label"
                >
                  PROMO CODE
                </label>

                <div className="cart-promo">
                  <input
                    id="cart-promo"
                    type="text"
                    value={promo}
                    onChange={(event) =>
                      setPromo(event.target.value)
                    }
                    placeholder="Enter your promo code"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      // Connect your promo-code validation here.
                    }}
                  >
                    APPLY
                  </button>
                </div>

                <Link
                  href="/checkout"
                  className="cart-checkout-button"
                >
                  PROCEED TO CHECKOUT
                  <ArrowIcon />
                </Link>

                <Link
                  href="/collection"
                  className="cart-continue-button"
                >
                  CONTINUE SHOPPING
                </Link>

                <p className="cart-shipping-note">
                  Complimentary shipping on all prepaid orders.
                </p>
              </aside>
            </div>
          )}

          {/* YOU MAY ALSO LIKE */}
          <section className="cart-recommendations">
            <div className="cart-recommendations-heading">
              <h2>YOU MAY ALSO LIKE</h2>

              <Link href="/collection">VIEW ALL</Link>
            </div>

            <div className="cart-recs-grid">
              {YOU_MAY_LIKE.map((item) => (
                <Link
                  key={item.slug}
                  href={`/collection/${item.slug}`}
                  className="cart-rec-product"
                >
                  <div className="cart-rec-image">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      quality={80}
                      sizes="(max-width: 768px) 50vw, 28vw"
                      className="object-cover object-center"
                    />

                    <span className="cart-rec-add">+</span>
                  </div>

                  <p className="cart-rec-name">{item.name}</p>

                  <p className="cart-rec-price">
                    {fmt(item.price)}
                  </p>

                  <div className="cart-swatches">
                    {item.swatches.map((color, i) => (
                      <span
                        key={`${color}-${i}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .him-cart-page {
          --cart-bg: ${DARK_BG};
          --cart-panel: ${PANEL};
          --cart-border: ${RULE};
          --cart-text: ${INK};
          --cart-muted: ${MUTED};

          min-height: 100vh;
          background: var(--cart-bg);
          color: var(--cart-text);
          font-family: ${SANS};
        }

        .him-cart-page *,
        .him-cart-page *::before,
        .him-cart-page *::after {
          box-sizing: border-box;
        }

        /* LARGE HERO — PRESERVED */

        .cart-hero {
          position: relative;
          height: clamp(220px, 26vw, 380px);
          overflow: hidden;
          background: ${DARK_BG};
        }

        .cart-hero-image {
          object-fit: cover;
          object-position: center 25%;
          opacity: 0.4;
        }

        .cart-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.1) 0%,
            rgba(0, 0, 0, 0.7) 100%
          );
        }

        .cart-hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          padding: clamp(24px, 5vw, 60px);
        }

        .cart-hero-eyebrow {
          margin: 0 0 8px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .cart-hero-content h1 {
          margin: 0;
          color: #fff;
          font-family: ${SERIF};
          font-size: clamp(40px, 7vw, 92px);
          font-weight: 300;
          letter-spacing: -1px;
          line-height: 0.9;
          text-transform: uppercase;
        }

        .cart-hero-caption {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          letter-spacing: 1px;
          line-height: 1.7;
          text-transform: uppercase;
        }

        /* MAIN CONTAINER */

        .cart-container {
          width: min(100% - 40px, 1080px);
          margin: 0 auto;
          padding: 28px 0 60px;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
          align-items: start;
        }

        .cart-items-section {
          min-width: 0;
        }

        .cart-section-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cart-section-heading p {
          margin: 0;
          color: var(--cart-text);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .cart-section-heading > span {
          color: var(--cart-muted);
          font-size: 8px;
          letter-spacing: 0.5px;
        }

        /* CART ITEMS */

        .cart-items-panel,
        .cart-gift-panel,
        .cart-summary {
          border: 1px solid var(--cart-border);
          background: var(--cart-panel);
        }

        .cart-item {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
          padding: 15px;
          border-bottom: 1px solid var(--cart-border);
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-image {
          position: relative;
          display: block;
          width: 64px;
          height: 78px;
          overflow: hidden;
          background: #211a14;
        }

        .cart-item-details {
          min-width: 0;
        }

        .cart-item-name {
          display: inline-block;
          margin: 0 0 6px;
          color: var(--cart-text);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-decoration: none;
        }

        .cart-item-variant {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 0 0 9px;
          color: var(--cart-muted);
          font-size: 8px;
        }

        .cart-swatches {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .cart-swatches span {
          display: block;
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border: 1px solid rgba(238, 230, 218, 0.25);
          border-radius: 50%;
        }

        .cart-item-details > .cart-swatches {
          margin-bottom: 10px;
        }

        .cart-stepper {
          display: inline-flex;
          height: 25px;
          align-items: center;
          border: 1px solid var(--cart-border);
        }

        .cart-stepper button {
          display: grid;
          width: 24px;
          height: 23px;
          padding: 0;
          place-items: center;
          border: none;
          background: transparent;
          color: var(--cart-text);
          cursor: pointer;
        }

        .cart-stepper > span {
          min-width: 24px;
          padding: 0 5px;
          border-right: 1px solid var(--cart-border);
          border-left: 1px solid var(--cart-border);
          color: var(--cart-text);
          font-size: 8px;
          line-height: 23px;
          text-align: center;
        }

        .cart-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .cart-remove {
          display: grid;
          width: 20px;
          height: 20px;
          padding: 0;
          place-items: center;
          border: none;
          background: transparent;
          color: var(--cart-muted);
          cursor: pointer;
        }

        .cart-item-price {
          margin: 0;
          color: var(--cart-text);
          font-size: 9px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* GIFT MESSAGE */

        .cart-gift-panel {
          margin-top: 10px;
        }

        .cart-gift-toggle {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          border: none;
          background: transparent;
          color: var(--cart-muted);
          font-family: ${SANS};
          font-size: 8px;
          text-align: left;
          cursor: pointer;
        }

        .cart-gift-symbol {
          color: var(--cart-text);
          font-size: 15px;
        }

        .cart-gift-content {
          padding: 0 15px 15px;
        }

        .cart-gift-content textarea {
          display: block;
          width: 100%;
          padding: 10px;
          resize: vertical;
          border: 1px solid var(--cart-border);
          border-radius: 0;
          outline: none;
          background: #17110d;
          color: var(--cart-text);
          font-family: ${SANS};
          font-size: 11px;
        }

        .cart-gift-content textarea::placeholder {
          color: #827568;
        }

        /* ORDER SUMMARY */

        .cart-summary {
          padding: 17px;
        }

        .cart-summary h2 {
          margin: 0 0 18px;
          color: var(--cart-text);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .cart-summary-lines {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 18px;
        }

        .cart-summary-lines > div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }

        .cart-summary-lines span {
          color: var(--cart-muted);
          font-size: 9px;
        }

        .cart-summary-lines span:last-child {
          color: var(--cart-text);
          text-align: right;
          white-space: nowrap;
        }

        .cart-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          padding: 15px 0 18px;
          margin-bottom: 17px;
          border-top: 1px solid var(--cart-border);
        }

        .cart-total > span {
          color: var(--cart-text);
          font-size: 11px;
          font-weight: 600;
        }

        .cart-total strong {
          color: var(--cart-text);
          font-family: ${SERIF};
          font-size: 20px;
          font-weight: 500;
          white-space: nowrap;
        }

        .cart-promo-label {
          display: block;
          margin-bottom: 8px;
          color: var(--cart-muted);
          font-size: 8px;
          letter-spacing: 1px;
        }

        .cart-promo {
          display: flex;
          margin-bottom: 15px;
        }

        .cart-promo input {
          width: 0;
          min-width: 0;
          height: 35px;
          flex: 1;
          padding: 0 10px;
          border: 1px solid var(--cart-border);
          border-right: none;
          border-radius: 0;
          outline: none;
          background: #17110d;
          color: var(--cart-text);
          font-family: ${SANS};
          font-size: 9px;
        }

        .cart-promo input::placeholder {
          color: #827568;
        }

        .cart-promo button {
          height: 35px;
          padding: 0 14px;
          border: 1px solid #bda078;
          background: #bda078;
          color: #17110d;
          font-family: ${SANS};
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.8px;
          cursor: pointer;
        }

        .cart-checkout-button,
        .cart-continue-button {
          display: flex;
          width: 100%;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-family: ${SANS};
          font-size: 8px;
          letter-spacing: 1px;
          text-align: center;
          text-decoration: none;
          transition: background 180ms ease, border-color 180ms ease;
        }

        .cart-checkout-button {
          margin-bottom: 8px;
          padding: 9px;
          background: #bda078;
          color: #17110d;
          font-weight: 700;
        }

        .cart-checkout-button:hover {
          background: #d0b58f;
        }

        .cart-continue-button {
          padding: 8px;
          border: 1px solid #65584c;
          background: transparent;
          color: var(--cart-text);
        }

        .cart-continue-button:hover {
          border-color: var(--cart-text);
        }

        .cart-shipping-note {
          margin: 13px 0 0;
          color: var(--cart-muted);
          font-size: 8px;
          line-height: 1.6;
          text-align: center;
        }

        /* RECOMMENDATIONS */

        .cart-recommendations {
          margin-top: 42px;
          padding-top: 24px;
          border-top: 1px solid var(--cart-border);
        }

        .cart-recommendations-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .cart-recommendations-heading h2 {
          margin: 0;
          color: var(--cart-text);
          font-family: ${SERIF};
          font-size: 19px;
          font-weight: 400;
          letter-spacing: 0.4px;
        }

        .cart-recommendations-heading a {
          padding-bottom: 2px;
          border-bottom: 1px solid var(--cart-muted);
          color: var(--cart-muted);
          font-size: 8px;
          letter-spacing: 1px;
          text-decoration: none;
        }

        .cart-recs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .cart-rec-product {
          display: block;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }

        .cart-rec-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1.08 / 1;
          overflow: hidden;
          background: #17110d;
        }

        .cart-rec-add {
          position: absolute;
          right: 9px;
          bottom: 9px;
          display: grid;
          width: 23px;
          height: 23px;
          place-items: center;
          border: 1px solid #65584c;
          border-radius: 50%;
          background: rgba(20, 16, 12, 0.88);
          color: var(--cart-text);
          font-size: 16px;
          line-height: 1;
        }

        .cart-rec-name {
          margin: 9px 0 4px;
          color: var(--cart-text);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.4px;
        }

        .cart-rec-price {
          margin: 0 0 8px;
          color: var(--cart-muted);
          font-size: 9px;
        }

        /* EMPTY CART */

        .cart-empty {
          padding: 65px 0;
          text-align: center;
        }

        .cart-empty p {
          margin: 0 0 18px;
          color: var(--cart-text);
          font-family: ${SERIF};
          font-size: 28px;
        }

        .cart-primary-button {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          background: #bda078;
          color: #17110d;
          font-size: 9px;
          letter-spacing: 1px;
          text-decoration: none;
        }

        /* RESPONSIVE */

        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: minmax(0, 1fr) 270px;
            gap: 16px;
          }

          .cart-item {
            grid-template-columns: 56px minmax(0, 1fr) auto;
            gap: 10px;
            padding: 13px 10px;
          }

          .cart-item-image {
            width: 56px;
            height: 70px;
          }

          .cart-summary {
            padding: 13px;
          }
        }

        @media (max-width: 680px) {
          .cart-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
          }

          .cart-summary {
            padding: 17px;
          }

          .cart-recommendations {
            margin-top: 32px;
          }
        }

        @media (max-width: 480px) {
          .cart-hero {
            height: 260px;
          }

          .cart-hero-content {
            padding: 24px;
          }

          .cart-container {
            width: calc(100% - 28px);
            padding-top: 22px;
            padding-bottom: 36px;
          }

          .cart-item {
            grid-template-columns: 48px minmax(0, 1fr) auto;
            gap: 9px;
            padding: 12px 9px;
          }

          .cart-item-image {
            width: 48px;
            height: 62px;
          }

          .cart-item-name {
            font-size: 8px;
          }

          .cart-item-variant {
            gap: 5px;
            font-size: 7px;
          }

          .cart-item-price {
            font-size: 8px;
          }

          .cart-recs-grid {
            gap: 10px;
          }

          .cart-recommendations-heading h2 {
            font-size: 16px;
          }

          .cart-rec-name,
          .cart-rec-price {
            font-size: 7px;
          }
        }
      `}</style>
    </>
  );
}