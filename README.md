# HIM

Luxury menswear site built with Next.js 16, React 19, React Three Fiber, and GSAP.

## Scripts

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npm run typecheck  # TypeScript (no emit)
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Home (hero, house flythrough, products, lookbook) |
| `/house` | Standalone house experience |
| `/collection` | Product listing |
| `/collection/[slug]` | Product detail |

## Notes

- House idle LOD uses `public/house/window-2.mp4` (auto-spin); interact LOD uses `window-1.mp4` + `frames/window-1`.
- Homepage loads the R3F house via `next/dynamic` (`ssr: false`).
- CI runs typecheck, lint, and build on push/PR.
