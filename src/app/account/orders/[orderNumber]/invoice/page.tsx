import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getOrderConfirmation } from "@/lib/orders";
import { buildLoginHref } from "@/lib/auth-redirect";
import {
	getBusinessProfile,
	splitGstForPlaceOfSupply,
} from "@/lib/business";
import {
	formatInvoiceDate,
	INVOICE_PAGE_CSS,
	INVOICE_SHEET_CSS,
} from "@/lib/invoice-document";
import TaxInvoiceDocument from "@/components/invoice/TaxInvoiceDocument";
import SendInvoiceEmail from "@/components/checkout/SendInvoiceEmail";
import InvoicePrintButton from "./InvoicePrintButton";

export const metadata: Metadata = {
	title: "Tax invoice",
	robots: { index: false, follow: false },
};

type PageProps = {
	params: Promise<{ orderNumber: string }>;
};

export default async function OrderInvoicePage({ params }: PageProps) {
	const user = await getSessionUser();
	const { orderNumber: raw } = await params;
	const orderNumber = decodeURIComponent(raw || "").trim();

	if (!user) {
		redirect(
			buildLoginHref(
				`/account/orders/${encodeURIComponent(orderNumber)}/invoice`,
			),
		);
	}

	if (!orderNumber) notFound();

	const order = await getOrderConfirmation(user.id, orderNumber);
	if (!order || order.paymentStatus !== "paid") {
		notFound();
	}

	const business = getBusinessProfile();
	const a = order.address;
	const buyerState = a?.state || null;
	const gst = splitGstForPlaceOfSupply(order.taxCents, buyerState, business);
	const invoiceNumber = `INV-${order.orderNumber}`;

	const billTo = [
		order.customerName || a?.fullName,
		a?.line1,
		a?.line2,
		[a?.city, a?.state].filter(Boolean).join(", "),
		[a?.postalCode, a?.country].filter(Boolean).join(", "),
		order.customerEmail,
		order.customerPhone,
	].filter((line): line is string => Boolean(line && String(line).trim()));

	return (
		<main className="inv-page">
			<div className="inv-toolbar no-print">
				<Link
					href={`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`}
				>
					← Back to confirmation
				</Link>
				<InvoicePrintButton />
			</div>

			<div className="inv-email-bar no-print">
				<SendInvoiceEmail
					orderNumber={order.orderNumber}
					registeredEmail={order.customerEmail || user.email || ""}
					variant="light"
				/>
			</div>

			<TaxInvoiceDocument
				model={{
					invoiceNumber,
					orderNumber: order.orderNumber,
					placedAtLabel: formatInvoiceDate(order.placedAt),
					currency: order.currency,
					subtotalCents: order.subtotalCents,
					taxCents: order.taxCents,
					totalCents: order.totalCents,
					paymentId: order.paymentId,
					business,
					gst,
					billTo,
					items: order.items.map((item) => ({
						name: item.name,
						size: item.size,
						color: item.color,
						qty: item.qty,
						unitPriceCents: item.unitPriceCents,
					})),
				}}
			/>

			<style>{`
				${INVOICE_PAGE_CSS}
				${INVOICE_SHEET_CSS}
				.inv-email-bar :global(.sie) {
					margin-top: 12px;
					padding-top: 0;
					border-top: none;
				}
			`}</style>
		</main>
	);
}
