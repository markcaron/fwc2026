/**
 * Runtime configuration.
 *
 * SCORES_URL points at a public JSON file that contains only the matches
 * that have been played so far. Updating that file is all that's needed to
 * push new results — no Netlify rebuild required.
 *
 * Recommended host: a public GitHub Gist.
 *   1. Create a Gist with a file named `scores.json` (use public/scores.json
 *      in this repo as the starting template).
 *   2. Copy the "Raw" URL for the file.
 *   3. Replace the placeholder below with that URL.
 *
 * The app fetches the URL at page load and on every tab focus, so results
 * appear as soon as the user opens or returns to the page.
 *
 * Leave as an empty string to skip fetching (app shows scheduled times only).
 */
export const SCORES_URL =
  'https://gist.githubusercontent.com/markcaron/fwc2026-scores/raw/scores.json';
