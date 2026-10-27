"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
	productImageTiers,
	type ImageTier,
} from "@/lib/product-image";

const FADE_MS = 320;
const TIER_RANK: Record<ImageTier, number> = { low: 0, mid: 1, high: 2 };

type ProgressiveImageProps = Omit<ImageProps, "src" | "onLoad" | "placeholder"> & {
	src: string;
	/** Highest tier to load. Cards use "mid"; PDP uses "high". */
	maxTier?: ImageTier;
	/** Class on the outer wrapper (e.g. PDP active-frame styles). */
	wrapperClassName?: string;
};

function preload(url: string): Promise<void> {
	return new Promise((resolve) => {
		if (!url || typeof window === "undefined") {
			resolve();
			return;
		}
		const img = new window.Image();
		img.decoding = "async";
		img.onload = () => resolve();
		img.onerror = () => resolve();
		img.src = url;
	});
}

function hasObjectFitClass(className?: string): boolean {
	return Boolean(className && /\bobject-(cover|contain|fill|none|scale-down)\b/.test(className));
}

export default function ProgressiveImage({
	src,
	maxTier = "high",
	alt,
	className,
	style,
	priority,
	fill,
	sizes,
	quality,
	width,
	height,
	draggable,
	wrapperClassName,
	...rest
}: ProgressiveImageProps) {
	const tiers = useMemo(() => productImageTiers(src), [src]);
	const maxRank = TIER_RANK[maxTier];
	const hasMid = tiers.mid !== tiers.low;
	const hasHigh = tiers.high !== tiers.mid && tiers.high !== tiers.low;
	const progressive = hasMid || hasHigh;

	const [readyMid, setReadyMid] = useState(false);
	const [readyHigh, setReadyHigh] = useState(false);

	useEffect(() => {
		if (!progressive) return;
		let cancelled = false;
		setReadyMid(false);
		setReadyHigh(false);

		(async () => {
			if (maxRank >= TIER_RANK.mid && hasMid) {
				await preload(tiers.mid);
				if (cancelled) return;
				setReadyMid(true);
			} else if (maxRank >= TIER_RANK.mid) {
				setReadyMid(true);
			}
			if (maxRank >= TIER_RANK.high && hasHigh) {
				await preload(tiers.high);
				if (cancelled) return;
				setReadyHigh(true);
			} else if (maxRank >= TIER_RANK.high) {
				setReadyHigh(true);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [tiers.mid, tiers.high, maxRank, progressive, hasMid, hasHigh]);

	const showHigh = progressive && maxRank >= TIER_RANK.high && readyHigh && hasHigh;
	const showMid =
		progressive && maxRank >= TIER_RANK.mid && readyMid && hasMid && !showHigh;
	const showLow = !showMid && !showHigh;

	const shared = {
		alt: alt ?? "",
		sizes,
		quality,
		unoptimized: true as const,
		draggable,
		...rest,
	};

	const fitStyle = (forFill: boolean): CSSProperties => {
		if (style?.objectFit) return {};
		if (hasObjectFitClass(className)) return {};
		// Fill boxes (cards/thumbs) default to cover; intrinsic stack images leave fit alone.
		return forFill ? { objectFit: "cover" } : {};
	};

	const layerStyle = (
		visible: boolean,
		opts?: { blur?: boolean; absolute?: boolean; forFill?: boolean },
	): CSSProperties => {
		const next: CSSProperties = {
			...style,
			...fitStyle(Boolean(opts?.forFill)),
			filter: opts?.blur && visible ? "blur(8px)" : style?.filter,
			transform:
				opts?.blur && visible
					? style?.transform
						? `${style.transform} scale(1.06)`
						: "scale(1.06)"
					: style?.transform,
			transition:
				style?.transition ??
				`opacity ${FADE_MS}ms ease, filter ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
			pointerEvents: "none",
		};
		if (opts?.absolute) {
			next.position = "absolute";
			next.inset = 0;
			next.width = "100%";
			next.height = "100%";
		}
		if (!visible) {
			next.opacity = 0;
		} else if (style?.opacity !== undefined) {
			next.opacity = style.opacity;
		} else {
			delete next.opacity;
		}
		return next;
	};

	if (fill) {
		return (
			<span
				className={["progressive-image", wrapperClassName].filter(Boolean).join(" ")}
				style={{ position: "absolute", inset: 0 }}
			>
				<Image
					{...shared}
					src={progressive ? tiers.low : tiers.high}
					alt={showLow ? (alt ?? "") : ""}
					fill
					priority={priority}
					className={className}
					style={layerStyle(showLow, { blur: progressive, forFill: true })}
				/>
				{progressive && maxRank >= TIER_RANK.mid && hasMid ? (
					<Image
						{...shared}
						src={tiers.mid}
						alt={showMid ? (alt ?? "") : ""}
						fill
						priority={false}
						className={className}
						style={layerStyle(showMid, { forFill: true })}
					/>
				) : null}
				{progressive && maxRank >= TIER_RANK.high && hasHigh ? (
					<Image
						{...shared}
						src={tiers.high}
						alt={showHigh ? (alt ?? "") : ""}
						fill
						priority={false}
						className={className}
						style={layerStyle(showHigh, { forFill: true })}
					/>
				) : null}
				<style jsx>{`
					@media (prefers-reduced-motion: reduce) {
						.progressive-image :global(img) {
							transition: none !important;
							filter: none !important;
							transform: none !important;
						}
					}
				`}</style>
			</span>
		);
	}

	const w = typeof width === "number" ? width : Number(width) || 1200;
	const h = typeof height === "number" ? height : Number(height) || 1500;

	// Intrinsic stack: in-flow base sets natural height (height: auto).
	// Higher tiers overlay the same box with object-fit: cover — no forced AR.
	return (
		<span
			className={["progressive-image", "progressive-image--fixed", wrapperClassName]
				.filter(Boolean)
				.join(" ")}
			style={{
				position: "relative",
				display: "block",
				width: "100%",
				lineHeight: 0,
			}}
		>
			<Image
				{...shared}
				src={progressive ? tiers.low : tiers.high}
				alt={showLow ? (alt ?? "") : ""}
				width={w}
				height={h}
				priority={priority}
				className={className}
				style={{
					...layerStyle(showLow, { blur: progressive }),
					width: "100%",
					height: "auto",
					display: "block",
					// Ignore width/height attribute AR when it disagrees with the file
					// (PDP often passes 1200×1500 while masters are 2:3).
					aspectRatio: "auto",
					// Keep layout even when faded out so overlays have a sized box.
					visibility: showLow ? "visible" : "hidden",
					opacity: showLow
						? style?.opacity !== undefined
							? style.opacity
							: 1
						: 0,
				}}
			/>
			{progressive && maxRank >= TIER_RANK.mid && hasMid ? (
				<Image
					{...shared}
					src={tiers.mid}
					alt={showMid ? (alt ?? "") : ""}
					width={w}
					height={h}
					priority={false}
					className={className}
					style={{
						...layerStyle(showMid, { absolute: true, forFill: true }),
						objectFit: style?.objectFit ?? "cover",
					}}
				/>
			) : null}
			{progressive && maxRank >= TIER_RANK.high && hasHigh ? (
				<Image
					{...shared}
					src={tiers.high}
					alt={showHigh ? (alt ?? "") : ""}
					width={w}
					height={h}
					priority={false}
					className={className}
					style={{
						...layerStyle(showHigh, { absolute: true, forFill: true }),
						objectFit: style?.objectFit ?? "cover",
					}}
				/>
			) : null}
			<style jsx>{`
				@media (prefers-reduced-motion: reduce) {
					.progressive-image :global(img) {
						transition: none !important;
						filter: none !important;
						transform: none !important;
					}
				}
			`}</style>
		</span>
	);
}
