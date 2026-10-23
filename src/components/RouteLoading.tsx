import Image from "next/image";

const GATE_BG =
	"radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)";

type RouteLoadingProps = {
	/** When used as a fadeable overlay; omit for static loading.tsx shells. */
	visible?: boolean;
	className?: string;
};

/** Branded full-screen wait — same surface language as HomeGate. */
export default function RouteLoading({ visible = true, className = "" }: RouteLoadingProps) {
	return (
		<div
			role="status"
			aria-busy={visible}
			aria-live="polite"
			aria-label="Loading"
			className={`fixed inset-0 z-100 flex flex-col items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
				} ${className}`}
			style={{ background: GATE_BG }}
		>
			<Image
				src="/apple-touch-icon.png"
				alt=""
				width={72}
				height={72}
				priority
				unoptimized
				aria-hidden
				style={{ borderRadius: 12 }}
			/>
			<p
				className="m-0 mt-5 text-[11px] tracking-[0.22em] uppercase"
				style={{
					fontFamily: "var(--font-room-sans), system-ui, sans-serif",
					color: "rgba(244, 231, 204, 0.55)",
				}}
			>
				Loading
			</p>
		</div>
	);
}
