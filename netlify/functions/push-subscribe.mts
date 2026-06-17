/**
 * Netlify Function — POST /api/push/subscribe
 *                    DELETE /api/push/subscribe
 *
 * Manages Web Push subscription registration and removal.
 * Subscriptions are stored in a Netlify Blob store keyed by a SHA-256 hash
 * of the endpoint URL so that duplicate registrations are silently deduplicated.
 *
 * Environment variables required (set in Netlify dashboard):
 *   VAPID_PUBLIC_KEY   — base64url-encoded VAPID public key
 *   VAPID_PRIVATE_KEY  — base64url-encoded VAPID private key
 *   VAPID_SUBJECT      — mailto: or https: contact URI (e.g. "mailto:admin@example.com")
 *
 * Generate a key pair once with: npx web-push generate-vapid-keys
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscribeBody {
  subscription: PushSubscriptionJSON;
  allMatches: boolean;
  favoriteTeamIds: string[];
}

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
  allMatches: boolean;
  favoriteTeamIds: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function endpointKey(endpoint: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY  ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject    = process.env.VAPID_SUBJECT     ?? '';

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('[push-subscribe] VAPID env vars not configured');
    return new Response('Push notifications not configured', { status: 503 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const store = getStore('push-subscriptions');

  // ── POST — upsert subscription ─────────────────────────────────────────────
  if (req.method === 'POST') {
    let body: SubscribeBody;
    try {
      body = await req.json() as SubscribeBody;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { subscription, allMatches, favoriteTeamIds } = body;
    if (!subscription?.endpoint) {
      return new Response('Missing subscription endpoint', { status: 400 });
    }

    const keys = subscription.keys as { p256dh?: string; auth?: string } | undefined;
    if (!keys?.p256dh || !keys?.auth) {
      return new Response('Missing subscription keys', { status: 400 });
    }

    const key = await endpointKey(subscription.endpoint);
    await store.setJSON(key, {
      endpoint:       subscription.endpoint,
      keys:           { p256dh: keys.p256dh, auth: keys.auth },
      expirationTime: subscription.expirationTime ?? null,
      allMatches:     Boolean(allMatches),
      favoriteTeamIds: Array.isArray(favoriteTeamIds) ? favoriteTeamIds : [],
    } satisfies StoredSubscription);

    console.log(`[push-subscribe] upserted ${key.slice(0, 8)}…`);
    return new Response('Created', { status: 201 });
  }

  // ── DELETE — remove subscription ──────────────────────────────────────────
  if (req.method === 'DELETE') {
    let body: { endpoint: string };
    try {
      body = await req.json() as { endpoint: string };
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (!body?.endpoint) {
      return new Response('Missing endpoint', { status: 400 });
    }

    const key = await endpointKey(body.endpoint);
    await store.delete(key);
    console.log(`[push-subscribe] deleted ${key.slice(0, 8)}…`);
    return new Response(null, { status: 204 });
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST, DELETE' },
  });
}

export const config: Config = {
  path: '/api/push/subscribe',
};
