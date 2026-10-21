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

const FPS = 24;
const DEFAULT_ASPECT = 2212 / 936;

const ROOM_VIDEOS = ROOMS.map((_, i) => `/house/window-${i + 1}.mp4?v=1021`);

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
const INTERIOR_Z = -0.42;
/** Camera-to-plate gap at the interior stop, where the shot already fills. */
const INTERIOR_DIST = INTERIOR_Z - PLANE_Z;
/** Closest the plate may come: nearer than this crops the shot inside the FOV. */
const FRUSTUM_DIST = (IMAGE_HEIGHT * 0.97) / (2 * Math.tan((72 * Math.PI) / 360));
const PLANE_HEIGHT = (OPENING_HEIGHT * (WINDOW_Z - PLANE_Z) / WINDOW_Z) * 1.08;

let reduceMotionCached =
	typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (typeof window !== "undefined") {
	const media = window.matchMedia("(prefers-reduced-motion: reduce)");
	media.addEventListener("change", () => {
		reduceMotionCached = media.matches;
	});
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
	pos: number;
	vel: number;
	dragging: boolean;
	duration: number;
	video: HTMLVideoElement | null;
	pendingTime: number | null;
	captureFrame: (() => void) | null;
};

const play: PlayState[] = ROOM_VIDEOS.map(() => ({
	pos: 0,
	vel: FPS,
	dragging: false,
	duration: 0,
	video: null,
	pendingTime: null,
	captureFrame: null,
}));

export function frameCount(room: number) {
	const duration = play[room]?.duration ?? 0;
	return Math.max(1, Math.round(duration * FPS));
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
	if (video.seeking) return;
	const t = item.pendingTime;
	if (t == null) return;
	if (Math.abs(video.currentTime - t) <= 1 / FPS) {
		item.pendingTime = null;
		return;
	}
	item.captureFrame?.();
	video.currentTime = t;
}

function seekVideo(item: PlayState, pos: number) {
	const video = item.video;
	if (!video || item.duration <= 0) return;
	item.pendingTime = wrapTime(pos / FPS, item.duration);
	flushSeek(item);
}

export function beginDrag(room: number) {
	const item = play[room];
	if (!item) return;
	item.captureFrame?.();
	item.dragging = true;
	item.vel = 0;
	item.video?.pause();
}

export function scrub(room: number, pos: number) {
	const item = play[room];
	if (!item) return;
	item.pos = pos;
	seekVideo(item, pos);
}

export function releaseDrag(room: number, velocity: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	item.vel = Math.max(-260, Math.min(260, velocity));
}

export function showCharacter(room: number, frame: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	item.pos = frame;
	item.vel = FPS;
	seekVideo(item, frame);
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
	const freezeMapRef = useRef<CanvasTexture | null>(null);
	const freezeCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
		const src = ROOM_VIDEOS[room];
		if (!src) return;
		const video = makeVideo(src, room === 0 ? "auto" : "metadata");
		videoRef.current = video;
		const item = play[room];
		if (item) item.video = video;

		const map = new VideoTexture(video);
		map.colorSpace = SRGBColorSpace;
		map.minFilter = LinearFilter;
		map.magFilter = LinearFilter;
		map.generateMipmaps = false;
		map.wrapS = ClampToEdgeWrapping;
		map.wrapT = ClampToEdgeWrapping;
		mapRef.current = map;

		const freezeCanvas = document.createElement("canvas");
		freezeCanvasRef.current = freezeCanvas;
		const freezeMap = new CanvasTexture(freezeCanvas);
		freezeMap.colorSpace = SRGBColorSpace;
		freezeMap.minFilter = LinearFilter;
		freezeMap.magFilter = LinearFilter;
		freezeMap.generateMipmaps = false;
		freezeMap.wrapS = ClampToEdgeWrapping;
		freezeMap.wrapT = ClampToEdgeWrapping;
		freezeMapRef.current = freezeMap;

		const captureFrame = () => {
			if (video.readyState < 2 || video.videoWidth === 0) return;
			if (freezeCanvas.width !== video.videoWidth || freezeCanvas.height !== video.videoHeight) {
				freezeCanvas.width = video.videoWidth;
				freezeCanvas.height = video.videoHeight;
			}
			const ctx = freezeCanvas.getContext("2d", { alpha: false });
			if (!ctx) return;
			ctx.drawImage(video, 0, 0);
			freezeMap.needsUpdate = true;
		};
		if (item) item.captureFrame = captureFrame;

		const material = materialRef.current;
		if (material) {
			material.map = map;
			material.needsUpdate = true;
		}

		const onMeta = () => {
			if (item) {
				item.duration = Number.isFinite(video.duration) ? video.duration : 0;
				item.pos = video.currentTime * FPS;
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
			captureFrame();
			void video.play().catch(() => { });
			announce();
		};

		const onSeeked = () => {
			captureFrame();
			if (item) flushSeek(item);
		};

		video.addEventListener("loadedmetadata", onMeta);
		video.addEventListener("loadeddata", onReady);
		video.addEventListener("canplay", onReady);
		video.addEventListener("seeked", onSeeked);
		if (video.readyState >= 1) onMeta();
		if (video.readyState >= 2) onReady();
		const readyFallback = window.setTimeout(announce, 2500);

		return () => {
			window.clearTimeout(readyFallback);
			video.removeEventListener("loadedmetadata", onMeta);
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("canplay", onReady);
			video.removeEventListener("seeked", onSeeked);
			video.pause();
			video.removeAttribute("src");
			video.load();
			if (item?.video === video) item.video = null;
			if (item?.captureFrame === captureFrame) item.captureFrame = null;
			videoRef.current = null;
			mapRef.current = null;
			freezeMapRef.current = null;
			freezeCanvasRef.current = null;
			if (material?.map === map || material?.map === freezeMap) material.map = null;
			map.dispose();
			freezeMap.dispose();
		};
	}, [room]);

	useFrame((state, delta) => {
		const map = mapRef.current;
		const freezeMap = freezeMapRef.current;
		const mesh = meshRef.current;
		const video = videoRef.current;
		const item = play[room];
		const material = materialRef.current;
		if (!map || !mesh || !video || !item || !material) return;

		const focused = nearestRoom(state.camera.position.x) === room;
		const near = Math.abs(state.camera.position.x - ROOMS[room].x) < BAY * 1.1;
		if (focused || near) ensurePreload(video);

		mesh.visible = focused;
		if (mesh.geometry !== geometry) mesh.geometry = geometry;
		mesh.position.z = focused ? coverPlaneZ(state.camera.position.z) : PLANE_Z;

		if (!focused) {
			if (!video.paused) video.pause();
			return;
		}

		const coasting = !item.dragging && Math.abs(item.vel - FPS) > 8;
		const freeze = item.dragging || video.seeking || coasting;
		const nextMap = freeze && freezeMap && freezeMap.image.width > 0 ? freezeMap : map;
		if (material.map !== nextMap) {
			material.map = nextMap;
			material.needsUpdate = true;
		}

		if (item.dragging) {
			if (!video.paused) video.pause();
			return;
		}

		if (reduceMotionCached) {
			if (!video.paused) video.pause();
			item.vel = 0;
			return;
		}

		if (coasting) {
			if (!video.paused) video.pause();
			item.vel += (FPS - item.vel) * (1 - Math.exp(-delta * 2.2));
			item.pos += item.vel * delta;
			if (item.duration > 0) {
				item.pos = wrapTime(item.pos / FPS, item.duration) * FPS;
			}
			seekVideo(item, item.pos);
			return;
		}

		item.vel = FPS;
		if (video.paused) void video.play().catch(() => { });
		if (item.duration > 0) item.pos = video.currentTime * FPS;
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
