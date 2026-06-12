export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string;    // 3-letter FIFA code
  flag: string;    // emoji flag
  group: string;   // 'A' through 'L'
  colors: [string, string]; // [primary, secondary] hex colors
}

export type MatchRound =
  | 'group'
  | 'r32'    // Round of 32
  | 'r16'    // Round of 16
  | 'qf'     // Quarterfinal
  | 'sf'     // Semifinal
  | '3rd'    // Third-place play-off
  | 'final';

export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface Match {
  id: number;
  round: MatchRound;
  group?: string;               // 'A'–'L' for group stage
  utc: string;                  // ISO 8601 UTC string
  venue: string;
  city: string;
  homeId: string | null;        // team id or null for TBD
  awayId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;  // penalty shootout
  awayPenalty?: number | null;
  status: MatchStatus;
  /** for knockout, human-readable source description e.g. "Group A Winner" */
  homeLabel?: string;
  awayLabel?: string;
}

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;  // goals for
  ga: number;  // goals against
  gd: number;  // goal difference
  points: number;
}

export interface StoredPreferences {
  timezone: string;           // IANA timezone string
  favoriteTeamIds: string[];  // array of team ids
  schemaVersion: number;
}

export const SCHEMA_VERSION = 1;

export type TabId = 'schedule' | 'groups' | 'bracket' | 'settings';

export const ROUND_LABELS: Record<MatchRound, string> = {
  group: 'Group Stage',
  r32:   'Round of 32',
  r16:   'Round of 16',
  qf:    'Quarterfinal',
  sf:    'Semifinal',
  '3rd': 'Third-Place Play-off',
  final: 'Final',
};

export type FilterType = 'all' | 'today' | 'date' | 'search' | 'favorites' | 'group' | 'team' | 'round';

export interface ScheduleFilter {
  type: FilterType;
  value?: string; // group letter, team id, or round key
}
