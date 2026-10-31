"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SIZE_FIT_HEADLINE, SIZE_FIT_NOTE } from "@/lib/size-chart";

type SizeChartModalProps = {
	open: boolean;
	onClose: () => void;
};

const EXIT_MS = 280;

export default function SizeChartModal({ open, onClose }: SizeChartModalProps) {
	const [mounted, setMounted] = useState(open);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (open) {
			setMounted(true);
			const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
				.matches;
			if (reduce) {
				setVisible(true);
				return;
			}
			const id = window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => setVisible(true));
			});
			return () => window.cancelAnimationFrame(id);
		}

		setVisible(false);
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
			.matches;
		const timer = window.setTimeout(
			() => setMounted(false),
			reduce ? 0 : EXIT_MS,
		);
		return () => window.clearTimeout(timer);
	}, [open]);

	useEffect(() => {
		if (!mounted) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [mounted, onClose]);

	if (!mounted) return null;

	return (
		<div
			className={`him-size-chart${visible ? " is-visible" : ""}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby="him-size-chart-title"
			onClick={onClose}
		>
			<div
				className="him-size-chart-panel"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="him-size-chart-head">
					<div>
						<p id="him-size-chart-title" className="him-size-chart-title">
							SIZE CHART
						</p>
					</div>
					<button
						type="button"
						className="him-size-chart-close"
						aria-label="Close size chart"
						onClick={onClose}
					>
						<X
							size={18}
							strokeWidth={1.25}
							absoluteStrokeWidth={false}
							aria-hidden
						/>
					</button>
				</header>

				<div className="him-size-chart-note">
					<p className="him-size-chart-note-title">{SIZE_FIT_HEADLINE}</p>
					<p className="him-size-chart-note-body">{SIZE_FIT_NOTE}</p>
				</div>
			</div>

			<style jsx>{`
				.him-size-chart {
					--sc-ink: #111;
					--sc-muted: #6b6b6b;
					--sc-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
					--sc-ease: cubic-bezier(0.22, 1, 0.36, 1);
					position: fixed;
					inset: 0;
					z-index: 80;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 24px 16px;
					background: rgba(10, 6, 4, 0.55);
					opacity: 0;
					transition: opacity ${EXIT_MS}ms var(--sc-ease);
				}

				.him-size-chart.is-visible {
					opacity: 1;
				}

				.him-size-chart-panel {
					width: min(100%, 420px);
					max-height: min(88vh, 640px);
					overflow: auto;
					padding: 28px 24px 24px;
					background: #fff;
					color: var(--sc-ink);
					box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
					transform: translateY(14px) scale(0.98);
					opacity: 0;
					transition:
						transform ${EXIT_MS}ms var(--sc-ease),
						opacity ${EXIT_MS}ms var(--sc-ease);
				}

				.him-size-chart.is-visible .him-size-chart-panel {
					transform: translateY(0) scale(1);
					opacity: 1;
				}

				.him-size-chart-head {
					display: flex;
					align-items: flex-start;
					justify-content: space-between;
					gap: 16px;
					margin-bottom: 18px;
				}

				.him-size-chart-title {
					margin: 0;
					font-family: var(--sc-sans);
					font-size: 11px;
					font-weight: 500;
					letter-spacing: 0.18em;
					text-transform: uppercase;
				}

				.him-size-chart-close {
					display: grid;
					place-items: center;
					width: 36px;
					height: 36px;
					margin: -8px -8px 0 0;
					padding: 0;
					border: none;
					background: transparent;
					color: var(--sc-ink);
					cursor: pointer;
				}

				.him-size-chart-note {
					margin: 0;
					padding: 14px 16px;
					border-left: 2px solid var(--sc-ink);
					background: #f5f3ef;
				}

				.him-size-chart-note-title {
					margin: 0;
					font-family: var(--sc-sans);
					font-size: 14px;
					font-weight: 600;
					line-height: 1.35;
					color: var(--sc-ink);
				}

				.him-size-chart-note-body {
					margin: 6px 0 0;
					font-family: var(--sc-sans);
					font-size: 13px;
					line-height: 1.55;
					color: #3d3d3d;
				}

				@media (max-width: 480px) {
					.him-size-chart-panel {
						padding: 22px 18px 20px;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.him-size-chart,
					.him-size-chart-panel {
						transition: none;
					}

					.him-size-chart-panel {
						transform: none;
					}
				}
			`}</style>
		</div>
	);
}
