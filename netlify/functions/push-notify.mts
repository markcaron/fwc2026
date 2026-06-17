/**
 * Netlify Scheduled Function — runs every minute.
 *
 * Finds matches kicking off in 4–6 minutes (UTC), loads all push
 * subscriptions from Netlify Blobs, filters by subscriber preference
 * (all matches vs. favorite teams), and sends a Web Push notification.
 *
 * Expired / invalid subscriptions (HTTP 410 Gone) are removed automatically.
 *
 * Environment variables required:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import type { StoredSubscription } from './push-subscribe.mjs';

// ── Minimal fixture table (id · utc · homeId · awayId · round · venue · city) ─

type MatchRound = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';

interface Fixture {
  id:     number;
  utc:    string;
  homeId: string | null;
  awayId: string | null;
  round:  MatchRound;
  venue:  string;
  city:   string;
}

const FIXTURES: Fixture[] = [
  // ── Group A ──────────────────────────────────────────────────────────────
  { id:  1, utc:'2026-06-11T19:00:00Z', homeId:'mex', awayId:'zaf', round:'group', venue:'Estadio Azteca',              city:'Mexico City'            },
  { id:  2, utc:'2026-06-12T02:00:00Z', homeId:'kor', awayId:'cze', round:'group', venue:'Estadio Akron',               city:'Guadalajara'            },
  { id: 25, utc:'2026-06-18T16:00:00Z', homeId:'cze', awayId:'zaf', round:'group', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  { id: 28, utc:'2026-06-19T01:00:00Z', homeId:'mex', awayId:'kor', round:'group', venue:'Estadio Akron',               city:'Guadalajara'            },
  { id: 53, utc:'2026-06-25T01:00:00Z', homeId:'cze', awayId:'mex', round:'group', venue:'Estadio Azteca',              city:'Mexico City'            },
  { id: 54, utc:'2026-06-25T01:00:00Z', homeId:'zaf', awayId:'kor', round:'group', venue:'Estadio BBVA',                city:'Monterrey'              },
  // ── Group B ──────────────────────────────────────────────────────────────
  { id:  3, utc:'2026-06-12T19:00:00Z', homeId:'can', awayId:'bih', round:'group', venue:'BMO Field',                   city:'Toronto'                },
  { id:  8, utc:'2026-06-13T19:00:00Z', homeId:'qat', awayId:'sui', round:'group', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  { id: 26, utc:'2026-06-18T19:00:00Z', homeId:'sui', awayId:'bih', round:'group', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 27, utc:'2026-06-18T22:00:00Z', homeId:'can', awayId:'qat', round:'group', venue:'BC Place',                    city:'Vancouver'              },
  { id: 51, utc:'2026-06-24T19:00:00Z', homeId:'sui', awayId:'can', round:'group', venue:'BC Place',                    city:'Vancouver'              },
  { id: 52, utc:'2026-06-24T19:00:00Z', homeId:'bih', awayId:'qat', round:'group', venue:'Lumen Field',                 city:'Seattle'                },
  // ── Group C ──────────────────────────────────────────────────────────────
  { id:  7, utc:'2026-06-13T22:00:00Z', homeId:'bra', awayId:'mar', round:'group', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id:  5, utc:'2026-06-14T01:00:00Z', homeId:'hai', awayId:'sco', round:'group', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 30, utc:'2026-06-19T22:00:00Z', homeId:'sco', awayId:'mar', round:'group', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 29, utc:'2026-06-20T01:00:00Z', homeId:'bra', awayId:'hai', round:'group', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  { id: 49, utc:'2026-06-24T22:00:00Z', homeId:'sco', awayId:'bra', round:'group', venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id: 50, utc:'2026-06-24T22:00:00Z', homeId:'mar', awayId:'hai', round:'group', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  // ── Group D ──────────────────────────────────────────────────────────────
  { id:  4, utc:'2026-06-13T01:00:00Z', homeId:'usa', awayId:'par', round:'group', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id:  6, utc:'2026-06-14T04:00:00Z', homeId:'aus', awayId:'tur', round:'group', venue:'BC Place',                    city:'Vancouver'              },
  { id: 32, utc:'2026-06-19T19:00:00Z', homeId:'usa', awayId:'aus', round:'group', venue:'Lumen Field',                 city:'Seattle'                },
  { id: 31, utc:'2026-06-20T03:00:00Z', homeId:'tur', awayId:'par', round:'group', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  { id: 59, utc:'2026-06-26T02:00:00Z', homeId:'tur', awayId:'usa', round:'group', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 60, utc:'2026-06-26T02:00:00Z', homeId:'par', awayId:'aus', round:'group', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  // ── Group E ──────────────────────────────────────────────────────────────
  { id: 10, utc:'2026-06-14T17:00:00Z', homeId:'ger', awayId:'cur', round:'group', venue:'NRG Stadium',                 city:'Houston'                },
  { id:  9, utc:'2026-06-14T23:00:00Z', homeId:'civ', awayId:'ecu', round:'group', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  { id: 33, utc:'2026-06-20T20:00:00Z', homeId:'ger', awayId:'civ', round:'group', venue:'BMO Field',                   city:'Toronto'                },
  { id: 34, utc:'2026-06-21T00:00:00Z', homeId:'ecu', awayId:'cur', round:'group', venue:'Arrowhead Stadium',           city:'Kansas City'            },
  { id: 55, utc:'2026-06-25T20:00:00Z', homeId:'cur', awayId:'civ', round:'group', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  { id: 56, utc:'2026-06-25T20:00:00Z', homeId:'ecu', awayId:'ger', round:'group', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  // ── Group F ──────────────────────────────────────────────────────────────
  { id: 11, utc:'2026-06-14T20:00:00Z', homeId:'ned', awayId:'jpn', round:'group', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 12, utc:'2026-06-15T02:00:00Z', homeId:'swe', awayId:'tun', round:'group', venue:'Estadio BBVA',                city:'Monterrey'              },
  { id: 35, utc:'2026-06-20T17:00:00Z', homeId:'ned', awayId:'swe', round:'group', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 36, utc:'2026-06-21T04:00:00Z', homeId:'tun', awayId:'jpn', round:'group', venue:'Estadio BBVA',                city:'Monterrey'              },
  { id: 57, utc:'2026-06-25T23:00:00Z', homeId:'jpn', awayId:'swe', round:'group', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 58, utc:'2026-06-25T23:00:00Z', homeId:'tun', awayId:'ned', round:'group', venue:'Arrowhead Stadium',           city:'Kansas City'            },
  // ── Group G ──────────────────────────────────────────────────────────────
  { id: 16, utc:'2026-06-15T19:00:00Z', homeId:'bel', awayId:'egy', round:'group', venue:'Lumen Field',                 city:'Seattle'                },
  { id: 15, utc:'2026-06-16T01:00:00Z', homeId:'irn', awayId:'nzl', round:'group', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 39, utc:'2026-06-21T19:00:00Z', homeId:'bel', awayId:'irn', round:'group', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 40, utc:'2026-06-22T01:00:00Z', homeId:'nzl', awayId:'egy', round:'group', venue:'BC Place',                    city:'Vancouver'              },
  { id: 63, utc:'2026-06-27T03:00:00Z', homeId:'egy', awayId:'irn', round:'group', venue:'Lumen Field',                 city:'Seattle'                },
  { id: 64, utc:'2026-06-27T03:00:00Z', homeId:'nzl', awayId:'bel', round:'group', venue:'BC Place',                    city:'Vancouver'              },
  // ── Group H ──────────────────────────────────────────────────────────────
  { id: 14, utc:'2026-06-15T16:00:00Z', homeId:'esp', awayId:'cpv', round:'group', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  { id: 13, utc:'2026-06-15T22:00:00Z', homeId:'ksa', awayId:'uru', round:'group', venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id: 38, utc:'2026-06-21T16:00:00Z', homeId:'esp', awayId:'ksa', round:'group', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  { id: 37, utc:'2026-06-21T22:00:00Z', homeId:'uru', awayId:'cpv', round:'group', venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id: 65, utc:'2026-06-27T00:00:00Z', homeId:'cpv', awayId:'ksa', round:'group', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 66, utc:'2026-06-27T00:00:00Z', homeId:'uru', awayId:'esp', round:'group', venue:'Estadio Akron',               city:'Guadalajara'            },
  // ── Group I ──────────────────────────────────────────────────────────────
  { id: 17, utc:'2026-06-16T19:00:00Z', homeId:'fra', awayId:'sen', round:'group', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id: 18, utc:'2026-06-16T22:00:00Z', homeId:'irq', awayId:'nor', round:'group', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 42, utc:'2026-06-22T21:00:00Z', homeId:'fra', awayId:'irq', round:'group', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  { id: 41, utc:'2026-06-23T00:00:00Z', homeId:'nor', awayId:'sen', round:'group', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id: 61, utc:'2026-06-26T19:00:00Z', homeId:'nor', awayId:'fra', round:'group', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 62, utc:'2026-06-26T19:00:00Z', homeId:'sen', awayId:'irq', round:'group', venue:'BMO Field',                   city:'Toronto'                },
  // ── Group J ──────────────────────────────────────────────────────────────
  { id: 19, utc:'2026-06-17T01:00:00Z', homeId:'arg', awayId:'alg', round:'group', venue:'Arrowhead Stadium',           city:'Kansas City'            },
  { id: 20, utc:'2026-06-17T04:00:00Z', homeId:'aut', awayId:'jor', round:'group', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  { id: 43, utc:'2026-06-22T17:00:00Z', homeId:'arg', awayId:'aut', round:'group', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 44, utc:'2026-06-23T03:00:00Z', homeId:'jor', awayId:'alg', round:'group', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  { id: 69, utc:'2026-06-28T02:00:00Z', homeId:'alg', awayId:'aut', round:'group', venue:'Arrowhead Stadium',           city:'Kansas City'            },
  { id: 70, utc:'2026-06-28T02:00:00Z', homeId:'jor', awayId:'arg', round:'group', venue:'AT&T Stadium',                city:'Dallas'                 },
  // ── Group K ──────────────────────────────────────────────────────────────
  { id: 23, utc:'2026-06-17T17:00:00Z', homeId:'por', awayId:'cod', round:'group', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 24, utc:'2026-06-18T02:00:00Z', homeId:'uzb', awayId:'col', round:'group', venue:'Estadio Azteca',              city:'Mexico City'            },
  { id: 47, utc:'2026-06-23T17:00:00Z', homeId:'por', awayId:'uzb', round:'group', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 48, utc:'2026-06-24T02:00:00Z', homeId:'col', awayId:'cod', round:'group', venue:'Estadio Akron',               city:'Guadalajara'            },
  { id: 71, utc:'2026-06-27T23:30:00Z', homeId:'col', awayId:'por', round:'group', venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id: 72, utc:'2026-06-27T23:30:00Z', homeId:'cod', awayId:'uzb', round:'group', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  // ── Group L ──────────────────────────────────────────────────────────────
  { id: 22, utc:'2026-06-17T20:00:00Z', homeId:'eng', awayId:'cro', round:'group', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 21, utc:'2026-06-17T23:00:00Z', homeId:'gha', awayId:'pan', round:'group', venue:'BMO Field',                   city:'Toronto'                },
  { id: 45, utc:'2026-06-23T20:00:00Z', homeId:'eng', awayId:'gha', round:'group', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 46, utc:'2026-06-23T23:00:00Z', homeId:'pan', awayId:'cro', round:'group', venue:'BMO Field',                   city:'Toronto'                },
  { id: 67, utc:'2026-06-27T21:00:00Z', homeId:'pan', awayId:'eng', round:'group', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id: 68, utc:'2026-06-27T21:00:00Z', homeId:'cro', awayId:'gha', round:'group', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  // ── Round of 32 ──────────────────────────────────────────────────────────
  { id: 73, utc:'2026-06-28T19:00:00Z', homeId:null, awayId:null, round:'r32', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 74, utc:'2026-06-29T20:30:00Z', homeId:null, awayId:null, round:'r32', venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 75, utc:'2026-06-30T01:00:00Z', homeId:null, awayId:null, round:'r32', venue:'Estadio BBVA',                city:'Monterrey'              },
  { id: 76, utc:'2026-06-29T17:00:00Z', homeId:null, awayId:null, round:'r32', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 77, utc:'2026-06-30T21:00:00Z', homeId:null, awayId:null, round:'r32', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id: 78, utc:'2026-06-30T17:00:00Z', homeId:null, awayId:null, round:'r32', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 79, utc:'2026-07-01T01:00:00Z', homeId:null, awayId:null, round:'r32', venue:'Estadio Azteca',              city:'Mexico City'            },
  { id: 80, utc:'2026-07-01T16:00:00Z', homeId:null, awayId:null, round:'r32', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  { id: 81, utc:'2026-07-02T00:00:00Z', homeId:null, awayId:null, round:'r32', venue:"Levi's Stadium",              city:'San Francisco Bay Area' },
  { id: 82, utc:'2026-07-01T20:00:00Z', homeId:null, awayId:null, round:'r32', venue:'Lumen Field',                 city:'Seattle'                },
  { id: 83, utc:'2026-07-02T23:00:00Z', homeId:null, awayId:null, round:'r32', venue:'BMO Field',                   city:'Toronto'                },
  { id: 84, utc:'2026-07-02T19:00:00Z', homeId:null, awayId:null, round:'r32', venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 85, utc:'2026-07-03T03:00:00Z', homeId:null, awayId:null, round:'r32', venue:'BC Place',                    city:'Vancouver'              },
  { id: 86, utc:'2026-07-03T22:00:00Z', homeId:null, awayId:null, round:'r32', venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id: 87, utc:'2026-07-04T01:30:00Z', homeId:null, awayId:null, round:'r32', venue:'Arrowhead Stadium',           city:'Kansas City'            },
  { id: 88, utc:'2026-07-03T18:00:00Z', homeId:null, awayId:null, round:'r32', venue:'AT&T Stadium',                city:'Dallas'                 },
  // ── Round of 16 ──────────────────────────────────────────────────────────
  { id: 89, utc:'2026-07-04T21:00:00Z', homeId:null, awayId:null, round:'r16', venue:'Lincoln Financial Field',     city:'Philadelphia'           },
  { id: 90, utc:'2026-07-04T17:00:00Z', homeId:null, awayId:null, round:'r16', venue:'NRG Stadium',                 city:'Houston'                },
  { id: 91, utc:'2026-07-05T20:00:00Z', homeId:null, awayId:null, round:'r16', venue:'MetLife Stadium',             city:'New York / New Jersey'  },
  { id: 92, utc:'2026-07-06T00:00:00Z', homeId:null, awayId:null, round:'r16', venue:'Estadio Azteca',              city:'Mexico City'            },
  { id: 93, utc:'2026-07-06T19:00:00Z', homeId:null, awayId:null, round:'r16', venue:'AT&T Stadium',                city:'Dallas'                 },
  { id: 94, utc:'2026-07-07T00:00:00Z', homeId:null, awayId:null, round:'r16', venue:'Lumen Field',                 city:'Seattle'                },
  { id: 95, utc:'2026-07-07T16:00:00Z', homeId:null, awayId:null, round:'r16', venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  { id: 96, utc:'2026-07-07T20:00:00Z', homeId:null, awayId:null, round:'r16', venue:'BC Place',                    city:'Vancouver'              },
  // ── Quarterfinals ────────────────────────────────────────────────────────
  { id: 97, utc:'2026-07-09T20:00:00Z', homeId:null, awayId:null, round:'qf',  venue:'Gillette Stadium',            city:'Boston'                 },
  { id: 98, utc:'2026-07-10T19:00:00Z', homeId:null, awayId:null, round:'qf',  venue:'SoFi Stadium',                city:'Los Angeles'            },
  { id: 99, utc:'2026-07-11T21:00:00Z', homeId:null, awayId:null, round:'qf',  venue:'Hard Rock Stadium',           city:'Miami'                  },
  { id:100, utc:'2026-07-12T01:00:00Z', homeId:null, awayId:null, round:'qf',  venue:'Arrowhead Stadium',           city:'Kansas City'            },
  // ── Semifinals ───────────────────────────────────────────────────────────
  { id:101, utc:'2026-07-14T19:00:00Z', homeId:null, awayId:null, round:'sf',  venue:'AT&T Stadium',                city:'Dallas'                 },
  { id:102, utc:'2026-07-15T19:00:00Z', homeId:null, awayId:null, round:'sf',  venue:'Mercedes-Benz Stadium',       city:'Atlanta'                },
  // ── Third-place play-off ─────────────────────────────────────────────────
  { id:103, utc:'2026-07-18T21:00:00Z', homeId:null, awayId:null, round:'3rd', venue:'Hard Rock Stadium',           city:'Miami'                  },
  // ── Final ────────────────────────────────────────────────────────────────
  { id:104, utc:'2026-07-19T19:00:00Z', homeId:null, awayId:null, round:'final',venue:'MetLife Stadium',            city:'New York / New Jersey'  },
];

// ── Team name lookup ──────────────────────────────────────────────────────────

const TEAM_NAME: Record<string, string> = {
  mex:'Mexico',       zaf:'South Africa',  kor:'South Korea',    cze:'Czechia',
  can:'Canada',       sui:'Switzerland',   qat:'Qatar',          bih:'Bosnia & Herz.',
  bra:'Brazil',       mar:'Morocco',       sco:'Scotland',       hai:'Haiti',
  usa:'United States',par:'Paraguay',      aus:'Australia',      tur:'Türkiye',
  ger:'Germany',      cur:'Curaçao',       civ:"Côte d'Ivoire",  ecu:'Ecuador',
  ned:'Netherlands',  jpn:'Japan',         tun:'Tunisia',        swe:'Sweden',
  bel:'Belgium',      egy:'Egypt',         irn:'Iran',           nzl:'New Zealand',
  esp:'Spain',        cpv:'Cape Verde',    ksa:'Saudi Arabia',   uru:'Uruguay',
  fra:'France',       sen:'Senegal',       nor:'Norway',         irq:'Iraq',
  arg:'Argentina',    alg:'Algeria',       aut:'Austria',        jor:'Jordan',
  por:'Portugal',     uzb:'Uzbekistan',    col:'Colombia',       cod:'DR Congo',
  eng:'England',      cro:'Croatia',       gha:'Ghana',          pan:'Panama',
};

const ROUND_LABEL: Record<MatchRound, string> = {
  group:'Group Stage', r32:'Round of 32', r16:'Round of 16',
  qf:'Quarterfinal',   sf:'Semifinal',    '3rd':'3rd-Place Play-off', final:'Final',
};

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(): Promise<Response> {
  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY  ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject    = process.env.VAPID_SUBJECT     ?? '';

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('[push-notify] VAPID env vars not configured');
    return new Response('Not configured', { status: 503 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const nowMs = Date.now();
  const WINDOW_MIN = 4 * 60 * 1000;
  const WINDOW_MAX = 6 * 60 * 1000;

  const upcoming = FIXTURES.filter(f => {
    const diff = new Date(f.utc).getTime() - nowMs;
    return diff >= WINDOW_MIN && diff <= WINDOW_MAX;
  });

  if (upcoming.length === 0) {
    return new Response('No upcoming kickoffs', { status: 200 });
  }

  const store = getStore('push-subscriptions');
  const { blobs } = await store.list();

  if (blobs.length === 0) {
    return new Response('No subscribers', { status: 200 });
  }

  let sent = 0;
  let pruned = 0;

  for (const fixture of upcoming) {
    const homeTeam = fixture.homeId ? TEAM_NAME[fixture.homeId] : null;
    const awayTeam = fixture.awayId ? TEAM_NAME[fixture.awayId] : null;

    const matchLine = homeTeam && awayTeam
      ? `${homeTeam} vs ${awayTeam}`
      : ROUND_LABEL[fixture.round];

    const payload = JSON.stringify({
      title: 'Kickoff in 5 minutes ⚽',
      body:  `${matchLine} · ${fixture.city}`,
      data:  { matchId: fixture.id },
    });

    for (const blob of blobs) {
      const sub = await store.get(blob.key, { type: 'json' }) as StoredSubscription | null;
      if (!sub) continue;

      // Filter: send only if subscriber wants all matches, OR one of their
      // favorites is playing in this fixture.
      const relevant =
        sub.allMatches ||
        (fixture.homeId != null && sub.favoriteTeamIds.includes(fixture.homeId)) ||
        (fixture.awayId != null && sub.favoriteTeamIds.includes(fixture.awayId));

      if (!relevant) continue;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys:     sub.keys,
            expirationTime: sub.expirationTime,
          },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410) {
          // Subscription expired — remove it
          await store.delete(blob.key);
          pruned++;
          console.log(`[push-notify] pruned expired subscription ${blob.key.slice(0, 8)}…`);
        } else {
          console.error(`[push-notify] send failed (${status}):`, err);
        }
      }
    }
  }

  console.log(`[push-notify] sent ${sent}, pruned ${pruned}, fixtures ${upcoming.length}`);
  return new Response('OK', { status: 200 });
}

export const config: Config = {
  schedule: '* * * * *',
};
