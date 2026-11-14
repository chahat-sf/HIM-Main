"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "@/components/Toast";
import { track } from "@/lib/analytics";
import CityCountryAutocomplete from "./CityCountryAutocomplete";
import styles from "./creators.module.css";

const PLATFORMS = [
	{ value: "instagram", label: "Instagram" },
	{ value: "youtube", label: "YouTube" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "x", label: "X" },
	{ value: "blog", label: "Blog / Editorial" },
	{ value: "other", label: "Other" },
] as const;

const AUDIENCE_SIZES = [
	{ value: "under_10k", label: "Under 10K" },
	{ value: "10k_50k", label: "10K – 50K" },
	{ value: "50k_100k", label: "50K – 100K" },
	{ value: "100k_500k", label: "100K – 500K" },
	{ value: "500k_plus", label: "500K+" },
] as const;

const CONTENT_CATEGORIES = [
	{ value: "fashion", label: "Fashion" },
	{ value: "menswear", label: "Menswear" },
	{ value: "lifestyle", label: "Lifestyle" },
	{ value: "photography", label: "Photography" },
	{ value: "film", label: "Film / Video" },
	{ value: "music", label: "Music" },
	{ value: "other", label: "Other" },
] as const;

const ABOUT_MAX = 500;

function splitCityCountry(raw: string): { city: string; country: string } {
	const value = raw.trim();
	if (!value) return { city: "", country: "" };
	if (value.toLowerCase() === "other") {
		return { city: "Other", country: "Other" };
	}
	const comma = value.indexOf(",");
	if (comma === -1) {
		return { city: value, country: "India" };
	}
	const city = value.slice(0, comma).trim();
	const country = value.slice(comma + 1).trim();
	return { city, country: country || "India" };
}

export default function CreatorApplicationForm() {
	const [formKey, setFormKey] = useState(0);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [cityCountry, setCityCountry] = useState("");
	const [mobile, setMobile] = useState("");
	const [primaryPlatform, setPrimaryPlatform] = useState("");
	const [socialUrl, setSocialUrl] = useState("");
	const [audienceSize, setAudienceSize] = useState("");
	const [contentCategory, setContentCategory] = useState("");
	const [portfolioUrl, setPortfolioUrl] = useState("");
	const [about, setAbout] = useState("");
	const [privacyAccepted, setPrivacyAccepted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const resetFields = () => {
		setFullName("");
		setEmail("");
		setCityCountry("");
		setMobile("");
		setPrimaryPlatform("");
		setSocialUrl("");
		setAudienceSize("");
		setContentCategory("");
		setPortfolioUrl("");
		setAbout("");
		setPrivacyAccepted(false);
		setError("");
		setFormKey((k) => k + 1);
	};

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;

		const form = event.currentTarget;
		setSubmitting(true);
		setError("");

		const { city, country } = splitCityCountry(cityCountry);
		const payload = {
			fullName: fullName.trim(),
			email: email.trim(),
			city,
			country,
			mobile: mobile.trim(),
			primaryPlatform,
			socialUrl: socialUrl.trim(),
			audienceSize,
			contentCategory,
			portfolioUrl: portfolioUrl.trim(),
			about: about.trim(),
			privacyAccepted,
		};

		try {
			const res = await fetch("/api/creators", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = (await res.json().catch(() => ({}))) as { error?: string };

			if (!res.ok) {
				setError(
					data.error || "Unable to submit your application. Please try again.",
				);
				return;
			}

			toast("Application received — we'll be in touch if it's a fit.");
			track("creator_application_submitted", {
				platform: payload.primaryPlatform,
				category: payload.contentCategory,
			});
			form.reset();
			resetFields();
		} catch {
			setError("Unable to submit your application. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className={styles.formWrap}>
			<form
				key={formKey}
				className={styles.form}
				onSubmit={onSubmit}
				noValidate
			>
				<h3 className={styles.sectionTitle}>Personal Details</h3>
				<div className={styles.fields}>
					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Full name <span className={styles.required}>*</span>
						</span>
						<input
							type="text"
							name="fullName"
							autoComplete="name"
							placeholder="Enter your full name"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
						/>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Email address <span className={styles.required}>*</span>
						</span>
						<input
							type="email"
							name="email"
							autoComplete="email"
							placeholder="Enter your email address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							City / Country <span className={styles.required}>*</span>
						</span>
						<CityCountryAutocomplete
							name="cityCountry"
							value={cityCountry}
							onChange={setCityCountry}
							required
						/>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>Mobile number (optional)</span>
						<input
							type="tel"
							name="mobile"
							autoComplete="tel"
							placeholder="Enter your mobile number"
							value={mobile}
							onChange={(e) => setMobile(e.target.value)}
						/>
					</label>
				</div>

				<h3 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>
					Your Creator Profile
				</h3>
				<div className={styles.fields}>
					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Primary platform <span className={styles.required}>*</span>
						</span>
						<select
							name="primaryPlatform"
							value={primaryPlatform}
							onChange={(e) => setPrimaryPlatform(e.target.value)}
							required
						>
							<option value="" disabled>
								Select primary platform
							</option>
							{PLATFORMS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Social profile URL <span className={styles.required}>*</span>
						</span>
						<input
							type="url"
							name="socialUrl"
							placeholder="https://"
							value={socialUrl}
							onChange={(e) => setSocialUrl(e.target.value)}
							required
						/>
						<p className={styles.fieldHint}>
							Tag @itshimworld so we can find your work.
						</p>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Audience size <span className={styles.required}>*</span>
						</span>
						<select
							name="audienceSize"
							value={audienceSize}
							onChange={(e) => setAudienceSize(e.target.value)}
							required
						>
							<option value="" disabled>
								Select audience size
							</option>
							{AUDIENCE_SIZES.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</label>

					<label className={styles.field}>
						<span className={styles.fieldLabel}>
							Content category <span className={styles.required}>*</span>
						</span>
						<select
							name="contentCategory"
							value={contentCategory}
							onChange={(e) => setContentCategory(e.target.value)}
							required
						>
							<option value="" disabled>
								Select content category
							</option>
							{CONTENT_CATEGORIES.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</label>

					<label className={`${styles.field} ${styles.fieldFull}`}>
						<span className={styles.fieldLabel}>Portfolio link (optional)</span>
						<input
							type="url"
							name="portfolioUrl"
							placeholder="Behance, YouTube, Google Drive, etc."
							value={portfolioUrl}
							onChange={(e) => setPortfolioUrl(e.target.value)}
						/>
					</label>
				</div>

				<h3 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>
					Tell Us About Yourself
				</h3>
				<label className={styles.field}>
					<span className={styles.fieldLabel}>
						Why do you want to work with HIM?{" "}
						<span className={styles.required}>*</span>
					</span>
					<textarea
						name="about"
						rows={5}
						maxLength={ABOUT_MAX}
						placeholder="Share a bit about your style, the kind of content you create, and why you'd like to collaborate with HIM."
						value={about}
						onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_MAX))}
						required
					/>
					<p className={styles.charCount}>
						{about.length} / {ABOUT_MAX}
					</p>
				</label>

				<label className={styles.privacy}>
					<input
						type="checkbox"
						checked={privacyAccepted}
						onChange={(e) => setPrivacyAccepted(e.target.checked)}
						required
					/>
					<span>
						I agree to the{" "}
						<Link href="/privacy-policy">Privacy Policy</Link> and consent to be
						contacted by the HIM team regarding this application.{" "}
						<span className={styles.required}>*</span>
					</span>
				</label>

				{error ? (
					<p className={`${styles.status} ${styles.error}`} role="alert">
						{error}
					</p>
				) : null}

				<button type="submit" className={styles.submit} disabled={submitting}>
					{submitting ? "SUBMITTING…" : "SUBMIT APPLICATION"}
					<ArrowUpRight
						size={14}
						strokeWidth={1.5}
						absoluteStrokeWidth={false}
					/>
				</button>
				<p className={styles.requiredNote}>Fields marked * are required.</p>
			</form>
		</div>
	);
}
