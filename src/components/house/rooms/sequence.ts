import manifest from "./frameSequences.json";

export type SequenceInfo = { count: number; fps: number };

export const SEQUENCES: SequenceInfo[] = manifest;

const FETCH_CONCURRENCY = 8;
const DECODE_CONCURRENCY = 4;
const DECODE_ALL_CONCURRENCY = 8;
const DRAG_DECODE_CONCURRENCY = 12;
/** Ring size while warming a room that is not yet fully decoded. */
const CACHE_LIMIT = 64;
const PREFETCH_AHEAD = 32;
const PREFETCH_BEHIND = 8;
const FRAME_VERSION = 2;
/** How far to look for a stand-in while the full set is still decoding. */
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
	private decoding = new Map<number, Promise<void>>();
	private settled = 0;
	private token = 0;
	private loading = false;
	private decodingAll = false;
	private holdAll = false;
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

	/** Every frame blob is fetched (decode may still be in progress). */
	get ready() {
		return this.settled === this.count && this.blobs[0] !== null;
	}

	/** Every frame is decoded at native resolution and held in memory. */
	get fullyDecoded() {
		return this.count > 0 && this.bitmaps.size === this.count;
	}

	get decoded() {
		return this.bitmaps.size;
	}

	load() {
		if (this.loading || this.settled === this.count) {
			if (this.settled === this.count) this.decodeAll();
			return;
		}
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
					if (i === 0) void this.decode(0);
				} catch {
					if (token !== this.token) return;
				}
				this.settled++;
			}
		};

		void Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker)).then(
			() => {
				if (token !== this.token) return;
				this.loading = false;
				this.decodeAll();
			},
		);
	}

	/**
	 * Decode every fetched blob at native resolution and keep the full set.
	 * Safe to call repeatedly after trim() while blobs remain.
	 */
	decodeAll() {
		if (this.fullyDecoded || this.settled !== this.count) return;
		this.holdAll = true;
		this.cacheLimit = this.count;
		this.decodeLimit = DECODE_ALL_CONCURRENCY;
		if (this.decodingAll) return;
		this.decodingAll = true;
		const token = this.token;
		let next = 0;

		const worker = async () => {
			while (token === this.token && this.holdAll) {
				const i = next++;
				if (i >= this.count) return;
				await this.decode(i);
			}
		};

		void Promise.all(
			Array.from({ length: DECODE_ALL_CONCURRENCY }, worker),
		).then(() => {
			if (token === this.token) this.decodingAll = false;
		});
	}

	/** Raise decode budget and warm frames around the scrub point. */
	beginDrag(index: number) {
		this.dragging = true;
		if (this.fullyDecoded) return;
		this.decodeLimit = DRAG_DECODE_CONCURRENCY;
		this.prefetch(index, 1);
		this.prefetch(index, -1);
	}

	endDrag() {
		this.dragging = false;
		if (this.holdAll) this.decodeLimit = DECODE_ALL_CONCURRENCY;
		else this.decodeLimit = DECODE_CONCURRENCY;
	}

	/** Decode around `index`, biased in the direction the frames are moving. */
	prefetch(index: number, direction: number) {
		if (this.fullyDecoded) return;
		this.center = index;
		const forward = direction >= 0 ? 1 : -1;
		const ahead = Math.min(
			PREFETCH_AHEAD,
			Math.max(8, this.cacheLimit - PREFETCH_BEHIND - 1),
		);
		void this.decode(index);
		for (let k = 1; k <= ahead; k++) {
			if (this.decoding.size >= this.decodeLimit) return;
			void this.decode(this.wrap(index + forward * k));
			if (k <= PREFETCH_BEHIND)
				void this.decode(this.wrap(index - forward * k));
		}
	}

	has(index: number) {
		return this.bitmaps.has(this.wrap(index));
	}

	/**
	 * Exact frame when the full set is decoded. During warm-up, fall back to
	 * the nearest ready neighbour so the plate never goes blank.
	 */
	frame(index: number) {
		const i = this.wrap(index);
		const hit = this.bitmaps.get(i);
		if (hit) return hit;
		if (this.fullyDecoded) return null;
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
		this.holdAll = false;
		this.decodingAll = false;
		this.cacheLimit = CACHE_LIMIT;
		this.decodeLimit = DECODE_CONCURRENCY;
	}

	release() {
		this.token++;
		this.loading = false;
		this.decodingAll = false;
		this.trim();
		this.decoding.clear();
		this.blobs.fill(null);
		this.settled = 0;
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
		// Native resolution only — no resize (quality is non-negotiable).
		const job = createImageBitmap(blob)
			.then((bitmap) => {
				this.decoding.delete(i);
				if (token !== this.token) {
					bitmap.close();
					return;
				}
				this.bitmaps.set(i, bitmap);
				if (!this.holdAll) this.evict();
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
				const d = Math.abs(key - this.center);
				const distance = Math.min(d, this.count - d);
				if (distance > farthestDistance) {
					farthestDistance = distance;
					farthest = key;
				}
			}
			this.bitmaps.get(farthest)?.close();
			this.bitmaps.delete(farthest);
		}
	}
}
