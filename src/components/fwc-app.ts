import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { loadPreferences, updatePreferences } from '../lib/storage.js';
import { getTodayString, formatMatchTime } from '../lib/time.js';
import { MATCHES } from '../lib/data.js';
import type { StoredPreferences, TabId } from '../lib/types.js';
import type { PreferencesChangedEvent } from './fwc-settings.js';
import './fwc-schedule.js';
import './fwc-standings.js';
import './fwc-bracket.js';
import './fwc-settings.js';

@customElement('fwc-app')
export class FwcApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    /* ── Header ─────────────────────────────────────── */
    .app-header {
      background: var(--fwc-header-bg);
      color: #fff;
      padding: 12px 16px 10px;
      padding-top: calc(12px + env(safe-area-inset-top));
      box-shadow: var(--fwc-shadow-header);
      flex-shrink: 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header-trophy {
      font-size: 1.6rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .header-text { flex: 1; min-width: 0; }
    .header-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--fwc-gold);
      letter-spacing: 0.01em;
      line-height: 1.2;
    }
    .header-sub {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.7);
      margin-top: 1px;
    }
    .header-today {
      text-align: right;
      flex-shrink: 0;
    }
    .today-badge {
      display: inline-block;
      background: rgba(201,162,39,0.2);
      border: 1px solid var(--fwc-gold);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--fwc-gold);
    }
    .today-match-count {
      font-size: 0.68rem;
      color: rgba(255,255,255,0.5);
      margin-top: 2px;
      text-align: right;
    }

    /* ── Content area ───────────────────────────────── */
    .app-content {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      background: var(--fwc-bg-body);
    }
    .tab-panel {
      display: none;
      min-height: 100%;
    }
    .tab-panel[data-active] {
      display: block;
    }

    /* ── Bottom tab bar ─────────────────────────────── */
    .tab-bar {
      flex-shrink: 0;
      background: var(--fwc-tab-bg);
      border-top: 1px solid var(--fwc-border);
      box-shadow: var(--fwc-shadow-tab);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .tab-list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      max-width: 600px;
      margin: 0 auto;
    }
    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-height: 56px;
      padding: 6px 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--fwc-tab-text);
      transition: color 0.15s;
      font-family: inherit;
      position: relative;
    }
    .tab-btn[aria-selected="true"] {
      color: var(--fwc-tab-active);
    }
    .tab-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 2px;
      background: var(--fwc-tab-active);
      border-radius: 0 0 2px 2px;
      transform: scaleX(0);
      transition: transform 0.15s;
    }
    .tab-btn[aria-selected="true"]::before {
      transform: scaleX(1);
    }
    .tab-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: -2px;
    }

    .tab-icon { font-size: 1.3rem; line-height: 1; }
    .tab-label {
      font-size: 0.64rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    /* Today badge on Schedule tab */
    .tab-pip {
      position: absolute;
      top: 8px;
      right: calc(50% - 12px);
      width: 7px;
      height: 7px;
      background: var(--fwc-danger);
      border-radius: 50%;
      border: 1.5px solid var(--fwc-tab-bg);
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

  @state() private _prefs: StoredPreferences = loadPreferences();
  @state() private _activeTab: TabId = 'schedule';

  private get _todayMatchCount(): number {
    const today = getTodayString(this._prefs.timezone);
    return MATCHES.filter(m => {
      const d = new Intl.DateTimeFormat('en-CA', {
        timeZone: this._prefs.timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(m.utc));
      return d === today;
    }).length;
  }

  private get _todayLabel(): string {
    const fmt = formatMatchTime(new Date().toISOString(), this._prefs.timezone);
    return fmt.dateShort;
  }

  private _handlePrefsChanged(e: Event) {
    const ev = e as PreferencesChangedEvent;
    this._prefs = updatePreferences(ev.prefs);
  }

  private _selectTab(tab: TabId) {
    this._activeTab = tab;
  }

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
    // Move focus to the newly selected tab button
    this.shadowRoot?.querySelector<HTMLButtonElement>(`#tab-${tabs[next]}`)?.focus();
  }

  render() {
    const { _prefs: prefs, _activeTab: active } = this;
    const todayCount = this._todayMatchCount;

    return html`
      <!-- Skip-to-content link for keyboard/screen reader users -->
      <a href="#main-content" class="visually-hidden" tabindex="0"
         style="position:fixed;top:4px;left:4px;z-index:9999;background:var(--fwc-gold);color:var(--fwc-text-on-gold);padding:6px 12px;border-radius:4px;">
        Skip to content
      </a>

      <header class="app-header" role="banner">
        <div class="header-inner">
          <div class="header-trophy" role="img" aria-label="Trophy">🏆</div>
          <div class="header-text">
            <div class="header-title">FIFA World Cup 2026™</div>
            <div class="header-sub">USA · Canada · Mexico · Jun 11 – Jul 19</div>
          </div>
          <div class="header-today" aria-label="${todayCount} matches today, ${this._todayLabel}">
            <div class="today-badge">${this._todayLabel}</div>
            ${todayCount > 0
              ? html`<div class="today-match-count">${todayCount} match${todayCount !== 1 ? 'es' : ''} today</div>`
              : html``
            }
          </div>
        </div>
      </header>

      <main class="app-content" id="main-content">
        <div
          class="tab-panel"
          id="panel-schedule"
          role="tabpanel"
          aria-labelledby="tab-schedule"
          ?data-active="${active === 'schedule'}"
          tabindex="0"
        >
          <fwc-schedule
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-schedule>
        </div>

        <div
          class="tab-panel"
          id="panel-groups"
          role="tabpanel"
          aria-labelledby="tab-groups"
          ?data-active="${active === 'groups'}"
          tabindex="0"
        >
          <fwc-standings
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-standings>
        </div>

        <div
          class="tab-panel"
          id="panel-bracket"
          role="tabpanel"
          aria-labelledby="tab-bracket"
          ?data-active="${active === 'bracket'}"
          tabindex="0"
        >
          <fwc-bracket
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-bracket>
        </div>

        <div
          class="tab-panel"
          id="panel-settings"
          role="tabpanel"
          aria-labelledby="tab-settings"
          ?data-active="${active === 'settings'}"
          tabindex="0"
          @preferences-changed="${this._handlePrefsChanged}"
        >
          <fwc-settings
            .timezone="${prefs.timezone}"
            .favoriteTeamIds="${prefs.favoriteTeamIds}"
          ></fwc-settings>
        </div>
      </main>

      <nav class="tab-bar" role="navigation" aria-label="Main navigation">
        <div class="tab-list" role="tablist">
          <button
            class="tab-btn"
            id="tab-schedule"
            role="tab"
            aria-selected="${active === 'schedule'}"
            aria-controls="panel-schedule"
            tabindex="${active === 'schedule' ? '0' : '-1'}"
            @click="${() => this._selectTab('schedule')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'schedule')}"
          >
            ${todayCount > 0 ? html`<span class="tab-pip" aria-hidden="true"></span>` : html``}
            <span class="tab-icon" aria-hidden="true">📅</span>
            <span class="tab-label">Schedule</span>
          </button>

          <button
            class="tab-btn"
            id="tab-groups"
            role="tab"
            aria-selected="${active === 'groups'}"
            aria-controls="panel-groups"
            tabindex="${active === 'groups' ? '0' : '-1'}"
            @click="${() => this._selectTab('groups')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'groups')}"
          >
            <span class="tab-icon" aria-hidden="true">📊</span>
            <span class="tab-label">Groups</span>
          </button>

          <button
            class="tab-btn"
            id="tab-bracket"
            role="tab"
            aria-selected="${active === 'bracket'}"
            aria-controls="panel-bracket"
            tabindex="${active === 'bracket' ? '0' : '-1'}"
            @click="${() => this._selectTab('bracket')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'bracket')}"
          >
            <span class="tab-icon" aria-hidden="true">🥊</span>
            <span class="tab-label">Bracket</span>
          </button>

          <button
            class="tab-btn"
            id="tab-settings"
            role="tab"
            aria-selected="${active === 'settings'}"
            aria-controls="panel-settings"
            tabindex="${active === 'settings' ? '0' : '-1'}"
            @click="${() => this._selectTab('settings')}"
            @keydown="${(e: KeyboardEvent) => this._onTabKeydown(e, 'settings')}"
          >
            <span class="tab-icon" aria-hidden="true">⚙️</span>
            <span class="tab-label">Settings</span>
          </button>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-app': FwcApp;
  }
}
