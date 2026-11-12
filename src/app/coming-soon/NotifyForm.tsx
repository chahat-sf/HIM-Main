"use client";

import { FormEvent, useState } from "react";
import styles from "./coming-soon.module.css";

type Status = "idle" | "loading" | "success" | "already" | "error";

export default function NotifyForm() {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [instagram, setInstagram] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMessage, setErrorMessage] = useState("");

	const done = status === "success" || status === "already";

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("loading");
		setErrorMessage("");

		try {
			const res = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					email,
					instagramUsername: instagram.trim() || undefined,
				}),
			});
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				alreadySubscribed?: boolean;
				error?: string;
			};

			if (!res.ok) {
				setStatus("error");
				setErrorMessage(data.error || "Unable to subscribe. Please try again.");
				return;
			}

			setStatus(data.alreadySubscribed ? "already" : "success");
		} catch {
			setStatus("error");
			setErrorMessage("Unable to subscribe. Please try again.");
		}
	}

	if (done) {
		return (
			<div className={styles.done}>
				<p className={styles.doneMessage}>
					{status === "already"
						? "You're already on the list. We'll be in touch."
						: "You're on the list. We'll notify you when we open."}
				</p>
			</div>
		);
	}

	if (!open) {
		return (
			<button
				type="button"
				className={styles.toggle}
				onClick={() => setOpen(true)}
			>
				Get notified
			</button>
		);
	}

	return (
		<form className={styles.form} onSubmit={onSubmit} noValidate>
			<label className={styles.label} htmlFor="waitlist-name">
				Name
				<input
					id="waitlist-name"
					className={styles.input}
					name="name"
					type="text"
					autoComplete="name"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={status === "loading"}
					required
					maxLength={120}
				/>
			</label>
			<label className={styles.label} htmlFor="waitlist-email">
				Email
				<input
					id="waitlist-email"
					className={styles.input}
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@email.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={status === "loading"}
					required
					maxLength={254}
				/>
			</label>
			<label className={styles.label} htmlFor="waitlist-instagram">
				<span className={styles.labelRow}>
					Instagram username
					<span className={styles.optional}>Optional</span>
				</span>
				<input
					id="waitlist-instagram"
					className={styles.input}
					name="instagram"
					type="text"
					autoComplete="username"
					placeholder="@username"
					value={instagram}
					onChange={(e) => setInstagram(e.target.value)}
					disabled={status === "loading"}
					maxLength={65}
				/>
			</label>
			<button
				type="submit"
				className={styles.submit}
				disabled={status === "loading"}
			>
				{status === "loading" ? "Saving…" : "Notify me"}
			</button>
			{status === "error" ? (
				<p className={`${styles.status} ${styles.statusError}`} role="alert">
					{errorMessage}
				</p>
			) : null}
		</form>
	);
}
