export const BAY = 9.2;

export type Pose = {
	px: number;
	py: number;
	pz: number;
	tx: number;
	ty: number;
	tz: number;
	fov: number;
};

export type RoomId = "living" | "bedroom" | "study";

export type RoomDef = {
	id: RoomId;
	name: string;
	x: number;
};

export const ROOMS: RoomDef[] = [
	{ id: "living", name: "Living room", x: 0 },
	{ id: "bedroom", name: "Bedroom", x: BAY },
	{ id: "study", name: "Study", x: BAY * 2 },
];

export function roomPoses(x: number): {
	exterior: Pose;
	window: Pose;
	interior: Pose;
} {
	return {
		exterior: { px: x, py: 1.9, pz: 3.58, tx: x, ty: 1.9, tz: -4.6, fov: 72 },
		window: { px: x, py: 1.9, pz: 0.35, tx: x, ty: 1.9, tz: -4.6, fov: 72 },
		interior: {
			px: x,
			py: 1.9,
			pz: -0.42,
			tx: x,
			ty: 1.9,
			tz: -4.6,
			fov: 72,
		},
	};
}

export const INITIAL_POSE = roomPoses(ROOMS[0].x).exterior;
