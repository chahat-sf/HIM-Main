import type { Metadata } from "next";
import NotifyForm from "./NotifyForm";
import styles from "./coming-soon.module.css";

export const metadata: Metadata = {
	title: "Coming Soon",
	description: "HIM World is almost here. Leave your name and email to get notified.",
	robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
	return (
		<main className={styles.page}>
			<div className={styles.inner}>
				<p className={styles.brand}>HIM</p>
				<h1 className={styles.title}>Coming Soon</h1>
				<p className={styles.sub}>
					Luxury menswear, crafted for the man who stands out. Be first to know
					when we open.
				</p>
				<NotifyForm />
			</div>
		</main>
	);
}
