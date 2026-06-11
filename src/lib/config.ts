/**
 * Runtime configuration.
 *
 * SCORES_URL is the endpoint the frontend fetches at page load and on every
 * tab focus to get live / completed match scores.
 *
 * In production (Netlify):
 *   /api/scores is served by netlify/functions/scores.mts which reads from
 *   Netlify Blobs. The Blobs data is populated every 5 minutes by
 *   netlify/functions/fetch-scores.mts (a scheduled cron function that calls
 *   football-data.org using the FOOTBALL_DATA_API_KEY env variable).
 *
 * In local dev (npm run dev):
 *   /api/scores won't exist unless you run `netlify dev` instead. The app
 *   degrades gracefully — a failed fetch returns null and the static schedule
 *   is shown with no scores. Run `netlify dev` to test the full pipeline locally.
 */
export const SCORES_URL = '/api/scores';
