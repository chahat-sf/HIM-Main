"use client";

import { useEffect, useState } from "react";

const TOAST_EVENT = "him-toast";
const MAX_VISIBLE = 2;
const DISMISS_MS = 2500;

type ToastPayload = {
	id: number;
	message: string;
};

type ToastDetail = {
	message: string;
};

let toastId = 0;

/** Show a transient success toast (client-only). */
export function toast(message: string): void {
	if (typeof window === "undefined") return;
	const text = message.trim();
	if (!text) return;
	window.dispatchEvent(
		new CustomEvent<ToastDetail>(TOAST_EVENT, {
			detail: { message: text },
		}),
	);
}

export default function ToastHost() {
	const [items, setItems] = useState<ToastPayload[]>([]);

	useEffect(() => {
		const onToast = (event: Event) => {
			const detail = (event as CustomEvent<ToastDetail>).detail;
			const message = detail?.message?.trim();
			if (!message) return;
			const id = ++toastId;
			setItems((prev) => [...prev, { id, message }].slice(-MAX_VISIBLE));
			window.setTimeout(() => {
				setItems((prev) => prev.filter((t) => t.id !== id));
			}, DISMISS_MS);
		};

		window.addEventListener(TOAST_EVENT, onToast);
		return () => window.removeEventListener(TOAST_EVENT, onToast);
	}, []);

	if (items.length === 0) return null;

	return (
		<div className="him-toast-host" aria-live="polite" aria-relevant="additions">
			{items.map((item) => (
				<div key={item.id} className="him-toast" role="status">
					{item.message}
				</div>
			))}

			<style jsx global>{`
				.him-toast-host {
					position: fixed;
					left: 50%;
					bottom: max(24px, env(safe-area-inset-bottom, 0px));
					transform: translateX(-50%);
					z-index: 10050;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 8px;
					pointer-events: none;
					padding: 0 16px;
					box-sizing: border-box;
					max-width: min(100vw, 420px);
				}

				.him-toast {
					pointer-events: none;
					background: #111;
					color: #f5f5f5;
					font-family: Arial, Helvetica, sans-serif;
					font-size: 11px;
					font-weight: 500;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					line-height: 1.3;
					padding: 12px 18px;
					border-radius: 0;
					box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
					animation: him-toast-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
					white-space: nowrap;
					max-width: 100%;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				@keyframes him-toast-in {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.him-toast {
						animation: none;
					}
				}
			`}</style>
		</div>
	);
}
