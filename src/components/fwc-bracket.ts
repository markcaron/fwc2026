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
      padding: 10px 12px;
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

    .matchup {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .team-row {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 4px 0;
    }
    .team-row + .team-row {
      border-top: 1px solid var(--fwc-border-subtle);
    }
    .team-flag { font-size: 1.1rem; line-height: 1; flex-shrink: 0; }
    .team-name-bracket {
      flex: 1;
      font-size: 0.82rem;
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
    .team-score {
      font-size: 1rem;
      font-weight: 700;
      color: var(--fwc-text);
      font-variant-numeric: tabular-nums;
      min-width: 16px;
      text-align: right;
    }
    .team-score.winner {
      color: var(--fwc-qualified);
    }
    /* gold-text: AA-safe gold equivalent for text on card backgrounds */
    .team-time {
      font-size: 0.72rem;
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
    const champion = finalMatch?.status === 'completed' && finalMatch.homeScore !== null && finalMatch.awayScore !== null
      ? finalMatch.homeScore > finalMatch.awayScore
        ? TEAMS_BY_ID.get(finalMatch.homeId!)
        : TEAMS_BY_ID.get(finalMatch.awayId!)
      : null;

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
    const hasScore = match.homeScore !== null && match.awayScore !== null;
    const fmt = formatMatchTime(match.utc, timezone);

    const homeWon = hasScore && match.homeScore! > match.awayScore!;
    const awayWon = hasScore && match.awayScore! > match.homeScore!;

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
          <!-- Home / top team -->
          <div class="team-row">
            ${home
              ? html`<span class="team-flag" role="img" aria-label="${home.name} flag">${home.flag}</span>`
              : html`<span class="team-flag" aria-hidden="true">🏳</span>`
            }
            <span class="team-name-bracket ${home ? (homeIsFav ? 'favorite' : '') : 'tbd'}">
              ${home?.shortName ?? match.homeLabel ?? 'TBD'}
            </span>
            ${hasScore
              ? html`<span class="team-score ${homeWon ? 'winner' : ''}" aria-label="Score: ${match.homeScore}">${match.homeScore}</span>`
              : html`<span class="team-time">${fmt.time}</span>`
            }
          </div>

          <!-- Away / bottom team -->
          <div class="team-row">
            ${away
              ? html`<span class="team-flag" role="img" aria-label="${away.name} flag">${away.flag}</span>`
              : html`<span class="team-flag" aria-hidden="true">🏳</span>`
            }
            <span class="team-name-bracket ${away ? (awayIsFav ? 'favorite' : '') : 'tbd'}">
              ${away?.shortName ?? match.awayLabel ?? 'TBD'}
            </span>
            ${hasScore
              ? html`<span class="team-score ${awayWon ? 'winner' : ''}" aria-label="Score: ${match.awayScore}">${match.awayScore}</span>`
              : nothing
            }
          </div>
        </div>

        <div class="venue-line" aria-hidden="true">📍 ${match.venue}</div>
      </div>
    `;
  }

  private _roundDateRange(matches: Match[]): string {
    if (matches.length === 0) return '';
    const dates = matches.map(m => {
      const d = new Date(m.utc);
      return d;
    });
    dates.sort((a, b) => a.getTime() - b.getTime());
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const first = fmt.format(dates[0]);
    const last = fmt.format(dates[dates.length - 1]);
    return first === last ? first : `${first} – ${last}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-bracket': FwcBracket;
  }
}
