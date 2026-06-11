# ⚽ FIFA World Cup 2026 — Schedule & Standings

An interactive web app for following the FIFA World Cup 2026 (USA, Canada & Mexico — June 11–July 19, 2026).

## Features

- 📅 **Schedule** — all 104 matches with times in your timezone, filterable by date, group, team, or round
- 📊 **Group Standings** — live table for all 12 groups (A–L)
- 🥊 **Bracket** — knockout round bracket from Round of 32 to the Final
- ⚙️ **Settings** — choose your timezone and mark favorite teams (highlighted throughout the app)
- 💾 **Persistent preferences** via `localStorage` — timezone and favorites survive page reloads

## Tech Stack

- **[Lit 3](https://lit.dev/)** — Web Components with TypeScript
- **`@web/dev-server`** — native ESM dev server (no bundler in dev)
- No frameworks, no build step required for development
- Hosted on **[Netlify](https://www.netlify.com/)**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Project Structure

```
fwc2026/
├── index.html                  # Entry point
├── src/
│   ├── tokens.css              # CSS design tokens (light/dark mode)
│   ├── index.ts                # Root import
│   ├── components/
│   │   ├── fwc-app.ts          # Root component with tab navigation
│   │   ├── fwc-schedule.ts     # Schedule view with filters
│   │   ├── fwc-standings.ts    # Group standings tables
│   │   ├── fwc-bracket.ts      # Knockout bracket
│   │   ├── fwc-match-card.ts   # Reusable match card
│   │   └── fwc-settings.ts     # Settings panel
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       ├── data.ts             # All 48 teams + 104 match fixtures
│       ├── storage.ts          # localStorage helpers
│       └── time.ts             # Timezone utilities
└── public/
    └── favicon.svg
```

## Data

Match data is sourced from the official FIFA World Cup 2026 schedule. All times are stored internally as UTC ISO strings and displayed in the user's selected timezone.

### Groups

| Group | Teams |
|-------|-------|
| A | Mexico, South Africa, South Korea, Czechia |
| B | Canada, Switzerland, Qatar, Bosnia & Herzegovina |
| C | Brazil, Morocco, Scotland, Haiti |
| D | USA, Paraguay, Australia, Türkiye |
| E | Germany, Curaçao, Côte d'Ivoire, Ecuador |
| F | Netherlands, Japan, Tunisia, Sweden |
| G | Belgium, Egypt, Iran, New Zealand |
| H | Spain, Cape Verde, Saudi Arabia, Uruguay |
| I | France, Senegal, Norway, Iraq |
| J | Argentina, Algeria, Austria, Jordan |
| K | Portugal, Uzbekistan, Colombia, DR Congo |
| L | England, Croatia, Ghana, Panama |

## Updating Scores

To update match scores, edit `src/lib/data.ts` — find the match by `id` and set:

```ts
homeScore: 2,
awayScore: 1,
status: 'completed',
```

## Accessibility

Built with WCAG 2.1 AA compliance in mind:
- All interactive elements have accessible names
- Color contrast meets minimum ratios for text and UI components
- Keyboard navigation supported throughout
- Screen reader friendly with appropriate ARIA roles and labels
- No `user-scalable=no` or `maximum-scale` (preserves text scaling)
