import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MATCHES, TEAMS, GROUPS } from '../lib/data.js';
import { formatMatchTime, getLocalDateString, getTodayString } from '../lib/time.js';
import type { Match, ScheduleFilter } from '../lib/types.js';
import { ROUND_LABELS } from '../lib/types.js';
import './fwc-match-card.js';

/** Down-chevron reused in every select chip */
const CARET = html`
  <svg class="chip-caret" viewBox="0 0 10 6" fill="none" aria-hidden="true" focusable="false">
    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

@customElement('fwc-schedule')
export class FwcSchedule extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 0 0 16px;
    }

    /* ── Filter bar ─────────────────────────────────────────── */
    .filter-bar {
      background: var(--fwc-bg-body);
      border-bottom: 1px solid var(--fwc-border-subtle);
    }

    /*
     * Two wrapping flex rows. flex-wrap:wrap lets chips reflow on narrow screens
     * without the overflow:auto that used to clip focus rings.
     * 6px top padding + 6px bottom padding on each row gives the 4px clearance
     * that :focus-visible outlines (2px ring + 2px offset) need on all sides.
     */
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 16px;
      align-items: center;
    }
    .filter-divider {
      height: 1px;
      background: var(--fwc-border-subtle);
      margin: 0 12px;
    }

    /* ── Toggle buttons ─────────────────────────────────────── */
    .filter-btn {
      flex-shrink: 0;
      min-height: 36px;        /* ≥ 36px touch target */
      padding: 5px 14px;
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    /* Star icon used inside the Favorites button */
    .btn-icon {
      display: inline-block;
      width: 14px;
      height: 14px;
      background-color: currentColor;
      flex-shrink: 0;
      -webkit-mask: url('/public/icon-star.svg') no-repeat center / contain;
      mask: url('/public/icon-star.svg') no-repeat center / contain;
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

    /* ── Select chips ───────────────────────────────────────── */
    .chip-wrap {
      position: relative;
      display: inline-flex;
      align-items: stretch;
      flex-shrink: 0;
    }
    .chip-wrap select {
      appearance: none;
      -webkit-appearance: none;
      min-height: 36px;        /* ≥ 36px touch target */
      padding: 0 36px 0 12px;
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .chip-wrap select:hover {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .chip-wrap.active select {
      background: var(--fwc-gold);
      border-color: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
    }
    .chip-wrap.active select:hover {
      background: var(--fwc-gold-hover);
      border-color: var(--fwc-gold-hover);
    }
    .chip-wrap select:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    /* Caret SVG — absolutely centered on the right */
    .chip-caret {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 6px;
      pointer-events: none;
      color: var(--fwc-text-muted);
      transition: color 0.15s;
    }
    .chip-wrap.active .chip-caret { color: var(--fwc-text-on-gold); }
    .chip-wrap:not(.active):has(select:hover) .chip-caret { color: var(--fwc-text); }

    /* ── Day sections ───────────────────────────────────────── */
    .day-section { margin-top: 4px; }

    /*
     * .day-header is a flex row for the date label, TODAY pill, match count.
     * When in single-day view (--navigable modifier) it gains prev/next arrow
     * buttons on each side that let users step through match days.
     */
    .day-header {
      padding: 10px 16px 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .day-header--navigable {
      padding-left: 8px;
      padding-right: 8px;
    }

    /*
     * Day-nav arrow buttons — inside the day header when in single-day view.
     * 36px × 36px touch target. Transparent background so they don't compete
     * with the content. Disabled state uses reduced opacity + no-drop cursor.
     */
    .day-arrow {
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
    .day-arrow:hover:not(:disabled) {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .day-arrow:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .day-arrow:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .day-arrow svg {
      width: 7px;
      height: 12px;
      flex-shrink: 0;
    }

    .day-header-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      justify-content: center;
    }

    /*
     * Calendar-icon date picker: the visible button triggers showPicker()
     * on a hidden <input type="date">. The text label stays human-readable
     * (e.g. "Thursday, Jun 11") while the icon gives access to the picker.
     */
    .date-pick-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .date-pick-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: 1px solid var(--fwc-border);
      border-radius: 6px;
      color: var(--fwc-text-muted);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
    }
    .date-pick-btn:hover {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
      border-color: var(--fwc-accent);
    }
    .date-pick-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .date-pick-btn svg { width: 14px; height: 14px; }
    /* Hidden input — only used to access the native date picker via showPicker() */
    .date-input-hidden {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
      inset: 0;
    }

    /*
     * date-pill: same gold-pill style used in the app header's date badge.
     * Both must look identical — if this class changes, update fwc-app.ts too.
     * gold bg + navy text = 7.8:1 ✓
     */
    .date-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      background: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .count-label {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--fwc-text-subtle);
      text-transform: none;
      white-space: nowrap;
    }

    /* ── Match list ─────────────────────────────────────────── */
    .match-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 16px;
      list-style: none;
      margin: 0;
    }
    .match-list li { list-style: none; }

    /* ── Empty state ────────────────────────────────────────── */
    .empty-state {
      padding: 40px 24px;
      text-align: center;
      color: var(--fwc-text-muted);
    }
    .empty-state .empty-icon { font-size: 2rem; }
    .empty-state p { font-size: 0.9rem; margin-top: 8px; }
    .empty-state .empty-hint {
      font-size: 0.78rem;
      color: var(--fwc-text-subtle);
      margin-top: 4px;
    }
  `;

  /** Live match array passed down from fwc-app (static MATCHES + fetched scores). */
  @property({ type: Array }) matchData: Match[] = [...MATCHES];
  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];

  /** Single source of truth — all select bindings derive from this. */
  @state() private _filter: ScheduleFilter = { type: 'today' };

  // ── Derived select bindings ───────────────────────────────
  private get _groupValue() { return this._filter.type === 'group' ? (this._filter.value ?? '') : ''; }
  private get _teamValue()  { return this._filter.type === 'team'  ? (this._filter.value ?? '') : ''; }
  private get _roundValue() { return this._filter.type === 'round' ? (this._filter.value ?? '') : ''; }

  // ── Match days (sorted YYYY-MM-DD strings in user's timezone) ─
  private _getMatchDays(): string[] {
    const tz = this.timezone;
    const days = new Set<string>();
    for (const m of this.matchData) {
      days.add(getLocalDateString(m.utc, tz));
    }
    return [...days].sort();
  }

  /** The date string currently being viewed in single-day modes. */
  private get _viewingDate(): string {
    if (this._filter.type === 'today') return getTodayString(this.timezone);
    if (this._filter.type === 'date' && this._filter.value) return this._filter.value;
    return getTodayString(this.timezone);
  }

  private _navigateDay(delta: 1 | -1): void {
    const days = this._getMatchDays();
    const current = this._viewingDate;
    const idx = days.indexOf(current);
    const clamped = Math.max(0, Math.min(days.length - 1, idx + delta));
    const newDate = days[clamped];
    const today = getTodayString(this.timezone);
    this._filter = newDate === today
      ? { type: 'today' }
      : { type: 'date', value: newDate };
  }

  /** Navigate to a specific date string (YYYY-MM-DD).
   *  If there are no matches on that exact date, clamp to the nearest match day. */
  private _navigateToDate(dateStr: string): void {
    const days = this._getMatchDays();
    const today = getTodayString(this.timezone);
    // If an exact match exists, use it; otherwise find the nearest day
    const exact = days.find(d => d === dateStr);
    if (exact) {
      this._filter = exact === today ? { type: 'today' } : { type: 'date', value: exact };
      return;
    }
    // Find closest day by date arithmetic
    const target = new Date(dateStr + 'T12:00:00Z').getTime();
    let nearest = days[0];
    let minDiff = Infinity;
    for (const d of days) {
      const diff = Math.abs(new Date(d + 'T12:00:00Z').getTime() - target);
      if (diff < minDiff) { minDiff = diff; nearest = d; }
    }
    this._filter = nearest === today ? { type: 'today' } : { type: 'date', value: nearest };
  }

  private get _filteredMatches(): Match[] {
    const { type, value } = this._filter;
    const tz = this.timezone;
    const dateOf = (m: Match) => getLocalDateString(m.utc, tz);
    switch (type) {
      case 'today':
        return this.matchData.filter(m => dateOf(m) === getTodayString(tz));
      case 'date':
        return this.matchData.filter(m => dateOf(m) === value);
      case 'favorites':
        return this.matchData.filter(m =>
          (m.homeId && this.favoriteTeamIds.includes(m.homeId)) ||
          (m.awayId && this.favoriteTeamIds.includes(m.awayId))
        );
      case 'group':
        return this.matchData.filter(m => m.round === 'group' && m.group === value);
      case 'team':
        return this.matchData.filter(m => m.homeId === value || m.awayId === value);
      case 'round':
        return this.matchData.filter(m => m.round === value);
      default:
        return [...this.matchData];
    }
  }

  private _set(filter: ScheduleFilter) { this._filter = filter; }

  render() {
    const filtered = this._filteredMatches;
    const tz = this.timezone;
    const today = getTodayString(tz);
    const { type } = this._filter;
    const isSingleDay = type === 'today' || type === 'date';
    const hasFavorites = this.favoriteTeamIds.length > 0;

    // Day nav state — only matters in single-day view
    const matchDays = isSingleDay ? this._getMatchDays() : [];
    const viewDate = isSingleDay ? this._viewingDate : today;
    const dayIdx = matchDays.indexOf(viewDate);
    const canPrev = dayIdx > 0;
    const canNext = dayIdx < matchDays.length - 1 && dayIdx >= 0;

    // "Today" pill shown only in multi-day views where it provides useful
    // context. In single-day view (Today / Date filter) it's redundant.
    const showTodayPill = !isSingleDay;

    // Group matches by local date for rendering
    const byDate = new Map<string, Match[]>();
    for (const m of filtered) {
      const d = getLocalDateString(m.utc, tz);
      byDate.set(d, [...(byDate.get(d) ?? []), m]);
    }
    const sortedDates = [...byDate.keys()].sort();

    return html`
      <div role="region" aria-label="Match schedule">

        <!-- ── Filter bar ────────────────────────────────── -->
        <div class="filter-bar">

          <!-- Row 1: quick toggles -->
          <div class="filter-group" role="group" aria-label="Quick filters">
            <button
              class="filter-btn"
              aria-pressed="${type === 'all'}"
              @click="${() => this._set({ type: 'all' })}"
            >All Matches</button>

            <button
              class="filter-btn"
              aria-pressed="${type === 'today'}"
              @click="${() => this._set({ type: 'today' })}"
            >Today</button>

            ${hasFavorites ? html`
              <button
                class="filter-btn"
                aria-pressed="${type === 'favorites'}"
                @click="${() => this._set({ type: 'favorites' })}"
            ><span class="btn-icon" aria-hidden="true"></span> Favorites</button>
            ` : nothing}
          </div>

          <div class="filter-divider" role="separator" aria-hidden="true"></div>

          <!-- Row 2: dimensional select chips -->
          <div class="filter-group" role="group" aria-label="Filter by dimension">
            <div class="chip-wrap ${type === 'group' ? 'active' : ''}">
              <select
                aria-label="Filter by group"
                .value="${this._groupValue}"
                @change="${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value;
                  this._set(v ? { type: 'group', value: v } : { type: 'all' });
                }}"
              >
                <option value="">All Groups</option>
                ${GROUPS.map(g => html`<option value="${g}">Group ${g}</option>`)}
              </select>
              ${CARET}
            </div>

            <div class="chip-wrap ${type === 'team' ? 'active' : ''}">
              <select
                aria-label="Filter by team"
                .value="${this._teamValue}"
                @change="${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value;
                  this._set(v ? { type: 'team', value: v } : { type: 'all' });
                }}"
              >
                <option value="">Teams</option>
                ${GROUPS.map(g => html`
                  <optgroup label="Group ${g}">
                    ${TEAMS.filter(t => t.group === g).map(t => html`
                      <option value="${t.id}">${t.flag} ${t.shortName}</option>
                    `)}
                  </optgroup>
                `)}
              </select>
              ${CARET}
            </div>

            <div class="chip-wrap ${type === 'round' ? 'active' : ''}">
              <select
                aria-label="Filter by round"
                .value="${this._roundValue}"
                @change="${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value;
                  this._set(v ? { type: 'round', value: v } : { type: 'all' });
                }}"
              >
                <option value="">All Rounds</option>
                ${Object.entries(ROUND_LABELS).map(([k, v]) => html`
                  <option value="${k}">${v}</option>
                `)}
              </select>
              ${CARET}
            </div>
          </div>
        </div>

        <!-- ── Match list ────────────────────────────────── -->
        ${filtered.length === 0
          ? this._renderEmpty(isSingleDay, viewDate, today)
          : sortedDates.map(dateStr => {
              const dayMatches = byDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              const fmt = formatMatchTime(dayMatches[0].utc, tz);
              const dayLabel = `${fmt.dayOfWeek}, ${fmt.dateShort}`;

              return html`
                <section class="day-section" aria-label="${isToday ? `Today, ${dayLabel}` : dayLabel}">
                  <!--
                    Day header: gains ← → navigation arrows when in single-day
                    view (type === 'today' or 'date') so users can step through
                    match days without going back to the filter bar.
                  -->
                  <div class="day-header ${isSingleDay ? 'day-header--navigable' : ''}">

                    ${isSingleDay ? html`
                      <button
                        class="day-arrow"
                        aria-label="Previous match day"
                        ?disabled="${!canPrev}"
                        @click="${() => this._navigateDay(-1)}"
                      >
                        <svg viewBox="0 0 7 12" fill="none" aria-hidden="true">
                          <path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.5"
                                stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    ` : nothing}

                    <div class="day-header-content">
                      <span>${dayLabel}</span>
                      ${isToday && showTodayPill
                        ? html`<span class="date-pill" role="note">Today</span>`
                        : nothing}
                      <span class="count-label">
                        ${dayMatches.length} match${dayMatches.length !== 1 ? 'es' : ''}
                      </span>
                      ${isSingleDay ? html`
                        <div class="date-pick-wrap">
                          <button
                            class="date-pick-btn"
                            aria-label="Jump to date"
                            title="Jump to date"
                            @click="${(e: Event) => {
                              const wrap = (e.currentTarget as HTMLElement).parentElement!;
                              const inp = wrap.querySelector<HTMLInputElement>('.date-input-hidden');
                              inp?.showPicker?.();
                            }}"
                          >
                            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                              <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" stroke-width="1.2"/>
                              <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                              <line x1="9.5" y1="1" x2="9.5" y2="4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                            </svg>
                          </button>
                          <input
                            class="date-input-hidden"
                            type="date"
                            .value="${viewDate}"
                            min="2026-06-11"
                            max="2026-07-19"
                            tabindex="-1"
                            aria-hidden="true"
                            @change="${(e: Event) => this._navigateToDate((e.target as HTMLInputElement).value)}"
                          />
                        </div>
                      ` : nothing}
                    </div>

                    ${isSingleDay ? html`
                      <button
                        class="day-arrow"
                        aria-label="Next match day"
                        ?disabled="${!canNext}"
                        @click="${() => this._navigateDay(1)}"
                      >
                        <svg viewBox="0 0 7 12" fill="none" aria-hidden="true">
                          <path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                                stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    ` : nothing}

                  </div>

                  <ul class="match-list" role="list">
                    ${dayMatches.map(m => html`
                      <li role="listitem">
                        <fwc-match-card
                          .match="${m}"
                          .timezone="${tz}"
                          .favoriteTeamIds="${this.favoriteTeamIds}"
                          .showGroup="${type !== 'group'}"
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

  private _renderEmpty(isSingleDay: boolean, viewDate: string, today: string) {
    const fmt = formatMatchTime(
      new Date(viewDate + 'T12:00:00').toISOString(),
      this.timezone
    );
    return html`
      <div class="empty-state" role="status">
        <div class="empty-icon">⚽</div>
        <p>${isSingleDay
          ? `No matches on ${viewDate === today ? 'today' : fmt.dateShort}.`
          : 'No matches found for this filter.'
        }</p>
        ${isSingleDay ? html`
          <p class="empty-hint">Use the ← → arrows in a day header to find the next match day.</p>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-schedule': FwcSchedule;
  }
}
