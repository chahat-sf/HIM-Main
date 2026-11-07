"use client";

import { useCallback, useState } from "react";

type Props = {
	orderNumber: string;
	/** Account email confirmation already went to (for hints / skipped copy). */
	registeredEmail?: string;
	/** Dark checkout success surface vs light invoice page. */
	variant?: "dark" | "light";
};

export default function SendInvoiceEmail({
	orderNumber,
	registeredEmail = "",
	variant = "dark",
}: Props) {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle",
	);
	const [message, setMessage] = useState("");

	const onSend = useCallback(async () => {
		const trimmed = email.trim();
		if (!trimmed) {
			setStatus("error");
			setMessage("Enter an email address.");
			return;
		}
		setStatus("sending");
		setMessage("");
		try {
			const res = await fetch(
				`/api/orders/${encodeURIComponent(orderNumber)}/email`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: trimmed }),
				},
			);
			const body = (await res.json().catch(() => ({}))) as {
				error?: string;
				to?: string;
				skipped?: boolean;
			};
			if (!res.ok) {
				throw new Error(body.error || "Unable to send email.");
			}
			setStatus("sent");
			if (body.skipped) {
				setMessage("Already sent to your account email.");
			} else {
				setMessage(`Sent to ${body.to || trimmed}`);
			}
		} catch (err) {
			setStatus("error");
			setMessage(
				err instanceof Error ? err.message : "Unable to send email.",
			);
		}
	}, [email, orderNumber]);

	const isDark = variant === "dark";
	const accountHint = registeredEmail.trim()
		? ` Confirmation was already sent to ${registeredEmail.trim()}.`
		: " Confirmation was already sent to your account email.";

	return (
		<div className={`sie ${isDark ? "sie-dark" : "sie-light"}`}>
			<p className="sie-label">EMAIL A COPY</p>
			<p className="sie-hint">
				Send the order confirmation and tax invoice PDF to another email.
				{accountHint}
			</p>
			<div className="sie-row">
				<input
					type="email"
					name="invoice-email"
					autoComplete="email"
					inputMode="email"
					placeholder="another@email.com"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						if (status !== "idle" && status !== "sending") {
							setStatus("idle");
							setMessage("");
						}
					}}
					disabled={status === "sending"}
					aria-label="Alternate email for invoice"
				/>
				<button
					type="button"
					onClick={() => void onSend()}
					disabled={status === "sending"}
				>
					{status === "sending" ? "SENDING…" : "SEND"}
				</button>
			</div>
			{message ? (
				<p
					className={
						status === "error" ? "sie-msg sie-msg-error" : "sie-msg sie-msg-ok"
					}
					role="status"
				>
					{message}
				</p>
			) : null}

			<style jsx>{`
				.sie {
					margin-top: 18px;
					padding-top: 18px;
					border-top: 1px solid
						${isDark ? "rgba(255,255,255,0.28)" : "#e5e5e5"};
				}
				.sie-label {
					margin: 0 0 8px;
					font-size: 11px;
					letter-spacing: 0.18em;
					color: ${isDark ? "rgba(255,255,255,0.55)" : "#666"};
				}
				.sie-hint {
					margin: 0 0 12px;
					font-size: 12px;
					line-height: 1.45;
					color: ${isDark ? "rgba(255,255,255,0.45)" : "#666"};
				}
				.sie-row {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
				}
				.sie-row input {
					flex: 1 1 180px;
					min-width: 0;
					min-height: 42px;
					padding: 0 12px;
					border: 1px solid
						${isDark ? "rgba(255,255,255,0.28)" : "#ccc"};
					background: ${isDark ? "transparent" : "#fff"};
					color: ${isDark ? "#fff" : "#111"};
					font-size: 13px;
					font-family: inherit;
					outline: none;
				}
				.sie-row input:focus {
					border-color: ${isDark ? "#c4a574" : "#111"};
				}
				.sie-row input::placeholder {
					color: ${isDark ? "rgba(255,255,255,0.35)" : "#999"};
				}
				.sie-row button {
					appearance: none;
					min-height: 42px;
					padding: 0 18px;
					border: none;
					background: ${isDark ? "#c4a574" : "#111"};
					color: ${isDark ? "#111" : "#fff"};
					font-size: 11px;
					letter-spacing: 0.16em;
					cursor: pointer;
					font-family: inherit;
				}
				.sie-row button:disabled {
					opacity: 0.65;
					cursor: wait;
				}
				.sie-row button:not(:disabled):hover {
					background: ${isDark ? "#d4b888" : "#333"};
				}
				.sie-msg {
					margin: 10px 0 0;
					font-size: 12px;
				}
				.sie-msg-ok {
					color: ${isDark ? "#b8d4b0" : "#2f6b3a"};
				}
				.sie-msg-error {
					color: ${isDark ? "#e8a0a0" : "#a33"};
				}
			`}</style>
		</div>
	);
}
