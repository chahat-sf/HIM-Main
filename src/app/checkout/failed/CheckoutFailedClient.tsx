"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import OrderSummaryPanel from "@/components/checkout/OrderSummaryPanel";
import type { OrderConfirmation } from "@/lib/orders";

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
const CONTENT_MAX = "1120px";

function formatAddressLines(order: OrderConfirmation): string[] {
	const a = order.address;
	if (!a) return [];
	return [
		a.fullName,
		a.line1,
		a.line2,
		[a.city, a.state].filter(Boolean).join(", "),
		[a.postalCode, a.country].filter(Boolean).join(", "),
	].filter((line): line is string => Boolean(line && String(line).trim()));
}

export default function CheckoutFailedClient({
	orderNumber,
}: {
	orderNumber: string | null;
}) {
	const [order, setOrder] = useState<OrderConfirmation | null>(null);
	const [loading, setLoading] = useState(Boolean(orderNumber));

	useEffect(() => {
		if (!orderNumber) {
			setLoading(false);
			return;
		}

		let cancelled = false;
		async function load() {
			try {
				const res = await fetch(
					`/api/orders/${encodeURIComponent(orderNumber!)}`,
					{ credentials: "include" },
				);
				if (!res.ok) return;
				const body = (await res.json()) as OrderConfirmation;
				if (!cancelled) setOrder(body);
			} catch {
				/* optional snapshot */
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [orderNumber]);

	const lines = useMemo(
		() =>
			(order?.items ?? []).map((item) => ({
				name: item.name,
				size: item.size,
				color: item.color,
				qty: item.qty,
				price: item.unitPriceCents / 100,
				image: item.image,
			})),
		[order],
	);

	const itemCount = useMemo(
		() => lines.reduce((sum, line) => sum + line.qty, 0),
		[lines],
	);

	if (loading) {
		return <RouteLoading />;
	}

	const addressLines = order ? formatAddressLines(order) : [];

	return (
		<>
			<Navbar />
			<main className="cf-page">
				<div className="cf-inner">
					<header className="cf-header">
						<p className="cf-eyebrow">PAYMENT FAILED</p>
						<h1 className="cf-title">Payment was not completed</h1>
						<p className="cf-sub">
							No charge went through for this attempt. You can try again — your
							cart is still available at checkout.
							{orderNumber ? (
								<>
									{" "}
									Reference order ID{" "}
									<span className="cf-order">#{orderNumber}</span> if you need
									help from our team.
								</>
							) : null}
						</p>
					</header>

					{order && lines.length > 0 ? (
						<div className="cf-grid">
							<section className="cf-panel" aria-label="Shipping">
								<p className="cf-panel-title">SHIPPING ADDRESS</p>
								{addressLines.length > 0 ? (
									<div className="cf-address">
										{addressLines.map((line) => (
											<span key={line}>{line}</span>
										))}
									</div>
								) : (
									<p className="cf-muted">Address selected for this attempt.</p>
								)}
							</section>

							<OrderSummaryPanel
								title="ORDER ATTEMPT"
								lines={lines}
								subtotal={(order.subtotalCents || 0) / 100}
								tax={(order.taxCents || 0) / 100}
								total={(order.totalCents || 0) / 100}
								itemCount={itemCount}
								footer={
									<div className="cf-actions">
										<Link href="/checkout" className="cf-btn-primary">
											TRY PAYMENT AGAIN
										</Link>
										<Link href="/cart" className="cf-btn-secondary">
											BACK TO CART
										</Link>
									</div>
								}
							/>
						</div>
					) : (
						<div className="cf-actions cf-actions-solo">
							<Link href="/checkout" className="cf-btn-primary">
								TRY PAYMENT AGAIN
							</Link>
							<Link href="/cart" className="cf-btn-secondary">
								BACK TO CART
							</Link>
						</div>
					)}
				</div>
			</main>
			<Footer />

			<style jsx>{`
				.cf-page {
					min-height: 100vh;
					background: ${BG};
					color: ${INK};
					font-family: ${SANS};
					padding: 140px ${GUTTER} 80px;
				}
				.cf-inner {
					max-width: ${CONTENT_MAX};
					margin: 0 auto;
				}
				.cf-header {
					margin-bottom: clamp(28px, 4vw, 40px);
				}
				.cf-eyebrow {
					margin: 0 0 12px;
					font-size: 11px;
					letter-spacing: 0.22em;
					color: #e8a0a0;
				}
				.cf-title {
					margin: 0 0 14px;
					font-family: ${SERIF};
					font-weight: 400;
					font-size: clamp(32px, 4.5vw, 48px);
				}
				.cf-sub {
					margin: 0;
					max-width: 42em;
					color: ${MUTED_SOFT};
					font-size: 14px;
					line-height: 1.6;
					letter-spacing: 0.03em;
				}
				.cf-order {
					color: ${INK};
				}
				.cf-grid {
					display: grid;
					gap: 24px;
				}
				@media (min-width: 900px) {
					.cf-grid {
						grid-template-columns: 1fr 1fr;
						align-items: start;
					}
				}
				.cf-panel {
					border: 1px solid ${BORDER};
					padding: clamp(20px, 3vw, 28px);
				}
				.cf-panel-title {
					margin: 0 0 18px;
					font-size: 11px;
					letter-spacing: 0.22em;
					color: ${MUTED_SOFT};
				}
				.cf-address {
					display: grid;
					gap: 4px;
					font-size: 14px;
					line-height: 1.55;
				}
				.cf-muted {
					margin: 0;
					color: ${MUTED};
					font-size: 13px;
				}
				.cf-actions {
					display: grid;
					gap: 10px;
					margin-top: 22px;
				}
				.cf-actions-solo {
					max-width: 320px;
				}
				:global(.cf-btn-primary),
				:global(.cf-btn-secondary) {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 46px;
					font-size: 11px;
					letter-spacing: 0.18em;
					text-decoration: none;
					font-family: ${SANS};
				}
				:global(.cf-btn-primary) {
					background: ${GOLD};
					color: #111;
				}
				:global(.cf-btn-primary:hover) {
					background: ${GOLD_HOVER};
				}
				:global(.cf-btn-secondary) {
					border: 1px solid ${BORDER};
					color: ${INK};
				}
			`}</style>
		</>
	);
}
