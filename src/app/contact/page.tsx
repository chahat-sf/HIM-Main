import { Suspense } from "react";
import { Headphones, Ruler } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeroImage from "@/components/PageHeroImage";
import { ARCHIVIST_HERO } from "@/lib/page-heroes";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";
import ContactPanels from "./ContactPanels";
import styles from "./contact.module.css";

export const metadata = buildPageMetadata(PAGE_SEO.contact);

export default function ContactPage() {
	return (
		<>
			<Navbar />

			<main className={styles.page}>
				<section className={styles.hero} aria-label="Contact">
					<PageHeroImage
						src={ARCHIVIST_HERO}
						className={styles.heroImage}
					/>
					<div className={styles.heroOverlay} />
					<div className={styles.heroContent}>
						<p className={styles.eyebrow}>CONTACT</p>
						<h1 className={styles.title}>GET IN TOUCH</h1>
						<p className={styles.sub}>
							We&apos;re here to help, from styling questions to order support.
						</p>
					</div>
				</section>

				<Suspense fallback={<div className={styles.body} />}>
					<ContactPanels />
				</Suspense>

				<section className={styles.trust} aria-label="Customer promises">
					<div className={styles.trustInner}>
						<div className={styles.trustItem}>
							<span className={styles.trustIcon} aria-hidden>
								<Ruler
									size={22}
									strokeWidth={1.25}
									absoluteStrokeWidth={false}
								/>
							</span>
							<p className={styles.trustLabel}>Size Guidance</p>
							<p className={styles.trustSub}>Fit advice from our stylists</p>
						</div>
						<div className={styles.trustItem}>
							<span className={styles.trustIcon} aria-hidden>
								<Headphones
									size={22}
									strokeWidth={1.25}
									absoluteStrokeWidth={false}
								/>
							</span>
							<p className={styles.trustLabel}>24/7 Support</p>
							<p className={styles.trustSub}>We&apos;re here when you need us</p>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</>
	);
}
