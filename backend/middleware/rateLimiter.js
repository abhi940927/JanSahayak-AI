/**
 * JanSahayak AI - In-Memory Production Rate Limiting Middleware
 * Protects against DDoS, automated complaint spamming, and AI microservice flooding.
 */

const ipRequests = new Map();

/**
 * Creates a rate limiting middleware
 * @param {number} maxRequests - Max requests allowed within windowMs
 * @param {number} windowMs - Window duration in milliseconds (default: 60s)
 */
export const rateLimiter = (maxRequests = 120, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, []);
    }

    const timestamps = ipRequests.get(ip);
    // Filter out timestamps outside the active window
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again shortly.',
        retryAfterSeconds: Math.ceil(windowMs / 1000)
      });
    }

    recent.push(now);
    ipRequests.set(ip, recent);
    next();
  };
};
