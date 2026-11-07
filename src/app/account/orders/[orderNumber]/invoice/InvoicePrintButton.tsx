"use client";

export default function InvoicePrintButton() {
	return (
		<button
			type="button"
			className="inv-print-btn"
			onClick={() => window.print()}
		>
			Download / Print invoice
		</button>
	);
}
