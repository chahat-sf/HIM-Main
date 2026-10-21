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
const DEFAULT_ASPECT = 5084 / 2160;

const ROOM_VIDEOS = ROOMS.map((_, i) => `/house/window-${i + 1}.mp4?v=1021g`);

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
const INTERIOR_Z = -1.16;
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
};

const play: PlayState[] = ROOM_VIDEOS.map((_, i) => {
	const info = SEQUENCES[i] ?? { count: 1, fps: DEFAULT_FPS };
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
		sequence: new FrameSequence(i, info),
		usingFrames: false,
	};
});

export function frameCount(room: number) {
	return Math.max(1, play[room]?.count ?? 1);
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

export function beginDrag(room: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = true;
	item.vel = 0;
	item.target = item.pos;
	item.video?.pause();
	const index = Math.round(wrapFrame(item.pos, item.count)) % item.count;
	item.sequence.beginDrag(index);
}

export function scrub(room: number, pos: number) {
	const item = play[room];
	if (!item) return;
	if (!item.usingFrames) {
		item.pos = pos;
		item.target = pos;
		seekVideo(item, pos);
		return;
	}
	item.target = pos;
	const gap = frameDelta(item.pos, item.target, item.count);
	item.sequence.prefetch(
		Math.round(wrapFrame(item.pos, item.count)) % item.count,
		gap >= 0 ? 1 : -1,
	);
}

export function releaseDrag(room: number, velocity: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	// Keep walking to the last pointer target; flick only applies after we arrive.
	item.vel = Math.max(-260, Math.min(260, velocity));
	item.sequence.endDrag();
}

export function showCharacter(room: number, frame: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = false;
	item.pos = frame;
	item.target = frame;
	item.vel = item.fps;
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

		const sequence = item?.sequence;
		if (sequence) {
			sequence.onFirstFrame = announce;
			if (room === 0) sequence.load();
		}

		return () => {
			window.clearTimeout(readyFallback);
			if (sequence) {
				sequence.onFirstFrame = null;
				sequence.release();
			}
			if (item) item.usingFrames = false;
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

		const focused = nearestRoom(state.camera.position.x) === room;
		const near = Math.abs(state.camera.position.x - ROOMS[room].x) < BAY * 1.1;
		if (focused || near) sequence.load();
		else if (room !== 0) sequence.release();
		if (!focused) sequence.trim();
		if (focused && !sequence.ready) ensurePreload(video);

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

		if (sequence.ready && frameMap) {
			if (!item.usingFrames) {
				if (item.duration > 0 && video.readyState >= 1) {
					item.pos = video.currentTime * item.fps;
					item.target = item.pos;
				}
				item.pendingTime = null;
				item.usingFrames = true;
			}
			if (!video.paused) video.pause();

			const gap = frameDelta(item.pos, item.target, item.count);
			const catchingUp = Math.abs(gap) >= 0.5;

			if (item.dragging || catchingUp) {
				// Walk one displayed frame at a time so every pose is seen.
				const step = Math.sign(gap);
				const next = Math.round(wrapFrame(item.pos + step, item.count)) % item.count;
				sequence.prefetch(next, step);
				if (sequence.has(next)) {
					item.pos = next;
					directionRef.current = step;
				}
			} else if (!item.dragging) {
				if (reduceMotionCached) {
					item.vel = 0;
				} else {
					item.vel += (item.fps - item.vel) * (1 - Math.exp(-delta * 2.2));
					item.pos = wrapFrame(item.pos + item.vel * delta, item.count);
					item.target = item.pos;
				}
			}

			const index = Math.round(wrapFrame(item.pos, item.count)) % item.count;
			if (index !== lastIndexRef.current) {
				directionRef.current = frameDelta(lastIndexRef.current, index, item.count) >= 0 ? 1 : -1;
				lastIndexRef.current = index;
			}
			sequence.prefetch(index, directionRef.current);

			const bitmap = sequence.frame(index, item.dragging || catchingUp);
			const ctx = frameCtxRef.current;
			if (bitmap && ctx && bitmap !== drawnRef.current) {
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

			const shown = drawnRef.current ? frameMap : map;
			if (material.map !== shown) {
				material.map = shown;
				material.needsUpdate = true;
			}
			return;
		}

		if (material.map !== map) {
			material.map = map;
			material.needsUpdate = true;
		}

		if (item.dragging) {
			if (!video.paused) video.pause();
			if (!item.seekLock && !video.seeking) map.needsUpdate = true;
			return;
		}

		if (reduceMotionCached) {
			if (!video.paused) video.pause();
			item.vel = 0;
			map.needsUpdate = true;
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
