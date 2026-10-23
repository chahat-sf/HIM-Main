import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Space_Mono } from "next/font/google";
import NavigationOverlay from "@/components/NavigationOverlay";
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
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "32x32" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
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
			<body className="font-sans antialiased">
				{children}
				<NavigationOverlay />
			</body>
		</html>
	);
}
