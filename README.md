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

| Path                 | Description                                       |
| -------------------- | ------------------------------------------------- |
| `/`                  | Home (hero, house flythrough, products, lookbook) |
| `/house`             | Standalone house experience                       |
| `/collection`        | Product listing                                   |
| `/collection/[slug]` | Product detail                                    |

## Unreleased / Coming Soon gate

When `SITE_UNRELEASED=true`, public visitors only see `/coming-soon`. The full site stays deployable; flip the flag off to launch.

**Team preview** (sets a cookie and redirects to `/`):

```
https://<your-domain>/api/site-preview?secret=<SITE_PREVIEW_SECRET>
```

Example if the secret is `AAA`:

```
https://thehim.in/api/site-preview?secret=AAA
```

Set `NEXT_PUBLIC_SITE_URL` / `SITE_URL` to the public origin (e.g. `https://thehim.in`) so the unlock redirect does not use the nginx→`localhost:PORT` internal URL.

**Clear preview** (back to Coming Soon):

```
https://<your-domain>/api/site-preview?clear=1
```

Set `SITE_UNRELEASED` and `SITE_PREVIEW_SECRET` in the environment (see [`.env.example`](.env.example)).

## Analytics (PostHog hybrid)

Behavioral events go to **PostHog** (Cloud or self-hosted). Users/orders stay in **MySQL**.

1. Copy [`.env.example`](.env.example) → `.env.local`
2. Set `NEXT_PUBLIC_POSTHOG_KEY` (and `NEXT_PUBLIC_POSTHOG_HOST` for self-host / EU)
3. Omit the key to disable tracking (no-op)

See [docs/analytics-qa.md](docs/analytics-qa.md) for a local QA checklist.

Named events include: `signed_up`, `logged_in`, `logged_out`, `product_viewed`, `add_to_cart`, `remove_from_cart`, `cart_updated`, `wishlist_toggled`, `checkout_clicked`, `contact_submitted`, `newsletter_subscribed`, `search_used`. Future checkout should emit `order_completed`.

## Notes

- House idle LOD uses `public/house/window-2.mp4` (auto-spin); interact LOD uses `window-1.mp4` + `frames/window-1`.
- Homepage loads the R3F house via `next/dynamic` (`ssr: false`).
- CI runs typecheck, lint, and build on push/PR.
