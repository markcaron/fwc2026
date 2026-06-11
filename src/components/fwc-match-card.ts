import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Match, Team } from '../lib/types.js';
import { TEAMS_BY_ID } from '../lib/data.js';
import { formatMatchTime } from '../lib/time.js';
import { ROUND_LABELS } from '../lib/types.js';

@customElement('fwc-match-card')
export class FwcMatchCard extends LitElement {
  static styles = css`
    :host { display: block; }

    .card {
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-md);
      padding: 16px 20px;
      box-shadow: var(--fwc-shadow-sm);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    /* highlight-ring: navy-500 in light (6.1:1 on white ✓), gold in dark */
    .card.favorite {
      border-color: var(--fwc-highlight-ring);
      box-shadow: 0 0 0 1px var(--fwc-highlight-ring), var(--fwc-shadow-sm);
    }
    .card.live {
      border-color: var(--fwc-danger);
      animation: livePulse 2s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%, 100% { box-shadow: 0 0 0 1px var(--fwc-danger), var(--fwc-shadow-sm); }
      50%       { box-shadow: 0 0 8px 2px rgba(218,41,28,0.4), var(--fwc-shadow-sm); }
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      font-size: 0.72rem;
      color: var(--fwc-text-muted);
    }
    .badge {
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 0.68rem;
      font-weight: 600;
    }
    .badge.live {
      background: var(--fwc-danger);
      color: var(--fwc-white);
      border-color: transparent;
    }

    .teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
    }

    .team {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .team.home { align-items: flex-end; text-align: right; }
    .team.away { align-items: flex-start; text-align: left; }

    .team-flag {
      font-size: 1.8rem;
      line-height: 1;
    }
    .team-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--fwc-text);
    }
    /* gold-text token: navy-700 in light (10.5:1 on white ✓), gold-300 in dark */
    .team-name.favorite-team {
      color: var(--fwc-gold-text);
    }

    .score-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 56px;
    }
    .score {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--fwc-text);
      line-height: 1;
    }
    .score-sep {
      font-size: 1.2rem;
      color: var(--fwc-text-muted);
    }
    .time-display {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--fwc-text-muted);
    }
    /* gold-text token ensures AA contrast on both light and dark backgrounds */
    .time-display.today {
      color: var(--fwc-gold-text);
    }

    .footer {
      margin-top: 8px;
      font-size: 0.7rem;
      color: var(--fwc-text-subtle);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .venue-icon {
      flex-shrink: 0;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @property({ type: Object }) match!: Match;
  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];
  @property({ type: Boolean }) showGroup = false;
  @property({ type: Boolean }) isToday = false;

  private get _home(): Team | undefined {
    return this.match.homeId ? TEAMS_BY_ID.get(this.match.homeId) : undefined;
  }
  private get _away(): Team | undefined {
    return this.match.awayId ? TEAMS_BY_ID.get(this.match.awayId) : undefined;
  }

  render() {
    const { match, timezone, favoriteTeamIds } = this;
    const home = this._home;
    const away = this._away;
    const formatted = formatMatchTime(match.utc, timezone);
    const hasScore = match.homeScore !== null && match.awayScore !== null;
    const isLive = match.status === 'live';
    const homeFav = home && favoriteTeamIds.includes(home.id);
    const awayFav = away && favoriteTeamIds.includes(away.id);
    const isFavoriteMatch = homeFav || awayFav;

    const homeLabel = home?.name ?? match.homeLabel ?? 'TBD';
    const awayLabel = away?.name ?? match.awayLabel ?? 'TBD';
    const homeShort = home?.shortName ?? match.homeLabel ?? 'TBD';
    const awayShort = away?.shortName ?? match.awayLabel ?? 'TBD';

    const roundLabel = ROUND_LABELS[match.round];
    const metaLabel = this.showGroup && match.group
      ? `Group ${match.group}`
      : match.round !== 'group' ? roundLabel : '';

    const ariaLabel = hasScore
      ? `${homeLabel} ${match.homeScore} – ${match.awayScore} ${awayLabel}, ${formatted.date} ${formatted.time}, ${match.venue}, ${match.city}`
      : `${homeLabel} vs ${awayLabel}, ${formatted.date} ${formatted.time}, ${match.venue}, ${match.city}`;

    return html`
      <article
        class="card ${isFavoriteMatch ? 'favorite' : ''} ${isLive ? 'live' : ''}"
        aria-label="${ariaLabel}"
      >
        <div class="meta" aria-hidden="true">
          ${isLive ? html`<span class="badge live" role="status">Live</span>` : nothing}
          ${metaLabel ? html`<span class="badge">${metaLabel}</span>` : nothing}
          <span>${match.city}</span>
          <span>·</span>
          <span>${match.venue}</span>
        </div>

        <div class="teams">
          <!-- Home team -->
          <div class="team home">
            <span class="team-flag" role="img" aria-label="${homeLabel} flag">
              ${home?.flag ?? '🏳'}
            </span>
            <span class="team-name ${homeFav ? 'favorite-team' : ''}">
              ${homeShort}
            </span>
          </div>

          <!-- Score / time -->
          <div class="score-block">
            ${hasScore
              ? html`
                <div class="score" aria-label="${homeLabel} ${match.homeScore} – ${match.awayScore} ${awayLabel}">
                  <span>${match.homeScore}</span>
                  <span class="score-sep" aria-hidden="true">–</span>
                  <span>${match.awayScore}</span>
                </div>
                ${match.homePenalty !== undefined && match.homePenalty !== null
                  ? html`<div class="time-display" aria-label="Penalties: ${match.homePenalty}–${match.awayPenalty}">(${match.homePenalty}–${match.awayPenalty} pens)</div>`
                  : nothing}
              `
              : html`
                <div class="time-display ${this.isToday ? 'today' : ''}" aria-label="${formatted.time}">
                  ${formatted.time}
                </div>
                <div class="score" aria-hidden="true">
                  <span class="score-sep">vs</span>
                </div>
              `
            }
          </div>

          <!-- Away team -->
          <div class="team away">
            <span class="team-flag" role="img" aria-label="${awayLabel} flag">
              ${away?.flag ?? '🏳'}
            </span>
            <span class="team-name ${awayFav ? 'favorite-team' : ''}">
              ${awayShort}
            </span>
          </div>
        </div>

        <div class="footer" aria-hidden="true">
          <span class="venue-icon">📍</span>
          <span>${match.venue}, ${match.city}</span>
        </div>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-match-card': FwcMatchCard;
  }
}
