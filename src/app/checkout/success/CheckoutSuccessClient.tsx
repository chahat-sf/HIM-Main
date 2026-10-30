"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const GOLD = "#c4a574";
const GOLD_HOVER = "#d4b888";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "720px";

export default function CheckoutSuccessClient({
	orderNumber,
}: {
	orderNumber: string | null;
}) {
	return (
		<>
			<Navbar />
			<main className="cs-page">
				<div className="cs-card">
					<p className="cs-eyebrow">ORDER CONFIRMED</p>
					<h1 className="cs-title">Thank you</h1>
					<p className="cs-sub">
						Your payment was received
						{orderNumber ? (
							<>
								{" "}
								for order <span className="cs-order">#{orderNumber}</span>
							</>
						) : null}
						. A confirmation will appear in your account shortly.
					</p>
					<div className="cs-actions">
						<Link href="/account" className="cs-btn-primary">
							VIEW ACCOUNT
						</Link>
						<Link href="/collection" className="cs-btn-secondary">
							CONTINUE SHOPPING
						</Link>
					</div>
				</div>
			</main>
			<Footer />

			<style jsx>{`
				.cs-page {
					min-height: 100vh;
					background: ${BG};
					color: ${INK};
					font-family: ${SANS};
					padding: 140px ${GUTTER} 80px;
					display: flex;
					justify-content: center;
				}
				.cs-card {
					max-width: ${CONTENT_MAX};
					width: 100%;
					border: 1px solid ${BORDER};
					padding: clamp(32px, 5vw, 56px);
					text-align: center;
				}
				.cs-eyebrow {
					margin: 0 0 12px;
					font-size: 11px;
					letter-spacing: 0.22em;
					color: ${GOLD};
				}
				.cs-title {
					margin: 0 0 14px;
					font-family: ${SERIF};
					font-weight: 400;
					font-size: clamp(36px, 5vw, 52px);
				}
				.cs-sub {
					margin: 0 auto 32px;
					max-width: 36em;
					color: ${MUTED_SOFT};
					font-size: 14px;
					line-height: 1.6;
					letter-spacing: 0.03em;
				}
				.cs-order {
					color: ${INK};
				}
				.cs-actions {
					display: grid;
					gap: 10px;
					max-width: 320px;
					margin: 0 auto;
				}
				.cs-btn-primary,
				.cs-btn-secondary {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 46px;
					font-size: 11px;
					letter-spacing: 0.18em;
					text-decoration: none;
				}
				.cs-btn-primary {
					background: ${GOLD};
					color: #111;
				}
				.cs-btn-primary:hover {
					background: ${GOLD_HOVER};
				}
				.cs-btn-secondary {
					border: 1px solid ${BORDER};
					color: ${INK};
				}
				.cs-btn-secondary:hover {
					border-color: ${GOLD};
					color: ${GOLD};
				}
			`}</style>
		</>
	);
}
