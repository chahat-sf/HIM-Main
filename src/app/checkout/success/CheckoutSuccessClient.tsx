"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import OrderSummaryPanel from "@/components/checkout/OrderSummaryPanel";
import SendInvoiceEmail from "@/components/checkout/SendInvoiceEmail";
import { useSession } from "@/hooks/useSession";
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

export default function CheckoutSuccessClient({
	orderNumber,
}: {
	orderNumber: string | null;
}) {
	const { isAuthenticated } = useSession();
	const [order, setOrder] = useState<OrderConfirmation | null>(null);
	const [loading, setLoading] = useState(Boolean(orderNumber));
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!orderNumber) {
			setLoading(false);
			setError("Missing order reference.");
			return;
		}

		let cancelled = false;
		async function load() {
			setLoading(true);
			setError("");
			try {
				const res = await fetch(
					`/api/orders/${encodeURIComponent(orderNumber!)}`,
					{ credentials: "include" },
				);
				const body = (await res.json()) as OrderConfirmation & {
					error?: string;
				};
				if (!res.ok) {
					throw new Error(body.error || "Unable to load order.");
				}
				if (body.paymentStatus && body.paymentStatus !== "paid") {
					throw new Error("This order is not confirmed as paid yet.");
				}
				if (!cancelled) setOrder(body);
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : "Unable to load order.",
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [orderNumber]);

	const copyOrderId = useCallback(async () => {
		if (!order?.orderNumber) return;
		try {
			await navigator.clipboard.writeText(order.orderNumber);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setCopied(false);
		}
	}, [order?.orderNumber]);

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
	const invoiceHref =
		order && isAuthenticated
			? `/account/orders/${encodeURIComponent(order.orderNumber)}/invoice`
			: null;

	return (
		<>
			<Navbar />
			<main className="cs-page">
				<div className="cs-inner">
					<header className="cs-header">
						<p className="cs-eyebrow">ORDER CONFIRMED</p>
						<h1 className="cs-title">Thank you</h1>
						<p className="cs-sub">
							Your payment was received. A confirmation email is on its way.
							Quote your order ID if you contact our team.
						</p>

						{order ? (
							<div className="cs-order-id">
								<span className="cs-order-label">Order ID</span>
								<code className="cs-order-value">#{order.orderNumber}</code>
								<button
									type="button"
									className="cs-copy"
									onClick={() => void copyOrderId()}
								>
									{copied ? "COPIED" : "COPY"}
								</button>
							</div>
						) : null}

						{error ? <p className="cs-error">{error}</p> : null}
					</header>

					{order ? (
						<div className="cs-grid">
							<section className="cs-panel" aria-label="Shipping">
								<p className="cs-panel-title">SHIPPING ADDRESS</p>
								{addressLines.length > 0 ? (
									<div className="cs-address">
										{addressLines.map((line) => (
											<span key={line}>{line}</span>
										))}
									</div>
								) : (
									<p className="cs-muted">Address on file with this order.</p>
								)}
								{order.paymentId ? (
									<p className="cs-payment-ref">
										Payment ref · {order.paymentId}
									</p>
								) : null}
								{isAuthenticated ? (
									<SendInvoiceEmail
										orderNumber={order.orderNumber}
										registeredEmail={order.customerEmail}
										variant="dark"
									/>
								) : (
									<p className="cs-muted">
										Your tax invoice was emailed to {order.customerEmail}.
									</p>
								)}
							</section>

							<OrderSummaryPanel
								title="YOUR ORDER"
								lines={lines}
								subtotal={(order.subtotalCents || 0) / 100}
								tax={(order.taxCents || 0) / 100}
								total={(order.totalCents || 0) / 100}
								itemCount={itemCount}
								footer={
									<div className="cs-actions">
										{invoiceHref ? (
											<a
												href={invoiceHref}
												className="cs-btn-primary"
												target="_blank"
												rel="noreferrer"
											>
												DOWNLOAD INVOICE
											</a>
										) : null}
										{isAuthenticated ? (
											<Link
												href="/account?tab=orders"
												className="cs-btn-secondary"
											>
												VIEW ACCOUNT
											</Link>
										) : null}
										<Link href="/collection" className="cs-btn-secondary">
											CONTINUE SHOPPING
										</Link>
									</div>
								}
							/>
						</div>
					) : (
						<div className="cs-actions cs-actions-solo">
							{isAuthenticated ? (
								<Link href="/account?tab=orders" className="cs-btn-primary">
									VIEW ACCOUNT
								</Link>
							) : null}
							<Link href="/collection" className="cs-btn-secondary">
								CONTINUE SHOPPING
							</Link>
						</div>
					)}
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
				}
				.cs-inner {
					max-width: ${CONTENT_MAX};
					margin: 0 auto;
				}
				.cs-header {
					margin-bottom: clamp(28px, 4vw, 40px);
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
					margin: 0 0 22px;
					max-width: 40em;
					color: ${MUTED_SOFT};
					font-size: 14px;
					line-height: 1.6;
					letter-spacing: 0.03em;
				}
				.cs-order-id {
					display: inline-flex;
					flex-wrap: wrap;
					align-items: center;
					gap: 10px 14px;
					padding: 12px 16px;
					border: 1px solid ${BORDER};
				}
				.cs-order-label {
					font-size: 10px;
					letter-spacing: 0.2em;
					color: ${MUTED};
					text-transform: uppercase;
				}
				.cs-order-value {
					font-family: ${SANS};
					font-size: 14px;
					letter-spacing: 0.06em;
					color: ${INK};
					background: transparent;
				}
				.cs-copy {
					appearance: none;
					border: 1px solid ${BORDER};
					background: transparent;
					color: ${INK};
					font-size: 10px;
					letter-spacing: 0.16em;
					padding: 6px 10px;
					cursor: pointer;
				}
				.cs-copy:hover {
					border-color: ${GOLD};
					color: ${GOLD};
				}
				.cs-error {
					margin: 16px 0 0;
					color: #e8a0a0;
					font-size: 13px;
				}
				.cs-grid {
					display: grid;
					gap: 24px;
				}
				@media (min-width: 900px) {
					.cs-grid {
						grid-template-columns: 1fr 1fr;
						align-items: start;
					}
				}
				.cs-panel {
					border: 1px solid ${BORDER};
					padding: clamp(20px, 3vw, 28px);
				}
				.cs-panel-title {
					margin: 0 0 18px;
					font-size: 11px;
					letter-spacing: 0.22em;
					color: ${MUTED_SOFT};
				}
				.cs-address {
					display: grid;
					gap: 4px;
					font-size: 14px;
					line-height: 1.55;
					letter-spacing: 0.02em;
				}
				.cs-muted {
					margin: 0;
					color: ${MUTED};
					font-size: 13px;
				}
				.cs-payment-ref {
					margin: 20px 0 0;
					font-size: 11px;
					letter-spacing: 0.06em;
					color: ${MUTED};
					word-break: break-all;
				}
				.cs-actions {
					display: grid;
					gap: 10px;
					margin-top: 22px;
				}
				.cs-actions-solo {
					max-width: 320px;
				}
				:global(.cs-btn-primary),
				:global(.cs-btn-secondary) {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 46px;
					font-size: 11px;
					letter-spacing: 0.18em;
					text-decoration: none;
					font-family: ${SANS};
				}
				:global(.cs-btn-primary) {
					background: ${GOLD};
					color: #111;
				}
				:global(.cs-btn-primary:hover) {
					background: ${GOLD_HOVER};
				}
				:global(.cs-btn-secondary) {
					border: 1px solid ${BORDER};
					color: ${INK};
				}
				:global(.cs-btn-secondary:hover) {
					border-color: ${GOLD};
				}
			`}</style>
		</>
	);
}
