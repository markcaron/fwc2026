# Changelog

All notable changes to WC 2026 Schedule & Standings.

---

## [1.1.0] — Canada release — 2026-06-13

### Enhancements

- **Filter bar redesign** — Schedule filter bar reorganised into three clear rows: full-width search on Row 1; a segmented view-mode group (All Matches / Today / 📅 Date) plus Favorites on Row 2; dimensional filters (Group / Team / Round) on Row 3. The date picker moves from the day header into Row 2 as a chip whose label updates to show the selected date (e.g. "Jun 15"). Day header retains ← → navigation arrows. ([#25](https://github.com/markcaron/fwc2026/pull/25), closes [#21](https://github.com/markcaron/fwc2026/issues/21))
- **Header icon** — Trophy icon in the app header scaled up to 36 × 36 px for better visual balance ([#25](https://github.com/markcaron/fwc2026/pull/25))

### Bug fixes

- **Schedule sort order** — Matches within a day were rendered in fixture-list order (group A → B → … → L → knockouts) instead of ascending kick-off time. All filter modes now return matches sorted chronologically. ([#22](https://github.com/markcaron/fwc2026/pull/22), closes [#19](https://github.com/markcaron/fwc2026/issues/19))
- **Date picker — iOS Safari / iOS Chrome** — `showPicker()` and programmatic `.click()` both fail inside a Shadow Root on iOS. Fixed by using a Shadow DOM `<input type="date">` as the direct tap target (with an `aria-hidden` ghost element for visual presentation), so the user's touch lands on the input natively without any JavaScript intermediary. ([#24](https://github.com/markcaron/fwc2026/pull/24), closes [#20](https://github.com/markcaron/fwc2026/issues/20))

### Accessibility & polish

- **Timezone select chip style** — The timezone `<select>` in Settings now matches the pill-chip appearance (pill radius, custom SVG caret, hover state) used by the schedule filter selects. Shared CARET SVG extracted to `src/lib/icons.ts` to avoid duplication. ([#23](https://github.com/markcaron/fwc2026/pull/23), closes [#18](https://github.com/markcaron/fwc2026/issues/18))
- **Date segment keyboard & screen reader** — The date segment in the new filter bar uses `role="button"` with `tabindex="0"` as a single tab stop (avoiding Chrome's three internal month/day/year sub-fields). Both `@keydown` (Space/Enter) and `@click` trigger `showPicker()` so VoiceOver double-tap and JAWS virtual-mode activation both open the picker.
- **`_announce()` re-announcement** — Live-region text is reset to `''` before each navigation announcement so re-selecting the same date still produces a new DOM mutation that screen readers announce (WCAG 4.1.3).

---

## [1.0.0] — USA release — 2026-06-12

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
