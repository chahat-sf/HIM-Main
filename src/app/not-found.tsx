import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#1a120c] px-6 text-center text-[#f4e7cc]">
			<p className="m-0 text-xs tracking-[0.2em] uppercase opacity-70">404</p>
			<h1 className="m-0 text-2xl font-medium tracking-wide">Page not found</h1>
			<p className="m-0 max-w-sm text-sm opacity-70">
				That route is not part of HIM yet. Head home or browse the collection.
			</p>
			<div className="flex gap-4 text-sm tracking-wide uppercase">
				<Link href="/" className="underline underline-offset-4">
					Home
				</Link>
				<Link href="/collection" className="underline underline-offset-4">
					Collection
				</Link>
			</div>
		</main>
	);
}
