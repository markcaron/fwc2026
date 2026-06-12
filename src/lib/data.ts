import type { Team, Match, GroupStanding } from './types.js';

// ============================================================
// Group color palette — 12 distinct hues, A through L.
// Each entry: [bg (light mode), bg (dark mode), text (both modes)]
// All text values are verified ≥ 4.5:1 contrast on their bg.
// ============================================================
export const GROUP_COLORS: Record<string, { light: string; dark: string; text: string }> = {
  A: { light: '#fde8e8', dark: 'rgba(220,53,53,0.18)',  text: '#b91c1c' },
  B: { light: '#fff3e0', dark: 'rgba(234,126,0,0.18)',  text: '#c45d00' },
  C: { light: '#fefce8', dark: 'rgba(202,183,0,0.18)',  text: '#836b00' },
  D: { light: '#e8faf0', dark: 'rgba(22,163,74,0.18)',  text: '#166534' },
  E: { light: '#e0f7f4', dark: 'rgba(20,184,166,0.18)', text: '#0f766e' },
  F: { light: '#e0f2fe', dark: 'rgba(14,165,233,0.18)', text: '#075985' },
  G: { light: '#ede9fe', dark: 'rgba(124,58,237,0.18)', text: '#5b21b6' },
  H: { light: '#fce7f3', dark: 'rgba(219,39,119,0.18)', text: '#9d174d' },
  I: { light: '#fff1f2', dark: 'rgba(244,63,94,0.18)',  text: '#be123c' },
  J: { light: '#f0fdf4', dark: 'rgba(74,222,128,0.2)',  text: '#15803d' },
  K: { light: '#faf5ff', dark: 'rgba(168,85,247,0.18)', text: '#7e22ce' },
  L: { light: '#fff7ed', dark: 'rgba(249,115,22,0.18)', text: '#c2410c' },
};

// ============================================================
// Teams — all 48 FIFA World Cup 2026 participants
// Colors are primary jersey colors [home, away]
// ============================================================
export const TEAMS: Team[] = [
  // Group A
  { id: 'mex', name: 'Mexico',             shortName: 'Mexico',     code: 'MEX', flag: '🇲🇽', group: 'A', colors: ['#006847', '#ffffff'] },
  { id: 'zaf', name: 'South Africa',       shortName: 'S. Africa',  code: 'RSA', flag: '🇿🇦', group: 'A', colors: ['#007A4D', '#ffffff'] },
  { id: 'kor', name: 'South Korea',        shortName: 'Korea',      code: 'KOR', flag: '🇰🇷', group: 'A', colors: ['#CE1126', '#ffffff'] },
  { id: 'cze', name: 'Czechia',            shortName: 'Czechia',    code: 'CZE', flag: '🇨🇿', group: 'A', colors: ['#D7141A', '#ffffff'] },
  // Group B
  { id: 'can', name: 'Canada',             shortName: 'Canada',     code: 'CAN', flag: '🇨🇦', group: 'B', colors: ['#FF0000', '#ffffff'] },
  { id: 'sui', name: 'Switzerland',        shortName: 'Switzerland',code: 'SUI', flag: '🇨🇭', group: 'B', colors: ['#FF0000', '#ffffff'] },
  { id: 'qat', name: 'Qatar',              shortName: 'Qatar',      code: 'QAT', flag: '🇶🇦', group: 'B', colors: ['#8D1B3D', '#ffffff'] },
  { id: 'bih', name: 'Bosnia & Herz.',     shortName: 'Bosnia',     code: 'BIH', flag: '🇧🇦', group: 'B', colors: ['#002395', '#ffffff'] },
  // Group C
  { id: 'bra', name: 'Brazil',             shortName: 'Brazil',     code: 'BRA', flag: '🇧🇷', group: 'C', colors: ['#009C3B', '#FFDF00'] },
  { id: 'mar', name: 'Morocco',            shortName: 'Morocco',    code: 'MAR', flag: '🇲🇦', group: 'C', colors: ['#C1272D', '#006233'] },
  { id: 'sco', name: 'Scotland',           shortName: 'Scotland',   code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', colors: ['#003DA5', '#ffffff'] },
  { id: 'hai', name: 'Haiti',              shortName: 'Haiti',      code: 'HAI', flag: '🇭🇹', group: 'C', colors: ['#00209F', '#D21034'] },
  // Group D
  { id: 'usa', name: 'United States',      shortName: 'USA',        code: 'USA', flag: '🇺🇸', group: 'D', colors: ['#B22234', '#3C3B6E'] },
  { id: 'par', name: 'Paraguay',           shortName: 'Paraguay',   code: 'PAR', flag: '🇵🇾', group: 'D', colors: ['#D52B1E', '#ffffff'] },
  { id: 'aus', name: 'Australia',          shortName: 'Australia',  code: 'AUS', flag: '🇦🇺', group: 'D', colors: ['#FFD700', '#00843D'] },
  { id: 'tur', name: 'Türkiye',            shortName: 'Türkiye',    code: 'TUR', flag: '🇹🇷', group: 'D', colors: ['#E30A17', '#ffffff'] },
  // Group E
  { id: 'ger', name: 'Germany',            shortName: 'Germany',    code: 'GER', flag: '🇩🇪', group: 'E', colors: ['#ffffff', '#000000'] },
  { id: 'cur', name: 'Curaçao',            shortName: 'Curaçao',    code: 'CUW', flag: '🇨🇼', group: 'E', colors: ['#003DA5', '#F7A600'] },
  { id: 'civ', name: 'Côte d\'Ivoire',     shortName: 'Ivory Coast',code: 'CIV', flag: '🇨🇮', group: 'E', colors: ['#F77F00', '#009A44'] },
  { id: 'ecu', name: 'Ecuador',            shortName: 'Ecuador',    code: 'ECU', flag: '🇪🇨', group: 'E', colors: ['#FFD100', '#0033A0'] },
  // Group F
  { id: 'ned', name: 'Netherlands',        shortName: 'Netherlands',code: 'NED', flag: '🇳🇱', group: 'F', colors: ['#FF6600', '#ffffff'] },
  { id: 'jpn', name: 'Japan',              shortName: 'Japan',      code: 'JPN', flag: '🇯🇵', group: 'F', colors: ['#003DA5', '#ffffff'] },
  { id: 'tun', name: 'Tunisia',            shortName: 'Tunisia',    code: 'TUN', flag: '🇹🇳', group: 'F', colors: ['#E70013', '#ffffff'] },
  { id: 'swe', name: 'Sweden',             shortName: 'Sweden',     code: 'SWE', flag: '🇸🇪', group: 'F', colors: ['#006AA7', '#FECC02'] },
  // Group G
  { id: 'bel', name: 'Belgium',            shortName: 'Belgium',    code: 'BEL', flag: '🇧🇪', group: 'G', colors: ['#EF3340', '#000000'] },
  { id: 'egy', name: 'Egypt',              shortName: 'Egypt',      code: 'EGY', flag: '🇪🇬', group: 'G', colors: ['#CE1126', '#ffffff'] },
  { id: 'irn', name: 'Iran',               shortName: 'Iran',       code: 'IRN', flag: '🇮🇷', group: 'G', colors: ['#239F40', '#ffffff'] },
  { id: 'nzl', name: 'New Zealand',        shortName: 'New Zealand',code: 'NZL', flag: '🇳🇿', group: 'G', colors: ['#000000', '#ffffff'] },
  // Group H
  { id: 'esp', name: 'Spain',              shortName: 'Spain',      code: 'ESP', flag: '🇪🇸', group: 'H', colors: ['#AA151B', '#F1BF00'] },
  { id: 'cpv', name: 'Cape Verde',         shortName: 'Cape Verde', code: 'CPV', flag: '🇨🇻', group: 'H', colors: ['#003893', '#CF2027'] },
  { id: 'ksa', name: 'Saudi Arabia',       shortName: 'Saudi Arabia',code:'KSA', flag: '🇸🇦', group: 'H', colors: ['#006C35', '#ffffff'] },
  { id: 'uru', name: 'Uruguay',            shortName: 'Uruguay',    code: 'URU', flag: '🇺🇾', group: 'H', colors: ['#75AADB', '#ffffff'] },
  // Group I
  { id: 'fra', name: 'France',             shortName: 'France',     code: 'FRA', flag: '🇫🇷', group: 'I', colors: ['#002395', '#ffffff'] },
  { id: 'sen', name: 'Senegal',            shortName: 'Senegal',    code: 'SEN', flag: '🇸🇳', group: 'I', colors: ['#00853F', '#FDEF42'] },
  { id: 'nor', name: 'Norway',             shortName: 'Norway',     code: 'NOR', flag: '🇳🇴', group: 'I', colors: ['#EF2B2D', '#003087'] },
  { id: 'irq', name: 'Iraq',               shortName: 'Iraq',       code: 'IRQ', flag: '🇮🇶', group: 'I', colors: ['#CE1126', '#007A3D'] },
  // Group J
  { id: 'arg', name: 'Argentina',          shortName: 'Argentina',  code: 'ARG', flag: '🇦🇷', group: 'J', colors: ['#75AADB', '#ffffff'] },
  { id: 'alg', name: 'Algeria',            shortName: 'Algeria',    code: 'ALG', flag: '🇩🇿', group: 'J', colors: ['#006233', '#ffffff'] },
  { id: 'aut', name: 'Austria',            shortName: 'Austria',    code: 'AUT', flag: '🇦🇹', group: 'J', colors: ['#ED2939', '#ffffff'] },
  { id: 'jor', name: 'Jordan',             shortName: 'Jordan',     code: 'JOR', flag: '🇯🇴', group: 'J', colors: ['#007A3D', '#ffffff'] },
  // Group K
  { id: 'por', name: 'Portugal',           shortName: 'Portugal',   code: 'POR', flag: '🇵🇹', group: 'K', colors: ['#006600', '#FF0000'] },
  { id: 'uzb', name: 'Uzbekistan',         shortName: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', group: 'K', colors: ['#1EB53A', '#0099B5'] },
  { id: 'col', name: 'Colombia',           shortName: 'Colombia',   code: 'COL', flag: '🇨🇴', group: 'K', colors: ['#FCD116', '#003087'] },
  { id: 'cod', name: 'DR Congo',           shortName: 'DR Congo',   code: 'COD', flag: '🇨🇩', group: 'K', colors: ['#007FFF', '#F7D618'] },
  // Group L
  { id: 'eng', name: 'England',            shortName: 'England',    code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', colors: ['#ffffff', '#CC0000'] },
  { id: 'cro', name: 'Croatia',            shortName: 'Croatia',    code: 'CRO', flag: '🇭🇷', group: 'L', colors: ['#FF0000', '#ffffff'] },
  { id: 'gha', name: 'Ghana',              shortName: 'Ghana',      code: 'GHA', flag: '🇬🇭', group: 'L', colors: ['#006B3F', '#FCD116'] },
  { id: 'pan', name: 'Panama',             shortName: 'Panama',     code: 'PAN', flag: '🇵🇦', group: 'L', colors: ['#005293', '#D21034'] },
];

export const TEAMS_BY_ID = new Map<string, Team>(TEAMS.map(t => [t.id, t]));

// ============================================================
// Matches — all 104 FIFA World Cup 2026 fixtures
// All times stored as UTC ISO 8601 strings
// ET (EDT = UTC-4) times from official schedule
// ============================================================
export const MATCHES: Match[] = [
  // ── GROUP STAGE ──────────────────────────────────────────
  // Group A
  { id:  1, round:'group', group:'A', utc:'2026-06-11T19:00:00Z', venue:'Estadio Azteca',              city:'Mexico City',          homeId:'mex', awayId:'zaf', homeScore:null, awayScore:null, status:'scheduled' },
  { id:  2, round:'group', group:'A', utc:'2026-06-12T02:00:00Z', venue:'Estadio Akron',               city:'Guadalajara',          homeId:'kor', awayId:'cze', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 25, round:'group', group:'A', utc:'2026-06-18T16:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:'cze', awayId:'zaf', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 28, round:'group', group:'A', utc:'2026-06-19T01:00:00Z', venue:'Estadio Akron',               city:'Guadalajara',          homeId:'mex', awayId:'kor', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 53, round:'group', group:'A', utc:'2026-06-25T01:00:00Z', venue:'Estadio Azteca',              city:'Mexico City',          homeId:'cze', awayId:'mex', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 54, round:'group', group:'A', utc:'2026-06-25T01:00:00Z', venue:'Estadio BBVA',                city:'Monterrey',            homeId:'zaf', awayId:'kor', homeScore:null, awayScore:null, status:'scheduled' },

  // Group B
  { id:  3, round:'group', group:'B', utc:'2026-06-12T19:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:'can', awayId:'bih', homeScore:null, awayScore:null, status:'scheduled' },
  { id:  8, round:'group', group:'B', utc:'2026-06-13T19:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:'qat', awayId:'sui', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 26, round:'group', group:'B', utc:'2026-06-18T19:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:'sui', awayId:'bih', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 27, round:'group', group:'B', utc:'2026-06-18T22:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:'can', awayId:'qat', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 51, round:'group', group:'B', utc:'2026-06-24T19:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:'sui', awayId:'can', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 52, round:'group', group:'B', utc:'2026-06-24T19:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:'bih', awayId:'qat', homeScore:null, awayScore:null, status:'scheduled' },

  // Group C
  { id:  7, round:'group', group:'C', utc:'2026-06-13T22:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:'bra', awayId:'mar', homeScore:null, awayScore:null, status:'scheduled' },
  { id:  5, round:'group', group:'C', utc:'2026-06-14T01:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:'hai', awayId:'sco', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 30, round:'group', group:'C', utc:'2026-06-19T22:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:'sco', awayId:'mar', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 29, round:'group', group:'C', utc:'2026-06-20T01:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:'bra', awayId:'hai', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 49, round:'group', group:'C', utc:'2026-06-24T22:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:'sco', awayId:'bra', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 50, round:'group', group:'C', utc:'2026-06-24T22:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:'mar', awayId:'hai', homeScore:null, awayScore:null, status:'scheduled' },

  // Group D
  { id:  4, round:'group', group:'D', utc:'2026-06-13T01:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:'usa', awayId:'par', homeScore:null, awayScore:null, status:'scheduled' },
  { id:  6, round:'group', group:'D', utc:'2026-06-14T04:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:'aus', awayId:'tur', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 32, round:'group', group:'D', utc:'2026-06-19T19:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:'usa', awayId:'aus', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 31, round:'group', group:'D', utc:'2026-06-20T03:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:'tur', awayId:'par', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 59, round:'group', group:'D', utc:'2026-06-26T02:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:'tur', awayId:'usa', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 60, round:'group', group:'D', utc:'2026-06-26T02:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:'par', awayId:'aus', homeScore:null, awayScore:null, status:'scheduled' },

  // Group E
  { id: 10, round:'group', group:'E', utc:'2026-06-14T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:'ger', awayId:'cur', homeScore:null, awayScore:null, status:'scheduled' },
  { id:  9, round:'group', group:'E', utc:'2026-06-14T23:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:'civ', awayId:'ecu', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 33, round:'group', group:'E', utc:'2026-06-20T20:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:'ger', awayId:'civ', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 34, round:'group', group:'E', utc:'2026-06-21T00:00:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:'ecu', awayId:'cur', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 55, round:'group', group:'E', utc:'2026-06-25T20:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:'cur', awayId:'civ', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 56, round:'group', group:'E', utc:'2026-06-25T20:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:'ecu', awayId:'ger', homeScore:null, awayScore:null, status:'scheduled' },

  // Group F
  { id: 11, round:'group', group:'F', utc:'2026-06-14T20:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:'ned', awayId:'jpn', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 12, round:'group', group:'F', utc:'2026-06-15T02:00:00Z', venue:'Estadio BBVA',                city:'Monterrey',            homeId:'swe', awayId:'tun', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 35, round:'group', group:'F', utc:'2026-06-20T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:'ned', awayId:'swe', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 36, round:'group', group:'F', utc:'2026-06-21T04:00:00Z', venue:'Estadio BBVA',                city:'Monterrey',            homeId:'tun', awayId:'jpn', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 57, round:'group', group:'F', utc:'2026-06-25T23:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:'jpn', awayId:'swe', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 58, round:'group', group:'F', utc:'2026-06-25T23:00:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:'tun', awayId:'ned', homeScore:null, awayScore:null, status:'scheduled' },

  // Group G
  { id: 16, round:'group', group:'G', utc:'2026-06-15T19:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:'bel', awayId:'egy', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 15, round:'group', group:'G', utc:'2026-06-16T01:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:'irn', awayId:'nzl', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 39, round:'group', group:'G', utc:'2026-06-21T19:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:'bel', awayId:'irn', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 40, round:'group', group:'G', utc:'2026-06-22T01:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:'nzl', awayId:'egy', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 63, round:'group', group:'G', utc:'2026-06-27T03:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:'egy', awayId:'irn', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 64, round:'group', group:'G', utc:'2026-06-27T03:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:'nzl', awayId:'bel', homeScore:null, awayScore:null, status:'scheduled' },

  // Group H
  { id: 14, round:'group', group:'H', utc:'2026-06-15T16:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:'esp', awayId:'cpv', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 13, round:'group', group:'H', utc:'2026-06-15T22:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:'ksa', awayId:'uru', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 38, round:'group', group:'H', utc:'2026-06-21T16:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:'esp', awayId:'ksa', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 37, round:'group', group:'H', utc:'2026-06-21T22:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:'uru', awayId:'cpv', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 65, round:'group', group:'H', utc:'2026-06-27T00:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:'cpv', awayId:'ksa', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 66, round:'group', group:'H', utc:'2026-06-27T00:00:00Z', venue:'Estadio Akron',               city:'Guadalajara',          homeId:'uru', awayId:'esp', homeScore:null, awayScore:null, status:'scheduled' },

  // Group I
  { id: 17, round:'group', group:'I', utc:'2026-06-16T19:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:'fra', awayId:'sen', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 18, round:'group', group:'I', utc:'2026-06-16T22:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:'irq', awayId:'nor', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 42, round:'group', group:'I', utc:'2026-06-22T21:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:'fra', awayId:'irq', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 41, round:'group', group:'I', utc:'2026-06-23T00:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:'nor', awayId:'sen', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 61, round:'group', group:'I', utc:'2026-06-26T19:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:'nor', awayId:'fra', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 62, round:'group', group:'I', utc:'2026-06-26T19:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:'sen', awayId:'irq', homeScore:null, awayScore:null, status:'scheduled' },

  // Group J
  { id: 19, round:'group', group:'J', utc:'2026-06-17T01:00:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:'arg', awayId:'alg', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 20, round:'group', group:'J', utc:'2026-06-17T04:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:'aut', awayId:'jor', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 43, round:'group', group:'J', utc:'2026-06-22T17:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:'arg', awayId:'aut', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 44, round:'group', group:'J', utc:'2026-06-23T03:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:'jor', awayId:'alg', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 69, round:'group', group:'J', utc:'2026-06-28T02:00:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:'alg', awayId:'aut', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 70, round:'group', group:'J', utc:'2026-06-28T02:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:'jor', awayId:'arg', homeScore:null, awayScore:null, status:'scheduled' },

  // Group K
  { id: 23, round:'group', group:'K', utc:'2026-06-17T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:'por', awayId:'cod', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 24, round:'group', group:'K', utc:'2026-06-18T02:00:00Z', venue:'Estadio Azteca',              city:'Mexico City',          homeId:'uzb', awayId:'col', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 47, round:'group', group:'K', utc:'2026-06-23T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:'por', awayId:'uzb', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 48, round:'group', group:'K', utc:'2026-06-24T02:00:00Z', venue:'Estadio Akron',               city:'Guadalajara',          homeId:'col', awayId:'cod', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 71, round:'group', group:'K', utc:'2026-06-27T23:30:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:'col', awayId:'por', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 72, round:'group', group:'K', utc:'2026-06-27T23:30:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:'cod', awayId:'uzb', homeScore:null, awayScore:null, status:'scheduled' },

  // Group L
  { id: 22, round:'group', group:'L', utc:'2026-06-17T20:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:'eng', awayId:'cro', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 21, round:'group', group:'L', utc:'2026-06-17T23:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:'gha', awayId:'pan', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 45, round:'group', group:'L', utc:'2026-06-23T20:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:'eng', awayId:'gha', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 46, round:'group', group:'L', utc:'2026-06-23T23:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:'pan', awayId:'cro', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 67, round:'group', group:'L', utc:'2026-06-27T21:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:'pan', awayId:'eng', homeScore:null, awayScore:null, status:'scheduled' },
  { id: 68, round:'group', group:'L', utc:'2026-06-27T21:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:'cro', awayId:'gha', homeScore:null, awayScore:null, status:'scheduled' },

  // ── ROUND OF 32 ──────────────────────────────────────────
  { id: 73, round:'r32', utc:'2026-06-28T19:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:null, awayId:null, homeLabel:'Group A Runner-Up',  awayLabel:'Group B Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 74, round:'r32', utc:'2026-06-29T20:30:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:null, awayId:null, homeLabel:'Group E Winner',      awayLabel:'Best 3rd (A/B/C/D/F)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 75, round:'r32', utc:'2026-06-30T01:00:00Z', venue:'Estadio BBVA',                city:'Monterrey',            homeId:null, awayId:null, homeLabel:'Group F Winner',      awayLabel:'Group C Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 76, round:'r32', utc:'2026-06-29T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:null, awayId:null, homeLabel:'Group C Winner',      awayLabel:'Group F Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 77, round:'r32', utc:'2026-06-30T21:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:null, awayId:null, homeLabel:'Group I Winner',      awayLabel:'Best 3rd (C/D/F/G/H)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 78, round:'r32', utc:'2026-06-30T17:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:null, awayId:null, homeLabel:'Group E Runner-Up',   awayLabel:'Group I Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 79, round:'r32', utc:'2026-07-01T01:00:00Z', venue:'Estadio Azteca',              city:'Mexico City',          homeId:null, awayId:null, homeLabel:'Group A Winner',      awayLabel:'Best 3rd (C/E/F/H/I)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 80, round:'r32', utc:'2026-07-01T16:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:null, awayId:null, homeLabel:'Group L Winner',      awayLabel:'Best 3rd (E/H/I/J/K)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 81, round:'r32', utc:'2026-07-02T00:00:00Z', venue:'Levi\'s Stadium',             city:'San Francisco Bay Area',homeId:null, awayId:null, homeLabel:'Group D Winner',      awayLabel:'Best 3rd (B/E/F/I/J)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 82, round:'r32', utc:'2026-07-01T20:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:null, awayId:null, homeLabel:'Group G Winner',      awayLabel:'Best 3rd (A/E/H/I/J)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 83, round:'r32', utc:'2026-07-02T23:00:00Z', venue:'BMO Field',                   city:'Toronto',              homeId:null, awayId:null, homeLabel:'Group K Runner-Up',   awayLabel:'Group L Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 84, round:'r32', utc:'2026-07-02T19:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:null, awayId:null, homeLabel:'Group H Winner',      awayLabel:'Group J Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 85, round:'r32', utc:'2026-07-03T03:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:null, awayId:null, homeLabel:'Group B Winner',      awayLabel:'Best 3rd (E/F/G/I/J)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 86, round:'r32', utc:'2026-07-03T22:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:null, awayId:null, homeLabel:'Group J Winner',      awayLabel:'Group H Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },
  { id: 87, round:'r32', utc:'2026-07-04T01:30:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:null, awayId:null, homeLabel:'Group K Winner',      awayLabel:'Best 3rd (D/E/I/J/L)',    homeScore:null, awayScore:null, status:'scheduled' },
  { id: 88, round:'r32', utc:'2026-07-03T18:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:null, awayId:null, homeLabel:'Group D Runner-Up',   awayLabel:'Group G Runner-Up',       homeScore:null, awayScore:null, status:'scheduled' },

  // ── ROUND OF 16 ──────────────────────────────────────────
  { id: 89, round:'r16', utc:'2026-07-04T21:00:00Z', venue:'Lincoln Financial Field',     city:'Philadelphia',         homeId:null, awayId:null, homeLabel:'Winner Match 74',     awayLabel:'Winner Match 77',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 90, round:'r16', utc:'2026-07-04T17:00:00Z', venue:'NRG Stadium',                 city:'Houston',              homeId:null, awayId:null, homeLabel:'Winner Match 73',     awayLabel:'Winner Match 75',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 91, round:'r16', utc:'2026-07-05T20:00:00Z', venue:'MetLife Stadium',             city:'New York / New Jersey', homeId:null, awayId:null, homeLabel:'Winner Match 76',     awayLabel:'Winner Match 78',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 92, round:'r16', utc:'2026-07-06T00:00:00Z', venue:'Estadio Azteca',              city:'Mexico City',          homeId:null, awayId:null, homeLabel:'Winner Match 79',     awayLabel:'Winner Match 80',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 93, round:'r16', utc:'2026-07-06T19:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:null, awayId:null, homeLabel:'Winner Match 83',     awayLabel:'Winner Match 84',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 94, round:'r16', utc:'2026-07-07T00:00:00Z', venue:'Lumen Field',                 city:'Seattle',              homeId:null, awayId:null, homeLabel:'Winner Match 81',     awayLabel:'Winner Match 82',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 95, round:'r16', utc:'2026-07-07T16:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:null, awayId:null, homeLabel:'Winner Match 86',     awayLabel:'Winner Match 88',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 96, round:'r16', utc:'2026-07-07T20:00:00Z', venue:'BC Place',                    city:'Vancouver',            homeId:null, awayId:null, homeLabel:'Winner Match 85',     awayLabel:'Winner Match 87',         homeScore:null, awayScore:null, status:'scheduled' },

  // ── QUARTERFINALS ─────────────────────────────────────────
  { id: 97, round:'qf',  utc:'2026-07-09T20:00:00Z', venue:'Gillette Stadium',            city:'Boston',               homeId:null, awayId:null, homeLabel:'Winner Match 89',     awayLabel:'Winner Match 90',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 98, round:'qf',  utc:'2026-07-10T19:00:00Z', venue:'SoFi Stadium',                city:'Los Angeles',          homeId:null, awayId:null, homeLabel:'Winner Match 93',     awayLabel:'Winner Match 94',         homeScore:null, awayScore:null, status:'scheduled' },
  { id: 99, round:'qf',  utc:'2026-07-11T21:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:null, awayId:null, homeLabel:'Winner Match 91',     awayLabel:'Winner Match 92',         homeScore:null, awayScore:null, status:'scheduled' },
  { id:100, round:'qf',  utc:'2026-07-12T01:00:00Z', venue:'Arrowhead Stadium',           city:'Kansas City',          homeId:null, awayId:null, homeLabel:'Winner Match 95',     awayLabel:'Winner Match 96',         homeScore:null, awayScore:null, status:'scheduled' },

  // ── SEMIFINALS ────────────────────────────────────────────
  { id:101, round:'sf',  utc:'2026-07-14T19:00:00Z', venue:'AT&T Stadium',                city:'Dallas',               homeId:null, awayId:null, homeLabel:'Winner Match 97',     awayLabel:'Winner Match 98',         homeScore:null, awayScore:null, status:'scheduled' },
  { id:102, round:'sf',  utc:'2026-07-15T19:00:00Z', venue:'Mercedes-Benz Stadium',       city:'Atlanta',              homeId:null, awayId:null, homeLabel:'Winner Match 99',     awayLabel:'Winner Match 100',        homeScore:null, awayScore:null, status:'scheduled' },

  // ── THIRD-PLACE PLAY-OFF ──────────────────────────────────
  { id:103, round:'3rd', utc:'2026-07-18T21:00:00Z', venue:'Hard Rock Stadium',           city:'Miami',                homeId:null, awayId:null, homeLabel:'Loser Match 101',     awayLabel:'Loser Match 102',         homeScore:null, awayScore:null, status:'scheduled' },

  // ── FINAL ─────────────────────────────────────────────────
  { id:104, round:'final',utc:'2026-07-19T19:00:00Z', venue:'MetLife Stadium',            city:'New York / New Jersey', homeId:null, awayId:null, homeLabel:'Winner Match 101',    awayLabel:'Winner Match 102',        homeScore:null, awayScore:null, status:'scheduled' },
];

// ============================================================
// Group helpers
// ============================================================
export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const;
export type GroupLetter = typeof GROUPS[number];

export function getTeamsInGroup(group: string): Team[] {
  return TEAMS.filter(t => t.group === group);
}

/**
 * Returns group-stage matches for a given group.
 * Pass `matches` to use a live-data array instead of the static constant.
 */
export function getMatchesInGroup(group: string, matches: readonly Match[] = MATCHES): Match[] {
  return matches.filter(m => m.round === 'group' && m.group === group);
}

/**
 * Compute standings for a group from completed match data.
 * Pass `matches` to compute from a live-data array instead of static data.
 */
export function computeStandings(group: string, matches: readonly Match[] = MATCHES): GroupStanding[] {
  const teams = getTeamsInGroup(group);
  const standings = new Map<string, GroupStanding>(
    teams.map(t => [t.id, { teamId: t.id, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, gd:0, points:0 }])
  );

  for (const match of getMatchesInGroup(group, matches)) {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) continue;
    const home = standings.get(match.homeId!);
    const away = standings.get(match.awayId!);
    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += match.homeScore; home.ga += match.awayScore;
    away.gf += match.awayScore; away.ga += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++; home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++; away.points += 3;
      home.lost++;
    } else {
      home.drawn++; home.points++;
      away.drawn++; away.points++;
    }
  }

  return [...standings.values()]
    .map(s => ({ ...s, gd: s.gf - s.ga }))
    .sort((a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      (TEAMS_BY_ID.get(a.teamId)?.name ?? '').localeCompare(TEAMS_BY_ID.get(b.teamId)?.name ?? '')
    );
}
