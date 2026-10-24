import Image from "next/image";

const VALUES = [
  {
    num: "01",
    title: "INDIVIDUALITY",
    body: "Wear what feels like you.",
  },
  {
    num: "02",
    title: "CONFIDENCE",
    body: "Make your own statement.",
  },
  {
    num: "03",
    title: "EXPRESSION",
    body: "For every side of you.",
  },
] as const;

function Arrow() {
  return (
    <svg
      className="him-way-cta-arrow"
      width="12"
      height="9"
      viewBox="0 0 14 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 5H12.5M8.5 1L12.5 5L8.5 9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Editorial closer for the collection listing — THE HIM WAY. */
export default function HimWaySection() {
  return (
    <section className="him-way" aria-labelledby="him-way-title">
      <div className="him-way-inner">
        <header className="him-way-header">
          <h2 id="him-way-title" className="him-way-title">
            THE HIM WAY.
          </h2>
          <a
            href="#collection-listing"
            className="him-way-cta-link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("collection-listing");
              if (!el) return;
              const top = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top, behavior: "smooth" });
            }}
          >
            <span className="him-way-cta">
              <span className="him-way-cta-label">EXPLORE MORE</span>
              <Arrow />
            </span>
          </a>
        </header>

        <div className="him-way-grid">
          <div className="him-way-media">
            <Image
              src="/homepage/3-man-image.webp"
              alt="Two men in HIM tailored looks"
              fill
              quality={85}
              sizes="(max-width: 899px) 100vw, 58vw"
              className="him-way-img"
            />
          </div>

          <div className="him-way-copy">
            <h3 className="him-way-headline">MORE THAN WHAT YOU WEAR.</h3>
            <p className="him-way-body">
              At HIM, we believe style is a form of self-respect. It&apos;s not
              about chasing trends, but about finding what feels right for you
              today, tomorrow and always.
            </p>

            <ul className="him-way-values">
              {VALUES.map((item) => (
                <li key={item.num} className="him-way-value">
                  <div className="him-way-value-row">
                    <span className="him-way-num">{item.num}</span>
                    <span className="him-way-rule" aria-hidden="true" />
                    <p className="him-way-value-title">{item.title}</p>
                  </div>
                  <p className="him-way-value-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .him-way {
          --hw-ink: #111;
          --hw-muted: rgba(17, 17, 17, 0.55);
          --hw-rule: rgba(17, 17, 17, 0.28);
          --hw-rule-w: 56px;
          --hw-num-w: 1.6em;
          --hw-gap: 14px;
          background: #fff;
          color: var(--hw-ink);
          overflow-x: clip;
          max-width: 100%;
        }

        .him-way-inner {
          max-width: min(1440px, 100%);
          margin: 0 auto;
          padding: clamp(40px, 5.5vw, 72px) clamp(24px, 5vw, 80px)
            clamp(56px, 7vw, 96px);
          box-sizing: border-box;
        }

        .him-way-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: clamp(24px, 3.2vw, 40px);
          min-width: 0;
        }

        .him-way-title {
          margin: 0;
          min-width: 0;
          font-family: "Cormorant Garamond", "Cinzel", Georgia, serif;
          font-size: clamp(40px, 5.5vw, 80px);
          font-weight: 400;
          letter-spacing: 0.01em;
          line-height: 0.92;
          text-transform: uppercase;
        }

        .him-way-cta-link {
          display: inline-flex;
          flex-shrink: 0;
          text-decoration: none;
          color: inherit;
        }

        .him-way-cta {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--hw-ink);
          color: var(--hw-ink);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          line-height: 1;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
          transition: opacity 160ms ease;
        }

        .him-way-cta-label {
          display: inline;
        }

        .him-way-cta :global(.him-way-cta-arrow) {
          display: block;
          flex-shrink: 0;
        }

        .him-way-cta:hover {
          opacity: 0.55;
        }

        .him-way-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
          gap: clamp(32px, 5vw, 72px);
          align-items: start;
        }

        .him-way-media {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #e8e4de;
        }

        .him-way-media :global(.him-way-img) {
          object-fit: cover;
          object-position: center 28%;
        }

        .him-way-copy {
          padding-top: 0;
          min-width: 0;
        }

        .him-way-headline {
          margin: 0;
          font-family: "Cormorant Garamond", "Cinzel", Georgia, serif;
          font-size: clamp(28px, 2.6vw, 42px);
          font-weight: 400;
          letter-spacing: 0.01em;
          line-height: 1.05;
          text-transform: uppercase;
        }

        .him-way-body {
          margin: 18px 0 0;
          max-width: 36ch;
          color: var(--hw-muted);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.65;
        }

        .him-way-values {
          list-style: none;
          margin: 40px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
          width: 100%;
          max-width: 34ch;
        }

        .him-way-value {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        /* Rule sits on the bold title's vertical center only */
        .him-way-value-row {
          display: grid;
          grid-template-columns: var(--hw-num-w) var(--hw-rule-w) minmax(0, 1fr);
          align-items: center;
          column-gap: var(--hw-gap);
        }

        .him-way-num {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--hw-ink);
          line-height: 1;
        }

        .him-way-rule {
          display: block;
          height: 1px;
          width: 100%;
          background: var(--hw-rule);
        }

        .him-way-value-title {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .him-way-value-body {
          margin: 0;
          padding-left: calc(
            var(--hw-num-w) + var(--hw-gap) + var(--hw-rule-w) + var(--hw-gap)
          );
          color: var(--hw-muted);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          line-height: 1.45;
        }

        @media (max-width: 899px) {
          .him-way-inner {
            padding: 36px 20px 52px;
          }

          .him-way-header {
            margin-bottom: 22px;
          }

          .him-way-title {
            font-size: clamp(34px, 10vw, 48px);
          }

          .him-way-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .him-way-media {
            aspect-ratio: 16 / 10;
          }

          .him-way-body {
            max-width: none;
          }

          .him-way-values {
            max-width: none;
            margin-top: 32px;
          }
        }

        @media (max-width: 768px) {
          .him-way-inner {
            padding-top: 64px;
          }
        }

        @media (max-width: 640px) {
          .him-way-header {
            flex-direction: column;
            align-items: stretch;
            gap: 18px;
          }

          .him-way-title {
            align-self: flex-start;
            text-align: left;
            width: 100%;
          }

          .him-way-cta {
            align-self: flex-end;
            margin-top: 0;
          }
        }
      `}</style>
    </section>
  );
}
