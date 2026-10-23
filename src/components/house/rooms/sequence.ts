import manifest from "./frameSequences.json";

export type SequenceInfo = { count: number; fps: number };

export const SEQUENCES: SequenceInfo[] = manifest;

const FETCH_CONCURRENCY = 8;
const DECODE_CONCURRENCY = 4;
const DRAG_DECODE_CONCURRENCY = 8;
/** Hard cap on decoded ImageBitmaps — avoids ~664MB full-set decode. */
const CACHE_LIMIT = 16;
const PREFETCH_AHEAD = 10;
const PREFETCH_BEHIND = 4;
const FRAME_VERSION = 3;
/** How far to look for a stand-in while the ring is still warming. */
const NEAREST_RANGE = 8;

const framePath = (room: number, i: number) =>
	`/house/frames/window-${room + 1}/frame_${String(i + 1).padStart(4, "0")}.webp?v=${FRAME_VERSION}`;

export class FrameSequence {
	readonly count: number;
	readonly fps: number;
	onFirstFrame: (() => void) | null = null;

	private readonly room: number;
	private blobs: (Blob | null)[];
	private bitmaps = new Map<number, ImageBitmap>();
	private decoding = new Map<number, Promise<void>>();
	/** Successful blob fetches. */
	private settled = 0;
	/** Fetch attempts finished (success or failure). */
	private fetchDone = 0;
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

	/** Every frame fetch has finished (some blobs may be missing on error). */
	get ready() {
		return this.fetchDone === this.count;
	}

	/**
	 * Full-set decode is intentionally disabled (memory). Prefer ring + video fallback.
	 * Kept for call-site compatibility — always false.
	 */
	get fullyDecoded() {
		return false;
	}

	get decoded() {
		return this.bitmaps.size;
	}

	load() {
		if (this.loading || this.fetchDone === this.count) {
			if (this.fetchDone === this.count) this.warm(this.center);
			return;
		}
		this.loading = true;
		const token = ++this.token;
		let next = 0;

		const worker = async () => {
			while (token === this.token) {
				const i = next++;
				if (i >= this.count) return;
				if (this.blobs[i]) {
					this.fetchDone++;
					this.settled++;
					continue;
				}
				try {
					const res = await fetch(framePath(this.room, i));
					if (!res.ok) throw new Error(String(res.status));
					const blob = await res.blob();
					if (token !== this.token) return;
					this.blobs[i] = blob;
					this.settled++;
					// Decode around current scrub center — not always frame 0
					// (frame 0 as a stand-in causes flicker-to-start on mobile).
					if (i === this.center || (this.center === 0 && i === 0)) {
						void this.decode(i);
					}
				} catch {
					if (token !== this.token) return;
					// Failed fetches do not increment settled — only fetchDone.
				}
				this.fetchDone++;
			}
		};

		void Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker)).then(
			() => {
				if (token !== this.token) return;
				this.loading = false;
				this.warm(this.center);
			},
		);
	}

	/** Warm a ring of frames around `center` — never holds the full set. */
	decodeAll() {
		this.warm(this.center);
	}

	warm(index: number) {
		this.prefetch(index, 1);
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
		this.center = this.wrap(index);
		const forward = direction >= 0 ? 1 : -1;
		const ahead = Math.min(
			PREFETCH_AHEAD,
			Math.max(4, this.cacheLimit - PREFETCH_BEHIND - 1),
		);
		void this.decode(this.center);
		for (let k = 1; k <= ahead; k++) {
			if (this.decoding.size >= this.decodeLimit) return;
			void this.decode(this.wrap(this.center + forward * k));
			if (k <= PREFETCH_BEHIND)
				void this.decode(this.wrap(this.center - forward * k));
		}
	}

	has(index: number) {
		return this.bitmaps.has(this.wrap(index));
	}

	/** Exact decoded frame only — no nearest-neighbour (that flashed frame 0 while scrubbing). */
	exactFrame(index: number) {
		return this.bitmaps.get(this.wrap(index)) ?? null;
	}

	/**
	 * Exact frame when present. Nearest neighbour only within a short gap and
	 * never across more than half the loop (avoids jumping to frame 0).
	 */
	frame(index: number) {
		const i = this.wrap(index);
		const hit = this.bitmaps.get(i);
		if (hit) return hit;
		for (let k = 1; k <= NEAREST_RANGE; k++) {
			const a = this.bitmaps.get(this.wrap(i - k));
			if (a) return a;
			const b = this.bitmaps.get(this.wrap(i + k));
			if (b) return b;
		}
		return null;
	}

	/** Drop decoded frames but keep downloaded blobs. Bumps token to cancel in-flight decode. */
	trim() {
		this.token++;
		this.decoding.clear();
		for (const bitmap of this.bitmaps.values()) bitmap.close();
		this.bitmaps.clear();
		this.dragging = false;
		this.cacheLimit = CACHE_LIMIT;
		this.decodeLimit = DECODE_CONCURRENCY;
	}

	release() {
		this.token++;
		this.loading = false;
		this.trim();
		this.blobs.fill(null);
		this.settled = 0;
		this.fetchDone = 0;
	}

	private wrap(i: number) {
		return ((i % this.count) + this.count) % this.count;
	}

	private decode(i: number): Promise<void> {
		if (this.bitmaps.has(i)) return Promise.resolve();
		const pending = this.decoding.get(i);
		if (pending) return pending;
		const blob = this.blobs[i];
		if (!blob) return Promise.resolve();
		const token = this.token;
		const job = createImageBitmap(blob)
			.then((bitmap) => {
				this.decoding.delete(i);
				if (token !== this.token) {
					bitmap.close();
					return;
				}
				this.bitmaps.set(i, bitmap);
				this.evict();
				if (i === 0) this.onFirstFrame?.();
			})
			.catch(() => {
				this.decoding.delete(i);
			});
		this.decoding.set(i, job);
		return job;
	}

	private evict() {
		while (this.bitmaps.size > this.cacheLimit) {
			let farthest = -1;
			let farthestDistance = -1;
			for (const key of this.bitmaps.keys()) {
				// Never evict the scrub center — dropping it causes a blank/flash mid-drag.
				if (key === this.center) continue;
				const d = Math.abs(key - this.center);
				const distance = Math.min(d, this.count - d);
				if (distance > farthestDistance) {
					farthestDistance = distance;
					farthest = key;
				}
			}
			if (farthest < 0) break;
			this.bitmaps.get(farthest)?.close();
			this.bitmaps.delete(farthest);
		}
	}
}
