import HimLoaderGif from "@/components/HimLoaderGif";

type RouteLoadingProps = {
	/** When used as a fadeable overlay; omit for static loading.tsx shells. */
	visible?: boolean;
	className?: string;
};

const GATE_BG =
	"radial-gradient(ellipse 70% 55% at 50% 45%, #1a120c 0%, #0a0604 55%, #050302 100%)";

/** Branded full-screen wait — HIM loader GIF on HomeGate surface. */
export default function RouteLoading({ visible = true, className = "" }: RouteLoadingProps) {
	return (
		<div
			role="status"
			aria-busy={visible}
			aria-live="polite"
			aria-label="Loading"
			className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
				} ${className}`}
			style={{ background: GATE_BG }}
		>
			<HimLoaderGif active={visible} />
		</div>
	);
}
