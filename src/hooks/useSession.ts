"use client";

import {
	useSessionContext,
	type SessionUser,
} from "@/components/SessionProvider";

export type { SessionUser };

/**
 * Shared session — prefers SessionProvider when mounted (one /api/auth/me).
 */
export function useSession() {
	const ctx = useSessionContext();
	if (ctx) {
		return {
			user: ctx.user,
			loading: ctx.loading,
			isAuthenticated: ctx.isAuthenticated,
			refresh: ctx.refresh,
		};
	}

	return {
		user: null as SessionUser | null,
		loading: true,
		isAuthenticated: false,
		refresh: async () => {},
	};
}
