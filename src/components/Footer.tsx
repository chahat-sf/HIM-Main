
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  "REWARDS",
  "REVIEWS",
  "CONTACT",
  "ACCOUNT",
  "RETURNS POLICY",
  "CAREERS",
  "HELP CENTER",
  "RETURNS PORTAL",
  "FLAGSHIP STORE",
  "SUPPORT",
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const [gender, setGender] = useState({
    all: false,
    men: false,
    women: false,
  });

  return (
    <footer className="him-footer">
      {/* TOP BAR */}
      <div className="him-footer-top">
        <div className="him-footer-logo">
          <Image
            src="/homepage/him-logo.webp"
            alt="HIM"
            width={100}
            height={35}
            className="him-footer-logo-img"
          />
        </div>

        <div className="newsletter-copy">
          <span>SIGN UP TO OUR NEWSLETTER</span>
          <span>FOR TAILORED OFFERS</span>
        </div>

        <form
          className="newsletter-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="EMAIL ADDRESS"
            aria-label="Email address"
            className="newsletter-email"
          />

          <button type="submit" className="newsletter-submit">
            <span>SUBMIT</span>
            <span className="submit-arrow">→</span>
          </button>
        </form>
      </div>

      {/* BOTTOM BAR */}
      <div className="him-footer-bottom">
        <div className="footer-links-area">
          <div className="footer-vertical-title">LINKS</div>

          <div className="footer-links-grid">
            {footerLinks.map((link) => (
              <Link href="/collection" key={link}>
                {link}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-column footer-socials">
          <div className="footer-vertical-title">SOCIALS</div>

          <div className="footer-column-links">
            <span>INSTAGRAM</span>
            <span>TIKTOK</span>
            <span>YOUTUBE</span>
          </div>
        </div>

        <div className="footer-column footer-store">
          <div className="footer-vertical-title">THE STORE</div>

          <div className="footer-store-content">
            <span>INDIA</span>

            <div className="store-hours">
              <span>MON-FRI: 11-7</span>
              <span>SAT: 11-5:30</span>
              <span>SUN: 11-5:30</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
       
.him-footer {
  width: 100%;
  min-height: 300px;
  color: #f5f1e9;
  background: #100b08;
  border-top: 1px solid rgba(255, 255, 255, 0.48);
  font-family: Arial, Helvetica, sans-serif;
}

/* TOP BAR */

.him-footer-top {
  min-height: 100px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.42);
}

.him-footer-logo {
  width: 170px;
  flex: 0 0 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.42);
}

.him-footer-logo :global(.him-footer-logo-img) {
  display: block;
  width: 100px;
  height: auto;
  object-fit: contain;
}

.newsletter-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: stretch;
  padding-left: 38px;
  flex: 1;
  min-width: 200px;
  color: #f5f1e9;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.6;
}

.newsletter-form {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 22px;
  padding: 0 35px 0 15px;
}

.newsletter-email {
  width: 400px;
  height: 50px;
  padding: 0 15px;
  border: 1px solid rgba(245, 241, 233, 0.72);
  border-radius: 0;
  outline: none;
  background: #716f6f;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  box-sizing: border-box;
}

.newsletter-email::placeholder {
  color: #FAFAFA;
  opacity: 1;
}

.newsletter-email:focus {
  border-color: #000000;
}

.newsletter-submit {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: #f5f1e9;
  white-space: nowrap;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  cursor: pointer;
}

.submit-arrow {
  font-size: 20px;
  line-height: 0.8;
}

/* BOTTOM BAR */

.him-footer-bottom {
  min-height: 200px;
  display: grid;
  grid-template-columns: minmax(540px, 1.5fr) minmax(220px, 1fr) auto;
  align-items: start;
  column-gap: 65px;
  padding: 42px 50% 35px 38px;
  box-sizing: border-box;
}

.footer-links-area {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  column-gap: 48px;
  align-items: start;
}

.footer-vertical-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 1.4px;
  color: rgba(245, 241, 233, 0.9);
  white-space: nowrap;
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(95px, 1fr));
  grid-auto-flow: row;
  column-gap: 35px;
  row-gap: 22px;
  align-items: start;
}

.footer-links-grid a,
.footer-column-links a {
  color: rgba(245, 241, 233, 0.86);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  line-height: 1.5;
  text-decoration: none;
  white-space: nowrap;
  transition: color 180ms ease;
}

.footer-links-grid a:hover,
.footer-column-links a:hover {
  color: #ffffff;
}

.footer-column {
  display: grid;
  grid-template-columns: 15px auto;
  align-items: start;
  column-gap: 28px;
}

.footer-column-links {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.footer-store-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: rgba(245, 241, 233, 0.9);
  font-size: 10px;
  line-height: 1.5;
  white-space: nowrap;
}

.store-hours {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: rgba(245, 241, 233, 0.82);
  font-size: 9px;
}

/* TABLET */

@media (max-width: 1100px) {
  .him-footer-top {
    min-height: 90px;
  }

  .him-footer-logo :global(.him-footer-logo-img) {
  width: 80px;
}

  .newsletter-copy {
    padding-left: 22px;
    font-size: 9px;
  }

  .newsletter-form {
    gap: 12px;
    padding-right: 18px;
  }

  .newsletter-email {
    width: 210px;
    height: 40px;
  }

  .him-footer-bottom {
    grid-template-columns: minmax(390px, 1fr) auto auto;
    column-gap: 30px;
    padding: 35px 25px;
  }

  .footer-links-area {
    column-gap: 25px;
  }

  .footer-links-grid {
    column-gap: 16px;
    grid-template-columns: repeat(3, minmax(70px, 1fr));
  }

  .footer-column {
    column-gap: 14px;
  }
}

/* MOBILE */

@media (max-width: 700px) {
  .him-footer {
    min-height: auto;
  }

  .him-footer-top {
    display: grid;
    grid-template-columns: 90px 1fr;
    min-height: auto;
  }

 .him-footer-logo {
    width: 100px;
    height: auto;
    flex: none;
    grid-row: span 2;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
  }

 .him-footer-logo :global(.him-footer-logo-img) {
    width: 70px;
    height: auto;
  }

  .newsletter-copy {
    min-width: 0;
    padding: 15px;
    font-size: 9px;
  }

  .newsletter-form {
    grid-column: 2;
    justify-content: flex-start;
    padding: 0 15px 18px;
    gap: 10px;
  }

  .newsletter-email {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 38px;
    font-size: 9px;
  }

  .newsletter-submit {
    gap: 5px;
    font-size: 8px;
  }

  .him-footer-bottom {
    grid-template-columns: 1fr 1fr;
    row-gap: 35px;
    column-gap: 20px;
    padding: 30px 20px 35px;
  }

  .footer-links-area {
    grid-column: 1 / -1;
    grid-template-columns: 15px minmax(0, 1fr);
    column-gap: 22px;
  }

  .footer-links-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 10px;
    row-gap: 17px;
  }

  .footer-links-grid a,
  .footer-column-links a {
    font-size: 8px;
    white-space: normal;
  }

  .footer-column {
    grid-template-columns: 12px minmax(0, 1fr);
    column-gap: 12px;
  }

  .footer-column-links {
    gap: 16px;
  }

  .footer-store-content {
    font-size: 8px;
  }

  .store-hours {
    font-size: 7px;
  }
}

@media (max-width: 380px) {
  .him-footer-bottom {
    padding-left: 14px;
    padding-right: 14px;
    column-gap: 12px;
  }

  .footer-links-area {
    column-gap: 14px;
  }

  .footer-links-grid {
    column-gap: 7px;
  }
}

      `}</style>
    </footer>
  );
}
