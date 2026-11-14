"use client";

import type { MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./creators.module.css";

export default function HeroApplyCta() {
	const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
		const target = document.getElementById("application");
		if (!target) return;
		event.preventDefault();
		target.scrollIntoView({ behavior: "smooth", block: "start" });
		history.replaceState(null, "", "#application");
	};

	return (
		<a href="#application" className={styles.heroCta} onClick={onClick}>
			Apply to collaborate
			<ArrowUpRight size={16} strokeWidth={1.5} absoluteStrokeWidth={false} />
		</a>
	);
}
