/**
 * Netlify Function — GET /api/scores
 *
 * Serves the latest scores payload from Netlify Blobs. This is what the
 * frontend fetches on page load and tab focus (see src/lib/config.ts).
 *
 * Returns the JSON written by fetch-scores.mts, or an empty payload if no
 * data has been stored yet (e.g. first deploy before the cron runs).
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async function handler(): Promise<Response> {
  try {
    const store = getStore('scores');
    const data = await store.get('latest', { type: 'json' });
    const payload = data ?? { updated: null, scores: {} };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 s on CDN — fresh enough for live matches
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[scores] blob read failed:', err);
    // Return empty payload so the frontend still renders the static schedule
    return new Response(JSON.stringify({ updated: null, scores: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config: Config = {
  path: '/api/scores',
};
