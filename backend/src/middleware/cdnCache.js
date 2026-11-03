/**
 * CDN cache headers for public, non-personalised GET endpoints.
 * On Vercel the edge serves cached responses without invoking the function
 * (no compute, no DB read, no Google Maps API call) for repeated requests.
 *
 * @param {number} sMaxAge  seconds the edge may serve the cached copy
 * @param {number} swr      seconds the edge may serve stale while revalidating in background
 */
export function cdnCache(sMaxAge = 60, swr = 300) {
  return (req, res, next) => {
    if (req.method === 'GET' && !req.headers.authorization) {
      res.set('Cache-Control', `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`);
    }
    next();
  };
}

