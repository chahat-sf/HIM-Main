# HIM — SEO Team Content & Asset Request

**Purpose:** Collect final SEO copy and share images before locking metadata, Open Graph / Twitter previews, and product link previews live.

**Status note:** Engineering has placeholder (dummy) metadata and existing product images wired. Replace with SEO-approved content and dedicated share assets when ready.

**Preferred deliverable:** One spreadsheet + one asset folder (see end of document).

---

## 1. Global (site-wide)

| Item                             | What we need                           | Notes / status                        |
| -------------------------------- | -------------------------------------- | ------------------------------------- |
| Canonical production domain      | Exact URL (e.g. `https://him.world`)   | Must match `NEXT_PUBLIC_SITE_URL`     |
| Brand name for titles            | Exact spelling (e.g. HIM)              | Used in title template                |
| Default OG / Twitter share image | 1200×630, JPG or PNG preferred         | Safer than WebP for WhatsApp/Facebook |
| Default meta description         | ~150–160 characters                    | Site-wide fallback                    |
| Social handles                   | Twitter/X, Instagram, etc. (if any)    | Optional for OG/Twitter tags          |
| Robots / indexing policy         | Index now vs stay noindex until launch | Site may currently be noindex         |
| Sitemap scope                    | Confirm contact + legal pages included |                                       |
| Analytics / Search Console       | Property access if SEO owns setup      | Separate from content                 |

---

## 2. Home `/`

| Item                                               | What we need            |
| -------------------------------------------------- | ----------------------- |
| Title tag (or pattern)                             |                         |
| Meta description                                   |                         |
| H1 copy (if crawlable H1 should differ from hero)  |                         |
| OG title / OG description (if different from meta) |                         |
| Home-specific share image (optional)               | Else use global default |
| Primary keywords / phrases                         | For copy alignment      |

---

## 3. House `/house`

| Item                                 | What we need                         |
| ------------------------------------ | ------------------------------------ |
| Title + meta description             |                                      |
| OG title / description               |                                      |
| Share image                          | Strong still recommended (not WebGL) |
| Short indexable intro/blurb (if any) |                                      |

---

## 4. Collection `/collection`

| Item                                             | What we need |
| ------------------------------------------------ | ------------ |
| Title + meta description                         |              |
| OG title / description                           |              |
| Collection share image                           |              |
| Category naming for filters/URLs (if SEO-driven) |              |
| Intro paragraph for listing page (if any)        |              |

---

## 5. Product PDP `/collection/[slug]`

Provide **per product** (or a template + exceptions list).

| Item                            | What we need                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Final URL slug                  | Confirmed canonical slug                                                            |
| SEO title                       | ≤ ~60 characters, or rule e.g. `{Product Name} — HIM`                               |
| Meta description                | Unique, ~150–160 characters                                                         |
| Share / OG image                | Dedicated **1200×630** crop preferred; or written approval to use existing PDP hero |
| Alt text                        | Main image + gallery images                                                         |
| Short marketing line            | SEO-approved                                                                        |
| Long description                | If richer indexable copy is required                                                |
| Optional FAQ / care / materials | For future schema                                                                   |
| Optional Product schema fields  | Brand, SKU/GTIN, availability, currency                                             |

**Asset note:** Prefer **JPG or PNG** at **1200×630** for share images. WebP works on many platforms; JPG is safest for WhatsApp / Facebook.

---

## 6. Contact `/contact`

| Item                                            | What we need                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Title + meta description                        |                                                                             |
| OG title / description + share image (optional) |                                                                             |
| NAP consistency                                 | Business name, address, phone, email, hours (match Google Business if used) |
| Preferred CTA wording                           | e.g. Book a visit                                                           |

---

## 7. Legals `/legals`

| Item                        | What we need                             |
| --------------------------- | ---------------------------------------- |
| Title + meta description    |                                          |
| Final counsel-approved body | Or flag “placeholder — do not index yet” |
| Index or noindex decision   |                                          |

---

## 8. Privacy `/privacy-policy`

| Item                      | What we need |
| ------------------------- | ------------ |
| Title + meta description  |              |
| Final approved copy       |              |
| Index or noindex decision |              |

---

## 9. Terms of sale `/terms-of-sale`

| Item                      | What we need |
| ------------------------- | ------------ |
| Title + meta description  |              |
| Final approved copy       |              |
| Index or noindex decision |              |

---

## 10. Private / utility pages (usually no SEO copy)

Confirm **noindex** is correct for:

- `/cart`
- `/wishlist`
- `/account`
- `/login`
- `/signup`

If any of these should be indexed, say so explicitly.

---

## Deliverable format

### Spreadsheet columns

| Page / Product slug | Title | Meta description | H1 | OG image file | Index? (Y/N) | Notes |

### Asset folder naming

- `og-home.jpg`
- `og-collection.jpg`
- `og-house.jpg`
- `og-contact.jpg`
- `og-{product-slug}.jpg`
- `og-default.jpg` (global fallback)

---

## Minimum to unblock product link previews first

If only one batch can be delivered now:

1. Confirmed live domain
2. Per-product (or template) title + description
3. Per-product **1200×630** share image (or written approval to use existing PDP hero)
4. Sign-off that those images are public and final

---

## Engineering contact notes

- Product pages already emit Open Graph / Twitter image tags from catalog images when SEO assets are not yet provided.
- Absolute preview URLs require correct production `NEXT_PUBLIC_SITE_URL`.
- After launch or image changes, re-scrape URLs in Facebook Sharing Debugger / equivalent tools to clear caches.

---

_Document generated for HIM website SEO handoff._
