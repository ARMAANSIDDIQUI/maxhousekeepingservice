import Settings from '../models/Settings.js';

/**
 * Cached global flag for supervisor live tracking.
 * Avoids a Settings DB read on every GPS poll/broadcast request.
 */
const CACHE_TTL_MS = 5000;
let cachedValue = true;
let cachedAt = 0;
let inflight = null;

export async function isLiveTrackingEnabled() {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) return cachedValue;
  if (inflight) return inflight;

  inflight = Settings.findOne().select('liveTrackingEnabled').lean()
    .then((s) => {
      cachedValue = s?.liveTrackingEnabled !== false;
      cachedAt = Date.now();
      return cachedValue;
    })
    .catch(() => cachedValue)
    .finally(() => { inflight = null; });

  return inflight;
}

/** Connected clients listening for live-tracking state changes (Server-Sent Events). */
const subscribers = new Set();

function broadcast(value) {
  const payload = `event: live-tracking\ndata: ${JSON.stringify({ liveTrackingEnabled: value, at: Date.now() })}\n\n`;
  for (const res of subscribers) {
    try { res.write(payload); } catch { subscribers.delete(res); }
  }
}

/** Call after admin updates settings: refreshes server cache and pings every connected client. */
export function setLiveTrackingCache(value) {
  cachedValue = value !== false;
  cachedAt = Date.now();
  broadcast(cachedValue);
}

/**
 * GET /api/v1/public/live-tracking/stream
 * Lightweight SSE channel: sends current state on connect, then a ping whenever admin flips the switch.
 */
export async function liveTrackingStream(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');

  const current = await isLiveTrackingEnabled();
  res.write(`event: live-tracking\ndata: ${JSON.stringify({ liveTrackingEnabled: current, at: Date.now() })}\n\n`);

  subscribers.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(': keep-alive\n\n'); } catch { /* closed */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    subscribers.delete(res);
  });
}

/**
 * Route guard: short-circuits all live-tracking related endpoints
 * (GPS polling, broadcast, routing) with HTTP 200 + liveTrackingEnabled:false
 * when admin has disabled tracking. No further DB or third-party work is done.
 */
export async function requireLiveTracking(req, res, next) {
  try {
    if (await isLiveTrackingEnabled()) return next();
    return res.status(200).json({
      success: false,
      liveTrackingEnabled: false,
      message: 'Supervisor live tracking is currently disabled by administration.'
    });
  } catch (err) {
    return next(err);
  }
}
