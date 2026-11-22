# Ceylon Weddings — Advertising Plan for Guest Pages

Nov 22, 2026 · @Chamal Nihathamana

## Overview

Paid placements should sit where couples already have intent, look like the content around them, and always carry a "Sponsored" label.

- **Live today:** `CATALOG_TOP` (a strip on the Catalog) plus the homepage slots `HOME_HERO` and `HOME_PICKS`.
- **Defined but unused:** `CATALOG_INLINE`, `IDEAS_RAIL` and `VENDOR_SIDEBAR`.
- **Trust issue:** the Catalog strip, like the homepage, shows a paid promotion with the earned "Ceylon Pick" badge. Paid placements must say "Sponsored"; "Ceylon Pick" stays earned only.

## Tier 1: highest intent (the most revenue)

### Catalog (`/vendors`)

Couples arrive ready to pick, so treat it like search results, not a magazine.

- **Sponsored listings in the grid:** positions 1 and 6, then one every 12. Same card design, "Sponsored" label, shown only when they match the active filters (category, city, price). Replaces the top strip.
- **Date-free boost:** when a couple filters by wedding date, show sponsored vendors available that day under "Available on 12 Dec · Sponsored".
- **Category takeover:** one native header card within a category, such as a venue reel or 360° hall tour above Venues results.
- **Map sponsor pins:** in Map list view, sponsored vendors get a gold pin and appear first in the side list.
- **Few or no results:** "No venues in Jaffna yet — these travel to you", using sponsored vendors marked as willing to travel.

### Vendor profile (`/vendors/[slug]`)

No competitor ads above the fold: it is the vendor's own page, which keeps paying vendors happy.

- **Complete your team:** below reviews, "Couples who booked Lotus also booked…", sponsored complementary vendors only (a decorator on a photographer's page, never another photographer).
- **Self-upgrades the vendor buys for their own page:** header reel, "Wedding Week offer" ribbon, pinned review, "Available on your date" badge.
- **Similar vendors strip:** at the very bottom, competitors allowed, labelled, only after the couple has scrolled the whole profile. This becomes the `VENDOR_SIDEBAR` slot.

### Compare (`/vendors/compare`)

- **"Add a third option":** a sponsored suggestion when only two vendors are compared, same category and city, clearly labelled. High value: the couple is about to decide.
- **Never** place a sponsor inside the comparison table itself; it would undermine trust in the comparison.

## Tier 2: inspiration (attention and brand)

### Ideas list (`/ideas`)

- **Sponsored stories** in the article grid: at most one per row of six, labelled "Sponsored story", written as genuinely useful articles ("How to choose a Kandyan drummer troupe — by Island Drumline").
- **Category sponsor** per idea category ("Flowers ideas, presented by Fort Florals"), a small line under the category chips.
- **Wedding Reels strip** halfway down, sharing the homepage's reel inventory.

### Idea article (`/ideas/[slug]`)

- **Shop this wedding:** every vendor credited in a real-wedding story gets a clickable photo tag and a "Vendors in this story" box at the end. Credited vendors can pay to boost their tag with a WhatsApp button.
- **Contextual product card** mid-article: an osariya article shows one sponsored bridal-wear card. This is the `IDEAS_RAIL` slot, placed in the article body rather than an ignored side rail.
- **End-of-article next step:** "Ready to book? 3 florists available on your date", sponsored and filtered by the article's topic.
- **Hard rule:** advertisers cannot buy editorial articles without a "Sponsored" label, and sponsored and editorial articles look different at a glance.

### Awards (`/awards`)

- **Sell the badge, not the award.** Winners can pay for extras (winner reel, homepage "Award winner" story, awards-night sponsor slot); votes and wins can never be bought.
- **Category sponsor:** "Best Photographer, presented by Ceylon Camera Co.", for non-vendor brands like banks, jewellers and airlines.

## Tier 3: planning content (light touch)

### How it works and free consultation

- **One partner card each** at the bottom only, e.g. "Wedding loans with HNB" or a travel partner for diaspora couples. These pages turn visitors into sign-ups, so keep them almost ad-free.
- **No ads in the consultation booking flow itself.**

### For vendors (`/for-vendors`)

- **Your own sales page:** case studies with real results ("Lotus got 42 inquiries in 30 days") and a "See your ad live" preview. No third-party ads.

## Always ad-free pages

- **Guest wedding sites and RSVP (`/w/…`):** the couple's private space; ads there would feel like a betrayal.
- **Login and sign-up, About, FAQ, Contact, Privacy, Terms and the 404 page.** The 404 may suggest popular categories, but nothing sponsored.

## Site-wide rules

1. **Labels:** "Sponsored" for paid listings, "Sponsored story" for paid content. "Ceylon Pick" and "Award winner" are earned only and can never be bought.
2. **Relevance first:** a sponsored item appears only if it would plausibly qualify for that spot on merit (matching category, city, budget and date).
3. **Limits per page view:** one appearance per vendor, at most three sponsored units on content pages, and roughly one sponsored listing per six organic in results.
4. **Format bans:** no pop-ups, interstitials, sticky bars or autoplay sound. Reels stay muted until tapped.
5. **Eligibility:** only verified vendors that pass the "Ready" storefront check.
6. **Measurement per slot:** inquiries per 1,000 views; a guardrail metric per page (Catalog: clicks into profiles; Ideas: time reading); and a 5% holdout group that never sees ads, to prove the ads aren't hurting.

## Animated illustrated creatives

The champagne celebration we built for guest sites (a bottle popping its cork, flutes clinking, bubbles rising) is the model for sponsored creatives: small, on-brand SVG motion instead of static photo banners. Motion inside a native card earns a glance without the banner-blindness of a classic ad.

### Motifs by vendor category

| Category                      | Motif                                                       | Where it runs                                   |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Bars and beverage, receptions | Cork pops, flutes clink, bubbles rise                       | Wedding Week deals band, Catalog sponsored card |
| Cakes and sweets              | A tier slides on, the knife makes the first cut             | Category spotlight, Ideas inline card           |
| Florists and decor            | Frangipani petals drift into a garland or Poruwa frame      | Ideas article inline, category spotlight        |
| Entertainment                 | Magul bera drum beat with a gentle pulse ring               | Reels strip cover, Catalog sponsored card       |
| Jewellery and bridal wear     | A soft gold glint travels across a necklace or saree border | Category spotlight, Awards category sponsor     |
| Wedding cars                  | A ribbon unfurls across the bonnet                          | Catalog sponsored card, "Complete your team"    |
| Photo and video               | Polaroid prints fan out and develop                         | Catalog sponsored card, Similar vendors strip   |
| Venues                        | Hall lights warm up one by one                              | Category takeover, date-free results            |

### How it works in the product

1. **Template, not upload:** in Promote studio, vendors pick a motif, their accent colour and a headline. We render the SVG, so every creative stays on brand and lightweight.
2. **Plays once, then rests:** the animation runs once (up to 4 seconds) when the card scrolls into view, then holds its final frame. Tap or hover replays it.
3. **Lives inside native cards:** the motif sits in the corner or behind the image of a "Sponsored" card, never as a free-floating banner.
4. **Seasonal moments:** Wedding Week, Avurudu, Christmas and December peak season get a themed motif set that vendors can opt into.
5. **Respect the context:** the same rule as guest sites applies. No alcohol imagery next to Nikah, Walima or Mehndi content, or on pages filtered to those wedding types.

### Guardrails for motion

- **No flashing** or rapid colour changes, and no autoplay sound.
- **Reduced motion:** for visitors with reduced motion turned on, the creative shows its still final frame only.
- **Pause off-screen** and in background tabs.
- **Budget:** under 30 KB per creative, pure SVG and CSS, no video or animated GIF.
- **One animated creative per screen:** two moving ads side by side compete with each other and with the content.

## Promotion slots to add

Extend `promotionSlotSchema` so each placement can be priced and reported on separately.

| Slot                     | Page           | Placement                                    |
| ------------------------ | -------------- | -------------------------------------------- |
| `CATALOG_INLINE`         | Catalog        | Sponsored cards in the grid (exists, unused) |
| `CATALOG_DATE_AVAILABLE` | Catalog        | "Available on your date" group               |
| `CATALOG_MAP`            | Catalog        | Gold map pins and first in map list          |
| `VENDOR_COMPLEMENTARY`   | Vendor profile | "Complete your team" box                     |
| `VENDOR_SIMILAR`         | Vendor profile | Similar vendors strip at the bottom          |
| `COMPARE_SUGGEST`        | Compare        | "Add a third option"                         |
| `IDEAS_INLINE`           | Ideas list     | Sponsored stories in the grid                |
| `ARTICLE_INLINE`         | Idea article   | Mid-article product card                     |
| `ARTICLE_NEXT_STEP`      | Idea article   | End-of-article booking prompt                |
| `REELS`                  | Home, Ideas    | Wedding Reels strip                          |
| `AWARDS_CATEGORY`        | Awards         | Category sponsor line                        |

## Recommended first builds

These three bring the most revenue with the least annoyance:

1. **Native "Sponsored" cards in the Catalog grid**, replacing the top strip. This also fixes the Ceylon Pick label problem.
2. **"Complete your team" box** on vendor profiles.
3. **"Shop this wedding" tags** on real-wedding articles.
