import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Space_Mono } from "next/font/google";
import NavigationOverlay from "@/components/NavigationOverlay";
import BackgroundMusic from "@/components/BackgroundMusic";
import ToastHost from "@/components/Toast";
import { SessionProvider } from "@/components/SessionProvider";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import PostHogProviderGate from "@/components/PostHogProviderGate";
import { getSiteUrl } from "@/lib/site-url";
import { SEO_IMAGES } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();
const defaultOgImage = SEO_IMAGES.default;

const spaceMono = Space_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-nav",
	display: "swap",
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["500", "600"],
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
	metadataBase: new URL(siteUrl),
	title: {
		default: "HIM World | Luxury Menswear, Suits, Jackets & Tailoring",
		template: "%s | HIM World",
	},
	description:
		"HIM World is luxury menswear from Gurgaon. Tailored suits, velvet jackets, blazers and overcoats crafted for the man who stands out.",
	robots: {
		index: false,
		follow: false,
		googleBot: {
			index: false,
			follow: false,
		},
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "32x32" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
	openGraph: {
		title: "HIM World | Made for the Man Who Stands Out",
		description:
			"Luxury tailoring, velvet and eveningwear from our Gurgaon studio.",
		type: "website",
		url: siteUrl,
		siteName: "HIM World",
		images: [
			{
				url: defaultOgImage,
				width: 1200,
				height: 630,
				alt: "HIM World luxury menswear",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "HIM World | Made for the Man Who Stands Out",
		description:
			"Luxury tailoring, velvet and eveningwear from our Gurgaon studio.",
		images: [defaultOgImage],
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
				<SessionProvider>
					<CartProvider>
						<WishlistProvider>
							<PostHogProviderGate>
								{children}
								<NavigationOverlay />
								<BackgroundMusic />
								<ToastHost />
							</PostHogProviderGate>
						</WishlistProvider>
					</CartProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
