"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const GATE_BG =
	"radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)";

const MIN_VISIBLE_MS = 300;
const SAFETY_TIMEOUT_MS = 15_000;
const POLL_MS = 50;
const FADE_OUT_MS = 280;

const CLICK_HANDLER_KEY = "__himNavOverlayOnClick__" as const;
const LOCK_KEY = "__himNavOverlayLock__" as const;

type OverlayLock = {
	pending: boolean;
	opaque: boolean;
	mounted: boolean;
	destPath: string | null;
	shownAt: number;
	safetyTimer: number;
	fadeTimer: number;
	pollTimer: number;
};

function getLock(): OverlayLock {
	const w = window as Window & { [LOCK_KEY]?: OverlayLock };
	if (!w[LOCK_KEY]) {
		w[LOCK_KEY] = {
			pending: false,
			opaque: false,
			mounted: false,
			destPath: null,
			shownAt: 0,
			safetyTimer: 0,
			fadeTimer: 0,
			pollTimer: 0,
		};
	}
	return w[LOCK_KEY]!;
}

const syncListeners = new Set<() => void>();

function emitSync() {
	syncListeners.forEach((fn) => fn());
}

function isModifiedClick(event: MouseEvent) {
	return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function shouldHandleAnchor(anchor: HTMLAnchorElement, event: MouseEvent) {
	if (isModifiedClick(event)) return false;
	if (anchor.target && anchor.target !== "_self") return false;
	if (anchor.hasAttribute("download")) return false;

	const href = anchor.getAttribute("href");
	if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
		return false;
	}

	let url: URL;
	try {
		url = new URL(href, window.location.href);
	} catch {
		return false;
	}
	if (url.origin !== window.location.origin) return false;

	const next = `${url.pathname}${url.search}`;
	const current = `${window.location.pathname}${window.location.search}`;
	if (next === current) return false;
	return true;
}

function pageLooksStyledFor(pathname: string): boolean {
	if (pathname === "/collection" || pathname === "/collection/") {
		const hero = document.querySelector(".collection-hero");
		if (!(hero instanceof HTMLElement)) return false;
		const cs = getComputedStyle(hero);
		if (cs.position !== "relative" || hero.getBoundingClientRect().height < 280) {
			return false;
		}
		const imgs = Array.from(hero.querySelectorAll("img"));
		return imgs.some((img) => img.complete && img.naturalWidth > 64);
	}

	if (pathname.startsWith("/collection/")) {
		const main = document.querySelector(".pdp-main");
		if (!(main instanceof HTMLElement)) return false;
		return main.getBoundingClientRect().height > 200;
	}

	if (pathname === "/") {
		if (document.querySelector(".him-hero-video")) return true;
		const best = document.querySelector(".bestsellers-section");
		if (!(best instanceof HTMLElement)) return false;
		return best.getBoundingClientRect().height > 100;
	}

	if (pathname.startsWith("/cart")) {
		const page = document.querySelector(".cart-page");
		if (!(page instanceof HTMLElement)) return false;
		return page.getBoundingClientRect().height > 80;
	}

	if (pathname.startsWith("/wishlist")) {
		const page = document.querySelector(".wish-page");
		if (!(page instanceof HTMLElement)) return false;
		return page.getBoundingClientRect().height > 80;
	}

	const main = document.querySelector("main");
	if (!main) return false;
	if (main.querySelector(":scope > [aria-label='Loading']") && main.children.length <= 1) {
		return false;
	}
	return main.getBoundingClientRect().height > 40;
}

function showOverlay() {
	const lock = getLock();
	window.clearTimeout(lock.fadeTimer);
	lock.mounted = true;
	lock.opaque = true;
	emitSync();
}

function dismissOverlay() {
	const lock = getLock();
	lock.pending = false;
	lock.destPath = null;
	window.clearTimeout(lock.pollTimer);
	lock.pollTimer = 0;
	lock.opaque = false;
	emitSync();
	window.clearTimeout(lock.fadeTimer);
	lock.fadeTimer = window.setTimeout(() => {
		lock.mounted = false;
		emitSync();
	}, FADE_OUT_MS);
}

function startPolling(destPath: string) {
	const lock = getLock();
	window.clearTimeout(lock.pollTimer);

	const tick = () => {
		if (!lock.pending) return;
		if (performance.now() - lock.shownAt < MIN_VISIBLE_MS) {
			lock.pollTimer = window.setTimeout(tick, POLL_MS);
			return;
		}
		// Prefer clicked destination; fall back to current URL once it matches.
		const path =
			location.pathname === destPath || location.pathname.startsWith(destPath + "/")
				? location.pathname
				: destPath;
		if (pageLooksStyledFor(path) || pageLooksStyledFor(destPath)) {
			window.clearTimeout(lock.safetyTimer);
			dismissOverlay();
			return;
		}
		lock.pollTimer = window.setTimeout(tick, POLL_MS);
	};

	lock.pollTimer = window.setTimeout(tick, POLL_MS);
}

function onNavClick(event: MouseEvent) {
	if (event.defaultPrevented) return;
	const target = event.target;
	if (!(target instanceof Element)) return;
	if (target.closest("button, [role='button'], input, select, textarea, [data-no-route-loader]")) {
		return;
	}
	const anchor = target.closest("a");
	if (!(anchor instanceof HTMLAnchorElement)) return;
	if (anchor.hasAttribute("data-no-route-loader")) return;
	if (!shouldHandleAnchor(anchor, event)) return;

	let url: URL;
	try {
		url = new URL(anchor.href, window.location.href);
	} catch {
		return;
	}

	const lock = getLock();
	window.clearTimeout(lock.safetyTimer);
	window.clearTimeout(lock.pollTimer);
	lock.shownAt = performance.now();
	lock.destPath = url.pathname;
	lock.pending = true;
	showOverlay();
	startPolling(url.pathname);

	lock.safetyTimer = window.setTimeout(() => {
		if (lock.pending) dismissOverlay();
	}, SAFETY_TIMEOUT_MS);
}

function ensureClickListener() {
	const w = window as Window & {
		[CLICK_HANDLER_KEY]?: (event: MouseEvent) => void;
	};
	if (w[CLICK_HANDLER_KEY]) {
		document.removeEventListener("click", w[CLICK_HANDLER_KEY]!, true);
	}
	w[CLICK_HANDLER_KEY] = onNavClick;
	document.addEventListener("click", onNavClick, true);
}

/**
 * Full-screen branded veil for App Router client navigations.
 * Instant opaque cover; holds until destination CSS + hero image are ready.
 */
export default function NavigationOverlay() {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	const [opaque, setOpaque] = useState(false);

	useEffect(() => {
		ensureClickListener();
		const lock = getLock();
		const sync = () => {
			setMounted(lock.mounted);
			setOpaque(lock.opaque);
		};
		syncListeners.add(sync);
		sync();
		return () => {
			syncListeners.delete(sync);
		};
	}, []);

	// Keep polling after the URL lands (destination DOM appears then).
	useEffect(() => {
		const lock = getLock();
		if (lock.pending && lock.destPath) startPolling(lock.destPath);
	}, [pathname]);

	if (!mounted) return null;

	return (
		<div
			role="status"
			aria-busy={opaque}
			aria-live="polite"
			aria-label="Loading"
			data-him-nav-overlay=""
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 2147483000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: GATE_BG,
				opacity: opaque ? 1 : 0,
				transition: opaque ? "none" : `opacity ${FADE_OUT_MS}ms ease`,
				pointerEvents: opaque ? "auto" : "none",
			}}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src="/brand/him-loader.gif"
				alt=""
				width={160}
				height={284}
				aria-hidden
				draggable={false}
				style={{
					width: "min(160px, 28vw)",
					height: "auto",
					objectFit: "contain",
				}}
			/>
		</div>
	);
}
