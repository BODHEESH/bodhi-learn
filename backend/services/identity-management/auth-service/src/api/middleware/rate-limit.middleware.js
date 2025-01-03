// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\middleware\rate-limit.middleware.js

const { RedisService } = require('../services/redis.service');

class RateLimitMiddleware {
  constructor() {
    this.redis = new RedisService();
  }

  createRateLimiter(options) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests, please try again later.',
      keyGenerator = (req) => `rate_limit:${req.ip}`,
      skip = () => false
    } = options;

    return async (req, res, next) => {
      if (skip(req)) {
        return next();
      }

      const key = keyGenerator(req);

      try {
        const attempts = await this.redis.getRateLimitAttempts(key);

        if (attempts >= max) {
          return res.status(429).json({
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        await this.redis.setRateLimitKey(
          key,
          attempts + 1,
          Math.ceil(windowMs / 1000)
        );

        next();
      } catch (error) {
        console.error('Rate limit error:', error);
        // Fail open - allow request in case of Redis error
        next();
      }
    };
  }

  // Specific rate limiters for different endpoints
  loginLimiter() {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per 15 minutes
      message: 'Too many login attempts, please try again after 15 minutes',
      keyGenerator: (req) => `rate_limit:login:${req.ip}`
    });
  }

  passwordResetLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 password reset requests per hour
      message: 'Too many password reset requests, please try again after an hour',
      keyGenerator: (req) => `rate_limit:password_reset:${req.ip}`
    });
  }

  mfaVerifyLimiter() {
    return this.createRateLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5, // limit each IP to 5 MFA verification attempts per 5 minutes
      message: 'Too many MFA verification attempts, please try again after 5 minutes',
      keyGenerator: (req) => `rate_limit:mfa:${req.user.id}:${req.ip}`
    });
  }
}

module.exports = { RateLimitMiddleware };
