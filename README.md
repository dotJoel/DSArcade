# DSArcade

Interview data-structures-and-algorithms questions distilled into sub-minute browser games. The games train pattern recognition, complexity analysis, code debugging, and algorithm execution.

Hosted at `https://dotjoel.github.io/DSArcade/` (GitHub Pages from `/docs`). Installable as a web app (PWA) — add to home screen for offline play.

## Games

- **Spot the Pattern** — a problem statement, four techniques, 15 seconds. Trains problem→technique mapping.
- **Complexity Duel** — a code snippet, four Big-O answers, 20 seconds. Trains cost analysis including amortized and worst-case follow-ups.
- **Bug Hunt** — identify the bug behind a failing case and choose a fix. Covers binary search, hashing, stacks, graphs, recursion, and edge cases.
- **Binary Search Trainer** — search a sorted array for a target (or prove it's absent) using higher/lower feedback. Scores reward solving within the optimal comparison budget. Procedurally generated rounds.
- **Train Yard** — route inbound boxcars through one siding to match the target outbound order. The siding is a stack (last in, first out), so every solve is push/pop reasoning in disguise. Scores reward solving at the optimal move count (minimal siding stops). Procedurally generated rounds.

## Daily mode

Every game has a daily mode. The same questions are drawn for everyone on a given day: a Fisher-Yates shuffle seeded with the UTC date plus the game id (`assets/app.js`), no backend. Scores and streaks are stored in `localStorage` on each device and reset daily.

## Question libraries

- `docs/data/pattern.js` — curated problem/technique questions
- `docs/data/complexity.js` — curated Big-O questions
- `docs/data/bughunt.js` — curated code bugs with failing cases and fixes
- `docs/games/binsearch.html` — procedural generator (no library needed)
- `docs/games/trainyard.html` — procedural generator (no library needed)

Each MCQ entry needs `q`, `options` (4), `answer` (index), and `why` (the one-line explanation shown after every answer — this is the learning payload, keep it sharp). Bug Hunt entries also include `code`, the snippet shown to the player.

## Analytics

`docs/assets/analytics.js` counts pageviews and a few events with GoatCounter
(`dotjoel.goatcounter.com`). Cookieless: no cookies, no cross-site tracking, no
personal data, no consent banner.

Counted:

- pageviews — `/home`, `/games/<game>`, with `/daily` on daily runs and `/app`
  when the site is running as an installed app
- `/event/game-start/<game>/<mode>`
- `/event/game-end/<game>/<mode>/<bucket>`, bucket being `interview-ready`
  (1000+), `solid` (600–999) or `drill` (<600), the same thresholds the end
  screen uses
- `/event/install` when the browser reports the PWA was installed
- `/event/sponsor-info-click`, `/event/sponsor-contact-click` and `/event/sponsor-click/<id>`
  for aggregate sponsor-interest and outbound-click counts

Nothing else is sent: no answers, no exact scores, no user identifiers, no
referrer beyond GoatCounter's defaults.

Opt out with `?gc=off` (stored on the device; `?gc=on` reverses it). The counter
does not load at all when Do Not Track or Global Privacy Control is set, on
`file:` URLs, or under GoatCounter's localhost exclusion — local development
never pollutes the dashboard. `?gcdebug=1` logs the payloads to the console
instead of sending them.

Tests: `node --test tests/*.test.mjs`.

## Sponsorship

A small sponsor card appears on the hub and all four game result screens. While
open, “Your ad here” links to `docs/sponsors.html`, which describes the placement
and links to Joel's public GitHub profile for inquiries. The page states that
there is not yet enough analytics history to publish audience numbers.

To set the sponsor, edit `docs/data/sponsor.js` and replace
`window.DSA_SPONSOR = null` with an object containing `id`, `name`, `message`
and an `https://` `href`. After editing sponsor content, bump `CACHE_VERSION` in
`docs/sw.js` so installed apps fetch the new config. The card then shows a
“Sponsored” label and opens the sponsor link in a new tab. Text is inserted as
text, not HTML. The GoatCounter event `/event/sponsor-click/<id>` counts clicks
without recording user identifiers. A small “Sponsor DSArcade” footer link
keeps the inquiry page available after a sponsor is configured.

## Structure

```
docs/
  index.html          hub
  manifest.webmanifest
  sw.js               cache-first service worker (bump CACHE_VERSION on changes)
  assets/             shared styles, daily-seed helpers, MCQ engine, analytics and sponsor renderer
  data/               question libraries and sponsor configuration
  sponsors.html       sponsorship details
  games/              one page per game
```
