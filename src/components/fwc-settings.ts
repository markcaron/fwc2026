import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TEAMS, GROUPS } from '../lib/data.js';
import { TIMEZONE_GROUPS } from '../lib/time.js';
import type { StoredPreferences } from '../lib/types.js';

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
      text-transform: uppercase;
      letter-spacing: 0.06em;
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

    select {
      width: 100%;
      min-height: 44px;
      padding: 8px 12px;
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-sm);
      color: var(--fwc-text);
      font-size: 0.88rem;
      font-family: inherit;
      cursor: pointer;
      appearance: auto;
    }
    select:focus-visible {
      outline: var(--fwc-focus-ring);
      outline-offset: var(--fwc-focus-offset);
    }

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
    .team-toggle:has(input:checked) .toggle-check {
      background: var(--fwc-highlight-ring);
      border-color: var(--fwc-highlight-ring);
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
      text-transform: uppercase;
      letter-spacing: 0.04em;
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
  `;

  @property({ type: String }) timezone = 'America/New_York';
  @property({ type: Array }) favoriteTeamIds: string[] = [];

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
              <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026" target="_blank" rel="noopener">
                Official FIFA website ↗
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
