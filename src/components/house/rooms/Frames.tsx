"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	CanvasTexture,
	ClampToEdgeWrapping,
	LinearFilter,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	SRGBColorSpace,
	VideoTexture,
} from "three";
import { BAY, ROOMS } from "./poses";
import { FrameSequence, SEQUENCES } from "./sequence";

const DEFAULT_FPS = 24;
const DEFAULT_ASPECT = 2520 / 1080;

type LodMode = "idle" | "interact";

/** Idle = 2k auto-spin (video only). Interact = 1k drag scrub. */
const LOD = {
	idle: { video: "/house/window-2.mp4?v=1022c", asset: 1 },
	interact: { video: "/house/window-1.mp4?v=1022a", asset: 0 },
} as const;

/**
 * Picture uses the proven interior fit height. Mesh is larger so the window
 * never sees past the plate. During the dolly the plate eases toward the
 * glass so the opening stays filled, then sits at the interior gap again.
 */
const PLANE_Z = -4.12;
/** Proven interior FOV fit × slight overscan so the plate fills the view. */
const IMAGE_HEIGHT = 5.38 * 1.11;
const OPENING_HEIGHT = 2.5;
/** Legacy depth used only to size the oversized mesh. */
const WINDOW_Z = 0.35;
/** Facade opening — the camera crosses this on the way in. */
const FACADE_Z = 0.12;
const INTERIOR_Z = 0.05;
/** Camera-to-plate gap at the interior stop, where the shot already fills. */
const INTERIOR_DIST = INTERIOR_Z - PLANE_Z;
/** Closest the plate may come: nearer than this crops the shot inside the FOV. */
const FRUSTUM_DIST = (IMAGE_HEIGHT * 0.97) / (2 * Math.tan((72 * Math.PI) / 360));
const PLANE_HEIGHT = (OPENING_HEIGHT * (WINDOW_Z - PLANE_Z) / WINDOW_Z) * 1.08;

let reduceMotionCached =
	typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Touch / small screens: scrub with video only — WebP ring flickers to frame 0 on mobile. */
let videoScrubOnlyCached =
	typeof window !== "undefined" &&
	(window.matchMedia("(pointer: coarse)").matches ||
		window.matchMedia("(max-width: 768px)").matches);
if (typeof window !== "undefined") {
	const media = window.matchMedia("(prefers-reduced-motion: reduce)");
	media.addEventListener("change", () => {
		reduceMotionCached = media.matches;
	});
	const syncVideoScrub = () => {
		videoScrubOnlyCached =
			window.matchMedia("(pointer: coarse)").matches ||
			window.matchMedia("(max-width: 768px)").matches;
	};
	window.matchMedia("(pointer: coarse)").addEventListener("change", syncVideoScrub);
	window.matchMedia("(max-width: 768px)").addEventListener("change", syncVideoScrub);
}

function smoothstep(t: number) {
	const x = Math.min(1, Math.max(0, t));
	return x * x * (3 - 2 * x);
}

function coverPlaneZ(camZ: number) {
	const span = camZ - FACADE_Z;
	const cover = (IMAGE_HEIGHT * 0.97) / OPENING_HEIGHT;
	const restDist = camZ - PLANE_Z;
	// Through the glass, ease from the approach gap to the interior gap.
	// A hard switch here pops the plate forward.
	if (span <= 0) {
		const travel = FACADE_Z - INTERIOR_Z;
		const t = travel > 0 ? smoothstep(-span / travel) : 1;
		return camZ - (FRUSTUM_DIST + (INTERIOR_DIST - FRUSTUM_DIST) * t);
	}
	const holeDist = span * cover;
	const spanAtFrustum = FRUSTUM_DIST / cover;
	const dist = holeDist + (FRUSTUM_DIST - holeDist) * smoothstep((spanAtFrustum - span) / spanAtFrustum);
	return camZ - Math.min(dist, restDist);
}

function plateGeometry(aspect: number) {
	const planeWidth = PLANE_HEIGHT * aspect;
	const geo = new PlaneGeometry(planeWidth, PLANE_HEIGHT);
	const uv = geo.getAttribute("uv");
	const scale = PLANE_HEIGHT / IMAGE_HEIGHT;
	for (let i = 0; i < uv.count; i += 1) {
		uv.setXY(
			i,
			(uv.getX(i) - 0.5) * scale + 0.5,
			(uv.getY(i) - 0.5) * scale + 0.5,
		);
	}
	return geo;
}

type PlayState = {
	/** Frame currently shown. */
	pos: number;
	/** Frame the pointer wants; pos walks here one frame at a time. */
	target: number;
	vel: number;
	fps: number;
	count: number;
	dragging: boolean;
	duration: number;
	video: HTMLVideoElement | null;
	pendingTime: number | null;
	seekLock: boolean;
	sequence: FrameSequence;
	usingFrames: boolean;
	lodMode: LodMode;
};

function lodInfo(mode: LodMode) {
	const { asset } = LOD[mode];
	return SEQUENCES[asset] ?? { count: 1, fps: DEFAULT_FPS };
}

function makeSequence(mode: LodMode) {
	const { asset } = LOD[mode];
	return new FrameSequence(asset, lodInfo(mode));
}

const play: PlayState[] = ROOMS.map(() => {
	const info = lodInfo("idle");
	return {
		pos: 0,
		target: 0,
		fps: info.fps,
		vel: info.fps,
		count: info.count,
		dragging: false,
		duration: 0,
		video: null,
		pendingTime: null,
		seekLock: false,
		sequence: makeSequence("idle"),
		usingFrames: false,
		lodMode: "idle" as LodMode,
	};
});

export function frameCount(room: number) {
	return Math.max(1, play[room]?.count ?? 1);
}

export function isInteractMode(room = 0) {
	return play[room]?.lodMode === "interact";
}

function wrapFrame(pos: number, count: number) {
	return ((pos % count) + count) % count;
}

/** Shortest signed distance from `from` to `to` on a looping frame strip. */
function frameDelta(from: number, to: number, count: number) {
	let d = wrapFrame(to, count) - wrapFrame(from, count);
	if (d > count / 2) d -= count;
	if (d < -count / 2) d += count;
	return d;
}

export function roomPlay(room: number) {
	return play[room];
}

function wrapTime(seconds: number, duration: number) {
	if (duration <= 0) return 0;
	return ((seconds % duration) + duration) % duration;
}

function flushSeek(item: PlayState) {
	const video = item.video;
	if (!video || item.duration <= 0) return;
	if (item.seekLock || video.seeking) return;
	const t = item.pendingTime;
	if (t == null) return;
	if (Math.abs(video.currentTime - t) <= 0.5 / item.fps) {
		item.pendingTime = null;
		return;
	}
	item.seekLock = true;
	video.currentTime = t;
}

function seekVideo(item: PlayState, pos: number) {
	const video = item.video;
	if (!video || item.duration <= 0) return;
	const frame = Math.round(pos);
	item.pendingTime = wrapTime(frame / item.fps, item.duration);
	flushSeek(item);
}

let lodGeneration = 0;

function applyLod(item: PlayState, mode: LodMode) {
	if (item.lodMode === mode) return;

	// Map angle across LODs with different frame counts (idle 4K vs interact 1k).
	const progress = item.count > 0 ? wrapFrame(item.pos, item.count) / item.count : 0;
	item.dragging = false;
	item.lodMode = mode;
	item.usingFrames = false;
	item.pendingTime = null;
	item.seekLock = false;

	const onFirstFrame = item.sequence.onFirstFrame;
	item.sequence.release();
	item.sequence = makeSequence(mode);
	item.sequence.onFirstFrame = onFirstFrame;
	const info = lodInfo(mode);
	item.fps = info.fps;
	item.count = info.count;
	item.pos = progress * item.count;
	item.target = item.pos;
	item.vel = mode === "idle" ? item.fps : 0;

	const video = item.video;
	if (video) {
		const gen = ++lodGeneration;
		video.pause();
		video.src = LOD[mode].video;
		video.load();
		const onMeta = () => {
			video.removeEventListener("loadedmetadata", onMeta);
			if (gen !== lodGeneration) return;
			item.duration = Number.isFinite(video.duration) ? video.duration : 0;
			seekVideo(item, item.pos);
			if (mode === "idle") {
				void video.play().catch(() => { });
			} else {
				video.pause();
			}
		};
		video.addEventListener("loadedmetadata", onMeta);
		if (video.readyState >= 1) onMeta();
	}

	if (mode === "interact" && !videoScrubOnlyCached) {
		const index = Math.floor(wrapFrame(item.pos, item.count)) % item.count;
		item.sequence.load();
		item.sequence.warm(index);
	}
}

/**
 * Wait until the interact plate video can seek (avoids 5–7s jumpy scrub on cold load).
 * Resolves false if a newer LOD swap cancelled this wait.
 */
function waitInteractVideoReady(item: PlayState, gen: number): Promise<boolean> {
	const video = item.video;
	if (!video) return Promise.resolve(true);

	return new Promise((resolve) => {
		let settled = false;
		const finish = (ok: boolean) => {
			if (settled) return;
			settled = true;
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("canplay", onReady);
			video.removeEventListener("seeked", onSeeked);
			window.clearTimeout(timeout);
			resolve(ok);
		};

		const onSeeked = () => {
			if (gen !== lodGeneration) {
				finish(false);
				return;
			}
			item.seekLock = false;
			item.pendingTime = null;
			finish(true);
		};

		const trySeek = () => {
			if (gen !== lodGeneration) {
				finish(false);
				return;
			}
			if (video.readyState < 2) return;
			item.duration = Number.isFinite(video.duration) ? video.duration : 0;
			if (item.duration <= 0) return;

			const t = wrapTime(Math.round(item.pos) / item.fps, item.duration);
			if (Math.abs(video.currentTime - t) <= 0.05 && !video.seeking && video.readyState >= 2) {
				finish(true);
				return;
			}

			video.removeEventListener("seeked", onSeeked);
			video.addEventListener("seeked", onSeeked);
			item.seekLock = true;
			item.pendingTime = t;
			try {
				video.currentTime = t;
			} catch {
				finish(true);
			}
		};

		const onReady = () => trySeek();
		video.addEventListener("loadeddata", onReady);
		video.addEventListener("canplay", onReady);
		if (video.readyState >= 2) trySeek();

		// Never block the UI forever on a stalled network decode.
		const timeout = window.setTimeout(() => finish(gen === lodGeneration), 12000);
	});
}

/** Toggle 2k idle auto-spin vs 1k interactive drag. Resolves when interact video is seek-ready (or immediately when leaving). */
export function setInteractMode(enabled: boolean, room = 0): Promise<boolean> {
	const item = play[room];
	if (!item) return Promise.resolve(false);
	if (!enabled) {
		applyLod(item, "idle");
		return Promise.resolve(true);
	}
	if (item.lodMode !== "interact") applyLod(item, "interact");
	return waitInteractVideoReady(item, lodGeneration);
}

export function beginDrag(room: number) {
	const item = play[room];
	if (!item || item.lodMode !== "interact") return;
	item.dragging = true;
	item.vel = 0;
	item.target = item.pos;
	item.video?.pause();
	const index = Math.floor(wrapFrame(item.pos, item.count)) % item.count;
	item.sequence.beginDrag(index);
}

export function scrub(room: number, pos: number) {
	const item = play[room];
	if (!item || item.lodMode !== "interact") return;
	const gap = frameDelta(item.pos, pos, item.count);
	item.pos = pos;
	item.target = pos;
	// Mobile / video scrub path, or desktop while ring hasn't painted yet.
	if (videoScrubOnlyCached || !item.usingFrames) {
		seekVideo(item, pos);
		return;
	}
	item.sequence.prefetch(
		Math.floor(wrapFrame(item.pos, item.count)) % item.count,
		gap >= 0 ? 1 : -1,
	);
}

export function releaseDrag(room: number, _velocity: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	item.pos = item.target;
	// Interact mode never auto-spins; freeze on release.
	item.vel = item.lodMode === "interact" ? 0 : Math.max(-260, Math.min(260, _velocity));
	item.sequence.endDrag();
}

export function showCharacter(room: number, frame: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	item.pos = frame;
	item.target = frame;
	item.vel = item.lodMode === "idle" ? item.fps : 0;
	if (!item.usingFrames) seekVideo(item, frame);
}

function nearestRoom(cameraX: number) {
	let best = 0;
	let bestDistance = Infinity;
	for (let i = 0; i < ROOMS.length; i += 1) {
		const distance = Math.abs(cameraX - ROOMS[i].x);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = i;
		}
	}
	return best;
}

function makeVideo(src: string, preload: "auto" | "metadata") {
	const video = document.createElement("video");
	video.src = src;
	video.crossOrigin = "anonymous";
	video.loop = true;
	video.muted = true;
	video.playsInline = true;
	video.preload = preload;
	video.setAttribute("playsinline", "");
	video.setAttribute("muted", "");
	return video;
}

function ensurePreload(video: HTMLVideoElement) {
	if (video.preload === "auto") return;
	video.preload = "auto";
	video.load();
}

export function FramePlane({
	room,
	onFirstFrame,
}: {
	room: number;
	onFirstFrame?: () => void;
}) {
	const meshRef = useRef<Mesh>(null);
	const materialRef = useRef<MeshBasicMaterial>(null);
	const mapRef = useRef<VideoTexture | null>(null);
	const frameMapRef = useRef<CanvasTexture | null>(null);
	const frameCtxRef = useRef<CanvasRenderingContext2D | null>(null);
	const drawnRef = useRef<ImageBitmap | null>(null);
	const lastIndexRef = useRef(0);
	const directionRef = useRef(1);
	const aspectSetRef = useRef(false);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const announced = useRef(false);
	const onFirstFrameRef = useRef(onFirstFrame);
	onFirstFrameRef.current = onFirstFrame;
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const geometry = useMemo(() => plateGeometry(aspect), [aspect]);

	useEffect(() => {
		return () => {
			geometry.dispose();
		};
	}, [geometry]);

	useEffect(() => {
		const item = play[room];
		const src = LOD[item?.lodMode ?? "idle"].video;
		if (!src) return;
		const video = makeVideo(src, "auto");
		videoRef.current = video;
		if (item) item.video = video;

		const map = new VideoTexture(video);
		map.colorSpace = SRGBColorSpace;
		map.minFilter = LinearFilter;
		map.magFilter = LinearFilter;
		map.generateMipmaps = false;
		map.wrapS = ClampToEdgeWrapping;
		map.wrapT = ClampToEdgeWrapping;
		mapRef.current = map;

		const canvas = document.createElement("canvas");
		const frameMap = new CanvasTexture(canvas);
		frameMap.colorSpace = SRGBColorSpace;
		frameMap.minFilter = LinearFilter;
		frameMap.magFilter = LinearFilter;
		frameMap.generateMipmaps = false;
		frameMap.wrapS = ClampToEdgeWrapping;
		frameMap.wrapT = ClampToEdgeWrapping;
		frameMapRef.current = frameMap;
		frameCtxRef.current = canvas.getContext("2d", { alpha: false });
		drawnRef.current = null;
		aspectSetRef.current = false;

		const material = materialRef.current;
		if (material) {
			material.map = map;
			material.needsUpdate = true;
		}

		const onMeta = () => {
			if (item) {
				item.duration = Number.isFinite(video.duration) ? video.duration : 0;
				item.pos = video.currentTime * item.fps;
			}
			if (video.videoWidth > 0 && video.videoHeight > 0) {
				setAspect(video.videoWidth / video.videoHeight);
			}
		};

		const announce = () => {
			if (announced.current) return;
			announced.current = true;
			onFirstFrameRef.current?.();
		};

		const onReady = () => {
			void video.play().catch(() => { });
			announce();
		};

		const onSeeked = () => {
			if (item) {
				item.seekLock = false;
				flushSeek(item);
			}
			map.needsUpdate = true;
		};

		video.addEventListener("loadedmetadata", onMeta);
		video.addEventListener("loadeddata", onReady);
		video.addEventListener("canplay", onReady);
		video.addEventListener("seeked", onSeeked);
		if (video.readyState >= 1) onMeta();
		if (video.readyState >= 2) onReady();
		const readyFallback = window.setTimeout(announce, 2500);

		if (item) {
			item.sequence.onFirstFrame = announce;
			// Idle stays video-only — do not fetch/decode WebPs until interact.
			if (item.lodMode === "interact") item.sequence.load();
		}

		return () => {
			window.clearTimeout(readyFallback);
			if (item) {
				item.sequence.onFirstFrame = null;
				item.sequence.release();
				item.usingFrames = false;
			}
			frameMapRef.current = null;
			frameCtxRef.current = null;
			drawnRef.current = null;
			if (material?.map === frameMap) material.map = null;
			frameMap.dispose();
			video.removeEventListener("loadedmetadata", onMeta);
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("canplay", onReady);
			video.removeEventListener("seeked", onSeeked);
			video.pause();
			video.removeAttribute("src");
			video.load();
			if (item?.video === video) item.video = null;
			if (item) {
				item.pendingTime = null;
				item.seekLock = false;
			}
			videoRef.current = null;
			mapRef.current = null;
			if (material?.map === map) material.map = null;
			map.dispose();
		};
	}, [room]);

	useFrame((state, delta) => {
		const map = mapRef.current;
		const frameMap = frameMapRef.current;
		const mesh = meshRef.current;
		const video = videoRef.current;
		const item = play[room];
		const material = materialRef.current;
		if (!map || !mesh || !video || !item || !material) return;
		const sequence = item.sequence;
		const interact = item.lodMode === "interact";
		if (drawnRef.current && !interact) drawnRef.current = null;

		const focused = nearestRoom(state.camera.position.x) === room;
		const near = Math.abs(state.camera.position.x - ROOMS[room].x) < BAY * 1.1;
		const videoScrubOnly = videoScrubOnlyCached;
		// Desktop: warm WebP ring. Mobile: skip frames entirely (video scrub is stable).
		if (interact && !videoScrubOnly && (focused || near)) sequence.load();
		else if (interact && !focused) sequence.trim();
		if (focused && interact) ensurePreload(video);

		mesh.visible = focused;
		if (mesh.geometry !== geometry) mesh.geometry = geometry;
		mesh.position.z = focused ? coverPlaneZ(state.camera.position.z) : PLANE_Z;

		if (!focused) {
			if (!video.paused) video.pause();
			if (item.usingFrames) {
				item.usingFrames = false;
				drawnRef.current = null;
			}
			return;
		}

		// Interact desktop: exact ring frame only. Missing frame → hold last canvas or video.
		if (interact && !videoScrubOnly && frameMap) {
			if (!item.dragging) item.vel = 0;

			const index = Math.floor(wrapFrame(item.pos, item.count)) % item.count;
			if (index !== lastIndexRef.current) {
				directionRef.current = frameDelta(lastIndexRef.current, index, item.count) >= 0 ? 1 : -1;
				lastIndexRef.current = index;
			}
			sequence.prefetch(index, directionRef.current);

			const bitmap = sequence.exactFrame(index);
			const ctx = frameCtxRef.current;
			if (bitmap && ctx) {
				if (!video.paused) video.pause();
				item.usingFrames = true;
				item.pendingTime = null;
				if (bitmap !== drawnRef.current) {
					const canvas = ctx.canvas;
					if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
						canvas.width = bitmap.width;
						canvas.height = bitmap.height;
						if (!aspectSetRef.current) {
							aspectSetRef.current = true;
							setAspect(bitmap.width / bitmap.height);
						}
					}
					ctx.drawImage(bitmap, 0, 0);
					frameMap.needsUpdate = true;
					drawnRef.current = bitmap;
				}
				if (material.map !== frameMap) {
					material.map = frameMap;
					material.needsUpdate = true;
				}
				return;
			}

			// Hold last good canvas frame while the ring catches up — never flash frame 0.
			if (item.usingFrames && drawnRef.current) {
				if (!video.paused) video.pause();
				if (material.map !== frameMap) {
					material.map = frameMap;
					material.needsUpdate = true;
				}
				return;
			}
			item.usingFrames = false;
		}

		if (material.map !== map) {
			material.map = map;
			material.needsUpdate = true;
		}

		if (item.dragging) {
			if (!video.paused) video.pause();
			seekVideo(item, item.pos);
			if (!item.seekLock && !video.seeking) map.needsUpdate = true;
			return;
		}

		if (reduceMotionCached) {
			if (!video.paused) video.pause();
			item.vel = 0;
			map.needsUpdate = true;
			return;
		}

		// Interact (mobile / ring miss): video seek, no auto-spin.
		if (interact) {
			if (!video.paused) video.pause();
			item.vel = 0;
			seekVideo(item, item.pos);
			if (!item.seekLock && !video.seeking) map.needsUpdate = true;
			return;
		}

		const coasting = Math.abs(item.vel - item.fps) > 8;
		if (coasting) {
			if (!video.paused) video.pause();
			item.vel += (item.fps - item.vel) * (1 - Math.exp(-delta * 2.2));
			item.pos += item.vel * delta;
			if (item.duration > 0) {
				item.pos = wrapTime(item.pos / item.fps, item.duration) * item.fps;
			}
			seekVideo(item, item.pos);
			if (!item.seekLock && !video.seeking) map.needsUpdate = true;
			return;
		}

		item.vel = item.fps;
		if (video.paused) void video.play().catch(() => { });
		if (item.duration > 0) item.pos = video.currentTime * item.fps;
	});

	return (
		<mesh
			ref={meshRef}
			visible={room === 0}
			position={[0, 1.9, PLANE_Z]}
			geometry={geometry}
			raycast={() => null}
		>
			<meshBasicMaterial ref={materialRef} toneMapped={false} />
		</mesh>
	);
}
