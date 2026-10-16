"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ClampToEdgeWrapping,
	LinearFilter,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	SRGBColorSpace,
	VideoTexture,
} from "three";
import { ROOMS } from "./poses";

const FPS = 24;
const DEFAULT_ASPECT = 2212 / 936;

const ROOM_VIDEOS = [
	"/house/window-1.mp4?v=hq3",
	"/house/window-2.mp4",
	"/house/window-3.mp4",
] as const;

/**
 * Picture uses the proven interior fit height. Mesh is larger so the window
 * never sees past the plate. Baked letterbox is removed with texture
 * offset/repeat — not by enlarging cover — so the subject stays full-frame.
 *
 * During the dolly the window reveals more of a far plate than the picture
 * covers, so the plate eases toward the glass and keeps the opening filled.
 * Once the camera is through, it sits at the interior gap again.
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

/** Known letterbox on window-1 HQ (264px of 2160 each side). */
const WINDOW1_V0 = 264 / 2160;
const WINDOW1_VSPAN = 1 - 2 * WINDOW1_V0;

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
};

const play: PlayState[] = ROOM_VIDEOS.map(() => ({
	pos: 0,
	vel: FPS,
	dragging: false,
	duration: 0,
	video: null,
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

function seekVideo(item: PlayState, pos: number) {
	const video = item.video;
	if (!video || item.duration <= 0) return;
	const t = wrapTime(pos / FPS, item.duration);
	if (Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
}

export function beginDrag(room: number) {
	const item = play[room];
	if (!item) return;
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

function makeVideo(src: string) {
	const video = document.createElement("video");
	video.src = src;
	video.crossOrigin = "anonymous";
	video.loop = true;
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.setAttribute("playsinline", "");
	video.setAttribute("muted", "");
	return video;
}

function applyLetterbox(map: VideoTexture, v0: number, vSpan: number) {
	map.offset.set(0, v0);
	map.repeat.set(1, vSpan);
	map.wrapS = ClampToEdgeWrapping;
	map.wrapT = ClampToEdgeWrapping;
	map.needsUpdate = true;
}

export function FramePlane({
	room,
	onFirstFrame,
}: {
	room: number;
	onFirstFrame?: () => void;
}) {
	const gl = useThree((state) => state.gl);
	const meshRef = useRef<Mesh>(null);
	const materialRef = useRef<MeshBasicMaterial>(null);
	const mapRef = useRef<VideoTexture | null>(null);
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
		const video = makeVideo(src);
		videoRef.current = video;
		const item = play[room];
		if (item) item.video = video;

		const map = new VideoTexture(video);
		map.colorSpace = SRGBColorSpace;
		map.minFilter = LinearFilter;
		map.magFilter = LinearFilter;
		map.generateMipmaps = false;
		map.anisotropy = gl.capabilities.getMaxAnisotropy();
		// Crop baked letterbox without changing plate scale (avoids cover-zoom).
		if (room === 0) applyLetterbox(map, WINDOW1_V0, WINDOW1_VSPAN);
		else applyLetterbox(map, 0, 1);
		mapRef.current = map;

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
				const full = video.videoWidth / video.videoHeight;
				// Active picture aspect after letterbox crop.
				const vSpan = room === 0 ? WINDOW1_VSPAN : 1;
				setAspect(full / vSpan);
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

		video.addEventListener("loadedmetadata", onMeta);
		video.addEventListener("loadeddata", onReady);
		video.addEventListener("canplay", onReady);
		if (video.readyState >= 1) onMeta();
		if (video.readyState >= 2) onReady();
		const readyFallback = window.setTimeout(announce, 2500);

		return () => {
			window.clearTimeout(readyFallback);
			video.removeEventListener("loadedmetadata", onMeta);
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("canplay", onReady);
			video.pause();
			video.removeAttribute("src");
			video.load();
			if (item?.video === video) item.video = null;
			videoRef.current = null;
			mapRef.current = null;
			if (material?.map === map) material.map = null;
			map.dispose();
		};
	}, [room, gl]);

	useFrame((state, delta) => {
		const map = mapRef.current;
		const mesh = meshRef.current;
		const video = videoRef.current;
		const item = play[room];
		const material = materialRef.current;
		if (map && material && material.map !== map) {
			material.map = map;
			material.needsUpdate = true;
		}
		if (!map || !mesh || !video || !item) return;

		const focused = nearestRoom(state.camera.position.x) === room;
		mesh.visible = focused;
		if (mesh.geometry !== geometry) mesh.geometry = geometry;
		mesh.position.z = focused ? coverPlaneZ(state.camera.position.z) : PLANE_Z;

		const reduce = typeof window !== "undefined"
			&& window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (!focused) {
			if (!video.paused) video.pause();
			return;
		}

		if (item.dragging) {
			if (!video.paused) video.pause();
			map.needsUpdate = true;
			return;
		}

		if (reduce) {
			if (!video.paused) video.pause();
			item.vel = 0;
			map.needsUpdate = true;
			return;
		}

		const coasting = Math.abs(item.vel - FPS) > 8;
		if (coasting) {
			if (!video.paused) video.pause();
			item.vel += (FPS - item.vel) * (1 - Math.exp(-delta * 2.2));
			item.pos += item.vel * delta;
			if (item.duration > 0) {
				item.pos = wrapTime(item.pos / FPS, item.duration) * FPS;
			}
			seekVideo(item, item.pos);
			map.needsUpdate = true;
			return;
		}

		item.vel = FPS;
		if (video.paused) void video.play().catch(() => { });
		if (item.duration > 0) item.pos = video.currentTime * FPS;
		map.needsUpdate = true;
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
