import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeroImage from "@/components/PageHeroImage";
import { CREATORS_HERO } from "@/lib/page-heroes";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";
import CreatorApplicationForm from "./CreatorApplicationForm";
import HeroApplyCta from "./HeroApplyCta";
import styles from "./creators.module.css";

export const metadata = buildPageMetadata(PAGE_SEO.creators);

const HERO_ALT = PAGE_SEO.creators.image.alt;

const ORGANIZATION_JSON_LD = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "HIM",
	url: "https://thehim.in/",
	sameAs: ["https://www.instagram.com/itshimworld"],
};

const BENEFITS = [
	{
		num: "01",
		title: "Creative Partnerships",
		text: "Collaborate on meaningful brand stories.",
	},
	{
		num: "02",
		title: "Early Collection Access",
		text: "Get a first look at upcoming drops.",
	},
	{
		num: "03",
		title: "A Community of Original Voices",
		text: "Be part of creators who shape the HIM world.",
	},
] as const;

const STEPS = [
	{
		num: "01",
		title: "Your details",
		text: "Basic information to get started.",
	},
	{
		num: "02",
		title: "Your channels",
		text: "Share your social presence and audience details.",
	},
	{
		num: "03",
		title: "About your work",
		text: "Tell us about your content, style and interest in HIM.",
	},
] as const;

const PROCESS = [
	{
		label: "Apply",
		text: "Share your details and creator profile.",
	},
	{
		label: "Review",
		text: "Our team will go through your application.",
	},
	{
		label: "Connect",
		text: "If it's a fit, we'll reach out to explore collaboration opportunities.",
	},
] as const;

export default function CreatorsPage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(ORGANIZATION_JSON_LD),
				}}
			/>
			<Navbar />

			<main className={styles.page}>
				<section className={styles.hero} aria-label="Creator Program">
					<PageHeroImage
						src={CREATORS_HERO}
						alt={HERO_ALT}
						className={styles.heroImage}
					/>
					<div className={styles.heroOverlay} />
					<div className={styles.heroContent}>
						<p className={styles.eyebrow}>HIM / CREATOR PROGRAM</p>
						<h1 className={styles.title}>CREATE WITH HIM</h1>
						<p className={styles.sub}>
							For creators with a distinct point of view.
						</p>
						<HeroApplyCta />
					</div>
				</section>

				<section className={styles.benefits} aria-label="Program benefits">
					<div className={styles.benefitsInner}>
						{BENEFITS.map((item) => (
							<div key={item.num} className={styles.benefitItem}>
								<p className={styles.benefitHead}>
									<span className={styles.benefitNum}>{item.num} /</span>
									<span className={styles.benefitTitle}>{item.title}</span>
								</p>
								<p className={styles.benefitText}>{item.text}</p>
							</div>
						))}
					</div>
				</section>

				<section
					id="application"
					className={styles.application}
					aria-label="Creator application"
				>
					<div className={styles.applicationInner}>
						<aside className={styles.sidebar}>
							<p className={styles.sidebarLabel}>The Application</p>
							<h2 className={styles.sidebarTitle}>
								<span className={styles.sidebarTitleLine}>YOUR STORY</span>
								<span className={styles.sidebarTitleLine}>STARTS HERE.</span>
							</h2>
							<p className={styles.sidebarLead}>
								Tell us about yourself, your audience and the kind of work you
								create. We&apos;d love to learn more about your perspective and
								how it aligns with HIM.
							</p>
							<ol className={styles.steps}>
								{STEPS.map((step) => (
									<li key={step.num} className={styles.step}>
										<span className={styles.stepNum} aria-hidden>
											{step.num}
										</span>
										<div className={styles.stepBody}>
											<p className={styles.stepTitle}>{step.title}</p>
											<p className={styles.stepText}>{step.text}</p>
										</div>
									</li>
								))}
							</ol>
							<div className={styles.nextCard}>
								<p className={styles.nextCardTitle}>What happens next?</p>
								<p className={styles.nextCardText}>
									Our team will review your application and reach out if
									there&apos;s a good fit for upcoming collaborations.
								</p>
							</div>
						</aside>

						<CreatorApplicationForm />
					</div>
				</section>

				<section className={styles.process} aria-label="What happens next">
					<div className={styles.processInner}>
						<p className={styles.processHeading}>What happens next</p>
						<div className={styles.processSteps}>
							{PROCESS.map((item) => (
								<div key={item.label} className={styles.processItem}>
									<p className={styles.processLabel}>{item.label}</p>
									<p className={styles.processText}>{item.text}</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</>
	);
}
