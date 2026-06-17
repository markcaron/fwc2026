import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { loadPreferences, updatePreferences } from '../lib/storage.js';
import { formatMatchTime } from '../lib/time.js';
import { MATCHES, TEAMS_BY_ID } from '../lib/data.js';
import { fetchScores, applyScores } from '../lib/scores.js';
import { SCORES_URL } from '../lib/config.js';
import type { Match, StoredPreferences, TabId } from '../lib/types.js';
import type { PreferencesChangedEvent } from './fwc-settings.js';
import './fwc-schedule.js';
import './fwc-standings.js';
import './fwc-bracket.js';
import './fwc-settings.js';

@customElement('fwc-app')
export class FwcApp extends LitElement {
  static styles = css`
    /* Normal page flow — no fixed, no sticky, no overflow:hidden */
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    /*
     * Skip link — fixed so it overlays content without affecting layout.
     * Normally parked off-screen (top: -60px). On focus it slides into view
     * at top: 12px, centered, pill-shaped to match button style.
     * position:fixed is explicitly allowed here per product decision.
     */
    .skip-link {
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      padding: 8px 20px;
      background: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
      font-weight: 600;
      font-size: 0.85rem;
      font-family: inherit;
      text-decoration: none;
      white-space: nowrap;
      border-radius: 20px;
      box-shadow: var(--fwc-shadow-md);
      transition: top 0.15s;
    }
    .skip-link:focus {
      top: 12px;
    }
    .skip-link:focus-visible {
      outline: 2px solid var(--fwc-gold-600);
      outline-offset: 2px;
    }

    /* ── Floating header ─────────────────────────────────────── */
    /*
     * margin: 4px gives the "floating card" look without any
     * position:fixed/sticky. Everything scrolls naturally.
     * border-radius + shadow finish the floating aesthetic.
     */
    .app-header {
      margin: 4px 4px 0;
      background: linear-gradient(135deg, #163660 0%, #1f5e94 100%);
      color: #ffffff;
      padding: 20px 24px;
      padding-top: calc(20px + env(safe-area-inset-top));
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.28);
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    /*
     * Trophy icon via CSS mask — shape from world-cup.svg,
     * gold-400 (#e0b83a) gives a rich trophy-gold on the dark header.
     */
    .header-icon {
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: var(--fwc-gold-400);
      -webkit-mask: url('/public/world-cup.svg') no-repeat center / contain;
      mask: url('/public/world-cup.svg') no-repeat center / contain;
      flex-shrink: 0;
    }
    .header-text { flex: 1; min-width: 0; }
    .header-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--fwc-gold-300);
      letter-spacing: 0.01em;
      line-height: 1.2;
    }
    .header-sub {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.65);
      margin-top: 2px;
    }
    .date-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      background: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    /* ── Countdown strip ─────────────────────────────────────── */
    .countdown-strip {
      background: var(--fwc-bg-raised);
      border: 1px solid var(--fwc-border-subtle);
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      /* 0.82rem = ~13px: --fwc-text gives 7.5:1 in light, 9.5:1 in dark ✓
         (--fwc-text-muted at 0.78rem failed dark-mode AA: 4.34:1 < 4.5:1) */
      font-size: 0.82rem;
      color: var(--fwc-text);
      border-radius: 12px;
      margin: 16px 4px;
    }
    .countdown-strip.live-now {
      background: color-mix(in srgb, var(--fwc-danger) 8%, transparent);
      color: var(--fwc-danger-text);
    }
    .countdown-label { font-weight: 400; }
    .countdown-match {
      font-weight: 600;
      color: var(--fwc-text);
    }
    .countdown-match.live-now { color: var(--fwc-danger-text); }
    .countdown-time {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      color: var(--fwc-text);
      min-width: 48px;
      text-align: center;
    }
    .live-pip {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--fwc-danger);
      flex-shrink: 0;
    }
    /* Pulse only when the user has not opted out of motion */
    @media (prefers-reduced-motion: no-preference) {
      .live-pip { animation: livePip 1.2s ease-in-out infinite; }
      @keyframes livePip {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
      }
    }

    /* ── Tab nav — coach-board underline style ───────────────── */
    /*
     * Moved from the bottom to just below the floating header.
     * Underline indicator, icon above label, full-width flex tabs.
     * Mirrors the .help-tabs-wrap pattern from coach-board.
     */
    .tab-bar {
      border-bottom: 1px solid var(--fwc-border);
      padding: 0 4px;
      margin-top: 8px;
    }
    .tab-list {
      display: flex;
      gap: 2px;
      padding: 8px 0 0;
      margin: 0;
    }
    .tab-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px 10px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--fwc-tab-text);
      font: inherit;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: color 0.15s, border-color 0.15s;
      margin-bottom: -1px;
    }
    .tab-btn:hover:not([aria-selected="true"]) {
      color: var(--fwc-text);
      background: color-mix(in srgb, var(--fwc-accent) 6%, transparent);
      border-radius: 6px 6px 0 0;
    }
    .tab-btn[aria-selected="true"] {
      color: var(--fwc-tab-active);
      border-bottom-color: var(--fwc-tab-active);
      font-weight: 700;
    }
    .tab-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: -2px;
      border-radius: 6px 6px 0 0;
    }

    /* Tab icons via CSS mask — inherit color from parent .tab-btn */
    .tab-icon {
      display: block;
      width: 28px;
      height: 28px;
      background-color: currentColor;
      flex-shrink: 0;
    }
    .tab-icon-schedule  { -webkit-mask: url('/public/icon-schedule.svg')  no-repeat center / contain; mask: url('/public/icon-schedule.svg')  no-repeat center / contain; }
    .tab-icon-groups    { -webkit-mask: url('/public/icon-groups.svg')    no-repeat center / contain; mask: url('/public/icon-groups.svg')    no-repeat center / contain; }
    .tab-icon-knockouts { -webkit-mask: url('/public/icon-knockouts.svg') no-repeat center / contain; mask: url('/public/icon-knockouts.svg') no-repeat center / contain; }
    .tab-icon-settings  { -webkit-mask: url('/public/icon-settings.svg')  no-repeat center / contain; mask: url('/public/icon-settings.svg')  no-repeat center / contain; }

    /* ── Content area ────────────────────────────────────────── */
    .app-content {
      flex: 1;
      background: var(--fwc-bg-body);
    }
    .tab-panel { display: none; }
    .tab-panel[data-active] {
      display: block;
      padding-block: 16px 32px;
    }

    .visually-hidden {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    /* ── Update toast ──────────────────────────────────────────── */

    /* translateX(-50%) must be present in every keyframe stop —
       the toast uses left:50% + translateX(-50%) for centering;
       omitting it from a stop would cause a horizontal jump */
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* Exit drops 8px (vs entry 12px) — smaller offset so the
       dismissal feels deliberate rather than falling away */
    @keyframes toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
    }

    .update-toast {
      position: fixed;
      bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      width: min(560px, calc(100vw - 32px));
      background: var(--fwc-bg-raised);
      color: var(--fwc-text);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-md);
      box-shadow: var(--fwc-shadow-lg);
      font-size: 0.85rem;
      line-height: 1.5;
      font-family: inherit;
      animation: toast-in 220ms cubic-bezier(0.2, 0, 0, 1) both;
    }

    .update-toast.toast-dismissing {
      animation: toast-out 180ms ease-in forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      .update-toast,
      .update-toast.toast-dismissing { animation: none; }
    }

    .update-toast svg { flex-shrink: 0; }
    .update-toast span { flex: 1; }

    .update-toast button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 20px;
      min-height: 44px;
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-sm);
      background: var(--fwc-bg-raised);
      color: var(--fwc-text);
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .update-toast button:hover { background: var(--fwc-bg-surface); }

    .update-toast button:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    .update-toast .refresh-btn {
      background: var(--fwc-accent);
      border-color: var(--fwc-accent);
      color: var(--fwc-white);
    }

    .update-toast .refresh-btn:hover { background: var(--fwc-accent-hover); }

    .update-toast .dismiss-btn {
      background: transparent;
      border-color: var(--fwc-border);
      color: var(--fwc-text);
    }

    .update-toast .dismiss-btn:hover { background: var(--fwc-bg-surface); }
  `;

  @state() private _prefs: StoredPreferences = loadPreferences();
  @state() private _activeTab: TabId = 'schedule';
  /** Live match data — static MATCHES overlaid with any fetched scores. */
  @state() private _matches: Match[] = [...MATCHES];
  @state() private _countdown = '';
  /** Cached next match — set once per tick so _renderCountdown doesn't recompute. */
  @state() private _nextMatchCache: Match | null = null;
  @state() private _updateAvailable = false;
  @state() private _toastDismissing = false;

  /** SW controller at mount time — used to skip the toast on first-ever install */
  private _swController: ServiceWorker | null = null;
  private _swRefreshing = false;

  /**
   * Persistent live-region element appended to document.body.
   * Live regions must exist in the accessibility tree *before* content is
   * placed inside them — injecting a role="status" node fresh is missed by
   * JAWS and VoiceOver/Safari. A light-DOM element also sidesteps Shadow DOM
   * live-region mapping gaps in those same AT/browser combinations.
   */
  private _announcer: HTMLDivElement | null = null;

  private _onControllerChange = (): void => {
    // Ignore the controllerchange that fires when the SW activates for the
    // very first time (no previous controller) — that's a fresh install, not
    // an update. Also guard against the event firing twice.
    if (!this._swController || this._swRefreshing) return;
    this._swRefreshing = true;
    this._updateAvailable = true;
    if (this._announcer) {
      this._announcer.textContent =
        'A new version of the app is available. Use the Refresh button to update.';
    }
    // Shift focus to the Dismiss button once Lit has rendered the toast
    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector<HTMLElement>('.dismiss-btn')?.focus();
    });
  };

  /** Dismisses the toast with an optional exit animation and returns focus
   *  to a stable element before the toast node is removed from the DOM. */
  private _dismissToast(): void {
    if (this._toastDismissing) return;
    this._toastDismissing = true;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    // Return focus before the toast is destroyed — without this the browser
    // drops focus to document.body, a WCAG 2.4.3 (Focus Order) failure.
    const returnTarget =
      this.shadowRoot?.querySelector<HTMLElement>('.skip-link') ??
      this.shadowRoot?.querySelector<HTMLElement>('#tab-schedule');
    returnTarget?.focus();
    setTimeout(() => {
      this._updateAvailable = false;
      this._toastDismissing = false;
    }, delay);
  }

  /** Find the next live or upcoming match. Uses a 30-min lookback so a
   *  match that kicked off recently (but hasn't updated to 'live' yet) doesn't
   *  linger as "0m 00s" for a long time. */
  private _computeNextMatch(): Match | null {
    const now = Date.now();
    const live = this._matches.find(m => m.status === 'live');
    if (live) return live;
    return this._matches
      .filter(m => m.status === 'scheduled' && new Date(m.utc).getTime() > now - 60_000 * 30)
      .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime())[0] ?? null;
  }

  private _tickTimer: ReturnType<typeof setInterval> | null = null;

  private _tick(): void {
    const next = this._computeNextMatch();
    this._nextMatchCache = next;
    if (!next) { this._countdown = ''; return; }
    if (next.status === 'live') { this._countdown = 'live'; return; }
    const secs = Math.max(0, Math.floor((new Date(next.utc).getTime() - Date.now()) / 1000));
    if (secs === 0) {
      // Match is at kickoff but not yet flagged live — avoid misleading "0m 00s"
      this._countdown = 'starting';
      return;
    }
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    this._countdown = h > 0
      ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
      : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }

  private get _todayLabel(): string {
    return formatMatchTime(new Date().toISOString(), this._prefs.timezone).dateShort;
  }

  // ── Scores lifecycle ──────────────────────────────────────
  private async _loadScores(): Promise<void> {
    const payload = await fetchScores(SCORES_URL);
    this._matches = applyScores(MATCHES, payload);
  }

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  private _startPoll(): void {
    this._stopPoll();
    // Refresh every 60 s while visible — matches the /api/scores CDN
    // stale-while-revalidate=60 TTL so we never serve staler data than
    // the cache already holds (#12)
    this._pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') this._loadScores();
    }, 60_000);
  }

  private _stopPoll(): void {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  private _onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this._loadScores();
      // Resume ticking when the tab comes back into focus
      if (this._tickTimer === null) {
        this._tick();
        this._tickTimer = setInterval(() => this._tick(), 1000);
      }
    } else {
      // Pause the interval while the tab is hidden — browsers throttle it
      // anyway, but pausing explicitly avoids any accumulated lag on resume
      if (this._tickTimer !== null) {
        clearInterval(this._tickTimer);
        this._tickTimer = null;
      }
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadScores();
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    this._tick();
    this._tickTimer = setInterval(() => this._tick(), 1000);
    this._startPoll();

    if ('serviceWorker' in navigator) {
      this._swController = navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', this._onControllerChange);
    }

    // Persistent light-DOM live region — must exist before content is added
    // so AT registers it as a live region at boot, not at first announcement.
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    Object.assign(announcer.style, {
      position: 'absolute', width: '1px', height: '1px',
      overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)',
      whiteSpace: 'nowrap', border: '0',
    });
    document.body.appendChild(announcer);
    this._announcer = announcer;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    if (this._tickTimer !== null) clearInterval(this._tickTimer);
    this._stopPoll();
    navigator.serviceWorker?.removeEventListener('controllerchange', this._onControllerChange);
    this._announcer?.remove();
    this._announcer = null;
  }

  private _handlePrefsChanged(e: Event) {
    const ev = e as PreferencesChangedEvent;
    this._prefs = updatePreferences(ev.prefs);
  }

  private _selectTab(tab: TabId) { this._activeTab = tab; }

  private _onTabKeydown(e: KeyboardEvent, current: TabId) {
    const tabs: TabId[] = ['schedule', 'groups', 'bracket', 'settings'];
    const idx = tabs.indexOf(current);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    this._activeTab = tabs[next];
    this.shadowRoot?.querySelector<HTMLButtonElement>(`#tab-${tabs[next]}`)?.focus();
  }

  private _renderCountdown() {
    const next = this._nextMatchCache;
    if (!next || !this._countdown) return nothing;

    const isLive     = this._countdown === 'live';
    const isStarting = this._countdown === 'starting';
    const homeTeam = next.homeId ? TEAMS_BY_ID.get(next.homeId) : null;
    const awayTeam = next.awayId ? TEAMS_BY_ID.get(next.awayId) : null;
    const homeLabel = homeTeam?.shortName ?? next.homeLabel ?? 'TBD';
    const awayLabel = awayTeam?.shortName ?? next.awayLabel ?? 'TBD';
    // "versus" in aria-label; "vs" in visible text (screen readers pronounce "vs" literally)
    const matchVisual = `${homeLabel} vs ${awayLabel}`;
    const matchAria   = `${homeLabel} versus ${awayLabel}`;

    if (isLive) {
      return html`
        <div class="countdown-strip live-now" role="status"
             aria-label="${matchAria} is live now">
          <span class="live-pip" aria-hidden="true"></span>
          <span class="countdown-match live-now">${matchVisual}</span>
          <span class="countdown-label">is live now</span>
        </div>
      `;
    }

    if (isStarting) {
      return html`
        <div class="countdown-strip live-now" role="status"
             aria-label="${matchAria} is starting now">
          <span class="live-pip" aria-hidden="true"></span>
          <span class="countdown-match live-now">${matchVisual}</span>
          <span class="countdown-label">starting now</span>
        </div>
      `;
    }

    const fmt = formatMatchTime(next.utc, this._prefs.timezone);
    return html`
      <div class="countdown-strip" role="timer"
           aria-label="Countdown to next match">
        <span class="countdown-label">Next match in</span>
        <span class="countdown-time">${this._countdown}</span>
        <span class="countdown-match">${matchVisual}</span>
        <span class="countdown-label">${fmt.dateShort} · ${fmt.time}</span>
      </div>
    `;
  }

  render() {
    const { _prefs: prefs, _activeTab: active, _matches: matches } = this;

    return html`
      <a href="#main-content" class="skip-link">Skip to content</a>

      <header class="app-header" role="banner">
        <div class="header-inner">
          <div class="header-icon" role="img" aria-label="World Cup trophy"></div>
          <div class="header-text">
            <div class="header-title">FIFA World Cup 2026™</div>
            <div class="header-sub">USA · Canada · Mexico · Jun 11 – Jul 19</div>
          </div>
          <span class="date-pill" aria-label="Today, ${this._todayLabel}">
            ${this._todayLabel}
          </span>
        </div>
      </header>

      <!-- Countdown / live strip — between header and tab bar -->
      ${this._renderCountdown()}

      <!-- Tab bar below the floating header -->
      <nav class="tab-bar" aria-label="Main navigation">
        <div class="tab-list" role="tablist">
          <button
            class="tab-btn" id="tab-schedule" role="tab"
            aria-selected="${active === 'schedule'}"
            aria-controls="panel-schedule"
            tabindex="${active === 'schedule' ? '0' : '-1'}"
            @click="${() => this._selectTab('schedule')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'schedule')}"
          >
            <span class="tab-icon tab-icon-schedule" aria-hidden="true"></span>
            <span>Schedule</span>
          </button>

          <button
            class="tab-btn" id="tab-groups" role="tab"
            aria-selected="${active === 'groups'}"
            aria-controls="panel-groups"
            tabindex="${active === 'groups' ? '0' : '-1'}"
            @click="${() => this._selectTab('groups')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'groups')}"
          >
            <span class="tab-icon tab-icon-groups" aria-hidden="true"></span>
            <span>Groups</span>
          </button>

          <button
            class="tab-btn" id="tab-bracket" role="tab"
            aria-selected="${active === 'bracket'}"
            aria-controls="panel-bracket"
            tabindex="${active === 'bracket' ? '0' : '-1'}"
            @click="${() => this._selectTab('bracket')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'bracket')}"
          >
            <span class="tab-icon tab-icon-knockouts" aria-hidden="true"></span>
            <span>Knockouts</span>
          </button>

          <button
            class="tab-btn" id="tab-settings" role="tab"
            aria-selected="${active === 'settings'}"
            aria-controls="panel-settings"
            tabindex="${active === 'settings' ? '0' : '-1'}"
            @click="${() => this._selectTab('settings')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'settings')}"
          >
            <span class="tab-icon tab-icon-settings" aria-hidden="true"></span>
            <span>Settings</span>
          </button>
        </div>
      </nav>

      ${this._updateAvailable ? html`
        <div class="update-toast ${this._toastDismissing ? 'toast-dismissing' : ''}"
             role="region"
             aria-label="App update notification"
             aria-labelledby="toast-msg"
             @keydown="${(e: KeyboardEvent) => { if (e.key === 'Escape') this._dismissToast(); }}">
          <svg viewBox="0 0 1200 1200" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="m855.52 688.45c-248.88-56.199-287.43-94.75-343.62-343.62-2.5742-11.375-12.699-19.477-24.398-19.477s-21.824 8.1016-24.398 19.477c-56.227 248.88-94.75 287.43-343.62 343.62-11.398 2.6016-19.5 12.699-19.5 24.398 0 11.699 8.1016 21.801 19.5 24.398 248.88 56.227 287.4 94.773 343.62 343.62 2.5742 11.375 12.699 19.477 24.398 19.477s21.824-8.1016 24.398-19.477c56.227-248.85 94.75-287.4 343.62-343.62 11.398-2.6016 19.477-12.699 19.477-24.398 0-11.699-8.1016-21.801-19.477-24.398z"/>
            <path d="m1080.5 300.98c-132.3-29.875-150.88-48.449-180.75-180.73-2.6016-11.398-12.699-19.477-24.398-19.477s-21.801 8.0742-24.398 19.477c-29.875 132.27-48.449 150.85-180.73 180.73-11.398 2.6016-19.477 12.699-19.477 24.398s8.0742 21.801 19.477 24.398c132.27 29.875 150.85 48.449 180.73 180.75 2.6016 11.375 12.699 19.477 24.398 19.477s21.801-8.1016 24.398-19.477c29.875-132.3 48.449-150.88 180.75-180.75 11.375-2.6016 19.477-12.699 19.477-24.398s-8.1016-21.801-19.477-24.398z"/>
          </svg>
          <span id="toast-msg">A new version of the app is available.</span>
          <button class="dismiss-btn"
                  ?disabled="${this._toastDismissing}"
                  @click="${() => this._dismissToast()}">Dismiss</button>
          <button class="refresh-btn"
                  aria-label="Refresh to apply new version"
                  ?disabled="${this._toastDismissing}"
                  @click="${() => window.location.reload()}">Refresh</button>
        </div>
      ` : nothing}

      <main class="app-content" id="main-content">
        <div class="tab-panel" id="panel-schedule" role="tabpanel"
             aria-labelledby="tab-schedule"
             ?data-active="${active === 'schedule'}">
          <fwc-schedule
            .matchData="${matches}"
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-schedule>
        </div>

        <div class="tab-panel" id="panel-groups" role="tabpanel"
             aria-labelledby="tab-groups"
             ?data-active="${active === 'groups'}">
          <fwc-standings
            .matchData="${matches}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-standings>
        </div>

        <div class="tab-panel" id="panel-bracket" role="tabpanel"
             aria-labelledby="tab-bracket"
             ?data-active="${active === 'bracket'}">
          <fwc-bracket
            .matchData="${matches}"
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-bracket>
        </div>

        <div class="tab-panel" id="panel-settings" role="tabpanel"
             aria-labelledby="tab-settings"
             ?data-active="${active === 'settings'}"
             @preferences-changed="${this._handlePrefsChanged}">
          <fwc-settings
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-settings>
        </div>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-app': FwcApp;
  }
}
