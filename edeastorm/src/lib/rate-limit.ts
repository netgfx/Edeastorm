/**
 * Rate Limiting with Upstash Redis
 *
 * Provides rate limiting functionality for API routes using Upstash Redis
 * Free tier: 256MB storage, 500K commands/month, 10 databases
 *
 * Setup:
 * 1. Create account at console.upstash.com
 * 2. Create Redis database (Global for best latency)
 * 3. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * API rate limiter: 100 requests per minute per IP/user
 * Use for general API endpoints
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true, // Enable analytics dashboard at console.upstash.com
  prefix: "api", // Namespace for better organization
});

/**
 * AI rate limiter: 10 requests per minute per user
 * Use for AI operations (cluster, enhance, sentiment, summarize)
 */
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ai",
});

/**
 * Auth rate limiter: 5 attempts per minute (stricter)
 * Use for authentication endpoints (signin, signup, password reset)
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "auth",
});

/**
 * Upload rate limiter: 30 uploads per 10 seconds
 * Use for file upload endpoints
 */
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  analytics: true,
  prefix: "upload",
});

/**
 * Helper function to get client identifier
 * Prefers user ID for authenticated requests, falls back to IP
 *
 * @param req - Next.js Request object
 * @param userId - Optional authenticated user ID
 * @returns Unique identifier string
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address for unauthenticated requests
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting with proper error handling
 *
 * Implements a "fail-open" strategy: if rate limiting check fails due to
 * Redis being down, the request is allowed to proceed. This ensures service
 * availability is prioritized over strict rate limiting.
 *
 * @param limiter - Ratelimit instance to use
 * @param identifier - Unique identifier for the client
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (error) {
    // Log error for monitoring
    console.error('Rate limit check failed:', error);

    // Fail open - allow request if rate limiter is down
    // Better to have service available than block all requests
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}

/**
 * Example usage in API routes:
 *
 * import { NextRequest, NextResponse } from 'next/server';
 * import { auth } from '@/lib/auth';
 * import { checkRateLimit, apiRateLimit, getClientIdentifier } from '@/lib/rate-limit';
 *
 * export async function POST(req: NextRequest) {
 *   // Get authenticated user (if any)
 *   const session = await auth();
 *   const identifier = getClientIdentifier(req, session?.user?.id);
 *
 *   // Check rate limit
 *   const result = await checkRateLimit(apiRateLimit, identifier);
 *
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests. Please try again later.' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': result.limit.toString(),
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': new Date(result.reset).toISOString(),
 *           'Retry-After': result.retryAfter?.toString() || '60',
 *         },
 *       }
 *     );
 *   }
 *
 *   // Process request...
 *   const response = NextResponse.json({ success: true });
 *
 *   // Add rate limit info to response headers
 *   response.headers.set('X-RateLimit-Limit', result.limit.toString());
 *   response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
 *   response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());
 *
 *   return response;
 * }
 */
