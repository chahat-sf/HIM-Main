"use client";

import Image from "next/image";
import type { MouseEventHandler } from "react";

type Props = {
  className?: string;
  productName: string;
  compact?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function View360Button({
  className,
  productName,
  compact = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={["view-360", className].filter(Boolean).join(" ")}
      aria-label={`View ${productName} in 360 degrees`}
      onClick={onClick}
    >
      <Image
        src="/products/view-360-icon.png"
        alt=""
        width={80}
        height={61}
        className="view-360__icon"
        draggable={false}
      />
      {!compact ? (
        <>
          <span className="view-360__divider" />
          <span className="view-360__label">VIEW IN 360°</span>
        </>
      ) : null}

      <style jsx>{`
        .view-360 {
          flex: 0 0 auto;
          align-self: center;
          min-width: 0;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 12px;
          color: #111;
          background: linear-gradient(145deg, #fff, #f7f6f4);
          border: 1px solid #ebe8e4;
          border-radius: 10px;
          box-shadow: none;
          cursor: pointer;
          font: inherit;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .view-360:hover {
          border-color: #ddd9d4;
        }

        .view-360:active {
          transform: translateY(0.5px);
        }

        .view-360 :global(.view-360__icon) {
          width: 34px;
          height: auto;
          display: block;
          flex: 0 0 auto;
          object-fit: contain;
        }

        .view-360__divider {
          width: 1px;
          height: 18px;
          background: #c9c5c0;
        }

        .view-360__label {
          white-space: nowrap;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
        }

        .view-360.view-360--carousel {
          width: 48px;
          min-width: 48px;
          height: 48px;
          padding: 5px;
          gap: 0;
          border-radius: 50%;
        }

        .view-360.view-360--carousel :global(.view-360__icon) {
          width: 36px;
          height: auto;
        }

        @media (max-width: 768px) {
          .view-360.view-360--title {
            display: none !important;
          }
        }
      `}</style>
    </button>
  );
}
