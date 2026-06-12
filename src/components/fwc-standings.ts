import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MATCHES, GROUPS, TEAMS_BY_ID, computeStandings, GROUP_COLORS } from '../lib/data.js';
import type { Match, GroupStanding } from '../lib/types.js';
import type { GroupLetter } from '../lib/data.js';

@customElement('fwc-standings')
export class FwcStandings extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 8px 12px 24px;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 480px) {
      .groups-grid { grid-template-columns: 1fr; }
    }
    @media (min-width: 900px) {
      .groups-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .group-card {
      background: var(--fwc-bg-primary);
      border: 1px solid var(--fwc-border);
      border-radius: var(--fwc-radius-md);
      overflow: hidden;
      box-shadow: var(--fwc-shadow-sm);
    }

    .group-header {
      padding: 8px 12px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--fwc-text);
      border-bottom: 1px solid var(--fwc-border);
      display: flex;
      align-items: center;
      gap: 6px;
      /* background set inline via group color */
    }
    .group-letter {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.78rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.76rem;
    }
    thead th {
      padding: 5px 4px;
      text-align: center;
      color: var(--fwc-text-subtle);
      font-weight: 600;
      font-size: 0.68rem;
      border-bottom: 1px solid var(--fwc-border-subtle);
    }
    thead th.team-col { text-align: left; padding-left: 8px; }

    tbody tr {
      border-bottom: 1px solid var(--fwc-border-subtle);
      transition: background 0.1s;
    }
    tbody tr:last-child { border-bottom: none; }
    /* row tint set inline per group — no global pos-1/pos-2/pos-3 overrides needed */
    tbody tr:hover { filter: brightness(0.97); }

    /* highlight-ring: navy-500 in light (6.1:1 on white ✓), gold in dark */
    tbody tr.favorite-row {
      outline: 1px solid var(--fwc-highlight-ring);
      outline-offset: -1px;
    }

    td {
      padding: 7px 4px;
      text-align: center;
      color: var(--fwc-text-muted);
      font-variant-numeric: tabular-nums;
    }
    td.team-col {
      text-align: left;
      padding-left: 8px;
      min-width: 0;
    }
    td.pts {
      font-weight: 700;
      color: var(--fwc-text);
    }
    td.gd.positive { color: var(--fwc-qualified); }
    td.gd.negative { color: var(--fwc-danger-text); }

    .team-cell {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    /* pos-indicator: a colored tile with a symbol marker so advancement
     * status is conveyed by shape/text AND color (WCAG 1.4.1). */
    .pos-indicator {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 900;
      line-height: 1;
    }

    .team-flag {
      font-size: 1rem;
      line-height: 1;
    }
    .team-name {
      font-weight: 600;
      color: var(--fwc-text);
      font-size: 0.76rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
    }
    /* gold-text: navy-700 in light (10.5:1 ✓), gold-300 in dark (11.8:1 ✓) */
    .team-name.favorite { color: var(--fwc-gold-text); }
  `;

  @property({ type: Array }) matchData: Match[] = [...MATCHES];
  @property({ type: Array }) favoriteTeamIds: string[] = [];

  render() {
    return html`
      <div role="region" aria-label="Group standings">
        <div class="groups-grid">
          ${GROUPS.map(g => this._renderGroup(g))}
        </div>
      </div>
    `;
  }

  private _renderGroup(group: string) {
    const standings: GroupStanding[] = computeStandings(group, this.matchData);
    const gc = GROUP_COLORS[group as GroupLetter];
    const hdrStyle = `background:${gc.hdr};color:${gc.text};`;
    const letterStyle = `background:rgba(0,0,0,0.12);color:${gc.text};`;

    // Pos markers: convey advancement by symbol AND color (WCAG 1.4.1)
    // ↑ = top-2, advances to Round of 32; ≈ = 3rd, possible advance
    const MARKER: Record<number, string> = { 1: '↑', 2: '↑', 3: '≈' };

    return html`
      <div class="group-card">
        <div class="group-header" style="${hdrStyle}">
          <div class="group-letter" style="${letterStyle}" aria-hidden="true">${group}</div>
          <span>Group ${group}</span>
        </div>
        <table aria-label="Group ${group} standings">
          <thead>
            <tr>
              <th class="team-col" scope="col">Team</th>
              <th scope="col" title="Played">P</th>
              <th scope="col" title="Won">W</th>
              <th scope="col" title="Drawn">D</th>
              <th scope="col" title="Lost">L</th>
              <th scope="col" title="Goal Difference">GD</th>
              <th scope="col" title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((s, i) => {
              const pos  = i + 1;
              const team = TEAMS_BY_ID.get(s.teamId);
              const isFav = this.favoriteTeamIds.includes(s.teamId);
              const gdStr = s.gd > 0 ? `+${s.gd}` : `${s.gd}`;

              // Use explicit tint / tint3 properties — no fragile string-replace
              const rowBg = pos <= 2 ? gc.tint : pos === 3 ? gc.tint3 : '';
              const rowStyle = rowBg ? `background:${rowBg};` : '';

              // Advancement note in aria-label satisfies WCAG 1.4.1 (non-color indicator)
              const advNote = pos <= 2 ? ', advances to knockout round'
                            : pos === 3 ? ', possible third-place advance'
                            : '';

              const marker = MARKER[pos] ?? '';
              // Marker background matches the group header color; text from gc.text
              const markerStyle = marker
                ? `background:${gc.hdr};color:${gc.text};`
                : 'background:transparent;';

              return html`
                <tr
                  class="${isFav ? 'favorite-row' : ''}"
                  style="${rowStyle}"
                  aria-label="${team?.name ?? s.teamId}: ${s.points} points, played ${s.played}${advNote}"
                >
                  <td class="team-col">
                    <div class="team-cell">
                      <div class="pos-indicator" style="${markerStyle}" aria-hidden="true">
                        ${marker}
                      </div>
                      <span class="team-flag" role="img" aria-label="${team?.name ?? ''} flag">
                        ${team?.flag ?? '🏳'}
                      </span>
                      <span class="team-name ${isFav ? 'favorite' : ''}">
                        ${team?.shortName ?? s.teamId.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td>${s.played}</td>
                  <td>${s.won}</td>
                  <td>${s.drawn}</td>
                  <td>${s.lost}</td>
                  <td class="gd ${s.gd > 0 ? 'positive' : s.gd < 0 ? 'negative' : ''}">${s.played > 0 ? gdStr : '—'}</td>
                  <td class="pts">${s.points}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fwc-standings': FwcStandings;
  }
}
