import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MATCHES, TEAMS_BY_ID } from '../lib/data.js';
import { formatMatchTime } from '../lib/time.js';
import type { Match } from '../lib/types.js';

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
      padding: 0 12px;
    }

    /* ── Round list view (mobile default) ─────────────────── */
    .rounds-list { display: flex; flex-direction: column; gap: 0; }

    .round-section {
      margin-bottom: 2px;
    }

    .round-header {
      padding: 10px 16px 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .round-header.final-round {
      color: var(--fwc-gold-text);
    }
    .round-date {
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--fwc-text-subtle);
      text-transform: none;
    }

    .match-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
      padding: 0 12px;
    }

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

  private get _rounds() {
    type RoundDef = { id: string; label: string; matchIds: number[] };
    const defs: RoundDef[] = [
      { id: 'r32',   label: 'Round of 32',         matchIds: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
      { id: 'r16',   label: 'Round of 16',          matchIds: [89,90,91,92,93,94,95,96] },
      { id: 'qf',    label: 'Quarterfinals',         matchIds: [97,98,99,100] },
      { id: 'sf',    label: 'Semifinals',            matchIds: [101,102] },
      { id: '3rd',   label: 'Third-Place Play-off',  matchIds: [103] },
      { id: 'final', label: 'Final',                 matchIds: [104] },
    ];
    return defs.map(d => ({
      ...d,
      matches: d.matchIds.map(id => this.matchData.find(m => m.id === id)).filter(Boolean) as Match[],
    }));
  }

  render() {
    const rounds = this._rounds;
    const finalMatch = this.matchData.find(m => m.id === 104);

    // Determine champion accounting for penalty shootouts (#8)
    let champion = null;
    if (finalMatch?.status === 'completed' &&
        finalMatch.homeScore !== null && finalMatch.awayScore !== null &&
        finalMatch.homeId && finalMatch.awayId) {
      const homeWins =
        finalMatch.homeScore > finalMatch.awayScore ||
        (finalMatch.homeScore === finalMatch.awayScore &&
         finalMatch.homePenalty != null &&
         finalMatch.awayPenalty != null &&
         finalMatch.homePenalty > finalMatch.awayPenalty);
      champion = TEAMS_BY_ID.get(homeWins ? finalMatch.homeId : finalMatch.awayId) ?? null;
    }

    return html`
      <div role="region" aria-label="Knockout bracket">
        <div class="bracket-scroll">
          <div class="rounds-list">
            ${rounds.map(r => html`
              <section class="round-section" aria-label="${r.label}">
                <div class="round-header ${r.id === 'final' ? 'final-round' : ''}">
                  <span>${r.label}</span>
                  ${r.matches.length > 0
                    ? html`<span class="round-date">${this._roundDateRange(r.matches)}</span>`
                    : nothing}
                </div>
                <div class="match-grid">
                  ${r.matches.map(m => this._renderSlot(m, r.id === 'final'))}
                </div>
              </section>
            `)}

            ${champion
              ? html`
                <div class="trophy-section" role="status" aria-label="Champion: ${champion.name}">
                  <div class="trophy-icon" aria-hidden="true">🏆</div>
                  <div class="trophy-label">World Champion</div>
                  <div class="trophy-team">${champion.flag} ${champion.name}</div>
                </div>
              `
              : nothing
            }
          </div>
        </div>
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
