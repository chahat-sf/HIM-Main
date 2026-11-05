"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type ReactNode,
} from "react";
import RouteLoading from "@/components/RouteLoading";

const GATE_BG =
	"radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)";

const emptySubscribe = () => () => { };

type HomeLoadApi = {
	reportHeroProgress: (pct: number) => void;
	reportHeroReady: () => void;
	reportHouseReady: () => void;
};

const HomeLoadContext = createContext<HomeLoadApi | null>(null);

/**
 * Survives client navigations away from `/` and back.
 * Module flag resets on full reload; session key is cleared on reload so the
 * progress gate shows again after refresh.
 */
let homeGateEnteredThisLoad = false;
const GATE_ENTERED_KEY = "him-home-gate-entered";
/** Clear legacy key that used to skip the gate entirely after reload. */
const LEGACY_GATE_KEY = "him-home-gate-done";

// Run once when the client bundle loads — before any HomeGate paint.
if (typeof window !== "undefined") {
	try {
		sessionStorage.removeItem(LEGACY_GATE_KEY);
		const nav = performance.getEntriesByType("navigation")[0] as
			| PerformanceNavigationTiming
			| undefined;
		if (nav?.type === "reload") sessionStorage.removeItem(GATE_ENTERED_KEY);
	} catch {
		/* ignore */
	}
}

function markHomeGateEntered() {
	homeGateEnteredThisLoad = true;
	try {
		sessionStorage.setItem(GATE_ENTERED_KEY, "1");
	} catch {
		/* ignore */
	}
}

function isClientRevisit(): boolean {
	if (typeof window === "undefined") return false;
	if (homeGateEnteredThisLoad) return true;
	try {
		return sessionStorage.getItem(GATE_ENTERED_KEY) === "1";
	} catch {
		return false;
	}
}

export function hasEnteredHomeGate() {
	return isClientRevisit();
}

export function useHomeLoad() {
	return useContext(HomeLoadContext);
}

/** Gate unlocks on hero readiness; house warms later below the fold. */
function combinedProgress(heroPct: number, heroReady: boolean) {
	if (heroReady) return 100;
	return Math.min(100, Math.max(0, Math.round(heroPct)));
}

export default function HomeGate({ children }: { children: ReactNode }) {
	const [heroPct, setHeroPct] = useState(0);
	const [heroReady, setHeroReady] = useState(false);
	const [houseReady, setHouseReady] = useState(false);
	// Always false on SSR + first paint (hydration-safe).
	const [started, setStarted] = useState(false);
	// Next still SSRs `/` on client navigations — wait until client before choosing
	// progress vs GIF so the progress pill never paints on revisit.
	const gateReady = useSyncExternalStore(emptySubscribe, () => true, () => false);
	const revisit = gateReady && isClientRevisit();
	const [displayPct, setDisplayPct] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const magneticZoneRef = useRef<HTMLDivElement>(null);
	const magneticBtnRef = useRef<HTMLButtonElement>(null);
	const magneticLabelRef = useRef<HTMLSpanElement>(null);
	const progressFillRef = useRef<HTMLSpanElement>(null);
	const targetPctRef = useRef(0);
	const displayPctRef = useRef(0);
	const revealedRef = useRef(false);
	const startedRef = useRef(false);
	revealedRef.current = revealed;
	startedRef.current = started;

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

	const pageReady = heroReady;
	const progress = combinedProgress(heroPct, heroReady);
	// Keep reportHouseReady for Flythrough callers; it no longer blocks the gate.
	void houseReady;

	// Revisit: once hero is ready, open home and restart the hero video.
	useEffect(() => {
		if (!revisit || started || !pageReady) return;
		window.scrollTo(0, 0);
		setStarted(true);
		window.dispatchEvent(new Event("him-start"));
	}, [revisit, started, pageReady]);

	useEffect(() => {
		if (!gateReady || revisit) return;
		targetPctRef.current = pageReady ? 100 : progress;
	}, [progress, pageReady, revisit, gateReady]);

	// Smooth fill + label via rAF so discrete frame/house jumps do not restart CSS transitions.
	useEffect(() => {
		if (!gateReady || revisit || revealed) return;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let raf = 0;
		const tick = () => {
			const target = targetPctRef.current;
			const cur = displayPctRef.current;
			const next = reduce ? target : cur + (target - cur) * 0.1;
			const value = !reduce && Math.abs(target - next) < 0.2 ? target : next;
			displayPctRef.current = value;
			const fill = progressFillRef.current;
			if (fill) fill.style.transform = `scaleX(${value / 100})`;
			const rounded = Math.round(value);
			setDisplayPct((prev) => (prev === rounded ? prev : rounded));
			if (!revealedRef.current) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [revealed, revisit, gateReady]);

	useEffect(() => {
		if (!gateReady || revisit || !pageReady || revealed || started) return;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		// Wait until the smoothed bar is near 100%, then show the clickable welcome CTA.
		let timer = 0;
		const check = () => {
			if (displayPctRef.current < 99.5 && !reduce) {
				timer = window.setTimeout(check, 50);
				return;
			}
			// Short beat only — keep the button disabled as briefly as possible.
			timer = window.setTimeout(() => setRevealed(true), reduce ? 0 : 120);
		};
		timer = window.setTimeout(check, reduce ? 0 : 40);
		return () => window.clearTimeout(timer);
	}, [pageReady, revealed, started, revisit, gateReady]);

	// Soft-unlock: slow/dead network should not sit forever.
	useEffect(() => {
		if (!gateReady || pageReady || started) return;
		const timer = window.setTimeout(() => {
			setHeroReady(true);
			setHeroPct(100);
			setHouseReady(true);
		}, revisit ? 4000 : 8000);
		return () => window.clearTimeout(timer);
	}, [pageReady, started, revisit, gateReady]);

	// Reload often restores scroll mid-page behind the gate — pin to top until enter.
	useEffect(() => {
		const previous = history.scrollRestoration;
		try {
			history.scrollRestoration = "manual";
		} catch {
			/* unsupported */
		}
		const pinTop = () => {
			if (!startedRef.current) window.scrollTo(0, 0);
		};
		pinTop();
		// Safari / Chrome may restore scroll after first paint or on bfcache restore.
		window.addEventListener("pageshow", pinTop);
		const t1 = window.setTimeout(pinTop, 0);
		const t2 = window.setTimeout(pinTop, 100);
		return () => {
			window.removeEventListener("pageshow", pinTop);
			window.clearTimeout(t1);
			window.clearTimeout(t2);
			try {
				history.scrollRestoration = previous;
			} catch {
				/* unsupported */
			}
		};
	}, []);

	useEffect(() => {
		if (started) return;
		const html = document.documentElement;
		const previous = html.style.overflow;
		html.style.overflow = "hidden";
		window.scrollTo(0, 0);
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
			{!gateReady ? (
				<div
					aria-hidden
					className="fixed inset-0 z-1100!"
					style={{ background: GATE_BG }}
				/>
			) : revisit ? (
				<RouteLoading
					visible={!started}
					className="z-1100!"
				/>
			) : (
				<div
					aria-hidden={started}
					className={`fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${started ? "opacity-0 pointer-events-none" : "opacity-100"
						}`}
					style={{
						zIndex: 1100,
						background: GATE_BG,
					}}
				>
					<div
						ref={magneticZoneRef}
						className="magnetic-zone"
						style={{
							display: "grid",
							placeItems: "center",
							width: "min(100vw, 28rem)",
							height: revealed ? "min(60vh, 20rem)" : "auto",
							touchAction: "manipulation",
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
								if (!revealed || started) return;
								window.scrollTo(0, 0);
								markHomeGateEntered();
								setStarted(true);
								// Unlock house AudioContext on the same user gesture.
								window.dispatchEvent(new Event("him-start"));
							}}
						>
							{!revealed && (
								<span
									ref={progressFillRef}
									className="magnetic-btn__progress"
									style={{ transform: "scaleX(0)" }}
									aria-hidden
								/>
							)}
							<span className="magnetic-btn__hover" aria-hidden />
							<span
								ref={magneticLabelRef}
								className="magnetic-btn__label"
								style={{ display: "grid", placeItems: "center" }}
							>
								{/* Visible copy swaps; hidden sizer keeps loading pill = welcome button size. */}
								<span className="magnetic-btn__copy" style={{ gridArea: "1 / 1", whiteSpace: "nowrap" }}>
									{revealed ? "welcome to the HIM world" : `${displayPct}%`}
								</span>
								{!revealed && (
									<span
										className="magnetic-btn__sizer"
										aria-hidden
										style={{
											gridArea: "1 / 1",
											visibility: "hidden",
											whiteSpace: "nowrap",
										}}
									>
										welcome to the HIM world
									</span>
								)}
							</span>
						</button>
					</div>
				</div>
			)}
			<style jsx global>{`
				.magnetic-btn {
					--him-ivory: rgba(244, 231, 204, 0.94);
					--him-gold: rgba(214, 172, 106, 0.55);
					--him-gold-strong: rgba(255, 226, 172, 0.9);
					--him-ink: #0f0805;
					--him-surface: rgba(14, 8, 5, 0.88);

					position: relative;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					margin: 0;
					padding: 22px 42px;
					border: 1px solid var(--him-gold);
					border-radius: 999px;
					background: var(--him-surface);
					color: var(--him-ivory);
					font-family: var(--font-room-sans), system-ui, sans-serif;
					font-size: 15px;
					font-weight: 500;
					letter-spacing: 0.1em;
					text-transform: uppercase;
					overflow: hidden;
					/* scaleX progress breaks overflow+radius clipping; clip-path keeps the pill. */
					clip-path: inset(0 round 999px);
					isolation: isolate;
					-webkit-backdrop-filter: blur(12px);
					backdrop-filter: blur(12px);
					box-shadow:
						0 16px 40px rgba(0, 0, 0, 0.55),
						inset 0 1px 0 rgba(255, 226, 172, 0.08);
					transition:
						border-color 0.3s ease,
						color 0.3s ease,
						background 0.3s ease,
						box-shadow 0.3s ease;
				}

				.magnetic-btn--loading {
					cursor: default;
					pointer-events: none;
				}

				.magnetic-btn--ready {
					cursor: pointer;
					pointer-events: auto;
					will-change: transform;
				}

				.magnetic-btn__progress,
				.magnetic-btn__hover {
					position: absolute;
					inset: 0;
					border-radius: inherit;
					z-index: 1;
					pointer-events: none;
				}

				.magnetic-btn__progress {
					background: linear-gradient(
						90deg,
						rgba(214, 172, 106, 0.92),
						rgba(255, 226, 172, 0.95)
					);
					transform-origin: left center;
					will-change: transform;
				}

				.magnetic-btn__hover {
					background: var(--him-gold-strong);
					transform: scaleY(0);
					transform-origin: bottom;
					transition: transform 0.4s ease;
				}

				.magnetic-btn--loading .magnetic-btn__hover {
					display: none;
				}

				.magnetic-btn--ready:hover {
					color: var(--him-ink);
					border-color: var(--him-gold-strong);
					box-shadow:
						0 18px 44px rgba(0, 0, 0, 0.6),
						0 0 24px rgba(214, 172, 106, 0.22),
						inset 0 1px 0 rgba(255, 226, 172, 0.2);
				}

				.magnetic-btn--ready:hover .magnetic-btn__hover {
					transform: scaleY(1);
				}

				.magnetic-btn__label {
					position: relative;
					z-index: 2;
					display: grid;
					place-items: center;
					pointer-events: none;
					transition: color 0.3s ease;
				}

				.magnetic-btn__copy,
				.magnetic-btn__sizer {
					grid-area: 1 / 1;
					white-space: nowrap;
				}

				/* Invisible width lock — never shown, so no FOUC concat with %. */
				.magnetic-btn__sizer {
					visibility: hidden;
				}

				.magnetic-btn--loading .magnetic-btn__label {
					color: var(--him-ivory);
					mix-blend-mode: difference;
				}

				@media (prefers-reduced-motion: reduce) {
					.magnetic-btn,
					.magnetic-btn__hover {
						transition-duration: 0.01ms;
					}
				}
			`}</style>
		</HomeLoadContext.Provider>
	);
}
