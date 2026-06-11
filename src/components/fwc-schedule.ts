import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MATCHES, TEAMS, TEAMS_BY_ID, GROUPS } from '../lib/data.js';
import { formatMatchTime, groupByDate, getTodayString } from '../lib/time.js';
import type { Match, ScheduleFilter } from '../lib/types.js';
import { ROUND_LABELS } from '../lib/types.js';
import './fwc-match-card.js';

@customElement('fwc-schedule')
export class FwcSchedule extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 0 0 16px;
    }

    /* Filter bar */
    .filter-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--fwc-bg-body);
      border-bottom: 1px solid var(--fwc-border-subtle);
    }
    /*
     * Focus-ring fix: overflow-x:auto clips :focus-visible outlines at the
     * container boundary. Padding inside the scroll area gives the 4px
     * (2px offset + 2px ring width) of clearance the outline needs on all
     * four sides so it is never cropped.
     */
    .filter-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 6px 12px 8px;
    }
    .filter-row::-webkit-scrollbar { display: none; }

    .filter-btn {
      flex-shrink: 0;
      min-height: 32px;
      padding: 4px 12px;
      /*
       * bg-primary (white in light) gives text-muted (#4a6380) a 5.6:1 ratio ✓.
       * bg-surface (#dde4ed in light) only gave 4.45:1 — just under AA for
       * normal-weight text at 0.78rem.
       */
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .filter-btn:hover {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .filter-btn[aria-pressed="true"] {
      background: var(--fwc-gold);
      border-color: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
    }
    .filter-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    .filter-select {
      height: 32px;
      padding: 0 8px;
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text);
      font-size: 0.78rem;
      font-family: inherit;
      cursor: pointer;
    }
    .filter-select:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    /* Day sections */
    .day-section {
      margin-top: 4px;
    }
    .day-header {
      padding: 12px 16px 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .today-pill {
      background: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      text-transform: uppercase;
    }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 12px;
      list-style: none;
      margin: 0;
    }
    .match-list li {
      list-style: none;
    }

    /* Round headers (for knockout view) */
    .round-header {
      padding: 14px 16px 6px;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--fwc-text);
      border-bottom: 1px solid var(--fwc-border-subtle);
      margin-bottom: 4px;
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: var(--fwc-text-muted);
    }
    .empty-state p { font-size: 0.9rem; margin-top: 8px; }

    .count-label {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--fwc-text-subtle);
      text-transform: none;
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

  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];

  @state() private _filter: ScheduleFilter = { type: 'all' };
  @state() private _groupSelect = 'A';
  @state() private _teamSelect = '';
  @state() private _roundSelect = 'group';

  private get _filteredMatches(): Match[] {
    const { type, value } = this._filter;
    switch (type) {
      case 'today': {
        const today = getTodayString(this.timezone);
        return MATCHES.filter(m => {
          const d = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.timezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
          }).format(new Date(m.utc));
          return d === today;
        });
      }
      case 'group':
        return MATCHES.filter(m => m.round === 'group' && m.group === value);
      case 'team':
        return MATCHES.filter(m => m.homeId === value || m.awayId === value);
      case 'round':
        return MATCHES.filter(m => m.round === value);
      default:
        return [...MATCHES];
    }
  }

  private _setFilter(filter: ScheduleFilter) {
    this._filter = filter;
  }

  render() {
    const filtered = this._filteredMatches;
    const today = getTodayString(this.timezone);
    const byDate = groupByDate(filtered, this.timezone);
    const sortedDates = [...byDate.keys()].sort();
    const { type } = this._filter;

    return html`
      <div role="region" aria-label="Match schedule">
        <div class="filter-bar" role="toolbar" aria-label="Schedule filters">
          <div class="filter-row">
            <button
              class="filter-btn"
              aria-pressed="${type === 'all'}"
              @click="${() => this._setFilter({ type: 'all' })}"
            >All Matches</button>

            <button
              class="filter-btn"
              aria-pressed="${type === 'today'}"
              @click="${() => this._setFilter({ type: 'today' })}"
            >Today</button>

            <button
              class="filter-btn"
              aria-pressed="${type === 'group' || false}"
              @click="${() => this._setFilter({ type: 'group', value: this._groupSelect })}"
            >Group</button>

            <label class="visually-hidden" for="group-select">Filter by group</label>
            <select
              id="group-select"
              class="filter-select"
              .value="${this._groupSelect}"
              @change="${(e: Event) => {
                this._groupSelect = (e.target as HTMLSelectElement).value;
                this._filter = { type: 'group', value: this._groupSelect };
              }}"
              aria-label="Select group"
            >
              ${GROUPS.map(g => html`<option value="${g}">Group ${g}</option>`)}
            </select>

            <button
              class="filter-btn"
              aria-pressed="${type === 'team'}"
              @click="${() => { if (this._teamSelect) this._setFilter({ type: 'team', value: this._teamSelect }); }}"
            >Team</button>

            <label class="visually-hidden" for="team-select">Filter by team</label>
            <select
              id="team-select"
              class="filter-select"
              .value="${this._teamSelect}"
              @change="${(e: Event) => {
                this._teamSelect = (e.target as HTMLSelectElement).value;
                if (this._teamSelect) this._filter = { type: 'team', value: this._teamSelect };
              }}"
              aria-label="Select team"
            >
              <option value="">Pick a team…</option>
              ${GROUPS.map(g => html`
                <optgroup label="Group ${g}">
                  ${TEAMS.filter(t => t.group === g).map(t => html`
                    <option value="${t.id}">${t.flag} ${t.name}</option>
                  `)}
                </optgroup>
              `)}
            </select>

            ${this.favoriteTeamIds.length > 0
              ? html`
                <button
                  class="filter-btn"
                  aria-pressed="${type === 'team' && this.favoriteTeamIds.includes(this._filter.value ?? '')}"
                  @click="${() => {
                    if (this.favoriteTeamIds.length === 1) {
                      this._setFilter({ type: 'team', value: this.favoriteTeamIds[0] });
                    } else {
                      // Show all matches involving any favorite team
                      this._setFilter({ type: 'all' });
                    }
                  }}"
                >⭐ Favorites</button>
              `
              : nothing
            }

            <button
              class="filter-btn"
              aria-pressed="${type === 'round'}"
              @click="${() => this._setFilter({ type: 'round', value: this._roundSelect })}"
            >Round</button>

            <label class="visually-hidden" for="round-select">Filter by round</label>
            <select
              id="round-select"
              class="filter-select"
              .value="${this._roundSelect}"
              @change="${(e: Event) => {
                this._roundSelect = (e.target as HTMLSelectElement).value;
                this._filter = { type: 'round', value: this._roundSelect };
              }}"
              aria-label="Select round"
            >
              ${Object.entries(ROUND_LABELS).map(([k, v]) => html`
                <option value="${k}">${v}</option>
              `)}
            </select>
          </div>
        </div>

        ${filtered.length === 0
          ? html`
            <div class="empty-state" role="status">
              <div style="font-size: 2rem">⚽</div>
              <p>No matches found for this filter.</p>
            </div>
          `
          : sortedDates.map(dateStr => {
              const dayMatches = byDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              const fmt = formatMatchTime(dayMatches[0].utc, this.timezone);
              const dayLabel = isToday
                ? `Today — ${fmt.dayOfWeek}, ${fmt.dateShort}`
                : `${fmt.dayOfWeek}, ${fmt.dateShort}`;

              return html`
                <section class="day-section" aria-label="${dayLabel}">
                  <div class="day-header">
                    <span>${isToday ? `Today — ${fmt.dayOfWeek}, ${fmt.dateShort}` : `${fmt.dayOfWeek}, ${fmt.dateShort}`}</span>
                    ${isToday ? html`<span class="today-pill" role="note">Today</span>` : nothing}
                    <span class="count-label">${dayMatches.length} match${dayMatches.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <ul class="match-list" role="list">
                    ${dayMatches.map(m => html`
                      <li role="listitem">
                        <fwc-match-card
                          .match="${m}"
                          .timezone="${this.timezone}"
                          .favoriteTeamIds="${this.favoriteTeamIds}"
                          .showGroup="${type === 'all' || type === 'team' || type === 'round'}"
                          .isToday="${isToday}"
                        ></fwc-match-card>
                      </li>
                    `)}
                  </ul>
                </section>
              `;
            })
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-schedule': FwcSchedule;
  }
}
