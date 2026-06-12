import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { MATCHES, TEAMS, GROUPS, TEAMS_BY_ID } from '../lib/data.js';
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

    /* ── Search input ───────────────────────────────────────── */
    .search-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex: 1;
      min-width: 120px;
      max-width: 280px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      width: 14px;
      height: 14px;
      color: var(--fwc-text-muted);
      pointer-events: none;
      flex-shrink: 0;
    }
    .search-input {
      width: 100%;
      min-height: 36px;
      padding: 0 32px 0 30px;
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text);
      font-size: 0.78rem;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .search-input::placeholder { color: var(--fwc-text-muted); }
    .search-input:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
      border-color: var(--fwc-accent);
    }
    /* Active only when there is a real (non-whitespace) query (#15) */
    .search-input.has-query { border-color: var(--fwc-accent); }
    .search-clear {
      position: absolute;
      right: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: var(--fwc-bg-surface);
      border: none;
      border-radius: 50%;
      color: var(--fwc-text-muted);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .search-clear:hover { background: var(--fwc-border); color: var(--fwc-text); }
    .search-clear:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .search-clear svg { width: 10px; height: 10px; }

    /* Visually hidden live region for screen reader result announcements */
    .search-status {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
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
    }
    /* Centering only in single-day (navigable) view, not all-matches list */
    .day-header--navigable .day-header-content {
      justify-content: center;
    }

    /* Visually hidden live region for AT announcements on view change */
    .nav-announce {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
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
      min-width: 36px;
      min-height: 36px;
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
    .date-pick-btn:active {
      background: var(--fwc-bg-surface);
      border-color: var(--fwc-accent);
    }
    .date-pick-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .date-pick-btn svg { width: 18px; height: 18px; }
    /*
     * Hidden input is anchored at the BOTTOM of the wrapper so the browser
     * positions the native date picker popup below the button, not over it.
     */
    .date-input-hidden {
      position: absolute;
      top: 100%;
      left: 0;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
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
    .empty-state .empty-icon {
      font-size: 2rem;
      color: var(--fwc-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }
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
  /** Text announced to screen readers when the schedule view changes. */
  @state() private _announcement = '';

  /** Ref to the hidden date input — avoids fragile parentElement traversal. */
  @query('.date-input-hidden') private _dateInput?: HTMLInputElement;

  /** Tournament bounds derived from the fixture list — never hardcoded. */
  private get _minDate(): string {
    return this.matchData.reduce((a, b) => a.utc < b.utc ? a : b).utc.slice(0, 10);
  }
  private get _maxDate(): string {
    return this.matchData.reduce((a, b) => a.utc > b.utc ? a : b).utc.slice(0, 10);
  }

  /** Current search query — drives the 'search' filter type. */
  @state() private _searchQuery = '';
  /** Filter active before search was initiated — restored on Escape / clear. */
  @state() private _preSearchFilter: ScheduleFilter = { type: 'today' };

  @query('.search-input') private _searchEl?: HTMLInputElement;

  // ── Fuzzy match helper ─────────────────────────────────────
  private _matchesSearch(query: string, m: Match): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const check = (str: string | undefined | null) =>
      str != null && str.toLowerCase().includes(q);
    const homeTeam = m.homeId ? TEAMS_BY_ID.get(m.homeId) : undefined;
    const awayTeam = m.awayId ? TEAMS_BY_ID.get(m.awayId) : undefined;
    return (
      check(homeTeam?.name)      || check(homeTeam?.shortName) || check(homeTeam?.code) ||
      check(awayTeam?.name)      || check(awayTeam?.shortName) || check(awayTeam?.code) ||
      check(m.homeLabel)         || check(m.awayLabel) ||
      check(m.city)              || check(m.venue)
    );
  }

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
    if (!days.length) return;
    const current = this._viewingDate;
    const idx = days.indexOf(current);
    const clamped = Math.max(0, Math.min(days.length - 1, idx + delta));
    const newDate = days[clamped];
    const today = getTodayString(this.timezone);
    this._filter = newDate === today
      ? { type: 'today' }
      : { type: 'date', value: newDate };
    this._announce(newDate);
  }

  /** Navigate to a specific date string (YYYY-MM-DD).
   *  If there are no matches on that exact date, snaps to the nearest match day.
   *  Announces the resulting date to assistive technologies. */
  private _navigateToDate(dateStr: string): void {
    const days = this._getMatchDays();
    if (!days.length) return;                        // guard against empty array
    const today = getTodayString(this.timezone);
    // If an exact match exists, use it; otherwise find the nearest day
    const exact = days.find(d => d === dateStr);
    if (exact) {
      this._filter = exact === today ? { type: 'today' } : { type: 'date', value: exact };
      this._announce(exact, exact !== dateStr);
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
    this._announce(nearest, true /* snapped */);
  }

  /** Update the live-region announcement after a navigation. */
  private _announce(dateStr: string, snapped = false): void {
    const fmt = formatMatchTime(dateStr + 'T12:00:00Z', this.timezone);
    const label = `Showing matches for ${fmt.dayOfWeek}, ${fmt.dateShort}`;
    this._announcement = snapped
      ? `${label} (nearest match day)`
      : label;
  }

  private get _filteredMatches(): Match[] {
    const { type, value } = this._filter;
    const tz = this.timezone;
    const dateOf = (m: Match) => getLocalDateString(m.utc, tz);
    switch (type) {
      case 'search':
        return this.matchData.filter(m => this._matchesSearch(this._searchQuery, m));
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

  private _set(filter: ScheduleFilter) {
    // Clearing the query when switching away from search prevents a stale
    // "Brazil" showing in the input after the user clicks a filter chip (#15)
    if (filter.type !== 'search') this._searchQuery = '';
    this._filter = filter;
  }

  render() {
    const filtered = this._filteredMatches;
    const tz = this.timezone;
    const today = getTodayString(tz);
    const { type } = this._filter;
    const isSearch    = type === 'search';
    const isSingleDay = type === 'today' || type === 'date';
    const hasFavorites = this.favoriteTeamIds.length > 0;
    const minDate = this._minDate;
    const maxDate = this._maxDate;

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
        <!-- Live region: announces view changes to screen readers (WCAG 4.1.3) -->
        <div class="nav-announce" aria-live="polite" aria-atomic="true">
          ${this._announcement}
        </div>
        <!-- Live region: announces search result count to screen readers -->
        <div class="search-status" aria-live="polite" aria-atomic="true">
          ${isSearch && this._searchQuery.trim()
            ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} found for "${this._searchQuery.trim()}"`
            : ''}
        </div>

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

            <!-- Search — role="search" omitted (landmark scope is the full region above) -->
            <div class="search-wrap">
              <svg class="search-icon" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/>
                <path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              <input
                class="search-input ${this._searchQuery.trim() ? 'has-query' : ''}"
                type="text"
                placeholder="Search teams, cities…"
                aria-label="Search by team, city, or venue"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                .value="${this._searchQuery}"
                @input="${(e: Event) => {
                  const q = (e.target as HTMLInputElement).value;
                  // Capture current filter before switching to search so we
                  // can restore it when the user cancels (#15)
                  if (this._filter.type !== 'search' && q.trim()) {
                    this._preSearchFilter = { ...this._filter };
                  }
                  this._searchQuery = q;
                  this._set(q.trim() ? { type: 'search' } : this._preSearchFilter);
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === 'Escape') {
                    this._set(this._preSearchFilter); // restores Today/All/etc.
                    this._searchEl?.blur();
                  }
                }}"
              />
              ${this._searchQuery ? html`
                <button
                  class="search-clear"
                  aria-label="Clear search"
                  @click="${() => {
                    this._set(this._preSearchFilter); // restores Today/All/etc.
                    this._searchEl?.focus();
                  }}"
                >
                  <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              ` : nothing}
            </div>

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
          ? this._renderEmpty(isSingleDay, isSearch, viewDate, today)
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
                      ${isSingleDay ? html`
                        <div class="date-pick-wrap">
                          <button
                            class="date-pick-btn"
                            aria-label="Pick a match date"
                            @click="${() => this._dateInput?.showPicker?.()}"
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
                            min="${minDate}"
                            max="${maxDate}"
                            tabindex="-1"
                            aria-hidden="true"
                            @change="${(e: Event) => this._navigateToDate((e.target as HTMLInputElement).value)}"
                          />
                        </div>
                      ` : nothing}
                      <span class="count-label">
                        ${dayMatches.length} match${dayMatches.length !== 1 ? 'es' : ''}
                      </span>
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

  private _renderEmpty(isSingleDay: boolean, isSearch: boolean, viewDate: string, today: string) {
    const fmt = formatMatchTime(
      new Date(viewDate + 'T12:00:00Z').toISOString(),
      this.timezone
    );
    return html`
      <div class="empty-state" role="status">
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 1200 1200" width="36" height="36" fill="currentColor">
          <path d="m926.48 219.66c-12-1.5938-24-3.5156-36.656-5.9062-40.031-7.6406-79.359-18.75-117.19-32.719v-53.953l-16.734-10.266c-60.75-37.219-131.81-51.375-200.48-39.938-9.2812 1.5938-18.844 3.4219-28.688 5.6719-42.047 9.7969-82.312 24.75-120.1 44.625v-45.656c0-25.078-20.391-45.469-45.469-45.469h-53.109c-25.031 0-45.469 20.391-45.469 45.469v68.953c-8.3906 6.2344-12.281 17.156-8.4375 27.375 1.7344 4.5938 4.7344 8.25 8.4375 10.922v290.81c-8.3438 6.1875-12.281 17.109-8.4375 27.375 1.6875 4.5 4.8281 7.875 8.4375 10.547v600.24c0 25.547 20.766 46.312 46.312 46.312h51.375c25.547 0 46.312-20.766 46.312-46.312v-598.4c40.922-24.562 84.797-42.703 130.87-53.25 8.8125-2.0156 17.438-3.7031 25.875-5.1562 29.297-4.9219 59.297-4.125 88.734 2.1562v84.938c0 8.9062 5.0625 16.875 12.844 21l-0.09375 0.1875c66.188 35.156 138.84 60.562 215.95 75.516 13.594 2.625 26.438 4.6406 39.281 6.375l27.188 3.6562 0.046874-432.32-20.812-2.8125zm-615.84-34.641c7.9219-1.3594 15.891-2.1562 24-2.1562h0.65625c7.8281 0.046875 15.609 0.9375 23.344 2.2969v280.6c-7.6406-0.98437-15.328-1.6406-23.109-1.6875-8.2031-0.046874-16.547 0.70313-24.891 1.7812zm48-101.02v52.547c-7.6406-0.98438-15.375-1.5938-23.109-1.6406-8.4844 0.09375-16.734 0.79688-24.891 1.8281v-52.688h48zm0 1032-48 1.6406v-603.47c7.9219-1.3594 15.891-2.1562 24-2.1562h0.65625c7.875 0.046875 15.656 0.84375 23.344 2.1562zm196.74-702.52c-9.2812 1.5938-18.844 3.4219-28.594 5.6719-41.812 9.6094-82.125 24.562-120.19 44.578v-134.29c4.3125-2.2031 8.4375-4.4531 12.938-6.6094 2.0625-0.98437 3-3.5156 1.9688-5.625-1.0312-2.1094-3.5156-3-5.625-1.9688-3.2812 1.5469-6.1875 3.1875-9.375 4.7812v-137.95c40.5-24.281 84.469-42.047 130.87-52.875 8.8125-2.0156 17.438-3.7031 25.875-5.1094 54.797-9.1875 111.8 1.4062 161.26 29.812v141.61c-1.5938-0.79688-3.1406-1.7812-4.7344-2.5781-2.1094-1.0312-4.5938-0.14062-5.625 1.9688-0.98438 2.0625-0.09375 4.5938 1.9688 5.5781 2.8125 1.3594 5.5312 3.0938 8.3438 4.5469v131.44c-6.7969-3.0938-13.641-5.9531-20.625-8.4844-37.125-13.641-77.344-20.156-117-18.047-10.594 0.5625-21.141 1.7344-31.641 3.4688zm334.5 184.03c-60.984-11.812-118.73-30.984-172.6-56.344l48.141-47.156c5.2031-5.1094 7.6406-12.281 6.9375-19.5 0.046875-0.65625 0.28125-1.2656 0.28125-1.9219v-80.953c8.5781 3.0938 16.969 6.4219 25.688 9.2344 0.42188 0.14062 0.84375 0.1875 1.3125 0.1875 1.7812 0 3.4219-1.125 4.0312-2.9062 0.70312-2.2031-0.51562-4.5938-2.7188-5.2969-9.5625-3.0938-18.891-6.7031-28.266-10.172v-150.79c35.156 12.094 71.391 21.844 108.19 28.875 6.2812 1.2188 12.469 2.2969 18.469 3.2812v153.32c-2.4844-0.42188-4.8281-0.79688-7.3594-1.2656-7.4531-1.4062-14.766-2.9531-21.938-4.5-2.2031-0.46875-4.5 0.9375-5.0156 3.1875-0.46875 2.25 0.9375 4.5 3.1875 5.0156 7.2656 1.5938 14.672 3.1406 22.172 4.5938 3.0938 0.60938 5.9531 0.98438 8.9531 1.5469v173.29c-3.0938-0.5625-6.2344-1.125-9.375-1.7344z"/>
        </svg>
      </div>
        <p>${isSearch
          ? `No matches found for "${this._searchQuery}".`
          : isSingleDay
            ? `No matches on ${viewDate === today ? 'today' : fmt.dateShort}.`
            : 'No matches found for this filter.'
        }</p>
        ${isSingleDay && !isSearch ? html`
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
