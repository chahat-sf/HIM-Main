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
		if (!pageReady || started) return;
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
	}, [pageReady, started]);

	return (
		<HomeLoadContext.Provider value={api}>
			{children}
			<div
				aria-hidden={started}
				className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-black transition-opacity duration-700 ${started ? "opacity-0 pointer-events-none" : "opacity-100"
					}`}
			>
				{!pageReady ? (
					<>
						<div className="h-px w-48 bg-white/20">
							<div
								className="h-full bg-white transition-[width] duration-150"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<span className="text-xs text-white/60">
							Loading {progress}%
						</span>
					</>
				) : (
					<div
						ref={magneticZoneRef}
						className="magnetic-zone"
						style={{
							display: "grid",
							placeItems: "center",
							width: "min(100vw, 28rem)",
							height: "min(60vh, 20rem)",
							touchAction: "none",
						}}
					>
						<button
							ref={magneticBtnRef}
							type="button"
							className="magnetic-btn"
							onClick={() => setStarted(true)}
						>
							<span ref={magneticLabelRef}>Let's go</span>
						</button>
					</div>
				)}
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
					cursor: pointer;
					will-change: transform;
					transition: border-color 0.3s ease, color 0.3s ease;
				}

				.magnetic-btn span {
					position: relative;
					z-index: 2;
					pointer-events: none;
				}

				.magnetic-btn::before {
					content: "";
					position: absolute;
					inset: 0;
					background: #fff;
					transform: scaleY(0);
					transform-origin: bottom;
					transition: transform 0.4s ease;
					z-index: 1;
				}

				.magnetic-btn:hover {
					color: #0f0f0f;
					border-color: #fff;
				}

				.magnetic-btn:hover::before {
					transform: scaleY(1);
				}
			`}</style>
		</HomeLoadContext.Provider>
	);
}
