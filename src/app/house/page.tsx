"use client";

import Link from "next/link";
import Flythrough from "@/components/house/Flythrough";

export default function HousePage() {
	return (
		<div style={{ position: "relative", minHeight: "100vh" }}>
			<Flythrough />
			<Link
				href="/creator-program"
				style={{
					position: "absolute",
					bottom: 28,
					right: 28,
					zIndex: 30,
					fontFamily:
						'var(--font-room-sans), "Helvetica Neue", Helvetica, Arial, sans-serif',
					fontSize: 11,
					fontWeight: 500,
					letterSpacing: "0.14em",
					textTransform: "uppercase",
					color: "rgba(255,255,255,0.88)",
					textDecoration: "none",
				}}
			>
				Creator Program
			</Link>
		</div>
	);
}
