import type { Metadata } from "next";
import CheckoutSuccessClient from "./CheckoutSuccessClient";

export const metadata: Metadata = {
	title: "Order confirmed",
	robots: { index: false, follow: false },
};

type PageProps = {
	searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const orderNumber = params.order?.trim() || null;
	return <CheckoutSuccessClient orderNumber={orderNumber} />;
}
