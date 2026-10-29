import type { Metadata } from "next";
import { listProducts } from "@/lib/catalog";
import CartClient from "./CartClient";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Cart",
	robots: { index: false, follow: false },
};

export default async function CartPage() {
	const products = await listProducts();
	return <CartClient products={products} />;
}
