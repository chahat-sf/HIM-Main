"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function CreatorProgramAnalytics() {
	useEffect(() => {
		track("creator_program_viewed", { path: "/creator-program" });
	}, []);

	return null;
}
