"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import OrderSummaryPanel from "@/components/checkout/OrderSummaryPanel";
import type { AccountPayload, Address } from "@/lib/account";
import { buildLoginHref } from "@/lib/auth-redirect";
import { notifyCartChanged } from "@/lib/cart-local";
import { track } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import {
	loadRazorpayScript,
	type RazorpaySuccessResponse,
} from "@/lib/razorpay-browser";
import { splitInclusiveGst } from "@/lib/gst";

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

type AddressFormProps = {
	line1: string;
	line2: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	saving: boolean;
	showCancel?: boolean;
	onLine1: (value: string) => void;
	onLine2: (value: string) => void;
	onCity: (value: string) => void;
	onState: (value: string) => void;
	onPostalCode: (value: string) => void;
	onCountry: (value: string) => void;
	onCancel?: () => void;
	onSubmit: (e: FormEvent) => void;
};

function CheckoutAddressForm({
	line1,
	line2,
	city,
	state,
	postalCode,
	country,
	saving,
	showCancel = false,
	onLine1,
	onLine2,
	onCity,
	onState,
	onPostalCode,
	onCountry,
	onCancel,
	onSubmit,
}: AddressFormProps) {
	return (
		<form className="caf" onSubmit={onSubmit}>
			<label className="caf-field">
				<span>Address line 1</span>
				<input
					value={line1}
					onChange={(e) => onLine1(e.target.value)}
					required
				/>
			</label>
			<label className="caf-field">
				<span>Address line 2</span>
				<input value={line2} onChange={(e) => onLine2(e.target.value)} />
			</label>
			<div className="caf-row">
				<label className="caf-field">
					<span>City</span>
					<input
						value={city}
						onChange={(e) => onCity(e.target.value)}
						required
					/>
				</label>
				<label className="caf-field">
					<span>State</span>
					<input
						value={state}
						onChange={(e) => onState(e.target.value)}
						required
					/>
				</label>
			</div>
			<div className="caf-row">
				<label className="caf-field">
					<span>Postal code</span>
					<input
						value={postalCode}
						onChange={(e) => onPostalCode(e.target.value)}
						required
					/>
				</label>
				<label className="caf-field">
					<span>Country</span>
					<input
						value={country}
						onChange={(e) => onCountry(e.target.value)}
						required
					/>
				</label>
			</div>
			<div className="caf-actions">
				<button type="submit" className="caf-submit" disabled={saving}>
					{saving ? "Saving…" : "SAVE ADDRESS"}
				</button>
				{showCancel ? (
					<button
						type="button"
						className="caf-cancel"
						disabled={saving}
						onClick={onCancel}
					>
						Cancel
					</button>
				) : null}
			</div>

			<style jsx>{`
				.caf {
					display: grid;
					gap: 14px;
					width: 100%;
				}
				.caf-field {
					display: grid;
					gap: 6px;
					font-size: 11px;
					letter-spacing: 0.12em;
					color: ${MUTED};
					text-transform: uppercase;
					min-width: 0;
				}
				.caf-field input {
					width: 100%;
					box-sizing: border-box;
					background: transparent;
					border: 1px solid ${BORDER};
					color: ${INK};
					padding: 10px 12px;
					font-size: 14px;
					letter-spacing: 0;
					text-transform: none;
					outline: none;
				}
				.caf-field input:focus {
					border-color: ${GOLD};
				}
				.caf-row {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 12px;
				}
				.caf-actions {
					display: flex;
					flex-wrap: wrap;
					align-items: center;
					gap: 14px 18px;
					margin-top: 4px;
				}
				.caf-submit {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 42px;
					padding: 0 18px;
					background: transparent;
					color: ${INK};
					border: 1px solid ${BORDER};
					font-size: 11px;
					letter-spacing: 0.18em;
					cursor: pointer;
				}
				.caf-submit:hover:not(:disabled) {
					border-color: ${GOLD};
					color: ${GOLD};
				}
				.caf-submit:disabled {
					opacity: 0.55;
					cursor: not-allowed;
				}
				.caf-cancel {
					border: none;
					background: transparent;
					padding: 0;
					font-family: ${SANS};
					font-size: 11px;
					letter-spacing: 0.14em;
					text-transform: uppercase;
					color: ${GOLD};
					cursor: pointer;
					border-bottom: 1px solid transparent;
				}
				.caf-cancel:hover:not(:disabled) {
					border-bottom-color: ${GOLD};
				}
				.caf-cancel:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				@media (max-width: 520px) {
					.caf-row {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</form>
	);
}

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
	const [addressModalOpen, setAddressModalOpen] = useState(false);
	const [addingAddress, setAddingAddress] = useState(false);
	const [modalError, setModalError] = useState("");

	const [line1, setLine1] = useState("");
	const [line2, setLine2] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [country, setCountry] = useState("India");

	function clearAddressForm() {
		setLine1("");
		setLine2("");
		setCity("");
		setState("");
		setPostalCode("");
		setCountry("India");
	}

	function closeAddressModal() {
		setAddressModalOpen(false);
		setAddingAddress(false);
		setModalError("");
		clearAddressForm();
	}

	function openAddressModal() {
		setError("");
		setModalError("");
		setAddingAddress(false);
		clearAddressForm();
		setAddressModalOpen(true);
	}

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

	const total = useMemo(
		() => items.reduce((acc, i) => acc + i.price * i.qty, 0),
		[items],
	);
	const { taxableCents, taxCents } = splitInclusiveGst(
		Math.round(total * 100),
	);
	const subtotal = taxableCents / 100;
	const tax = taxCents / 100;

	useEffect(() => {
		if (!addressModalOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeAddressModal();
		};
		window.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [addressModalOpen]);

	async function onSaveAddress(e: FormEvent) {
		e.preventDefault();
		setSavingAddress(true);
		const setSaveError = addressModalOpen ? setModalError : setError;
		setSaveError("");
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
					isDefault: (account?.addresses.length ?? 0) === 0,
				}),
			});
			const body = (await res.json()) as AccountPayload & {
				error?: string;
				createdAddressId?: number;
			};
			if (!res.ok) {
				setSaveError(body.error || "Unable to save address.");
				return;
			}
			setAccount(body);
			const createdId = body.createdAddressId;
			const preferred =
				(createdId
					? body.addresses.find((a) => a.id === createdId)
					: null) ??
				body.addresses.find((a) => a.isDefault) ??
				body.addresses[0] ??
				null;
			setSelectedAddressId(preferred?.id ?? null);
			clearAddressForm();
			setAddingAddress(false);
			if (addressModalOpen) closeAddressModal();
		} catch {
			setSaveError("Unable to save address.");
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

			rzp.on("payment.failed", () => {
				setPaying(false);
				router.push(
					`/checkout/failed?order=${encodeURIComponent(created.orderNumber)}`,
				);
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
	const selectedAddress =
		addresses.find((a) => a.id === selectedAddressId) ??
		addresses.find((a) => a.isDefault) ??
		addresses[0] ??
		null;

	const addressForm = (
		<CheckoutAddressForm
			line1={line1}
			line2={line2}
			city={city}
			state={state}
			postalCode={postalCode}
			country={country}
			saving={savingAddress}
			showCancel={addingAddress}
			onLine1={setLine1}
			onLine2={setLine2}
			onCity={setCity}
			onState={setState}
			onPostalCode={setPostalCode}
			onCountry={setCountry}
			onCancel={() => {
				clearAddressForm();
				setAddingAddress(false);
				setModalError("");
			}}
			onSubmit={onSaveAddress}
		/>
	);

	return (
		<>
			<Navbar />
			<main className="co-page">
				<div className="co-inner">
					<header className="co-header">
						<Link
							href="/cart"
							className="co-back"
							aria-label="Back to cart"
						>
							<ArrowLeft
								size={20}
								strokeWidth={1.25}
								absoluteStrokeWidth={false}
								aria-hidden
							/>
						</Link>
						<div className="co-header-copy">
							<p className="co-eyebrow">CHECKOUT</p>
							<h1 className="co-title">Complete your order</h1>
							<p className="co-sub">
								Confirm shipping, then pay securely with Razorpay.
							</p>
						</div>
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
								<div className="co-panel-head">
									<p className="co-panel-title">SHIPPING ADDRESS</p>
									{addresses.length > 0 ? (
										<button
											type="button"
											className="co-text-btn"
											onClick={openAddressModal}
										>
											Change address
										</button>
									) : null}
								</div>

								{selectedAddress ? (
									<div className="co-address-current">
										<span className="co-address-label">
											{selectedAddress.label}
											{selectedAddress.isDefault ? (
												<span className="co-address-default">
													{" "}
													· Default
												</span>
											) : null}
										</span>
										{selectedAddress.lines.map((line) => (
											<span key={line} className="co-address-line">
												{line}
											</span>
										))}
									</div>
								) : (
									addressForm
								)}
							</section>

							<OrderSummaryPanel
								lines={items.map((item) => ({
									name: item.name,
									size: item.size,
									color: item.color,
									qty: item.qty,
									price: item.price,
									image: item.image,
								}))}
								subtotal={subtotal}
								tax={tax}
								total={total}
								itemCount={itemCount}
								footer={
									<button
										type="button"
										className="co-btn-primary co-pay-btn"
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
								}
							/>
						</div>
					)}
				</div>
			</main>
			<Footer />

			{addressModalOpen ? (
				<div
					className="co-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="co-address-modal-title"
					onClick={closeAddressModal}
				>
					<div
						className="co-modal-panel"
						onClick={(e) => e.stopPropagation()}
					>
						<header className="co-modal-head">
							<p id="co-address-modal-title" className="co-modal-title">
								{addingAddress ? "ADD ADDRESS" : "SELECT ADDRESS"}
							</p>
							<button
								type="button"
								className="co-modal-close"
								aria-label="Close"
								onClick={closeAddressModal}
							>
								<X
									size={18}
									strokeWidth={1.25}
									absoluteStrokeWidth={false}
									aria-hidden
								/>
							</button>
						</header>

						{modalError ? <p className="co-error">{modalError}</p> : null}

						{addingAddress ? (
							addressForm
						) : (
							<>
								<ul className="co-address-list co-address-list-modal">
									{addresses.map((addr) => (
										<li key={addr.id}>
											<label className="co-address-card">
												<input
													type="radio"
													name="modal-address"
													checked={selectedAddressId === addr.id}
													onChange={() => {
														setSelectedAddressId(addr.id);
														closeAddressModal();
													}}
												/>
												<span>
													<span className="co-address-label">
														{addr.label}
														{addr.isDefault ? (
															<span className="co-address-default">
																{" "}
																· Default
															</span>
														) : null}
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
								<button
									type="button"
									className="co-text-btn co-modal-add"
									onClick={() => {
										setModalError("");
										clearAddressForm();
										setAddingAddress(true);
									}}
								>
									Add new address
								</button>
							</>
						)}
					</div>
				</div>
			) : null}

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
					display: flex;
					align-items: flex-start;
					gap: 14px;
					margin-bottom: 36px;
				}
				.co-back {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;
					width: 36px;
					height: 36px;
					margin-top: 2px;
					color: ${INK};
					text-decoration: none;
					border: 1px solid transparent;
					transition: color 160ms ease, border-color 160ms ease;
				}
				.co-back:hover {
					color: ${GOLD};
					border-color: ${BORDER};
				}
				.co-header-copy {
					min-width: 0;
					flex: 1;
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
				.co-panel-head {
					display: flex;
					align-items: baseline;
					justify-content: space-between;
					gap: 16px;
					margin-bottom: 18px;
				}
				.co-panel-title {
					margin: 0;
					font-size: 11px;
					letter-spacing: 0.2em;
					color: ${MUTED};
				}
				.co-panel > .co-panel-title {
					margin-bottom: 18px;
				}
				.co-address-current {
					border: 1px solid ${RULE};
					padding: 14px;
				}
				.co-address-list {
					list-style: none;
					margin: 0;
					padding: 0;
					display: grid;
					gap: 12px;
				}
				.co-address-list-modal {
					max-height: min(52vh, 360px);
					overflow-y: auto;
					overscroll-behavior: contain;
					padding-right: 4px;
					scrollbar-width: thin;
					scrollbar-color: ${RULE} transparent;
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
				.co-address-default {
					color: ${MUTED};
					letter-spacing: 0.12em;
				}
				.co-address-line {
					display: block;
					font-size: 13px;
					line-height: 1.45;
					color: ${MUTED_SOFT};
				}
				.co-modal {
					position: fixed;
					inset: 0;
					z-index: 80;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 24px 16px;
					background: rgba(0, 0, 0, 0.72);
				}
				.co-modal-panel {
					width: min(520px, 100%);
					max-height: min(86vh, 720px);
					overflow-y: auto;
					background: ${BG};
					border: 1px solid ${BORDER};
					padding: 22px 22px 24px;
				}
				.co-modal-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 16px;
					margin-bottom: 18px;
				}
				.co-modal-title {
					margin: 0;
					font-size: 11px;
					letter-spacing: 0.2em;
					color: ${MUTED};
				}
				.co-modal-close {
					border: none;
					background: transparent;
					color: ${MUTED_SOFT};
					padding: 4px;
					cursor: pointer;
					display: inline-flex;
				}
				.co-modal-close:hover {
					color: ${INK};
				}
				.co-modal-add {
					margin-top: 16px;
				}
				.co-text-btn {
					border: none;
					background: transparent;
					padding: 0;
					font-family: ${SANS};
					font-size: 11px;
					letter-spacing: 0.14em;
					text-transform: uppercase;
					color: ${GOLD};
					cursor: pointer;
					border-bottom: 1px solid transparent;
				}
				.co-text-btn:hover:not(:disabled) {
					border-bottom-color: ${GOLD};
				}
				.co-text-btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				.co-pay-btn {
					margin-top: 16px;
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
				}
			`}</style>
		</>
	);
}
