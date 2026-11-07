import type { Metadata } from "next";
import CheckoutFailedClient from "./CheckoutFailedClient";

export const metadata: Metadata = {
	title: "Payment failed",
	robots: { index: false, follow: false },
};

type PageProps = {
	searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutFailedPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const orderNumber = params.order?.trim() || null;
	return <CheckoutFailedClient orderNumber={orderNumber} />;
}
