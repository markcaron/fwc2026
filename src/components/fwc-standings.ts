import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GROUPS, TEAMS_BY_ID, computeStandings } from '../lib/data.js';
import type { GroupStanding } from '../lib/types.js';

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
      background: var(--fwc-bg-surface);
      padding: 8px 12px;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--fwc-text);
      border-bottom: 1px solid var(--fwc-border);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .group-letter {
      width: 22px;
      height: 22px;
      background: var(--fwc-gold);
      color: var(--fwc-text-on-gold);
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
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--fwc-border-subtle);
    }
    thead th.team-col { text-align: left; padding-left: 8px; }

    tbody tr {
      border-bottom: 1px solid var(--fwc-border-subtle);
      transition: background 0.1s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--fwc-bg-overlay); }

    /* Position row coloring */
    tbody tr.pos-1,
    tbody tr.pos-2 {
      background: var(--fwc-qualified-bg);
    }
    tbody tr.pos-3 {
      background: var(--fwc-playoff-bg);
    }
    tbody tr.pos-1:hover,
    tbody tr.pos-2:hover { background: var(--fwc-qualified-bg); }
    tbody tr.pos-3:hover  { background: var(--fwc-playoff-bg); }

    tbody tr.favorite-row {
      outline: 1px solid var(--fwc-gold);
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
    .pos-indicator {
      width: 4px;
      height: 20px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .pos-1 .pos-indicator,
    .pos-2 .pos-indicator { background: var(--fwc-qualified); }
    .pos-3 .pos-indicator { background: var(--fwc-playoff); }
    .pos-4 .pos-indicator { background: transparent; }

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
    .team-name.favorite { color: var(--fwc-gold); }

    .legend {
      margin-top: 10px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: var(--fwc-text-subtle);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .legend-dot.qualified { background: var(--fwc-qualified); }
    .legend-dot.playoff   { background: var(--fwc-playoff); }
  `;

  @property({ type: Array }) favoriteTeamIds: string[] = [];

  render() {
    return html`
      <div role="region" aria-label="Group standings">
        <div class="groups-grid">
          ${GROUPS.map(g => this._renderGroup(g))}
        </div>
        <div class="legend" role="note" aria-label="Table legend">
          <div class="legend-item">
            <div class="legend-dot qualified" aria-hidden="true"></div>
            <span>Advance (top 2)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot playoff" aria-hidden="true"></div>
            <span>Possible 3rd-place advance</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderGroup(group: string) {
    const standings: GroupStanding[] = computeStandings(group);

    return html`
      <div class="group-card">
        <div class="group-header">
          <div class="group-letter" aria-hidden="true">${group}</div>
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
              const pos = i + 1;
              const team = TEAMS_BY_ID.get(s.teamId);
              const isFav = this.favoriteTeamIds.includes(s.teamId);
              const gdStr = s.gd > 0 ? `+${s.gd}` : `${s.gd}`;

              return html`
                <tr
                  class="pos-${pos} ${isFav ? 'favorite-row' : ''}"
                  aria-label="${team?.name ?? s.teamId}: ${s.points} points, played ${s.played}"
                >
                  <td class="team-col pos-${pos}">
                    <div class="team-cell">
                      <div class="pos-indicator" aria-hidden="true"></div>
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
