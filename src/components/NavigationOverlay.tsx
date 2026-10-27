"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import RouteLoading from "./RouteLoading";

const MIN_VISIBLE_MS = 200;

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

function NavigationOverlayInner() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

	const [pending, setPending] = useState(false);
	const [visible, setVisible] = useState(false);
	const shownAtRef = useRef(0);
	const hideTimerRef = useRef(0);
	const pendingRef = useRef(false);
	const bootedRef = useRef(false);

	pendingRef.current = pending;

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			if (event.defaultPrevented) return;
			const target = event.target;
			if (!(target instanceof Element)) return;
			// Ignore clicks on buttons or elements marked to skip navigation loader
			if (target.closest("button, [role='button'], input, select, textarea, [data-no-route-loader]")) {
				return;
			}
			const anchor = target.closest("a");
			if (!(anchor instanceof HTMLAnchorElement)) return;
			if (anchor.hasAttribute("data-no-route-loader")) return;
			if (!shouldHandleAnchor(anchor, event)) return;

			window.clearTimeout(hideTimerRef.current);
			shownAtRef.current = performance.now();
			pendingRef.current = true;
			setPending(true);
			setVisible(true);

			// Safety fallback: if navigation is cancelled or blocked, auto-dismiss
			window.setTimeout(() => {
				if (pendingRef.current) {
					pendingRef.current = false;
					setPending(false);
					setVisible(false);
				}
			}, 4000);
		};

		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
	}, []);

	// Hide only after the URL actually changes (not when pending flips on).
	useEffect(() => {
		if (!bootedRef.current) {
			bootedRef.current = true;
			return;
		}
		if (!pendingRef.current) return;

		const elapsed = performance.now() - shownAtRef.current;
		const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

		window.clearTimeout(hideTimerRef.current);
		hideTimerRef.current = window.setTimeout(() => {
			pendingRef.current = false;
			setPending(false);
			setVisible(false);
		}, wait);

		return () => window.clearTimeout(hideTimerRef.current);
	}, [routeKey]);

	return <RouteLoading visible={visible} />;
}

/** Full-screen branded veil for App Router client navigations. */
export default function NavigationOverlay() {
	return (
		<Suspense fallback={null}>
			<NavigationOverlayInner />
		</Suspense>
	);
}
