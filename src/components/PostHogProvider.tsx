"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import {
	capturePageview,
	identifyUser,
	initAnalytics,
	isAnalyticsEnabled,
	resetAnalyticsUser,
} from "@/lib/analytics";

function PostHogPageViews() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const search = searchParams?.toString() ?? "";

	useEffect(() => {
		if (!pathname || !isAnalyticsEnabled()) return;
		initAnalytics();
		const path = search ? `${pathname}?${search}` : pathname;
		capturePageview(path);
	}, [pathname, search]);

	return null;
}

function PostHogIdentity() {
	const { user, loading } = useSession();
	const hadUser = useRef(false);

	useEffect(() => {
		if (loading || !isAnalyticsEnabled()) return;
		initAnalytics();
		if (user) {
			identifyUser({
				id: user.id,
				email: user.email,
				fullName: user.fullName,
			});
			hadUser.current = true;
			return;
		}
		if (hadUser.current) {
			resetAnalyticsUser();
			hadUser.current = false;
		}
	}, [user, loading]);

	return null;
}

/**
 * Initializes PostHog once and bridges App Router pageviews + session identity.
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is unset.
 */
export default function PostHogProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		initAnalytics();
	}, []);

	return (
		<>
			<PostHogIdentity />
			<PostHogPageViews />
			{children}
		</>
	);
}
