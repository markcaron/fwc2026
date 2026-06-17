import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TEAMS, GROUPS } from '../lib/data.js';
import { TIMEZONE_GROUPS } from '../lib/time.js';
import type { StoredPreferences } from '../lib/types.js';
import { CARET } from '../lib/icons.js';

export class PreferencesChangedEvent extends Event {
  static readonly eventName = 'preferences-changed' as const;
  constructor(public prefs: Partial<StoredPreferences>) {
    super(PreferencesChangedEvent.eventName, { bubbles: true, composed: true });
  }
}

@customElement('fwc-settings')
export class FwcSettings extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 8px 12px 32px;
      max-width: 600px;
      margin: 0 auto;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      padding: 0 4px 8px;
      border-bottom: 1px solid var(--fwc-border-subtle);
      margin-bottom: 12px;
    }

    .field {
      margin-bottom: 14px;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--fwc-text);
      margin-bottom: 6px;
    }
    .hint {
      font-size: 0.75rem;
      color: var(--fwc-text-muted);
      margin-top: 4px;
    }

    /* Timezone select — chip-wrap pattern mirrors fwc-schedule.ts select chips */
    .tz-chip-wrap {
      position: relative;
      display: inline-flex;
      align-items: stretch;
      width: 100%;
    }
    .tz-chip-wrap select {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      min-height: 44px;
      padding: 0 44px 0 14px;
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: 20px;
      color: var(--fwc-text);
      font-size: 0.88rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .tz-chip-wrap select:hover {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .tz-chip-wrap select:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .tz-chip-wrap .chip-caret {
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
    .tz-chip-wrap:has(select:hover) .chip-caret { color: var(--fwc-text); }

    /* Favorite teams grid */
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 6px;
    }

    .team-toggle {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 10px;
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-sm);
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s;
      min-height: 44px;
      user-select: none;
    }
    .team-toggle:hover {
      background: var(--fwc-bg-raised);
      border-color: var(--fwc-highlight-ring);
    }
    .team-toggle input[type="checkbox"] {
      /* visually hide checkbox — label handles full-width click target */
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }
    /* highlight-ring: navy-500 in light (6.1:1 ✓), gold in dark */
    .team-toggle:has(input:checked) {
      background: var(--fwc-bg-raised);
      border-color: var(--fwc-highlight-ring);
      box-shadow: 0 0 0 1px var(--fwc-highlight-ring);
    }
    .team-toggle:focus-within {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    .toggle-flag { font-size: 1.2rem; line-height: 1; }
    .toggle-name {
      flex: 1;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fwc-text);
      line-height: 1.2;
    }
    .toggle-check {
      width: 16px;
      height: 16px;
      border: 2px solid var(--fwc-border);
      border-radius: 3px;
      background: var(--fwc-bg-primary);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.12s, background 0.12s;
    }
    /*
     * Checked bg → gold so the --fwc-text-on-gold (navy-900) stroke is legible.
     * gold #C9A227 + navy-900 #0a1b2e = 7.83:1 ✓
     * Previous: navy-500 bg + navy-900 stroke ≈ 1.5:1 — failed.
     */
    .team-toggle:has(input:checked) .toggle-check {
      background: var(--fwc-gold);
      border-color: var(--fwc-gold);
    }
    .check-mark {
      width: 8px;
      height: 8px;
      display: none;
    }
    .team-toggle:has(input:checked) .check-mark {
      display: block;
    }

    .group-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--fwc-text-muted);
      margin: 10px 0 5px;
      padding: 0 2px;
    }

    .clear-btn {
      min-height: 36px;
      padding: 6px 14px;
      background: transparent;
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-sm);
      color: var(--fwc-text-muted);
      font-size: 0.82rem;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      margin-top: 8px;
    }
    .clear-btn:hover {
      background: var(--fwc-bg-surface);
      color: var(--fwc-text);
    }
    .clear-btn:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    .info-card {
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-md);
      padding: 12px 14px;
      font-size: 0.8rem;
      color: var(--fwc-text-muted);
      line-height: 1.6;
    }
    .info-card strong {
      color: var(--fwc-text);
      font-weight: 700;
    }
    .info-card a {
      color: var(--fwc-accent);
      text-decoration: none;
    }
    .info-card a:hover { text-decoration: underline; }

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

    .selected-count {
      font-size: 0.72rem;
      color: var(--fwc-text-muted);
      margin-left: 6px;
    }
    /* gold-text: navy-700 in light (10.5:1 ✓), gold-300 in dark (11.8:1 ✓) */
    .selected-count.has-selection {
      color: var(--fwc-gold-text);
      font-weight: 700;
    }

    /* ── Match Notifications ────────────────────────────────────────────── */

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 44px;
      cursor: pointer;
    }
    .toggle-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--fwc-text);
    }
    .toggle-sublabel {
      font-size: 0.75rem;
      color: var(--fwc-text-muted);
      margin-top: 2px;
    }

    /* Switch — the visible affordance for the enable/disable toggle */
    .switch {
      position: relative;
      width: 44px;
      height: 26px;
      flex-shrink: 0;
    }
    .switch input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .switch-track {
      display: block;
      width: 44px;
      height: 26px;
      border-radius: 13px;
      background: var(--fwc-border);
      transition: background 0.2s;
      cursor: pointer;
    }
    .switch-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      transition: transform 0.2s;
      pointer-events: none;
    }
    .switch input:checked ~ .switch-track { background: var(--fwc-accent); }
    .switch input:checked ~ .switch-thumb { transform: translateX(18px); }
    .switch input:focus-visible ~ .switch-track {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

    /* Scope radios */
    .scope-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 10px;
    }
    .scope-option {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      cursor: pointer;
    }
    .scope-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .radio-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--fwc-border);
      background: var(--fwc-bg-primary);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.12s;
    }
    .radio-dot::after {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--fwc-accent);
      opacity: 0;
      transition: opacity 0.12s;
    }
    .scope-option.is-selected .radio-dot {
      border-color: var(--fwc-accent);
    }
    .scope-option.is-selected .radio-dot::after { opacity: 1; }
    .scope-option input[type="radio"]:focus-visible ~ .radio-dot {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }
    .scope-option-label {
      font-size: 0.85rem;
      color: var(--fwc-text);
    }

    .notif-disabled {
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
    }
    .ios-note {
      margin-top: 8px;
      font-size: 0.75rem;
      color: var(--fwc-text-muted);
      line-height: 1.5;
    }
    .notif-error {
      margin-top: 8px;
      font-size: 0.78rem;
      color: var(--fwc-text-muted);
      background: var(--fwc-bg-surface);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-sm);
      padding: 8px 10px;
    }
  `;

  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];
  @property({ type: Boolean }) notificationsEnabled = false;
  @property({ type: String }) notificationScope: 'favorites' | 'all' = 'favorites';

  /** True while permission request / subscribe call is in flight */
  @state() private _notifPending = false;
  /** Non-empty string shown when something goes wrong */
  @state() private _notifError = '';

  private _isIosBrowser(): boolean {
    return /iP(hone|ad|od)/.test(navigator.userAgent) && !(window.navigator as Navigator & { standalone?: boolean }).standalone;
  }

  private async _onNotifToggle(e: Event) {
    const input = e.target as HTMLInputElement;
    const enabling = input.checked;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      this._notifError = 'Web Push is not supported in this browser.';
      return;
    }

    if (this._isIosBrowser()) {
      this._notifError = 'On iOS, add this app to your Home Screen first, then enable notifications.';
      input.checked = !enabling;
      return;
    }

    this._notifPending = true;
    this._notifError   = '';

    try {
      if (enabling) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          this._notifError = 'Notification permission was denied. You can re-enable it in your browser settings.';
          input.checked = false;
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const vapidKey = (document.querySelector('meta[name="vapid-public-key"]') as HTMLMetaElement | null)?.content ?? '';
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            allMatches: this.notificationScope === 'all',
            favoriteTeamIds: this.favoriteTeamIds,
          }),
        });

        this.dispatchEvent(new PreferencesChangedEvent({ notificationsEnabled: true }));
      } else {
        // Unsubscribe from push and remove from server
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        this.dispatchEvent(new PreferencesChangedEvent({ notificationsEnabled: false }));
      }
    } catch (err) {
      console.error('[fwc-settings] notification toggle error:', err);
      this._notifError = 'Something went wrong. Please try again.';
      input.checked = !enabling;
    } finally {
      this._notifPending = false;
    }
  }

  private _onScopeChange(scope: 'favorites' | 'all') {
    this.dispatchEvent(new PreferencesChangedEvent({ notificationScope: scope }));

    // Update the server-side subscription if already subscribed
    if (this.notificationsEnabled) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription()
      ).then(sub => {
        if (!sub) return;
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            allMatches: scope === 'all',
            favoriteTeamIds: this.favoriteTeamIds,
          }),
        }).catch(console.error);
      }).catch(console.error);
    }
  }

  private _onTimezoneChange(e: Event) {
    const tz = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(new PreferencesChangedEvent({ timezone: tz }));
  }

  private _toggleFavorite(teamId: string) {
    const current = new Set(this.favoriteTeamIds);
    if (current.has(teamId)) {
      current.delete(teamId);
    } else {
      current.add(teamId);
    }
    this.dispatchEvent(new PreferencesChangedEvent({ favoriteTeamIds: [...current] }));
  }

  private _clearFavorites() {
    this.dispatchEvent(new PreferencesChangedEvent({ favoriteTeamIds: [] }));
  }

  render() {
    const { timezone, favoriteTeamIds } = this;
    const favCount = favoriteTeamIds.length;

    return html`
      <div role="region" aria-label="App settings">

        <!-- Timezone -->
        <div class="section">
          <div class="section-title">Time Zone</div>
          <div class="field">
            <label for="tz-select">Display match times in</label>
            <div class="tz-chip-wrap">
              <select
                id="tz-select"
                .value="${timezone}"
                @change="${this._onTimezoneChange}"
              >
                ${TIMEZONE_GROUPS.map(g => html`
                  <optgroup label="${g.label}">
                    ${g.zones.map(z => html`
                      <option value="${z.value}" ?selected="${z.value === timezone}">
                        ${z.label}
                      </option>
                    `)}
                  </optgroup>
                `)}
              </select>
              ${CARET}
            </div>
            ${!TIMEZONE_GROUPS.flatMap(g => g.zones).some(z => z.value === timezone) ? html`
              <div class="hint" role="note">
                Your timezone (<strong>${timezone}</strong>) is active but not shown in the list above.
              </div>
            ` : nothing}
            <div class="hint">
              Times across the schedule, bracket, and standings will update to reflect your selection.
            </div>
          </div>
        </div>

        <!-- Favorite teams -->
        <div class="section">
          <div class="section-title">
            Favorite Teams
            <span class="selected-count ${favCount > 0 ? 'has-selection' : ''}">
              ${favCount > 0 ? `(${favCount} selected)` : ''}
            </span>
          </div>

          <fieldset style="border:none;margin:0;padding:0;">
            <legend class="visually-hidden">Select favorite teams to highlight throughout the app</legend>
            ${GROUPS.map(g => html`
              <div class="group-label" aria-hidden="true">Group ${g}</div>
              <div class="teams-grid" role="group" aria-label="Group ${g} teams">
                ${TEAMS.filter(t => t.group === g).map(t => {
                  const checked = favoriteTeamIds.includes(t.id);
                  return html`
                    <label
                      class="team-toggle"
                      title="${checked ? 'Remove from favorites' : 'Add to favorites'}: ${t.name}"
                    >
                      <input
                        type="checkbox"
                        .checked="${checked}"
                        @change="${() => this._toggleFavorite(t.id)}"
                        aria-label="${t.name}"
                      />
                      <span class="toggle-flag" role="img" aria-hidden="true">${t.flag}</span>
                      <span class="toggle-name">${t.shortName}</span>
                      <span class="toggle-check" aria-hidden="true">
                        <svg class="check-mark" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4l2 2 4-4" stroke="var(--fwc-text-on-gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                    </label>
                  `;
                })}
              </div>
            `)}
          </fieldset>

          ${favCount > 0
            ? html`
              <button
                class="clear-btn"
                @click="${this._clearFavorites}"
                aria-label="Clear all favorite teams"
              >Clear favorites</button>
            `
            : nothing
          }
        </div>

        <!-- Match Notifications -->
        <div class="section" aria-busy="${this._notifPending ? 'true' : 'false'}">
          <div class="section-title">Match Notifications</div>

          <!-- Outer <label> makes the visible text "Kickoff alerts" the
               accessible name (WCAG 2.5.3) and extends the click target to
               the full row (WCAG 2.5.5). role="switch" tells AT this is a
               toggle, not a checkbox. -->
          <label class="toggle-row">
            <span>
              <span class="toggle-label">Kickoff alerts</span>
              <span class="toggle-sublabel">Notify me 5 minutes before kickoff</span>
            </span>
            <span class="switch">
              <input
                type="checkbox"
                role="switch"
                .checked="${this.notificationsEnabled}"
                ?disabled="${this._notifPending}"
                @change="${this._onNotifToggle}"
              />
              <span class="switch-track" aria-hidden="true"></span>
              <span class="switch-thumb" aria-hidden="true"></span>
            </span>
          </label>

          <!-- Always in the DOM so JAWS registers the live region before
               content fires — injecting role="alert" fresh can be missed. -->
          <div class="notif-error" role="alert" aria-live="assertive" aria-atomic="true">
            ${this._notifError}
          </div>

          <fieldset
            class="scope-group ${this.notificationsEnabled ? '' : 'notif-disabled'}"
            ?disabled="${!this.notificationsEnabled}"
          >
            <legend class="visually-hidden">Notify me for</legend>

            <label class="scope-option ${this.notificationScope === 'favorites' ? 'is-selected' : ''}">
              <input
                type="radio"
                name="notif-scope"
                value="favorites"
                .checked="${this.notificationScope === 'favorites'}"
                @change="${() => this._onScopeChange('favorites')}"
              />
              <span class="radio-dot" aria-hidden="true"></span>
              <span class="scope-option-label">Favorite teams only</span>
            </label>

            <label class="scope-option ${this.notificationScope === 'all' ? 'is-selected' : ''}">
              <input
                type="radio"
                name="notif-scope"
                value="all"
                .checked="${this.notificationScope === 'all'}"
                @change="${() => this._onScopeChange('all')}"
              />
              <span class="radio-dot" aria-hidden="true"></span>
              <span class="scope-option-label">All matches</span>
            </label>
          </fieldset>

          ${this._isIosBrowser() ? html`
            <p class="ios-note">
              <strong>iOS users:</strong> Notifications require adding this app to your
              Home Screen. Open the Share menu in Safari and tap
              <em>Add to Home Screen</em>, then return here to enable alerts.
            </p>
          ` : nothing}
        </div>

        <!-- About -->
        <div class="section">
          <div class="section-title">About</div>
          <div class="info-card">
            <p><strong>FIFA World Cup 2026™</strong></p>
            <p>June 11 – July 19, 2026 · USA, Canada &amp; Mexico</p>
            <p style="margin-top:8px">48 teams · 12 groups · 104 matches</p>
            <p style="margin-top:8px">
              Schedule data sourced from official FIFA fixtures. 
              Your preferences are saved locally in this browser.
            </p>
            <p style="margin-top:8px">
              <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026" target="_blank" rel="noopener noreferrer">
                Official FIFA website
                <span class="visually-hidden">(opens in new tab)</span> ↗
              </a>
            </p>
          </div>
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-settings': FwcSettings;
  }
}
