"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import type { AccountPayload, Address } from "@/lib/account";
import { buildLoginHref } from "@/lib/auth-redirect";
import { toCardImage } from "@/lib/card-image";
import { notifyCartChanged } from "@/lib/cart-local";
import { track } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import {
	loadRazorpayScript,
	type RazorpaySuccessResponse,
} from "@/lib/razorpay-browser";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const RULE = "rgba(255,255,255,0.14)";
const GOLD = "#c4a574";
const GOLD_HOVER = "#d4b888";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "1120px";

function fmt(n: number) {
	return "₹ " + n.toLocaleString("en-IN");
}

type CreateCheckoutResponse = {
	orderId: number;
	orderNumber: string;
	keyId: string;
	razorpayOrderId: string;
	amount: number;
	currency: string;
	customer: {
		name: string;
		email: string;
		contact: string | null;
	};
	error?: string;
};

type VerifyResponse = {
	orderId: number;
	orderNumber: string;
	totalCents: number;
	currency: string;
	error?: string;
};

export default function CheckoutClient() {
	const router = useRouter();
	const { items, itemCount, loading: cartLoading, isAuthenticated } =
		useCart();

	const [account, setAccount] = useState<AccountPayload | null>(null);
	const [accountLoading, setAccountLoading] = useState(true);
	const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
		null,
	);
	const [paying, setPaying] = useState(false);
	const [error, setError] = useState("");
	const [savingAddress, setSavingAddress] = useState(false);

	const [line1, setLine1] = useState("");
	const [line2, setLine2] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [country, setCountry] = useState("India");

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setAccountLoading(true);
			try {
				const res = await fetch("/api/account", { credentials: "include" });
				if (res.status === 401) {
					router.replace(buildLoginHref("/checkout"));
					return;
				}
				if (!res.ok) {
					throw new Error("Unable to load account.");
				}
				const payload = (await res.json()) as AccountPayload;
				if (cancelled) return;
				setAccount(payload);
				const preferred =
					payload.addresses.find((a) => a.isDefault) ??
					payload.addresses[0] ??
					null;
				setSelectedAddressId(preferred?.id ?? null);
			} catch {
				if (!cancelled) setError("Unable to load checkout.");
			} finally {
				if (!cancelled) setAccountLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [router]);

	const subtotal = useMemo(
		() => items.reduce((acc, i) => acc + i.price * i.qty, 0),
		[items],
	);
	const tax = Math.round(subtotal * 0.07);
	const total = subtotal + tax;

	async function onSaveAddress(e: FormEvent) {
		e.preventDefault();
		setSavingAddress(true);
		setError("");
		try {
			const res = await fetch("/api/account/addresses", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					line1,
					line2: line2.trim() || null,
					city,
					state,
					postalCode,
					country,
				}),
			});
			const body = (await res.json()) as AccountPayload & { error?: string };
			if (!res.ok) {
				setError(body.error || "Unable to save address.");
				return;
			}
			setAccount(body);
			const preferred =
				body.addresses.find((a) => a.isDefault) ?? body.addresses[0] ?? null;
			setSelectedAddressId(preferred?.id ?? null);
		} catch {
			setError("Unable to save address.");
		} finally {
			setSavingAddress(false);
		}
	}

	async function verifyPayment(response: RazorpaySuccessResponse) {
		const res = await fetch("/api/checkout/verify", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				razorpayOrderId: response.razorpay_order_id,
				razorpayPaymentId: response.razorpay_payment_id,
				razorpaySignature: response.razorpay_signature,
			}),
		});
		const body = (await res.json()) as VerifyResponse;
		if (!res.ok) {
			throw new Error(body.error || "Payment verification failed.");
		}

		notifyCartChanged();
		track("order_completed", {
			order_id: body.orderNumber,
			revenue: Math.round(body.totalCents / 100),
			currency: body.currency || "INR",
		});

		router.push(
			`/checkout/success?order=${encodeURIComponent(body.orderNumber)}`,
		);
	}

	async function onPay() {
		if (!selectedAddressId) {
			setError("Please add a shipping address.");
			return;
		}
		if (items.length === 0) {
			setError("Your cart is empty.");
			return;
		}

		setPaying(true);
		setError("");

		try {
			const createRes = await fetch("/api/checkout/create", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ addressId: selectedAddressId }),
			});
			const created = (await createRes.json()) as CreateCheckoutResponse;
			if (!createRes.ok) {
				throw new Error(created.error || "Unable to start payment.");
			}

			await loadRazorpayScript();
			if (!window.Razorpay) {
				throw new Error("Razorpay failed to load.");
			}

			const rzp = new window.Razorpay({
				key: created.keyId,
				amount: created.amount,
				currency: created.currency,
				name: "HIM",
				description: `Order ${created.orderNumber}`,
				order_id: created.razorpayOrderId,
				prefill: {
					name: created.customer.name,
					email: created.customer.email,
					contact: created.customer.contact ?? undefined,
				},
				theme: { color: GOLD },
				handler: (response) => {
					void verifyPayment(response).catch((err: unknown) => {
						setError(
							err instanceof Error
								? err.message
								: "Payment verification failed.",
						);
						setPaying(false);
					});
				},
				modal: {
					ondismiss: () => setPaying(false),
				},
			});

			rzp.open();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to start payment.",
			);
			setPaying(false);
		}
	}

	if (cartLoading || accountLoading) {
		return <RouteLoading />;
	}

	if (!isAuthenticated) {
		return <RouteLoading />;
	}

	const addresses: Address[] = account?.addresses ?? [];

	return (
		<>
			<Navbar />
			<main className="co-page">
				<div className="co-inner">
					<header className="co-header">
						<p className="co-eyebrow">CHECKOUT</p>
						<h1 className="co-title">Complete your order</h1>
						<p className="co-sub">
							Confirm shipping, then pay securely with Razorpay.
						</p>
					</header>

					{error && <p className="co-error">{error}</p>}

					{items.length === 0 ? (
						<div className="co-empty">
							<p>Your cart is empty.</p>
							<Link href="/collection" className="co-btn-secondary">
								CONTINUE SHOPPING
							</Link>
						</div>
					) : (
						<div className="co-grid">
							<section className="co-panel" aria-label="Shipping">
								<p className="co-panel-title">SHIPPING ADDRESS</p>

								{addresses.length > 0 ? (
									<ul className="co-address-list">
										{addresses.map((addr) => (
											<li key={addr.id}>
												<label className="co-address-card">
													<input
														type="radio"
														name="address"
														checked={selectedAddressId === addr.id}
														onChange={() => setSelectedAddressId(addr.id)}
													/>
													<span>
														<span className="co-address-label">
															{addr.label}
														</span>
														{addr.lines.map((line) => (
															<span key={line} className="co-address-line">
																{line}
															</span>
														))}
													</span>
												</label>
											</li>
										))}
									</ul>
								) : (
									<form className="co-form" onSubmit={onSaveAddress}>
										<label>
											Address line 1
											<input
												value={line1}
												onChange={(e) => setLine1(e.target.value)}
												required
											/>
										</label>
										<label>
											Address line 2
											<input
												value={line2}
												onChange={(e) => setLine2(e.target.value)}
											/>
										</label>
										<div className="co-form-row">
											<label>
												City
												<input
													value={city}
													onChange={(e) => setCity(e.target.value)}
													required
												/>
											</label>
											<label>
												State
												<input
													value={state}
													onChange={(e) => setState(e.target.value)}
													required
												/>
											</label>
										</div>
										<div className="co-form-row">
											<label>
												Postal code
												<input
													value={postalCode}
													onChange={(e) => setPostalCode(e.target.value)}
													required
												/>
											</label>
											<label>
												Country
												<input
													value={country}
													onChange={(e) => setCountry(e.target.value)}
													required
												/>
											</label>
										</div>
										<button
											type="submit"
											className="co-btn-secondary"
											disabled={savingAddress}
										>
											{savingAddress ? "Saving…" : "SAVE ADDRESS"}
										</button>
									</form>
								)}

								{addresses.length > 0 && (
									<p className="co-hint">
										Need a different address? Update it in{" "}
										<Link href="/account">My Account</Link>.
									</p>
								)}
							</section>

							<aside className="co-panel co-summary" aria-label="Order summary">
								<p className="co-panel-title">ORDER SUMMARY</p>

								<ul className="co-lines">
									{items.map((item) => (
										<li key={item.id} className="co-line">
											<div className="co-line-img">
												<Image
													src={toCardImage(item.image)}
													alt=""
													fill
													sizes="64px"
													className="object-cover"
												/>
											</div>
											<div className="co-line-meta">
												<p className="co-line-name">{item.name}</p>
												<p className="co-line-detail">
													{[item.size, item.color].filter(Boolean).join(" · ")}
													{" · "}
													Qty {item.qty}
												</p>
											</div>
											<p className="co-line-price">
												{fmt(item.price * item.qty)}
											</p>
										</li>
									))}
								</ul>

								<div className="co-totals">
									<div>
										<span>Subtotal ({itemCount} items)</span>
										<span>{fmt(subtotal)}</span>
									</div>
									<div>
										<span>Shipping</span>
										<span className="co-free">Free</span>
									</div>
									<div>
										<span>Estimated Tax</span>
										<span>{fmt(tax)}</span>
									</div>
									<div className="co-total">
										<span>Total</span>
										<span>{fmt(total)}</span>
									</div>
								</div>

								<button
									type="button"
									className="co-btn-primary"
									onClick={() => void onPay()}
									disabled={paying || !selectedAddressId}
								>
									{paying ? "PROCESSING…" : "PAY WITH RAZORPAY"}{" "}
									{!paying && (
										<ArrowRight
											size={12}
											strokeWidth={1.25}
											absoluteStrokeWidth={false}
											aria-hidden
										/>
									)}
								</button>

								<Link href="/cart" className="co-btn-secondary">
									BACK TO CART
								</Link>
							</aside>
						</div>
					)}
				</div>
			</main>
			<Footer />

			<style jsx>{`
				.co-page {
					min-height: 100vh;
					background: ${BG};
					color: ${INK};
					font-family: ${SANS};
					padding: 120px ${GUTTER} 80px;
				}
				.co-inner {
					max-width: ${CONTENT_MAX};
					margin: 0 auto;
				}
				.co-header {
					margin-bottom: 36px;
				}
				.co-eyebrow {
					font-size: 11px;
					letter-spacing: 0.22em;
					color: ${MUTED};
					margin: 0 0 10px;
				}
				.co-title {
					font-family: ${SERIF};
					font-weight: 400;
					font-size: clamp(32px, 4vw, 48px);
					margin: 0 0 8px;
					letter-spacing: 0.02em;
				}
				.co-sub {
					margin: 0;
					color: ${MUTED_SOFT};
					font-size: 14px;
					letter-spacing: 0.04em;
				}
				.co-error {
					color: #e8a0a0;
					font-size: 13px;
					margin: 0 0 20px;
				}
				.co-empty {
					border: 1px solid ${BORDER};
					padding: 48px 24px;
					text-align: center;
					display: grid;
					gap: 20px;
					justify-items: center;
				}
				.co-grid {
					display: grid;
					grid-template-columns: 1.2fr 0.8fr;
					gap: 28px;
					align-items: start;
				}
				.co-panel {
					border: 1px solid ${BORDER};
					padding: 24px;
				}
				.co-panel-title {
					margin: 0 0 18px;
					font-size: 11px;
					letter-spacing: 0.2em;
					color: ${MUTED};
				}
				.co-address-list {
					list-style: none;
					margin: 0;
					padding: 0;
					display: grid;
					gap: 12px;
				}
				.co-address-card {
					display: grid;
					grid-template-columns: auto 1fr;
					gap: 12px;
					align-items: start;
					border: 1px solid ${RULE};
					padding: 14px;
					cursor: pointer;
				}
				.co-address-card input {
					margin-top: 4px;
					accent-color: ${GOLD};
				}
				.co-address-label {
					display: block;
					font-size: 11px;
					letter-spacing: 0.16em;
					margin-bottom: 6px;
					color: ${GOLD};
				}
				.co-address-line {
					display: block;
					font-size: 13px;
					line-height: 1.45;
					color: ${MUTED_SOFT};
				}
				.co-hint {
					margin: 16px 0 0;
					font-size: 12px;
					color: ${MUTED};
				}
				.co-hint :global(a) {
					color: ${GOLD};
					text-decoration: underline;
					text-underline-offset: 3px;
				}
				.co-form {
					display: grid;
					gap: 14px;
				}
				.co-form label {
					display: grid;
					gap: 6px;
					font-size: 11px;
					letter-spacing: 0.12em;
					color: ${MUTED};
					text-transform: uppercase;
				}
				.co-form input {
					background: transparent;
					border: 1px solid ${BORDER};
					color: ${INK};
					padding: 10px 12px;
					font-size: 14px;
					outline: none;
				}
				.co-form input:focus {
					border-color: ${GOLD};
				}
				.co-form-row {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 12px;
				}
				.co-lines {
					list-style: none;
					margin: 0 0 20px;
					padding: 0;
					display: grid;
					gap: 14px;
				}
				.co-line {
					display: grid;
					grid-template-columns: 56px 1fr auto;
					gap: 12px;
					align-items: center;
				}
				.co-line-img {
					position: relative;
					width: 56px;
					height: 70px;
					background: #141414;
					overflow: hidden;
				}
				.co-line-name {
					margin: 0 0 4px;
					font-size: 13px;
					letter-spacing: 0.04em;
				}
				.co-line-detail {
					margin: 0;
					font-size: 11px;
					color: ${MUTED};
				}
				.co-line-price {
					margin: 0;
					font-size: 13px;
					white-space: nowrap;
				}
				.co-totals {
					border-top: 1px solid ${RULE};
					padding-top: 16px;
					display: grid;
					gap: 10px;
					margin-bottom: 22px;
				}
				.co-totals > div {
					display: flex;
					justify-content: space-between;
					font-size: 13px;
					color: ${MUTED_SOFT};
				}
				.co-free {
					color: ${GOLD};
				}
				.co-total {
					padding-top: 10px;
					border-top: 1px solid ${RULE};
					color: ${INK} !important;
					font-size: 15px !important;
				}
				.co-btn-primary,
				.co-btn-secondary {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					width: 100%;
					min-height: 46px;
					font-size: 11px;
					letter-spacing: 0.18em;
					text-decoration: none;
					border: none;
					cursor: pointer;
				}
				.co-btn-primary {
					background: ${GOLD};
					color: #111;
					margin-bottom: 10px;
				}
				.co-btn-primary:hover:not(:disabled) {
					background: ${GOLD_HOVER};
				}
				.co-btn-primary:disabled {
					opacity: 0.55;
					cursor: not-allowed;
				}
				.co-btn-secondary {
					background: transparent;
					color: ${INK};
					border: 1px solid ${BORDER};
				}
				.co-btn-secondary:hover {
					border-color: ${GOLD};
					color: ${GOLD};
				}
				@media (max-width: 860px) {
					.co-grid {
						grid-template-columns: 1fr;
					}
					.co-form-row {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</>
	);
}
