"use client";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#1a120c] px-6 text-center text-[#f4e7cc]">
			<h1 className="m-0 text-2xl font-medium tracking-wide">Something went wrong</h1>
			<p className="m-0 max-w-sm text-sm opacity-70">
				{error.message || "An unexpected error occurred."}
			</p>
			<button
				type="button"
				onClick={reset}
				className="rounded-full border border-[rgba(214,172,106,0.55)] bg-[rgba(14,8,5,0.88)] px-5 py-2.5 text-xs tracking-[0.12em] uppercase"
			>
				Try again
			</button>
		</main>
	);
}
