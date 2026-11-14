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

## How events work

- **Autocapture** (`autocapture: true`) records generic link/button clicks as `$autocapture`. Use this for exploratory click paths.
- **Named `track()` events** are for funnels you care about (cart, auth, checkout, key CTAs). Prefer these over autocapture when building dashboards.

## Named event inventory

| Event                                                          | When                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| `$pageview`                                                    | App Router navigation (manual; `capture_pageview` is off) |
| `product_viewed`                                               | PDP open                                                  |
| `add_to_cart`                                                  | Add to bag succeeds                                       |
| `cart_updated`                                                 | Cart qty change                                           |
| `remove_from_cart`                                             | Line removed                                              |
| `wishlist_toggled`                                             | Wishlist heart toggle                                     |
| `checkout_clicked`                                             | Cart checkout / guest / login CTAs                        |
| `continue_shopping_clicked`                                    | Cart “Continue shopping”                                  |
| `home_entered`                                                 | Home welcome CTA                                          |
| `view_360_clicked`                                             | PDP View 360°                                             |
| `waitlist_opened`                                              | Coming-soon “Get notified”                                |
| `waitlist_subscribed`                                          | Waitlist submit success                                   |
| `search_used`                                                  | Navbar search (2+ chars, debounced)                       |
| `contact_submitted`                                            | Contact form success                                      |
| `newsletter_subscribed`                                        | Footer newsletter success                                 |
| `signed_up` / `logged_in` / `logged_out`                       | Auth                                                      |
| `order_completed`                                              | Successful checkout                                       |
| `creator_program_viewed`                                       | Creator program page                                      |
| `creator_apply_clicked`                                        | Creator hero Apply CTA                                    |
| `creator_application_submitted` / `creator_application_failed` | Creator form outcome                                      |

## Dedupe (local)

Strict Mode can remount effects twice in `next dev`. Guards skip:

- repeat `$pageview` for the same path
- repeat `product_viewed` for the same slug within ~1s
- repeat `identify` / `$set` when id+email+name are unchanged

Expect **one** of each per real navigation / PDP open / login.

## Smoke checks

| Step                       | Expected event / person                             |
| -------------------------- | --------------------------------------------------- |
| Load any page              | `$pageview` with `path`                             |
| Click links/buttons        | Autocapture click events                            |
| Home welcome CTA           | `home_entered`                                      |
| Open a PDP                 | `product_viewed` (slug, name, price)                |
| View 360°                  | `view_360_clicked` (slug, product_name)             |
| Add to cart                | `add_to_cart`                                       |
| Change qty / remove        | `cart_updated` / `remove_from_cart`                 |
| Toggle wishlist            | `wishlist_toggled` (`added` true/false)             |
| Cart checkout CTA          | `checkout_clicked`                                  |
| Cart continue shopping     | `continue_shopping_clicked`                         |
| Coming-soon Get notified   | `waitlist_opened`                                   |
| Coming-soon submit success | `waitlist_subscribed`                               |
| Navbar search (2+ chars)   | `search_used`                                       |
| Contact form success       | `contact_submitted`                                 |
| Footer newsletter success  | `newsletter_subscribed`                             |
| Checkout payment success   | `order_completed` (order_id, revenue, currency)     |
| Creator program page       | `creator_program_viewed`                            |
| Creator Apply CTA          | `creator_apply_clicked`                             |
| Creator form submit        | `creator_application_submitted` or `_failed`        |
| Sign up                    | `signed_up` then person `identify` by MySQL user id |
| Log in                     | `logged_in` + identify                              |
| Log out                    | `logged_out` + anonymous distinct id after `reset`  |

## Identity

- Before login: anonymous `distinct_id`
- After login/signup: person id = `String(users.id)` with `email` / `name`
- Pre-login pageviews should merge onto that person

## Kill switch

Unset `NEXT_PUBLIC_POSTHOG_KEY` → site works; no events sent.
