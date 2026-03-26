import { createClient } from 'npm:@supabase/supabase-js@2.100.1';

import { scrapeUrls } from '../_shared/event-scraper.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/i,
  /^\[?fc/i,
  /^\[?fd/i,
];

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey || !authorization) {
      return jsonResponse({ error: 'Supabase context or auth header missing.' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError) {
      return jsonResponse({ error: adminError.message }, 403);
    }

    if (!isAdmin) {
      return jsonResponse({ error: 'Admin access required.' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const rawUrls = Array.isArray(payload?.urls) ? payload.urls : [];
    const urls = normalizeUrls(rawUrls);

    if (!urls.length) {
      return jsonResponse({ error: 'Please provide at least one URL.' }, 400);
    }

    if (urls.length > 20) {
      return jsonResponse({ error: 'Please send at most 20 URLs per request.' }, 400);
    }

    const response = await scrapeUrls(urls);
    return jsonResponse(response, 200);
  } catch (error) {
    return jsonResponse(
      {
        error:
          error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unexpected scraping error.',
      },
      500,
    );
  }
});

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeUrls(values: unknown[]): string[] {
  const uniqueUrls = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const url = value.trim();
    if (!url) {
      continue;
    }

    assertSafePublicUrl(url);
    uniqueUrls.add(url);
  }

  return [...uniqueUrls];
}

function assertSafePublicUrl(value: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Only http/https URLs are allowed: ${value}`);
  }

  const hostname = url.hostname.trim().toLowerCase();
  if (!hostname) {
    throw new Error(`URL is missing a hostname: ${value}`);
  }

  if (
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))
  ) {
    throw new Error(`Private or local URLs are not allowed: ${value}`);
  }
}
