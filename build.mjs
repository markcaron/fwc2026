/**
 * Production build script for Netlify (and any static host).
 *
 * What it does:
 *   1. Bundles src/index.ts → dist/bundle.js  (esbuild, minified ESM)
 *   2. Copies src/tokens.css → dist/src/tokens.css  (keeps /src/tokens.css path)
 *   3. Copies public/ → dist/public/           (SVG icons, favicon, etc.)
 *   4. Patches index.html → dist/index.html    (swaps TypeScript src for bundle.js)
 *
 * Why this is needed:
 *   The dev server (web-dev-server + esbuild plugin) transpiles .ts files on
 *   the fly in the browser. In production, browsers enforce strict MIME types —
 *   a .ts file served as text/vnd.trolltech.linguist is rejected as a module.
 *   Bundling produces a valid .js file the browser can load without issues.
 */

import { build } from 'esbuild';
import fs from 'node:fs';
import sharp from 'sharp';

// ── Clean and scaffold output dir ────────────────────────────
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/src',    { recursive: true });
fs.mkdirSync('dist/public', { recursive: true });

// ── 1. Bundle TypeScript ──────────────────────────────────────
await build({
  entryPoints: ['src/index.ts'],
  bundle:      true,
  outfile:     'dist/bundle.js',
  format:      'esm',
  target:      'es2022',
  minify:      true,
});
console.log('✓ Bundled src/index.ts → dist/bundle.js');

// ── 2. Copy CSS (index.html links it as /src/tokens.css) ─────
fs.copyFileSync('src/tokens.css', 'dist/src/tokens.css');
console.log('✓ Copied src/tokens.css');

// ── 3. Copy public assets ────────────────────────────────────
fs.cpSync('public', 'dist/public', { recursive: true });
console.log('✓ Copied public/');

// ── 3a. Generate apple-touch-icon.png from favicon.svg ───────
// iOS/Safari requires a 180×180 PNG for home-screen icons.
// We render the same SVG used for the browser favicon.
await sharp(
  Buffer.from(fs.readFileSync('public/favicon.svg', 'utf8')),
  { density: 72 }           // 72 dpi → crisp render at 180×180 px
)
  .resize(180, 180)
  .png()
  .toFile('dist/public/apple-touch-icon.png');
console.log('✓ Generated apple-touch-icon.png (180×180)');

// ── 4. Patch index.html ──────────────────────────────────────
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<script type="module" src="/src/index.ts"></script>',
  '<script type="module" src="/bundle.js"></script>',
);
fs.writeFileSync('dist/index.html', html);
console.log('✓ Patched index.html → dist/index.html');

console.log('\nBuild complete → dist/');
