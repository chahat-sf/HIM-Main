"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ClampToEdgeWrapping, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture } from "three";
import { ROOMS } from "./poses";

export const FRAME_COUNT = 337;
const FPS = 24;
const PLATE_ASPECT = 2212 / 936;

/**
 * The picture stays the size that fits the interior view. The mesh is
 * larger so the window opening cannot see past it on the way in or out.
 * UVs outside the picture clamp to the roof and floor.
 */
const PLANE_Z = -4.12;
const IMAGE_HEIGHT = 5.38 * 1.11;
const OPENING_HEIGHT = 2.5;
const WINDOW_Z = 0.35;
const PLANE_HEIGHT = (OPENING_HEIGHT * (WINDOW_Z - PLANE_Z) / WINDOW_Z) * 1.08;
const PLANE_WIDTH = PLANE_HEIGHT * PLATE_ASPECT;

function plateGeometry() {
	const geo = new PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
	const uv = geo.getAttribute("uv");
	const scale = PLANE_HEIGHT / IMAGE_HEIGHT;
	for (let i = 0; i < uv.count; i += 1) {
		uv.setXY(i, (uv.getX(i) - 0.5) * scale + 0.5, (uv.getY(i) - 0.5) * scale + 0.5);
	}
	return geo;
}


const images = new Array<HTMLImageElement | undefined>(FRAME_COUNT);
const ready = new Array<boolean>(FRAME_COUNT).fill(false);
const pending = new Set<number>();
const queue: number[] = [];
let decoding = 0;
let preloadStarted = false;
let uploadTick = -1;
let uploadBudget = 0;

const OLD_COUNT = 241;
export const FRAME_STARTS = [0, 209, 181].map((frame) => Math.round((frame / OLD_COUNT) * FRAME_COUNT));

const play: { pos: number; vel: number; dragging: boolean }[] = FRAME_STARTS.map((start) => ({
	pos: start,
	vel: FPS,
	dragging: false,
}));

export function roomPlay(room: number) {
	return play[room];
}

export function beginDrag(room: number) {
	const item = play[room];
	if (!item) return;
	item.dragging = true;
	item.vel = 0;
}

export function scrub(room: number, pos: number) {
	const item = play[room];
	if (!item) return;
	item.pos = pos;
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
	for (let k = 0; k < 30; k += 1) requestFrame(frame + k, true);
}

function wrap(index: number) {
	return ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
}

function pump() {
	while (decoding < 2 && queue.length > 0) {
		const i = queue.shift();
		if (i === undefined || images[i]) {
			pending.delete(i ?? -1);
			continue;
		}
		decoding += 1;
		const image = new Image();
		images[i] = image;
		image.decoding = "async";
		image.src = `/house/frames/${String(i).padStart(3, "0")}.jpg?v=2`;
		const done = () => {
			ready[i] = image.naturalWidth > 0;
			decoding -= 1;
			pump();
		};
		if (image.decode) image.decode().then(done, done);
		else image.onload = image.onerror = done;
	}
}

function requestFrame(index: number, urgent = false) {
	const i = wrap(index);
	if (images[i]) return;
	if (pending.has(i)) {
		if (!urgent) return;
		const at = queue.indexOf(i);
		if (at > 0) {
			queue.splice(at, 1);
			queue.unshift(i);
		}
		return;
	}
	pending.add(i);
	if (urgent) queue.unshift(i);
	else queue.push(i);
	pump();
}

function startPreload() {
	if (preloadStarted) return;
	preloadStarted = true;
	for (let i = 0; i < FRAME_COUNT; i += 1) requestFrame(i);
}

function takeUpload(frame: number) {
	if (uploadTick !== frame) {
		uploadTick = frame;
		uploadBudget = 1;
	}
	if (uploadBudget <= 0) return false;
	uploadBudget -= 1;
	return true;
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

function nearestReady(index: number) {
	const i = wrap(index);
	if (ready[i]) return i;
	for (let d = 1; d <= 10; d += 1) {
		const previous = wrap(i - d);
		const next = wrap(i + d);
		if (ready[previous]) return previous;
		if (ready[next]) return next;
	}
	return -1;
}

export function FramePlane({
	start,
	room,
	onFirstFrame,
}: {
	start: number;
	room: number;
	onFirstFrame?: () => void;
}) {
	const meshRef = useRef<Mesh>(null);
	const materialRef = useRef<MeshBasicMaterial>(null);
	const mapRef = useRef<Texture | null>(null);
	const geometry = useMemo(() => plateGeometry(), []);
	const shown = useRef(-1);
	const uploadedAt = useRef(0);
	const announced = useRef(false);

	useEffect(() => {
		const map = new Texture();
		map.colorSpace = SRGBColorSpace;
		map.minFilter = LinearFilter;
		map.magFilter = LinearFilter;
		map.generateMipmaps = false;
		map.wrapS = ClampToEdgeWrapping;
		map.wrapT = ClampToEdgeWrapping;
		mapRef.current = map;
		const material = materialRef.current;
		if (material) {
			material.map = map;
			material.needsUpdate = true;
		}
		for (let k = 0; k < FPS; k += 1) requestFrame(start + k, true);
		startPreload();
		return () => {
			mapRef.current = null;
			if (material?.map === map) material.map = null;
			map.dispose();
			geometry.dispose();
		};
	}, [start, geometry]);

	useFrame((state, delta) => {
		const map = mapRef.current;
		const mesh = meshRef.current;
		if (!map || !mesh) return;
		const item = play[room];
		const focused = nearestRoom(state.camera.position.x) === room;
		mesh.visible = focused;
		if (item && !item.dragging) {
			const target = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : FPS;
			item.vel += (target - item.vel) * (1 - Math.exp(-delta * 2.2));
			item.pos += item.vel * delta;
		}
		const index = Math.floor(item?.pos ?? start);
		for (let k = 0; k <= 3; k += 1) requestFrame(index + k, true);
		const frame = nearestReady(index);
		if (frame < 0 || frame === shown.current) return;
		const image = images[frame];
		if (!image) return;
		if (!focused && state.clock.elapsedTime - uploadedAt.current < 0.4) return;
		if (!takeUpload(state.gl.info.render.frame)) return;
		map.image = image;
		map.needsUpdate = true;
		shown.current = frame;
		uploadedAt.current = state.clock.elapsedTime;
		if (!announced.current && onFirstFrame) {
			announced.current = true;
			onFirstFrame();
		}
	});

	return (
		<mesh ref={meshRef} visible={room === 0} position={[0, 1.9, PLANE_Z]} raycast={() => null}>
			<primitive object={geometry} attach="geometry" />
			<meshBasicMaterial ref={materialRef} toneMapped={false} />
		</mesh>
	);
}
