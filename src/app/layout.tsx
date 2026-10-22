import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-nav",
	display: "swap",
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["500", "600"],
	style: ["normal", "italic"],
	variable: "--font-room-serif",
	display: "swap",
});

const jost = Jost({
	subsets: ["latin"],
	weight: ["300", "400"],
	variable: "--font-room-sans",
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "HIM",
		template: "%s — HIM",
	},
	description: "HIM — Luxury Menswear",
	openGraph: {
		title: "HIM",
		description: "HIM — Luxury Menswear",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "HIM",
		description: "HIM — Luxury Menswear",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${spaceMono.variable} ${cormorant.variable} ${jost.variable}`}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
