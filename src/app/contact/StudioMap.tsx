import Image from "next/image";
import styles from "./contact.module.css";

type StudioMapProps = {
	label: string;
	href?: string;
};

export default function StudioMap({ label, href }: StudioMapProps) {
	const image = (
		<Image
			src="/contact/studio-map-v2.jpg"
			alt={`Map showing ${label}`}
			fill
			sizes="(max-width: 768px) 100vw, 40vw"
			className={styles.studioMapImage}
			priority
		/>
	);

	if (href) {
		return (
			<a
				href={href}
				className={styles.studioMap}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`Open map for ${label}`}
			>
				{image}
			</a>
		);
	}

	return (
		<div
			className={styles.studioMap}
			role="img"
			aria-label={`Map showing ${label}`}
		>
			{image}
		</div>
	);
}
