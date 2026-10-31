"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	ArrowRight,
	Clock,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
	Ruler,
	Sparkles,
	UserRound,
} from "lucide-react";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

const STUDIO_ADDRESS = "789, Sector-43, Gurgaon";
const STUDIO_MAPS_URL = "https://maps.google.com/?q=789+Sector+43+Gurgaon";
const PHONE_DISPLAY = "+91 99111 67778";
const PHONE_TEL = "+919911167778";
const EMAIL = "support@thehim.in";
const INSTAGRAM_URL =
	"https://www.instagram.com/itshimworld?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw==";

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

const CONCIERGE_SERVICES = [
	{
		icon: UserRound,
		title: "Personal styling",
		text: "One-to-one guidance on pieces, occasions, and how to wear HIM.",
	},
	{
		icon: Ruler,
		title: "Fit consultation",
		text: "A call to take your measurements and perfect the fit after you order.",
	},
	{
		icon: Sparkles,
		title: "Studio visit",
		text: "Book time at our Gurgaon studio for a private, considered appointment.",
	},
] as const;

type TabId = "care" | "concierge";

function parseTab(value: string | null): TabId {
	return value === "concierge" ? "concierge" : "care";
}

function InstagramIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden
		>
			<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
		</svg>
	);
}

export default function ContactPanels() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tab = parseTab(searchParams.get("tab"));

	const tabs = useMemo(
		() =>
			[
				{ id: "care" as const, label: "Customer Care" },
				{ id: "concierge" as const, label: "Concierge" },
			] as const,
		[],
	);

	const setTab = useCallback(
		(next: TabId) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", next);
			const query = params.toString();
			router.replace(query ? `${pathname}?${query}` : pathname, {
				scroll: false,
			});
		},
		[pathname, router, searchParams],
	);

	return (
		<div className={styles.body}>
			<div
				className={styles.tabs}
				role="tablist"
				aria-label="Contact options"
			>
				{tabs.map((item) => {
					const selected = tab === item.id;
					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							id={`contact-tab-${item.id}`}
							aria-selected={selected}
							aria-controls={`contact-panel-${item.id}`}
							tabIndex={selected ? 0 : -1}
							className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ""}`}
							onClick={() => setTab(item.id)}
						>
							{item.label}
						</button>
					);
				})}
			</div>

			{tab === "care" ? (
				<div
					className={styles.grid}
					role="tabpanel"
					id="contact-panel-care"
					aria-labelledby="contact-tab-care"
				>
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
								<a
									href={INSTAGRAM_URL}
									className={styles.social}
									aria-label="Instagram"
									target="_blank"
									rel="noopener noreferrer"
								>
									<InstagramIcon />
								</a>
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
			) : (
				<div
					className={styles.grid}
					role="tabpanel"
					id="contact-panel-concierge"
					aria-labelledby="contact-tab-concierge"
				>
					<section className={styles.card} aria-labelledby="concierge-title">
						<h2 id="concierge-title" className={styles.cardTitle}>
							HIM CONCIERGE
						</h2>
						<p className={styles.cardLead}>
							A private line for styling, fit, and studio appointments. Tell us
							what you need, we&apos;ll arrange the next step with you.
						</p>

						<ul className={styles.conciergeList}>
							{CONCIERGE_SERVICES.map((item) => {
								const Icon = item.icon;
								return (
									<li key={item.title} className={styles.conciergeItem}>
										<span className={styles.careIcon} aria-hidden>
											<Icon
												size={16}
												strokeWidth={1.25}
												absoluteStrokeWidth={false}
											/>
										</span>
										<div>
											<p className={styles.conciergeItemTitle}>{item.title}</p>
											<p className={styles.conciergeItemText}>{item.text}</p>
										</div>
									</li>
								);
							})}
						</ul>

						<ul className={styles.careList}>
							{CARE_ROWS.filter((row) =>
								["Phone", "WhatsApp", "Email", "Hours"].includes(row.label),
							).map((row) => {
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
					</section>

					<ContactForm
						title="REQUEST CONCIERGE"
						lead="Share your preferred time, city, and what you’d like help with. We’ll confirm shortly."
						defaultSubject="concierge"
						lockSubject
					/>
				</div>
			)}
		</div>
	);
}
