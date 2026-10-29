# PostHog analytics QA checklist

## Setup

1. Create a PostHog project (Cloud free tier is fine for local).
2. In `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

3. Restart `npm run dev`.
4. Open PostHog → **Activity** / **Live events**.

## Dedupe (local)

Strict Mode can remount effects twice in `next dev`. Guards skip:

- repeat `$pageview` for the same path
- repeat `product_viewed` for the same slug within ~1s
- repeat `identify` / `$set` when id+email+name are unchanged

Expect **one** of each per real navigation / PDP open / login.

## Smoke checks

| Step                      | Expected event / person                             |
| ------------------------- | --------------------------------------------------- |
| Load any page             | `$pageview` with `path`                             |
| Click links/buttons       | Autocapture click events                            |
| Open a PDP                | `product_viewed` (slug, name, price)                |
| Add to cart               | `add_to_cart`                                       |
| Change qty / remove       | `cart_updated` / `remove_from_cart`                 |
| Toggle wishlist           | `wishlist_toggled` (`added` true/false)             |
| Cart checkout CTA         | `checkout_clicked`                                  |
| Navbar search (2+ chars)  | `search_used`                                       |
| Contact form success      | `contact_submitted`                                 |
| Footer newsletter success | `newsletter_subscribed`                             |
| Sign up                   | `signed_up` then person `identify` by MySQL user id |
| Log in                    | `logged_in` + identify                              |
| Log out                   | `logged_out` + anonymous distinct id after `reset`  |

## Identity

- Before login: anonymous `distinct_id`
- After login/signup: person id = `String(users.id)` with `email` / `name`
- Pre-login pageviews should merge onto that person

## Kill switch

Unset `NEXT_PUBLIC_POSTHOG_KEY` → site works; no events sent.

## Future: orders

When checkout ships, capture:

```ts
track("order_completed", {
	order_id,
	revenue,
	currency: "INR",
	user_id,
});
```
