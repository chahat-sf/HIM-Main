"use client";

import Image from "next/image";
import { useState } from "react";

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
  const [gender, setGender] = useState({
    all: false,
    men: false,
    women: false,
  });

  return (
    <footer className="him-footer">
      {/* Background */}
      <Image
        src="/products/red-man-image.webp"
        alt=""
        fill
        className="him-footer-bg"
        sizes="100vw"
      />

      {/* Dark overlay */}
      <div className="him-footer-overlay" />

      <div className="him-footer-content">

        {/* =====================================================
            TOP SECTION
        ===================================================== */}
        <div className="him-footer-top">

          {/* LOGO */}
          <div className="him-footer-logo">
            HIM
          </div>

          {/* NEWSLETTER */}
          <div className="him-footer-newsletter">

            <div className="newsletter-copy">
              <span>SIGN UP TO OUR NEWSLETTER</span>
              <span>FOR TAILORED OFFERS</span>
            </div>

            <div className="newsletter-form">

              <span className="interested-label">
                I'M INTERESTED IN:
              </span>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={gender.all}
                  onChange={(e) =>
                    setGender({
                      ...gender,
                      all: e.target.checked,
                    })
                  }
                />
                <span>ALL</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={gender.men}
                  onChange={(e) =>
                    setGender({
                      ...gender,
                      men: e.target.checked,
                    })
                  }
                />
                <span>MEN</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={gender.women}
                  onChange={(e) =>
                    setGender({
                      ...gender,
                      women: e.target.checked,
                    })
                  }
                />
                <span>WOMEN</span>
              </label>

              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="newsletter-email"
              />

              <button
                type="button"
                className="newsletter-submit"
              >
                <span>SUBMIT</span>
                <span className="submit-arrow">→</span>
              </button>

            </div>
          </div>
        </div>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}
        <div className="him-footer-bottom">

          {/* LINKS */}
          <div className="footer-links-area">

            <div className="footer-links-title">
              LINKS
            </div>

            <div className="footer-links-grid">
              {footerLinks.map((link) => (
                <a href="#" key={link}>
                  {link}
                </a>
              ))}
            </div>

          </div>

          {/* SOCIALS */}
          <div className="footer-column">

            <div className="footer-column-title">
              SOCIALS
            </div>

            <div className="footer-column-links">
              <a href="#">INSTAGRAM</a>
              <a href="#">TIKTOK</a>
              <a href="#">YOUTUBE</a>
            </div>

          </div>

          {/* STORE */}
          <div className="footer-column store-column">

            <div className="footer-column-title">
              THE STORE
            </div>

            <div className="footer-store-content">

              <div>INDIA</div>

              <div className="store-hours">
                <span>MON-FRI: 11-7</span>
                <span>SAT: 11-5:30</span>
                <span>SUN: 11-5:30</span>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          STYLES
      ===================================================== */}
      <style jsx>{`

        /* =====================================================
           FOOTER
        ===================================================== */

        .him-footer {
          position: relative;
          width: 100%;
          min-height: 220px;

          overflow: hidden;

          color: #f5f1e9;
          background: #100b08;

          border-top: 1px solid rgba(255, 255, 255, 0.45);
        }


        /* =====================================================
           BACKGROUND IMAGE
        ===================================================== */

        .him-footer-bg {
          position: absolute !important;
          inset: 0;

          width: 100%;
          height: 100%;

          object-fit: cover;
          object-position: center center;

          z-index: 0;
        }


        /* =====================================================
           IMAGE OVERLAY
        ===================================================== */

        .him-footer-overlay {
          position: absolute;
          inset: 0;

          z-index: 1;

          background:
            linear-gradient(
              90deg,
              rgba(5, 5, 4, 0.72),
              rgba(5, 5, 4, 0.5)
            ),
            rgba(0, 0, 0, 0.35);
        }


        /* =====================================================
           CONTENT
        ===================================================== */

        .him-footer-content {
          position: relative;

          z-index: 2;

          width: 100%;
        }


        /* =====================================================
           TOP SECTION
        ===================================================== */

        .him-footer-top {
          min-height: 69px;

          display: flex;
          align-items: stretch;

          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
        }


        /* =====================================================
           LOGO
        ===================================================== */

        .him-footer-logo {
          width: 132px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 38px;
          font-weight: 700;

          letter-spacing: -2px;

          border-right: 1px solid rgba(255, 255, 255, 0.4);
        }


        /* =====================================================
           NEWSLETTER
        ===================================================== */

        .him-footer-newsletter {
          flex: 1;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          gap: 20px;
        }


        .newsletter-copy {
          min-width: 150px;
          flex-shrink: 0;

          display: flex;
          flex-direction: column;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 8px;
          line-height: 1.2;

          font-weight: 700;

          color: rgba(255, 255, 255, 0.9);
        }


        /* =====================================================
           NEWSLETTER FORM
        ===================================================== */

        .newsletter-form {
          display: flex;
          align-items: center;

          gap: 13px;

          white-space: nowrap;
        }


        .interested-label {
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 7px;

          color: rgba(255, 255, 255, 0.7);
        }


        /* =====================================================
           CHECKBOX
        ===================================================== */

        .checkbox-option {
          display: inline-flex;
          align-items: center;

          gap: 5px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 6.5px;

          color: rgba(255, 255, 255, 0.8);

          cursor: pointer;
        }


        .checkbox-option input {
          appearance: none;

          width: 10px;
          height: 10px;

          margin: 0;

          border: 1px solid rgba(255, 255, 255, 0.7);

          background: transparent;

          cursor: pointer;
        }


        .checkbox-option input:checked {
          background: rgba(255, 255, 255, 0.9);

          box-shadow:
            inset 0 0 0 2px rgba(30, 30, 30, 0.8);
        }


        /* =====================================================
           EMAIL
        ===================================================== */

        .newsletter-email {
          width: 190px;
          height: 28px;

          padding: 0 10px;

          border:
            1px solid
            rgba(255, 255, 255, 0.65);

          outline: none;

          background: rgba(255, 255, 255, 0.06);

          color: white;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 7px;
        }


        .newsletter-email::placeholder {
          color: rgba(255, 255, 255, 0.65);
        }


        .newsletter-email:focus {
          border-color:
            rgba(255, 255, 255, 0.95);
        }


        /* =====================================================
           SUBMIT
        ===================================================== */

        .newsletter-submit {
          display: inline-flex;
          align-items: center;

          gap: 5px;

          padding: 0;

          border: 0;

          background: transparent;

          color: rgba(255, 255, 255, 0.9);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 7px;

          cursor: pointer;
        }


        .submit-arrow {
          font-size: 12px;

          line-height: 1;
        }


        /* =====================================================
           BOTTOM SECTION
        ===================================================== */

        .him-footer-bottom {
          min-height: 145px;

          display: flex;
          align-items: stretch;
          justify-content: space-between;

          padding:
            27px
            25px
            22px;
        }


        /* =====================================================
           LINKS
        ===================================================== */

        .footer-links-area {
          display: flex;

          gap: 40px;

          flex-shrink: 0;
        }


        .footer-links-title,
        .footer-column-title {
          writing-mode: vertical-rl;

          transform: rotate(180deg);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 8px;
          font-weight: 700;

          line-height: 1;

          letter-spacing: 0.6px;

          color: rgba(255, 255, 255, 0.85);

          flex-shrink: 0;
        }


        /* =====================================================
           LINKS GRID
        ===================================================== */

        .footer-links-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(65px, 90px));

          grid-auto-rows:
            min-content;

          column-gap: 40px;

          row-gap: 14px;

          align-content: start;
        }


        .footer-links-grid a,
        .footer-column-links a {
          color: rgba(255, 255, 255, 0.78);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 6.5px;

          line-height: 1;

          text-decoration: none;

          text-transform: uppercase;

          transition:
            color 180ms ease;
        }


        .footer-links-grid a:hover,
        .footer-column-links a:hover {
          color: white;
        }


        /* =====================================================
           SOCIALS
        ===================================================== */

        .footer-column {
          display: flex;

          gap: 24px;

          flex-shrink: 0;
        }


        .footer-column-links {
          display: flex;

          flex-direction: column;

          gap: 14px;
        }


        /* =====================================================
           STORE
        ===================================================== */

        .store-column {
          flex-shrink: 0;
        }


        .footer-store-content {
          display: flex;

          flex-direction: column;

          gap: 9px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 7px;

          line-height: 1.2;

          color: rgba(255, 255, 255, 0.85);
        }


        .store-hours {
          display: flex;

          flex-direction: column;

          gap: 2px;

          color:
            rgba(255, 255, 255, 0.72);

          font-size: 6.5px;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1000px) {

          .him-footer-newsletter {
            gap: 12px;

            padding: 0 12px;
          }


          .newsletter-form {
            gap: 8px;
          }


          .newsletter-email {
            width: 145px;
          }


          .him-footer-bottom {
            padding-left: 18px;
            padding-right: 18px;
          }


          .footer-links-area {
            gap: 24px;
          }


          .footer-links-grid {
            grid-template-columns:
              repeat(3, minmax(55px, 75px));

            column-gap: 24px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .him-footer {
            min-height: auto;
          }


          .him-footer-top {
            flex-direction: column;
          }


          .him-footer-logo {
            width: 100%;

            height: 65px;

            border-right: 0;

            border-bottom:
              1px solid
              rgba(255, 255, 255, 0.35);
          }


          .him-footer-newsletter {
            padding: 18px 14px;

            flex-direction: column;

            align-items: flex-start;

            gap: 15px;
          }


          .newsletter-copy {
            min-width: auto;
          }


          .newsletter-form {
            width: 100%;

            flex-wrap: wrap;
          }


          .newsletter-email {
            flex: 1;

            min-width: 150px;
          }


          .him-footer-bottom {
            padding: 25px 16px;

            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap: 30px;
          }


          .footer-links-area {
            grid-column: 1 / -1;
          }


          .footer-links-grid {
            grid-template-columns:
              repeat(3, 1fr);

            width: 100%;
          }


          .footer-column {
            min-width: 0;
          }


          .store-column {
            min-width: 0;
          }

        }

      `}</style>
    </footer>
  );
}