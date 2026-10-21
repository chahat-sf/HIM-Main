import manifest from "./frameSequences.json";

export type SequenceInfo = { count: number; fps: number };

export const SEQUENCES: SequenceInfo[] = manifest;

const FETCH_CONCURRENCY = 8;
const DECODE_CONCURRENCY = 4;
const DRAG_DECODE_CONCURRENCY = 8;
/** Decoded 1920px frames are ~6MB each; the ring keeps memory near the hero's budget. */
const CACHE_LIMIT = 64;
/** Native 5K frames are ~44MB decoded; still wide enough for a fast scrub. */
const LARGE_CACHE_LIMIT = 48;
const LARGE_FRAME_PIXELS = 4_000_000;
const PREFETCH_AHEAD = 32;
const PREFETCH_BEHIND = 8;
const FRAME_VERSION = 2;
/** How far to look for a stand-in when the exact frame is still decoding. */
const NEAREST_RANGE = 12;

const framePath = (room: number, i: number) =>
	`/house/frames/window-${room + 1}/frame_${String(i + 1).padStart(4, "0")}.webp?v=${FRAME_VERSION}`;

export class FrameSequence {
	readonly count: number;
	readonly fps: number;
	onFirstFrame: (() => void) | null = null;

	private readonly room: number;
	private blobs: (Blob | null)[];
	private bitmaps = new Map<number, ImageBitmap>();
	private decoding = new Set<number>();
	private settled = 0;
	private token = 0;
	private loading = false;
	private center = 0;
	private cacheLimit = CACHE_LIMIT;
	private decodeLimit = DECODE_CONCURRENCY;
	private dragging = false;

	constructor(room: number, info: SequenceInfo) {
		this.room = room;
		this.count = info.count;
		this.fps = info.fps;
		this.blobs = Array(info.count).fill(null);
	}

	/** Every frame is fetched and the first one decodes. */
	get ready() {
		return this.settled === this.count && this.blobs[0] !== null;
	}

	load() {
		if (this.loading || this.settled === this.count) return;
		this.loading = true;
		const token = ++this.token;
		let next = 0;

		const worker = async () => {
			while (token === this.token) {
				const i = next++;
				if (i >= this.count) return;
				if (this.blobs[i]) continue;
				try {
					const res = await fetch(framePath(this.room, i));
					if (!res.ok) throw new Error(String(res.status));
					const blob = await res.blob();
					if (token !== this.token) return;
					this.blobs[i] = blob;
					if (i === 0) this.decode(0);
				} catch {
					if (token !== this.token) return;
				}
				this.settled++;
			}
		};

		void Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker)).then(
			() => {
				if (token === this.token) this.loading = false;
			},
		);
	}

	/** Raise decode budget and warm frames around the scrub point. */
	beginDrag(index: number) {
		this.dragging = true;
		this.decodeLimit = DRAG_DECODE_CONCURRENCY;
		this.prefetch(index, 1);
		this.prefetch(index, -1);
	}

	endDrag() {
		this.dragging = false;
		this.decodeLimit = DECODE_CONCURRENCY;
	}

	/** Decode around `index`, biased in the direction the frames are moving. */
	prefetch(index: number, direction: number) {
		this.center = index;
		const forward = direction >= 0 ? 1 : -1;
		const ahead = Math.min(
			PREFETCH_AHEAD,
			Math.max(8, this.cacheLimit - PREFETCH_BEHIND - 1),
		);
		this.decode(index);
		for (let k = 1; k <= ahead; k++) {
			if (this.decoding.size >= this.decodeLimit) return;
			this.decode(this.wrap(index + forward * k));
			if (k <= PREFETCH_BEHIND) this.decode(this.wrap(index - forward * k));
		}
	}

	has(index: number) {
		return this.bitmaps.has(this.wrap(index));
	}

	/**
	 * Exact frame if decoded. When `exact` is set (scrub catch-up), don't jump
	 * to a neighbour — hold the last painted frame until this one is ready.
	 */
	frame(index: number, exact = false) {
		const i = this.wrap(index);
		const hit = this.bitmaps.get(i);
		if (hit) return hit;
		if (exact || this.dragging) return null;
		for (let k = 1; k <= NEAREST_RANGE; k++) {
			const a = this.bitmaps.get(this.wrap(i - k));
			if (a) return a;
			const b = this.bitmaps.get(this.wrap(i + k));
			if (b) return b;
		}
		return null;
	}

	/** Drop decoded frames but keep downloaded data for a quick return. */
	trim() {
		for (const bitmap of this.bitmaps.values()) bitmap.close();
		this.bitmaps.clear();
		this.dragging = false;
		this.decodeLimit = DECODE_CONCURRENCY;
	}

	release() {
		this.token++;
		this.loading = false;
		this.trim();
		this.decoding.clear();
		this.blobs.fill(null);
		this.settled = 0;
	}

	private wrap(i: number) {
		return ((i % this.count) + this.count) % this.count;
	}

	private decode(i: number) {
		if (this.bitmaps.has(i) || this.decoding.has(i)) return;
		if (this.decoding.size >= this.decodeLimit) return;
		const blob = this.blobs[i];
		if (!blob) return;
		const token = this.token;
		this.decoding.add(i);
		createImageBitmap(blob)
			.then((bitmap) => {
				this.decoding.delete(i);
				if (token !== this.token) {
					bitmap.close();
					return;
				}
				if (bitmap.width * bitmap.height >= LARGE_FRAME_PIXELS) {
					this.cacheLimit = LARGE_CACHE_LIMIT;
				}
				this.bitmaps.set(i, bitmap);
				this.evict();
				if (i === 0) this.onFirstFrame?.();
			})
			.catch(() => {
				this.decoding.delete(i);
			});
	}

	private evict() {
		while (this.bitmaps.size > this.cacheLimit) {
			let farthest = -1;
			let farthestDistance = -1;
			for (const i of this.bitmaps.keys()) {
				const d = Math.abs(i - this.center);
				const distance = Math.min(d, this.count - d);
				if (distance > farthestDistance) {
					farthestDistance = distance;
					farthest = i;
				}
			}
			this.bitmaps.get(farthest)?.close();
			this.bitmaps.delete(farthest);
		}
	}
}
