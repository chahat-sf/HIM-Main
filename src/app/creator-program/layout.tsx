import { Cinzel, Inter, Playfair_Display } from "next/font/google";

const cinzel = Cinzel({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-creators-display",
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	variable: "--font-creators-sans",
	display: "swap",
});

const playfair = Playfair_Display({
	subsets: ["latin"],
	weight: ["700"],
	variable: "--font-creators-num",
	display: "swap",
});

export default function CreatorsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div
			className={`${cinzel.variable} ${inter.variable} ${playfair.variable}`}
		>
			{children}
		</div>
	);
}
