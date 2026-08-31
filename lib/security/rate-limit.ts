import type { NextRequest } from 'next/server';

export const RATE_APPLICATION_BURST = 3;
export const RATE_APPLICATION_BURST_WINDOW_SECONDS = 30;
export const RATE_APPLICATION_WINDOW = 5;
export const RATE_APPLICATION_WINDOW_SECONDS = 10 * 60;

const RATE_LIMIT_SCRIPT = `
local burst = tonumber(redis.call('GET', KEYS[1]) or '0')
local window = tonumber(redis.call('GET', KEYS[2]) or '0')

if burst >= tonumber(ARGV[1]) or window >= tonumber(ARGV[2]) then
  local ttl1 = redis.call('PTTL', KEYS[1])
  local ttl2 = redis.call('PTTL', KEYS[2])
  return {0, ttl1, ttl2}
end

local next_burst = redis.call('INCR', KEYS[1])
if next_burst == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
end

local next_window = redis.call('INCR', KEYS[2])
if next_window == 1 then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
end

if next_burst > tonumber(ARGV[1]) or next_window > tonumber(ARGV[2]) then
  local ttl1 = redis.call('PTTL', KEYS[1])
  local ttl2 = redis.call('PTTL', KEYS[2])
  return {0, ttl1, ttl2}
end

return {1, redis.call('PTTL', KEYS[1]), redis.call('PTTL', KEYS[2])}
`;

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || '0.0.0.0';
  return request.headers.get('x-real-ip')?.trim() || '0.0.0.0';
}

function env() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

function windowKey(ip: string, seconds: number) {
  const bucket = Math.floor(Date.now() / 1000 / seconds);
  return `squad25:recruitment:ip:${ip}:w${seconds}:${bucket}`;
}

export type RecruitmentRateLimitResult =
  | { allowed: true; retryAfterSeconds: 0 }
  | { allowed: false; retryAfterSeconds: number; unavailable: false }
  | { allowed: false; retryAfterSeconds: 0; unavailable: true };

export async function checkRecruitmentRateLimit(request: NextRequest): Promise<RecruitmentRateLimitResult> {
  const credentials = env();
  if (!credentials) return { allowed: false, retryAfterSeconds: 0, unavailable: true };

  const ip = clientIp(request);
  const burstKey = windowKey(ip, RATE_APPLICATION_BURST_WINDOW_SECONDS);
  const windowKeyName = windowKey(ip, RATE_APPLICATION_WINDOW_SECONDS);

  try {
    const response = await fetch(credentials.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify([
        'EVAL',
        RATE_LIMIT_SCRIPT,
        '2',
        burstKey,
        windowKeyName,
        RATE_APPLICATION_BURST,
        RATE_APPLICATION_WINDOW,
        RATE_APPLICATION_BURST_WINDOW_SECONDS,
        RATE_APPLICATION_WINDOW_SECONDS,
      ]),
    });

    if (!response.ok) return { allowed: false, retryAfterSeconds: 0, unavailable: true };

    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (typeof payload.error === 'string') return { allowed: false, retryAfterSeconds: 0, unavailable: true };

    if (!Array.isArray(payload.result) || payload.result.length < 3) {
      return { allowed: false, retryAfterSeconds: 0, unavailable: true };
    }

    const allowed = Number(payload.result[0]);
    const burstTtlMs = Number(payload.result[1]);
    const windowTtlMs = Number(payload.result[2]);

    if (!Number.isInteger(allowed) || !Number.isFinite(burstTtlMs) || !Number.isFinite(windowTtlMs)) {
      return { allowed: false, retryAfterSeconds: 0, unavailable: true };
    }

    if (allowed === 1) return { allowed: true, retryAfterSeconds: 0 };

    const retryAfterSeconds = Math.max(1, Math.ceil(Math.min(burstTtlMs, windowTtlMs) / 1000));
    return { allowed: false, retryAfterSeconds, unavailable: false };
  } catch {
    return { allowed: false, retryAfterSeconds: 0, unavailable: true };
  }
}
