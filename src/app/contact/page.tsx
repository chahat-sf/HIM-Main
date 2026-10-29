import type { ReactNode } from "react";
import Image from "next/image";
import {
	ArrowRight,
	Clock,
	Headphones,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
	RefreshCw,
	Ruler,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

export const metadata = buildPageMetadata(PAGE_SEO.contact);

const INSTAGRAM_URL =
	"https://www.instagram.com/itshimworld?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw==";
const STUDIO_ADDRESS = "789, Sector-43, Gurgaon";
const STUDIO_MAPS_URL = "https://maps.google.com/?q=789+Sector+43+Gurgaon";
const PHONE_DISPLAY = "+91 99111 67778";
const PHONE_TEL = "+919911167778";
const EMAIL = "support@thehim.in";

const CARE_ROWS = [
	{
		icon: Mail,
		label: "Email",
		value: EMAIL,
		href: `mailto:${EMAIL}`,
	},
	{
		icon: Phone,
		label: "Phone",
		value: PHONE_DISPLAY,
		href: `tel:${PHONE_TEL}`,
	},
	{
		icon: MessageCircle,
		label: "WhatsApp",
		value: PHONE_DISPLAY,
		href: `https://wa.me/${PHONE_TEL.replace("+", "")}`,
	},
	{
		icon: MapPin,
		label: "Our Studio",
		value: STUDIO_ADDRESS,
		href: STUDIO_MAPS_URL,
	},
	{
		icon: Clock,
		label: "Hours",
		value: "Mon–Sat, 11am – 7pm IST",
		href: undefined as string | undefined,
	},
] as const;

function SocialSvg({ children }: { children: ReactNode }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden
		>
			{children}
		</svg>
	);
}

function InstagramIcon() {
	return (
		<SocialSvg>
			<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
		</SocialSvg>
	);
}

const SOCIALS = [
	{ label: "Instagram", href: INSTAGRAM_URL, Icon: InstagramIcon },
] as const;

export default function ContactPage() {
	return (
		<>
			<Navbar />

			<main className={styles.page}>
				<section className={styles.hero} aria-label="Contact">
					<Image
						src="/products/man-image-103.webp"
						alt=""
						fill
						priority
						quality={80}
						sizes="100vw"
						className="object-cover"
						style={{ objectPosition: "center 20%" }}
					/>
					<div className={styles.heroOverlay} />
					<div className={styles.heroContent}>
						<p className={styles.eyebrow}>CONTACT</p>
						<h1 className={styles.title}>GET IN TOUCH</h1>
						<p className={styles.sub}>
							We&apos;re here to help — from styling questions to order support.
						</p>
					</div>
				</section>

				<div className={styles.body}>
					<div className={styles.grid}>
						<section className={styles.card} aria-labelledby="care-title">
							<h2 id="care-title" className={styles.cardTitle}>
								CUSTOMER CARE
							</h2>
							<p className={styles.cardLead}>
								Reach out to us through any of the channels below. Our team will
								get back to you as soon as possible.
							</p>

							<ul className={styles.careList}>
								{CARE_ROWS.map((row) => {
									const Icon = row.icon;
									const value = row.href ? (
										<a href={row.href} className={styles.careValue}>
											{row.value}
										</a>
									) : (
										<span className={styles.careValue}>{row.value}</span>
									);
									return (
										<li key={row.label} className={styles.careRow}>
											<span className={styles.careIcon} aria-hidden>
												<Icon
													size={16}
													strokeWidth={1.25}
													absoluteStrokeWidth={false}
												/>
											</span>
											<span className={styles.careLabel}>{row.label}</span>
											{value}
										</li>
									);
								})}
							</ul>

							<div className={styles.follow}>
								<p className={styles.followLabel}>Follow Us</p>
								<div className={styles.socials}>
									{SOCIALS.map(({ label, href, Icon }) => (
										<a
											key={label}
											href={href}
											className={styles.social}
											aria-label={label}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Icon />
										</a>
									))}
								</div>
							</div>

							<div className={styles.studio}>
								<div className={styles.studioMap} aria-hidden>
									<div className={styles.studioMapPin}>
										<MapPin
											size={28}
											strokeWidth={1.25}
											absoluteStrokeWidth={false}
										/>
										<span className={styles.studioMapLabel}>Gurgaon</span>
									</div>
								</div>
								<div className={styles.studioFooter}>
									<div className={styles.studioCopy}>
										<p className={styles.studioTitle}>Visit Our Studio</p>
										<p className={styles.studioSub}>{STUDIO_ADDRESS}</p>
									</div>
									<a
										href={STUDIO_MAPS_URL}
										className={styles.bookBtn}
										target="_blank"
										rel="noopener noreferrer"
									>
										Book a Visit
										<ArrowRight
											size={12}
											strokeWidth={1.25}
											absoluteStrokeWidth={false}
										/>
									</a>
								</div>
							</div>
						</section>

						<ContactForm />
					</div>
				</div>

				<section className={styles.trust} aria-label="Customer promises">
					<div className={styles.trustInner}>
						<div className={styles.trustItem}>
							<span className={styles.trustIcon} aria-hidden>
								<RefreshCw
									size={22}
									strokeWidth={1.25}
									absoluteStrokeWidth={false}
								/>
							</span>
							<p className={styles.trustLabel}>Worldwide Returns</p>
							<p className={styles.trustSub}>Easy exchanges within 14 days</p>
						</div>
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
