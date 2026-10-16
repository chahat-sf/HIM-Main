"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";

type HomeLoadApi = {
	reportHeroProgress: (pct: number) => void;
	reportHeroReady: () => void;
	reportHouseReady: () => void;
};

const HomeLoadContext = createContext<HomeLoadApi | null>(null);

export function useHomeLoad() {
	return useContext(HomeLoadContext);
}

/** Hero frames dominate download time; house first-frame fills the rest. */
function combinedProgress(heroPct: number, heroReady: boolean, houseReady: boolean) {
	const hero = Math.min(100, Math.max(0, heroPct)) * 0.8;
	const house = (houseReady ? 100 : heroReady ? 50 : 0) * 0.2;
	return Math.min(100, Math.round(hero + house));
}

export default function HomeGate({ children }: { children: ReactNode }) {
	const [heroPct, setHeroPct] = useState(0);
	const [heroReady, setHeroReady] = useState(false);
	const [houseReady, setHouseReady] = useState(false);
	const [started, setStarted] = useState(false);
	const [displayPct, setDisplayPct] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const magneticZoneRef = useRef<HTMLDivElement>(null);
	const magneticBtnRef = useRef<HTMLButtonElement>(null);
	const magneticLabelRef = useRef<HTMLSpanElement>(null);

	const reportHeroProgress = useCallback((pct: number) => {
		setHeroPct((prev) => Math.max(prev, Math.min(100, pct)));
	}, []);

	const reportHeroReady = useCallback(() => {
		setHeroPct(100);
		setHeroReady(true);
	}, []);

	const reportHouseReady = useCallback(() => {
		setHouseReady(true);
	}, []);

	const api = useMemo(
		() => ({ reportHeroProgress, reportHeroReady, reportHouseReady }),
		[reportHeroProgress, reportHeroReady, reportHouseReady],
	);

	const pageReady = heroReady && houseReady;
	const progress = combinedProgress(heroPct, heroReady, houseReady);

	useEffect(() => {
		if (revealed) return;
		setDisplayPct(pageReady ? 100 : progress);
	}, [progress, pageReady, revealed]);

	useEffect(() => {
		if (!pageReady || revealed) return;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		// Let the fill ease to 100%, hold a beat, then show the CTA.
		const delay = reduce ? 80 : 700;
		const timer = window.setTimeout(() => setRevealed(true), delay);
		return () => window.clearTimeout(timer);
	}, [pageReady, revealed]);

	useEffect(() => {
		if (started) return;
		const html = document.documentElement;
		const previous = html.style.overflow;
		html.style.overflow = "hidden";
		return () => {
			html.style.overflow = previous;
		};
	}, [started]);

	// Magnetic pull — adapted from https://github.com/livebloggerofficial/magnetic-button
	useEffect(() => {
		if (!revealed || started) return;
		const zone = magneticZoneRef.current;
		const button = magneticBtnRef.current;
		const label = magneticLabelRef.current;
		if (!zone || !button || !label) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let btnX = 0;
		let btnY = 0;
		let labelX = 0;
		let labelY = 0;
		let targetBtnX = 0;
		let targetBtnY = 0;
		let targetLabelX = 0;
		let targetLabelY = 0;
		let raf = 0;

		const tick = () => {
			btnX += (targetBtnX - btnX) * 0.22;
			btnY += (targetBtnY - btnY) * 0.22;
			labelX += (targetLabelX - labelX) * 0.22;
			labelY += (targetLabelY - labelY) * 0.22;
			button.style.transform = `translate3d(${btnX}px, ${btnY}px, 0)`;
			label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0)`;
			const settled =
				Math.abs(targetBtnX - btnX) < 0.05
				&& Math.abs(targetBtnY - btnY) < 0.05
				&& Math.abs(targetLabelX - labelX) < 0.05
				&& Math.abs(targetLabelY - labelY) < 0.05;
			raf = settled ? 0 : requestAnimationFrame(tick);
		};

		const drive = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};

		const onMove = (event: PointerEvent) => {
			const rect = button.getBoundingClientRect();
			const x = event.clientX - rect.left - rect.width / 2;
			const y = event.clientY - rect.top - rect.height / 2;
			targetBtnX = x * 0.35;
			targetBtnY = y * 0.35;
			targetLabelX = x * 0.15;
			targetLabelY = y * 0.15;
			drive();
		};

		const onLeave = () => {
			targetBtnX = 0;
			targetBtnY = 0;
			targetLabelX = 0;
			targetLabelY = 0;
			drive();
		};

		zone.addEventListener("pointermove", onMove);
		zone.addEventListener("pointerleave", onLeave);
		return () => {
			zone.removeEventListener("pointermove", onMove);
			zone.removeEventListener("pointerleave", onLeave);
			if (raf) cancelAnimationFrame(raf);
			button.style.transform = "";
			label.style.transform = "";
		};
	}, [revealed, started]);

	return (
		<HomeLoadContext.Provider value={api}>
			{children}
			<div
				aria-hidden={started}
				className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${started ? "opacity-0 pointer-events-none" : "opacity-100"
					}`}
			>
				<div
					ref={magneticZoneRef}
					className="magnetic-zone"
					style={{
						display: "grid",
						placeItems: "center",
						width: "min(100vw, 28rem)",
						height: revealed ? "min(60vh, 20rem)" : "auto",
						touchAction: "none",
					}}
				>
					<button
						ref={magneticBtnRef}
						type="button"
						className={`magnetic-btn${revealed ? " magnetic-btn--ready" : " magnetic-btn--loading"}`}
						disabled={!revealed}
						aria-busy={!revealed}
						aria-label={revealed ? "welcome to the HIM world" : `Loading ${displayPct}%`}
						onClick={() => {
							if (revealed) setStarted(true);
						}}
					>
						{!revealed && (
							<span
								className="magnetic-btn__progress"
								style={{ transform: `scaleX(${displayPct / 100})` }}
								aria-hidden
							/>
						)}
						<span className="magnetic-btn__hover" aria-hidden />
						<span ref={magneticLabelRef} className="magnetic-btn__label">
							<span className="magnetic-btn__copy" data-active={revealed || undefined}>
								welcome to the HIM world
							</span>
							<span className="magnetic-btn__copy" data-active={!revealed || undefined}>
								{displayPct}%
							</span>
						</span>
					</button>
				</div>
			</div>
			<style jsx global>{`
				.magnetic-btn {
					position: relative;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					margin: 0;
					padding: 22px 42px;
					border: 1px solid rgba(255, 255, 255, 0.35);
					border-radius: 999px;
					background: transparent;
					color: #fff;
					font-size: 18px;
					font-weight: 500;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					overflow: hidden;
					will-change: transform;
					transition:
						border-color 0.3s ease,
						color 0.3s ease,
						padding 0.55s cubic-bezier(0.22, 0.7, 0.18, 1);
				}

				.magnetic-btn--loading {
					cursor: default;
					pointer-events: none;
					padding: 11px 42px;
				}

				.magnetic-btn--ready {
					cursor: pointer;
					padding: 22px 42px;
				}

				.magnetic-btn__progress,
				.magnetic-btn__hover {
					position: absolute;
					inset: 0;
					background: #fff;
					z-index: 1;
					pointer-events: none;
				}

				.magnetic-btn__progress {
					transform-origin: left center;
					transition: transform 0.35s ease;
				}

				.magnetic-btn__hover {
					transform: scaleY(0);
					transform-origin: bottom;
					transition: transform 0.4s ease;
				}

				.magnetic-btn--loading .magnetic-btn__hover {
					display: none;
				}

				.magnetic-btn--ready:hover {
					color: #0f0f0f;
					border-color: #fff;
				}

				.magnetic-btn--ready:hover .magnetic-btn__hover {
					transform: scaleY(1);
				}

				.magnetic-btn__label {
					position: relative;
					z-index: 2;
					display: grid;
					pointer-events: none;
					transition: color 0.3s ease;
				}

				.magnetic-btn__copy {
					grid-area: 1 / 1;
					justify-self: center;
					visibility: hidden;
					transition: opacity 0.35s ease;
				}

				.magnetic-btn__copy[data-active] {
					visibility: visible;
				}

				.magnetic-btn--loading .magnetic-btn__label {
					color: #fff;
					mix-blend-mode: difference;
				}
			`}</style>
		</HomeLoadContext.Provider>
	);
}
