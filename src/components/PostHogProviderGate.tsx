"use client";

import { Suspense, type ReactNode } from "react";
import PostHogProvider from "@/components/PostHogProvider";

/**
 * Suspense boundary required because PostHog pageviews use useSearchParams.
 */
export default function PostHogProviderGate({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<Suspense fallback={null}>
			<PostHogProvider>{children}</PostHogProvider>
		</Suspense>
	);
}
