import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MATCHES, TEAMS_BY_ID } from '../lib/data.js';
import { formatMatchTime } from '../lib/time.js';
import type { Match } from '../lib/types.js';

// ── Bracket progression — which two match-IDs feed the same next-round slot ──
// Pairs are listed in display order (top → bottom within each round).
const BRACKET_PAIRS: Partial<Record<string, [number, number][]>> = {
  r32: [[74,77],[73,75],[76,78],[79,80],[83,84],[81,82],[86,88],[85,87]],
  r16: [[89,90],[93,94],[91,92],[95,96]],
  qf:  [[97,98],[99,100]],
  sf:  [[101,102]],
  // '3rd' and 'final' are single matches — no pairing needed
};

@customElement('fwc-bracket')
export class FwcBracket extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 8px 0 24px;
    }

    .bracket-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 0 12px 16px; /* bottom padding prevents shadow clipping from overflow-x: auto */
    }

    /* ── Round navigation ──────────────────────────────────── */
    .round-nav {
      display: flex;
      align-items: center;
      padding: 8px;
      min-height: 44px;
    }

    .round-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      background: none;
      border: none;
      border-radius: 8px;
      color: var(--fwc-text-muted);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .round-arrow:hover:not(:disabled) {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .round-arrow:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .round-arrow:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .round-arrow svg {
      width: 7px;
      height: 12px;
      flex-shrink: 0;
    }

    .round-nav-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 0;
    }
    .round-nav-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
    }
    .round-nav-label.final-round { color: var(--fwc-gold-text); }
    .round-date {
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--fwc-text-subtle);
    }

    /* Visually hidden live region for AT announcements on round change */
    .nav-announce {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .match-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
      padding: 0 12px;
    }

    /* ── Bracket pair grouping ─────────────────────────────── */
    .bracket-groups {
      display: flex;
      flex-direction: column;
      gap: 40px;
      padding: 0 32px 0 12px; /* extra right padding gives room for the outward stub */
    }
    .bracket-group {
      display: flex;
      align-items: stretch;
    }
    .bracket-group-matches {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    .bracket-groups[data-round="r16"] { --bracket-inner-gap: 16px;  }
    .bracket-groups[data-round="qf"]  { --bracket-inner-gap: 16px; }
    .bracket-groups[data-round="sf"]  { --bracket-inner-gap: 16px; }

    /* Right-side brace — top and bottom arms meeting at a midpoint.
       ::after creates the stub that extends RIGHTWARD beyond the brace edge. */
    .bracket-connector {
      width: 16px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      position: relative;
    }
    .bracket-connector::after {
      content: '';
      position: absolute;
      left: 14px;          /* flush with the right-border of the brace */
      top: calc(50% - 1px);
      width: 18px;         /* stub extends rightward past the brace edge */
      height: 2px;
      background: var(--fwc-border-subtle);
    }
    .bc-top {
      flex: 1;
      border-right: 2px solid var(--fwc-border-subtle);
      border-top: 2px solid var(--fwc-border-subtle);
      border-top-right-radius: 4px;
    }
    .bc-bottom {
      flex: 1;
      border-right: 2px solid var(--fwc-border-subtle);
      border-bottom: 2px solid var(--fwc-border-subtle);
      border-bottom-right-radius: 4px;
    }

    /* Left intake arm — short horizontal line entering each R16+ card from the left */
    .intake-arm {
      width: 20px;
      flex-shrink: 0;
      align-self: center;
      height: 0;
      border-top: 2px solid var(--fwc-border-subtle);
    }
    .slot-with-intake {
      display: flex;
      align-items: stretch;
    }
    .slot-with-intake .slot { flex: 1; min-width: 0; }

    /* ── Match slot card ───────────────────────────────────── */
    .slot {
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-md);
      padding: 16px 20px;
      box-shadow: var(--fwc-shadow-sm);
    }
    /* highlight-ring: navy-500 in light (6.1:1 ✓), gold in dark */
    .slot.final-slot {
      border-color: var(--fwc-highlight-ring);
      box-shadow: 0 0 0 1px var(--fwc-highlight-ring), var(--fwc-shadow-md);
    }

    .slot-meta {
      font-size: 0.68rem;
      color: var(--fwc-text-subtle);
      margin-bottom: 6px;
      display: flex;
      gap: 4px;
      align-items: center;
    }

    /* 3-column grid mirrors fwc-match-card: home | centre | away */
    .matchup {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
    }

    .team-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 2px 0;
    }
    .team-row.home { align-items: flex-end;   text-align: right; }
    .team-row.away { align-items: flex-start; text-align: left;  }

    .team-flag { font-size: 1.4rem; line-height: 1; }
    .team-name-bracket {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fwc-text);
    }
    .team-name-bracket.tbd {
      color: var(--fwc-text-subtle);
      font-weight: 400;
      font-style: italic;
    }
    /* gold-text: navy-700 in light (10.5:1 ✓), gold-300 in dark (11.8:1 ✓) */
    .team-name-bracket.favorite { color: var(--fwc-gold-text); }

    /* Centre column — time for scheduled, score for live/completed */
    .slot-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 52px;
    }
    .slot-score {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.2rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--fwc-text);
      line-height: 1;
    }
    .slot-score .winner { color: var(--fwc-qualified); }
    .score-sep {
      font-size: 1rem;
      color: var(--fwc-text-muted);
    }
    .slot-final {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      padding: 1px 6px;
      margin-top: 2px;
    }
    .slot-pens {
      font-size: 0.65rem;
      color: var(--fwc-text-muted);
    }
    .slot-vs {
      font-size: 0.72rem;
      color: var(--fwc-text-muted);
    }
    /* gold-text token: AA-safe gold equivalent for text on card backgrounds */
    .team-time {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--fwc-gold-text);
    }

    .venue-line {
      font-size: 0.68rem;
      color: var(--fwc-text-subtle);
      margin-top: 5px;
    }

    /* ── Finals combined page ──────────────────────────────── */
    .finals-page {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 12px 16px;
    }
    .finals-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .finals-section-label {
      text-align: center;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .finals-divider {
      height: 1px;
      background: var(--fwc-border-subtle);
      margin: 8px 0;
    }

    /* Final section — gold label + intake arm from SF */
    .finals-final-label {
      font-size: 1rem;
      font-weight: 800;
      color: var(--fwc-gold-text);
      letter-spacing: 0.02em;
    }
    .finals-match-row {
      display: flex;
      align-items: center;
    }
    .finals-match-row .slot {
      flex: 1;
      min-width: 0;
    }

    /* ── Trophy ─────────────────────────── */
    .trophy-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      gap: 8px;
    }
    .trophy-icon {
      font-size: 3rem;
      line-height: 1;
    }
    .trophy-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
    }
    .trophy-team {
      font-size: 1rem;
      font-weight: 700;
      color: var(--fwc-gold-text);
    }
  `;

  @property({ type: Array }) matchData: Match[] = [...MATCHES];
  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];

  /** Index of the currently displayed round */
  @state() private _activeRoundIdx = 0;
  /** AT live-region text set on each round change */
  @state() private _announcement = '';

  override connectedCallback(): void {
    super.connectedCallback();
    // Default to the first round that has any non-completed match so the view
    // opens at the most relevant round during the tournament.
    const rounds = this._rounds;
    const idx = rounds.findIndex(r => r.matches.some(m => m.status !== 'completed'));
    this._activeRoundIdx = idx >= 0 ? idx : rounds.length - 1;
  }

  private _navigate(delta: 1 | -1): void {
    const next = this._activeRoundIdx + delta;
    const rounds = this._rounds;
    if (next < 0 || next >= rounds.length) return;
    this._activeRoundIdx = next;
    this._announcement = rounds[next].label;
  }

  private get _rounds() {
    type RoundDef = { id: string; label: string; matchIds: number[] };
    const defs: RoundDef[] = [
      { id: 'r32',    label: 'Round of 32',         matchIds: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
      { id: 'r16',    label: 'Round of 16',          matchIds: [89,90,91,92,93,94,95,96] },
      { id: 'qf',     label: 'Quarterfinals',         matchIds: [97,98,99,100] },
      { id: 'sf',     label: 'Semifinals',            matchIds: [101,102] },
      { id: 'finals', label: 'Finals',                matchIds: [103,104] },
    ];
    return defs.map(d => ({
      ...d,
      matches: d.matchIds.map(id => this.matchData.find(m => m.id === id)).filter(Boolean) as Match[],
    }));
  }

  render() {
    const rounds = this._rounds;
    const activeIdx = this._activeRoundIdx;
    const round = rounds[activeIdx];
    if (!round) return nothing;

    const canPrev = activeIdx > 0;
    const canNext = activeIdx < rounds.length - 1;
    const isFinals = round.id === 'finals';
    const isFinal = round.id === 'final' || isFinals;
    const dateRange = round.matches.length > 0 ? this._roundDateRange(round.matches) : '';

    // Determine champion when on the Finals page
    let champion = null;
    if (isFinals) {
      const finalMatch = this.matchData.find(m => m.id === 104);
      if (finalMatch?.status === 'completed' &&
          finalMatch.homeScore !== null && finalMatch.awayScore !== null &&
          finalMatch.homeId && finalMatch.awayId) {
        const homeWins =
          finalMatch.homeScore > finalMatch.awayScore ||
          (finalMatch.homeScore === finalMatch.awayScore &&
           finalMatch.homePenalty != null && finalMatch.awayPenalty != null &&
           finalMatch.homePenalty > finalMatch.awayPenalty);
        champion = TEAMS_BY_ID.get(homeWins ? finalMatch.homeId : finalMatch.awayId) ?? null;
      }
    }

    return html`
      <div role="region" aria-label="Knockout bracket">

        <!-- Live region for AT announcements on round change -->
        <div class="nav-announce" aria-live="polite" aria-atomic="true">
          ${this._announcement}
        </div>

        <div class="bracket-scroll">

          <!-- Round navigation -->
          <nav class="round-nav" aria-label="Bracket round navigation">
            <button
              class="round-arrow"
              aria-label="Previous round"
              ?disabled="${!canPrev}"
              @click="${() => this._navigate(-1)}"
            >
              <svg viewBox="0 0 7 12" fill="none" aria-hidden="true">
                <path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="round-nav-content">
              <span class="round-nav-label ${isFinal ? 'final-round' : ''}">${round.label}</span>
              ${dateRange ? html`<span class="round-date">${dateRange}</span>` : nothing}
            </div>

            <button
              class="round-arrow"
              aria-label="Next round"
              ?disabled="${!canNext}"
              @click="${() => this._navigate(1)}"
            >
              <svg viewBox="0 0 7 12" fill="none" aria-hidden="true">
                <path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </nav>

          <!-- Current round matches — paired with bracket connectors if applicable -->
          ${isFinals
            ? this._renderFinalsPage(round.matches, champion)
            : BRACKET_PAIRS[round.id]
              ? this._renderPaired(round.matches, BRACKET_PAIRS[round.id]!, isFinal, round.id)
              : html`
                <div class="match-grid" role="list" aria-label="${round.label} matches">
                  ${round.matches.map(m => this._renderSlot(m, isFinal))}
                </div>
              `
          }

        </div>
      </div>
    `;
  }

  private _renderFinalsPage(matches: Match[], champion: { name: string; flag: string } | null) {
    const thirdPlace = matches.find(m => m.id === 103);
    const finalMatch = matches.find(m => m.id === 104);
    return html`
      <div class="finals-page">

        <!-- Third-Place Play-off -->
        ${thirdPlace ? html`
          <div class="finals-section" role="region" aria-label="Third-Place Play-off">
            <div class="finals-section-label">Third-Place Play-off</div>
            <div class="finals-match-row">
              <div class="intake-arm" aria-hidden="true"></div>
              ${this._renderSlot(thirdPlace, false)}
            </div>
          </div>
        ` : nothing}

        <div class="finals-divider" aria-hidden="true"></div>

        <!-- Final -->
        ${finalMatch ? html`
          <div class="finals-section" role="region" aria-label="Final">
            <div class="finals-section-label finals-final-label">🏆 Final</div>
            <div class="finals-match-row">
              <div class="intake-arm" aria-hidden="true"></div>
              ${this._renderSlot(finalMatch, true)}
            </div>
          </div>
        ` : nothing}

        ${champion ? html`
          <div class="trophy-section" role="status" aria-label="Champion: ${champion.name}">
            <div class="trophy-icon" aria-hidden="true">🏆</div>
            <div class="trophy-label">World Champion</div>
            <div class="trophy-team">${champion.flag} ${champion.name}</div>
          </div>
        ` : nothing}

      </div>
    `;
  }

  private _renderPaired(matches: Match[], pairs: [number, number][], isFinal: boolean, roundId: string) {
    const byId = new Map(matches.map(m => [m.id, m]));
    const hasIntakeArm = roundId !== 'r32';
    return html`
      <div class="bracket-groups" data-round="${roundId}" role="list" aria-label="Matches">
        ${pairs.map(([aId, bId]) => {
          const a = byId.get(aId);
          const b = byId.get(bId);
          return html`
            <div class="bracket-group" role="listitem">
              <div class="bracket-group-matches">
                ${a ? html`
                  <div class="slot-with-intake">
                    ${hasIntakeArm ? html`<div class="intake-arm" aria-hidden="true"></div>` : nothing}
                    ${this._renderSlot(a, isFinal)}
                  </div>
                ` : nothing}
                ${b ? html`
                  <div class="slot-with-intake">
                    ${hasIntakeArm ? html`<div class="intake-arm" aria-hidden="true"></div>` : nothing}
                    ${this._renderSlot(b, isFinal)}
                  </div>
                ` : nothing}
              </div>
              <!-- Right brace with rightward stub at midpoint via ::after -->
              <div class="bracket-connector" aria-hidden="true">
                <div class="bc-top"></div>
                <div class="bc-bottom"></div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderSlot(match: Match, isFinal: boolean) {
    const { timezone, favoriteTeamIds } = this;
    const home = match.homeId ? TEAMS_BY_ID.get(match.homeId) : null;
    const away = match.awayId ? TEAMS_BY_ID.get(match.awayId) : null;
    const hasScore   = match.homeScore !== null && match.awayScore !== null;
    const isFinished = match.status === 'completed';
    const fmt = formatMatchTime(match.utc, timezone);

    // Correctly handle penalty-decided matches (#8): equal regular-time scores
    // with penalties set mean the penalty winner should be highlighted.
    const homeWins = hasScore && (
      match.homeScore! > match.awayScore! ||
      (match.homeScore === match.awayScore &&
       match.homePenalty != null && match.awayPenalty != null &&
       match.homePenalty > match.awayPenalty)
    );
    const awayWins = hasScore && (
      match.awayScore! > match.homeScore! ||
      (match.homeScore === match.awayScore &&
       match.homePenalty != null && match.awayPenalty != null &&
       match.awayPenalty > match.homePenalty)
    );
    const homeWon = isFinished && homeWins;
    const awayWon = isFinished && awayWins;

    const homeIsFav = home && favoriteTeamIds.includes(home.id);
    const awayIsFav = away && favoriteTeamIds.includes(away.id);

    return html`
      <div
        class="slot ${isFinal ? 'final-slot' : ''}"
        role="article"
        aria-label="${home?.name ?? match.homeLabel ?? 'TBD'} vs ${away?.name ?? match.awayLabel ?? 'TBD'}, ${fmt.date}"
      >
        <div class="slot-meta" aria-hidden="true">
          <span>${fmt.date}</span>
          <span>·</span>
          <span>${match.city}</span>
        </div>

        <div class="matchup">
          <!-- Home team (right-aligned) -->
          <div class="team-row home">
            ${home
              ? html`<span class="team-flag" role="img" aria-label="${home.name} flag">${home.flag}</span>`
              : html`<span class="team-flag" aria-hidden="true">🏳</span>`
            }
            <span class="team-name-bracket ${home ? (homeIsFav ? 'favorite' : '') : 'tbd'}">
              ${home?.shortName ?? match.homeLabel ?? 'TBD'}
            </span>
          </div>

          <!-- Centre: score for live/completed, time + vs for scheduled -->
          <div class="slot-center">
            ${hasScore ? html`
              <div class="slot-score" aria-label="${home?.name ?? 'Home'} ${match.homeScore} – ${match.awayScore} ${away?.name ?? 'Away'}">
                <span class="${homeWon ? 'winner' : ''}">${match.homeScore}</span>
                <span class="score-sep" aria-hidden="true">–</span>
                <span class="${awayWon ? 'winner' : ''}">${match.awayScore}</span>
              </div>
              ${isFinished
                ? html`<div class="slot-final" aria-label="Full time">Final</div>`
                : nothing
              }
              ${match.homePenalty != null ? html`
                <div class="slot-pens" aria-label="Penalties: ${match.homePenalty}–${match.awayPenalty}">
                  (${match.homePenalty}–${match.awayPenalty} pens)
                </div>
              ` : nothing}
            ` : html`
              <span class="team-time" aria-hidden="true">${fmt.time}</span>
              <span class="slot-vs" aria-hidden="true">vs</span>
            `}
          </div>

          <!-- Away team (left-aligned) -->
          <div class="team-row away">
            ${away
              ? html`<span class="team-flag" role="img" aria-label="${away.name} flag">${away.flag}</span>`
              : html`<span class="team-flag" aria-hidden="true">🏳</span>`
            }
            <span class="team-name-bracket ${away ? (awayIsFav ? 'favorite' : '') : 'tbd'}">
              ${away?.shortName ?? match.awayLabel ?? 'TBD'}
            </span>
          </div>
        </div>

        <div class="venue-line" aria-hidden="true">📍 ${match.venue}</div>
      </div>
    `;
  }

  private _roundDateRange(matches: Match[]): string {
    if (matches.length === 0) return '';
    const dates = matches.map(m => new Date(m.utc)).sort((a, b) => a.getTime() - b.getTime());
    // Use the user's timezone so dates match what they see on the schedule (#11)
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      month: 'short',
      day: 'numeric',
    });
    const first = fmt.format(dates[0]);
    const last  = fmt.format(dates[dates.length - 1]);
    return first === last ? first : `${first} – ${last}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-bracket': FwcBracket;
  }
}
