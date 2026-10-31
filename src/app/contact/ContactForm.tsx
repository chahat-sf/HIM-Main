"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import styles from "./contact.module.css";

const SUBJECTS = [
	{ value: "order", label: "Order support" },
	{ value: "styling", label: "Styling advice" },
	{ value: "concierge", label: "Concierge request" },
	{ value: "returns", label: "Returns & exchanges" },
	{ value: "press", label: "Press & partnerships" },
	{ value: "other", label: "Other" },
] as const;

type ContactFormProps = {
	title?: string;
	lead?: string;
	defaultSubject?: string;
	lockSubject?: boolean;
};

export default function ContactForm({
	title = "SEND US A MESSAGE",
	lead = "Have a question, feedback, or need styling advice? Fill out the form and we'll get back to you shortly.",
	defaultSubject = "",
	lockSubject = false,
}: ContactFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [subject, setSubject] = useState(defaultSubject);
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [statusMessage, setStatusMessage] = useState("");

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		setStatus("idle");
		setStatusMessage("");

		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, subject, message }),
			});
			const data = (await res.json().catch(() => ({}))) as { error?: string };

			if (!res.ok) {
				setStatus("error");
				setStatusMessage(
					data.error || "Unable to send your message. Please try again.",
				);
				return;
			}

			setStatus("success");
			setStatusMessage("Thanks, we've received your message.");
			track("contact_submitted", { subject });
			setName("");
			setEmail("");
			setSubject(defaultSubject);
			setMessage("");
		} catch {
			setStatus("error");
			setStatusMessage("Unable to send your message. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className={styles.card} aria-labelledby="form-title">
			<h2 id="form-title" className={styles.cardTitle}>
				{title}
			</h2>
			<p className={styles.cardLead}>{lead}</p>

			<form className={styles.form} onSubmit={onSubmit} noValidate>
				<label className={styles.field}>
					<span>Full Name</span>
					<input
						type="text"
						name="name"
						autoComplete="name"
						placeholder="Your full name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</label>

				<label className={styles.field}>
					<span>Email Address</span>
					<input
						type="email"
						name="email"
						autoComplete="email"
						placeholder="you@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</label>

				<label className={styles.field}>
					<span>Subject</span>
					{lockSubject ? (
						<>
							<input type="hidden" name="subject" value={subject} />
							<input
								type="text"
								value={
									SUBJECTS.find((opt) => opt.value === subject)?.label ||
									"Concierge request"
								}
								readOnly
								aria-readonly="true"
							/>
						</>
					) : (
						<select
							name="subject"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							required
						>
							<option value="" disabled>
								Select a subject
							</option>
							{SUBJECTS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					)}
				</label>

				<label className={styles.field}>
					<span>Message</span>
					<textarea
						name="message"
						rows={5}
						placeholder="How can we help?"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						required
					/>
				</label>

				{status !== "idle" && (
					<p
						className={`${styles.status} ${status === "success" ? styles.success : styles.error
							}`}
						role="status"
					>
						{statusMessage}
					</p>
				)}

				<button type="submit" className={styles.submit} disabled={submitting}>
					{submitting ? "SENDING…" : "SEND MESSAGE"}
					<ArrowRight
						size={14}
						strokeWidth={1.25}
						absoluteStrokeWidth={false}
					/>
				</button>
			</form>
		</section>
	);
}
