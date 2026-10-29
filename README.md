# DSA Arcade

Interview data-structures-and-algorithms questions distilled into sub-minute browser games. The training target is pattern recognition: reading a problem and mapping it to the right technique before writing code.

Hosted at `https://dotjoel.github.io/dsa-arcade/` (GitHub Pages from `/docs`). Installable as a web app (PWA) — add to home screen for offline play.

## Games

- **Spot the Pattern** — a problem statement, four techniques, 15 seconds. Trains problem→technique mapping.
- **Complexity Duel** — a code snippet, four Big-O answers, 20 seconds. Trains cost analysis including amortized and worst-case follow-ups.
- **Binary Search Trainer** — search a sorted array for a target (or prove it's absent) using higher/lower feedback. Scores reward solving within the optimal comparison budget. Procedurally generated rounds.

## Daily mode

Every game has a daily mode. The same questions are drawn for everyone on a given day: a Fisher-Yates shuffle seeded with the UTC date plus the game id (`assets/app.js`), no backend. Scores and streaks are stored in `localStorage` on each device and reset daily.

## Question libraries

- `docs/data/pattern.js` — curated problem/technique questions
- `docs/data/complexity.js` — curated Big-O questions
- `docs/games/binsearch.html` — procedural generator (no library needed)

Each library entry needs `q`, `options` (4), `answer` (index), `why` (the one-line explanation shown after every answer — this is the learning payload, keep it sharp).

## Structure

```
docs/
  index.html          hub
  manifest.webmanifest
  sw.js               cache-first service worker (bump CACHE_VERSION on changes)
  assets/             shared styles, daily-seed helpers, MCQ engine
  data/               question libraries
  games/              one page per game
```
