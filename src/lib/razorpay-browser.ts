export type RazorpaySuccessResponse = {
	razorpay_payment_id: string;
	razorpay_order_id: string;
	razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
	key: string;
	amount: number;
	currency: string;
	name: string;
	description?: string;
	order_id: string;
	prefill?: {
		name?: string;
		email?: string;
		contact?: string;
	};
	theme?: { color?: string };
	handler: (response: RazorpaySuccessResponse) => void;
	modal?: {
		ondismiss?: () => void;
	};
};

export type RazorpayInstance = {
	open: () => void;
	on: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
	interface Window {
		Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
	}
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Razorpay requires a browser"));
	}
	if (window.Razorpay) return Promise.resolve();

	const existing = document.querySelector<HTMLScriptElement>(
		`script[src="${SCRIPT_SRC}"]`,
	);
	if (existing) {
		return new Promise((resolve, reject) => {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("Failed to load Razorpay")),
				{ once: true },
			);
		});
	}

	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Razorpay"));
		document.body.appendChild(script);
	});
}
