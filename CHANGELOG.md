# Changelog

All notable changes to WC 2026 Schedule & Standings.

---

## [1.0.0] — 2026-06-12

### New features

- **"Final" badge** — Completed match cards now show a pill badge below the score ([#2](https://github.com/markcaron/fwc2026/pull/2))
- **Calendar date picker** — A calendar icon between the day navigation arrows opens the platform's native date picker to jump to any match day; includes an `aria-live` announcement when the view changes and snaps to the nearest match day if the selected date has no fixtures ([#3](https://github.com/markcaron/fwc2026/pull/3))
- **Countdown timer** — A floating card strip above the tab bar counts down to the next match in real time; switches to a pulsing "Live now" state during a match ([#4](https://github.com/markcaron/fwc2026/pull/4))
- **Group color palette** — All 12 group headers use vivid solid colors (A = red → L = pink); standings rows carry a subtle same-color tint, and ▲ / ○ SVG markers indicate qualification status without relying on color alone ([#5](https://github.com/markcaron/fwc2026/pull/5))
- **PWA service worker** — App shell is cached for offline use; a build-time bundle hash ensures every Netlify deploy triggers an automatic page reload for all open tabs within seconds ([#6](https://github.com/markcaron/fwc2026/pull/6))
- **Schedule search** — Fuzzy text search in the filter bar matches team names, short names, country codes, cities, and venues in real time; pressing Escape or clicking × restores the previous filter ([#15](https://github.com/markcaron/fwc2026/pull/15))

### Bug fixes

- **Bracket penalty winners** — Champion and winner-highlight logic now correctly resolves matches decided on penalty shootouts; non-null assertions on nullable team IDs removed ([#8](https://github.com/markcaron/fwc2026/issues/8), [#16](https://github.com/markcaron/fwc2026/pull/16))
- **Bracket round dates use user timezone** — Round header date ranges (e.g. "Jul 3 – Jul 6") now reflect the user's selected timezone instead of UTC ([#11](https://github.com/markcaron/fwc2026/issues/11), [#16](https://github.com/markcaron/fwc2026/pull/16))
- **Bracket slot kick-off time** — Time now appears once between the two team rows instead of being duplicated or missing on the away row ([#11](https://github.com/markcaron/fwc2026/issues/11), [#16](https://github.com/markcaron/fwc2026/pull/16))
- **Score auto-refresh** — Scores now refresh automatically every 60 seconds while the tab is active, so long-running sessions see updated results without a manual reload ([#12](https://github.com/markcaron/fwc2026/issues/12), [#16](https://github.com/markcaron/fwc2026/pull/16))
- **Timezone selector blank state** — When the browser's timezone is not in the predefined list (e.g. `Asia/Calcutta`, `Europe/Berlin`), a note appears confirming the timezone is active ([#13](https://github.com/markcaron/fwc2026/issues/13), [#17](https://github.com/markcaron/fwc2026/pull/17))

### Accessibility

- **`prefers-reduced-motion`** — Live match card pulse animation and the "no score" dot animation are now wrapped in `@media (prefers-reduced-motion: no-preference)`; a static danger border remains visible when animation is disabled (WCAG 2.3.3) ([#9](https://github.com/markcaron/fwc2026/issues/9), [#17](https://github.com/markcaron/fwc2026/pull/17))
- **Tab panel `tabindex`** — Removed `tabindex="0"` from all four `role="tabpanel"` containers (panels with interactive content should not add the container itself to tab order) ([#14](https://github.com/markcaron/fwc2026/issues/14), [#17](https://github.com/markcaron/fwc2026/pull/17))
- **Redundant `role="navigation"`** removed from `<nav>` ([#14](https://github.com/markcaron/fwc2026/issues/14))
- **External link** — FIFA website link now carries `rel="noopener noreferrer"` and a visually-hidden "(opens in new tab)" announcement ([#14](https://github.com/markcaron/fwc2026/issues/14))
- **Schedule empty-state date** — Date formatted using UTC noon (`T12:00:00Z`) to avoid local-time ambiguity ([#14](https://github.com/markcaron/fwc2026/issues/14))

---

*Previous commits on `main` cover the initial build and the infrastructure setup (scores API, Netlify functions, CI).*
