/**
 * Runtime configuration.
 *
 * SCORES_URL is the endpoint the frontend fetches for live / completed scores.
 * Served by netlify/functions/scores.mts, populated every 5 min by
 * netlify/functions/fetch-scores.mts (cron) via football-data.org.
 *
 * For local dev testing without `netlify dev`, temporarily swap to:
 *   '/public/scores.json'  and edit that file with test data.
 */
export const SCORES_URL = '/api/scores';
