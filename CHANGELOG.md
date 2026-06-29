# Changelog

All notable changes to WC 2026 Schedule & Standings.

---

## [1.3.2] — 2026-06-29

### Bug fixes

- **Team names disappearing from bracket and schedule when R32 matches kick off** — Once Round of 32 matches went live, Pass 1 of the score cron wrote score entries without `homeId`/`awayId`. The final Blob merge was a shallow object spread that replaced the entire entry, silently discarding the team IDs that Pass 2 had written before kickoff. Fixed with two complementary changes: (1) the final merge is now a deep per-entry merge so existing team IDs survive when a new entry only carries scores/status; (2) Pass 1 also writes `homeId`/`awayId` when it resolves them, making entries self-contained. ([#38](https://github.com/markcaron/fwc2026/pull/38))

---

## [1.3.1] — 2026-06-22

### Bug fixes

- **USA, Mexico and other confirmed R32 teams not appearing in bracket** — The knockout date probe had a 7-day upper cutoff. USA's match (July 1) is 9 days out; Mexico's (June 30) is 8 days. Removed the cutoff entirely so all future knockout fixture dates are always probed. At most ~18 unique dates across the full bracket, all fetched in parallel, so runtime cost is unchanged. ([#37](https://github.com/markcaron/fwc2026/pull/37))

---

## [1.3.0] — Argentina release — 2026-06-22

### New features

- **Knockout bracket navigation** — The Knockouts tab now shows one round at a time with ← / → arrow navigation (matching the schedule's day-navigation pattern). The view auto-opens at the most relevant round — the first with any non-completed match. ([#35](https://github.com/markcaron/fwc2026/pull/35))
- **Bracket connector lines** — Paired matches (two that feed the same next-round slot) are visually grouped with a right-side brace connector (`┌─ ├── └─`) whose midpoint stub points outward. R16+ cards show a left intake arm (`──►`) indicating they were produced by the prior round. Pairs are 16px apart; groups 40px apart. ([#35](https://github.com/markcaron/fwc2026/pull/35))
- **Combined Finals page** — Third-Place Play-off and Final appear together on a single special page. The Final shows a gold `🏆 Final` label and highlight border; both cards carry SF intake arms; the champion trophy appears below once the Final completes. ([#35](https://github.com/markcaron/fwc2026/pull/35))
- **Confirmed knockout teams from ESPN** — The `fetch-scores` cron now probes upcoming knockout match dates (next 7 days, in parallel) via the ESPN dated scoreboard API. Confirmed teams (e.g. Germany, USA, Mexico) populate the bracket automatically within the next cron run (every 5 min), even before kickoff. Partial resolution is supported — one confirmed team displays while the other slot stays TBD. ([#35](https://github.com/markcaron/fwc2026/pull/35), closes [#34](https://github.com/markcaron/fwc2026/issues/34))

### Enhancements

- **Bracket match card redesign** — Knockout slots now use the same `1fr auto 1fr` grid as schedule cards: home team right-aligned, score/time centred, away team left-aligned. Eliminates the double border that appeared above the away row. Card padding updated to `16px 20px` to match schedule cards. ([#35](https://github.com/markcaron/fwc2026/pull/35))

### Bug fixes

- **Knockout match shadow clipping** — `overflow-x: auto` on the bracket scroll container was clipping card drop-shadows. Fixed with `padding-bottom` on the scroll wrapper. ([#35](https://github.com/markcaron/fwc2026/pull/35))
- **Confirmed knockout teams incorrectly marked completed** — `applyScores` was defaulting `status` to `'completed'` when no status field was present in a score entry. Scheduled knockout matches with ESPN-confirmed team IDs (but no score yet) were silently skipped by the countdown timer. Fixed to fall back to the static match status. ([#35](https://github.com/markcaron/fwc2026/pull/35))

---

## [1.2.0] — Mexico release — 2026-06-17

### New features

- **Web Push notifications** — Opt-in kickoff alerts delivered 5 minutes before a match starts. Users choose between "Favorite teams only" (default) and "All matches." Powered by VAPID-signed Web Push via a new Netlify scheduled function (`push-notify`) that runs every minute and a subscription CRUD function (`push-subscribe`) backed by Netlify Blobs. On iOS the Settings panel surfaces a prompt to add the app to the Home Screen first, since browser-tab push is unsupported on iOS Safari. ([#31](https://github.com/markcaron/fwc2026/pull/31), closes [#29](https://github.com/markcaron/fwc2026/issues/29))
- **Update-available toast** — When a new version of the app deploys, a slide-up toast appears at the bottom of the screen with **Dismiss** and **Refresh** actions — replacing the previous silent auto-reload. Respects `prefers-reduced-motion`; manages focus correctly on both paths. ([#32](https://github.com/markcaron/fwc2026/pull/32))

### Bug fixes

- **Favorite team checkboxes not visible on iOS** — The checked state (gold fill, border ring, ✓ checkmark) was invisible on iOS Safari because all three CSS rules used `:has(input:checked)` inside a Shadow Root — a known WebKit bug where `:has` + `:checked` style recalculations are unreliable. Replaced with an `.is-checked` class applied directly in the Lit template. The hidden checkbox is also corrected from the zero-dimension pattern (`width: 0; height: 0`) to the standard visually-hidden technique, and `pointer-events: none` is removed. ([#30](https://github.com/markcaron/fwc2026/pull/30), closes [#28](https://github.com/markcaron/fwc2026/issues/28))

### Accessibility

- **Push notification toggle** — The enable switch uses `role="switch"` (WCAG 4.1.2); the full toggle row is wrapped in a `<label>` so the visible text "Kickoff alerts" is both the click target (WCAG 2.5.5) and the accessible name (WCAG 2.5.3); a persistent light-DOM `role="status"` announcer is registered at boot so JAWS and VoiceOver reliably announce the update state.
- **Update toast focus management** — Focus shifts to the Dismiss button when the toast appears; Dismiss returns focus to the skip link before removing the toast node (WCAG 2.4.3); Escape key dismisses; interactive buttons moved from `role="status"` (semantically invalid) to `role="region"` with `aria-labelledby`.
- **Service worker precache resilience** — `cache.addAll()` replaced with `Promise.allSettled()` over individual `cache.add()` calls. `addAll()` is all-or-nothing; a single missing asset (e.g. 404 on deploy) previously aborted the entire SW install.

---

## [1.1.1] — 2026-06-14

### Bug fixes

- **Search input iOS zoom** — iOS Safari auto-zooms the viewport when a focused `<input>` has `font-size < 16px`. The search field was `0.78rem` (~12.5px). Fixed with `@media (pointer: coarse)` to override to `1rem` (16px) on touch screens; desktop retains `0.78rem`. ([#27](https://github.com/markcaron/fwc2026/pull/27))

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
