# Edeastorm v1.0 - Comprehensive Implementation Plan

**Last Updated:** 2026-01-13
**Project:** Edeastorm - Real-time Collaborative Ideation Platform
**Target:** Production v1.0 Launch

---

## ✅ Recently Completed (2026-01-13)

### Invitation Flow Race Condition Fix
- Fixed critical bug where invited users were assigned to personal organizations instead of joining invited organizations
- Updated database trigger to check for pending invitations before creating organizations
- Enhanced auth callback to log invitation context
- Improved invitation acceptance endpoint to handle duplicate memberships
- **Files:** `015_fix_invitation_race_condition.sql`, `auth.ts`, `accept/route.ts`
- **Documentation:** `README_INVITATION_FIX.md`

### Comprehensive Activity Logging System
- Implemented enterprise-grade activity logging for security, compliance, and audit
- Centralized logger with type-safe activity actions (auth, org, board, security, user)
- Zustand store for client-side activity tracking
- React components and hooks for easy integration
- Automatic logging via database triggers
- Activity log viewer with filters and pagination
- **Files Created:**
  - `src/lib/activity-logger.ts` - Core logger
  - `src/store/activityStore.ts` - Zustand store
  - `src/hooks/useActivityLogger.ts` - React hooks
  - `src/components/activity/ActivityLog.tsx` - UI component
  - `src/components/providers/ActivityProvider.tsx` - Context provider
  - `src/app/api/activity/log/route.ts` - Logging endpoint
  - `src/app/api/activity/route.ts` - Fetch endpoint
  - `src/lib/activity/index.ts` - Central exports
  - `docs/ACTIVITY_LOGGING.md` - Full documentation
  - `docs/IMPLEMENTATION_SUMMARY.md` - Implementation summary
- **Addresses:** Security audit requirements, compliance tracking, user activity monitoring

---

## Executive Summary

This plan covers all TODO items for v1.0 launch of Edeastorm, organized into 10 major epics with 87 actionable tasks. The plan prioritizes security, payment integration, and compliance as critical blockers, followed by feature completeness, testing, and documentation.

**Key Priorities:**
1. **Security hardening** - Fix authorization gaps, audit RLS policies, prevent exploits
2. **Payment integration** - Stripe setup, quota enforcement, plan cascading
3. **API for developers** - Public REST API with Mintlify documentation
4. **Legal compliance** - Privacy Policy, Terms of Service, GDPR audit
5. **Testing** - Smoke tests for critical paths
6. **Polish** - Canvas improvements, export features, UX enhancements

---

## Technology Context

**Stack:**
- Next.js 16.1 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Realtime + Storage)
- NextAuth v5 (Google/GitHub/Credentials OAuth)
- Zustand state management
- GSAP for canvas animations
- Google Gemini 2.5 Flash for AI features
- Vercel deployment

**Current Status:**
- ✅ Core features implemented (boards, collaboration, AI, invitations)
- ✅ 13 database migrations in place with RLS policies
- ✅ Real-time collaboration with Yjs CRDTs
- ⚠️ Security gaps identified (board access checks missing)
- ⚠️ No payment integration
- ⚠️ No usage quota enforcement
- ⚠️ Minimal testing coverage
- ⚠️ No legal documents

---

## Epic 1: Security Hardening & Authorization (CRITICAL)

**Priority:** P0 - Must complete before launch
**Complexity:** Medium
**Estimated Tasks:** 8

### 1.1 Fix Missing Board Access Verification (URGENT)

**Current Issue:** [src/app/api/ai/cluster/route.ts:38](src/app/api/ai/cluster/route.ts#L38) - Any authenticated user can trigger AI operations on any board

**Files to Modify:**
- [src/app/api/ai/cluster/route.ts](src/app/api/ai/cluster/route.ts)
- [src/app/api/ai/enhance/route.ts](src/app/api/ai/enhance/route.ts)
- [src/app/api/ai/sentiment/route.ts](src/app/api/ai/sentiment/route.ts)
- [src/app/api/ai/summarize/route.ts](src/app/api/ai/summarize/route.ts)

**Implementation:**
```typescript
// Add before AI operation
const { data: boardAccess } = await supabaseAdmin()
  .rpc('check_board_access', {
    p_board_id: boardId,
    p_user_id: session.user.id
  });

if (!boardAccess?.has_access || !['editor', 'admin'].includes(boardAccess?.access_role)) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

**Affected Endpoints:**
- `/api/ai/cluster`
- `/api/ai/enhance`
- `/api/ai/sentiment`
- `/api/ai/summarize`

### 1.2 Create Security Audit Checklist

**Create new file:** [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)

**Audit Areas:**
1. **SQL Injection** - Review all raw SQL queries (should be none, using Supabase client)
2. **XSS Protection** - Verify `sanitize-html` usage on all user content
3. **CSRF** - Verify NextAuth CSRF tokens on state-changing operations
4. **Session Hijacking** - Review JWT secret strength, rotation policy
5. **URL Manipulation** - Test accessing boards/teams/orgs by changing IDs in URL
6. **File Upload Vulnerabilities** - Verify file type validation, size limits, malware scanning
7. **Rate Limiting** - Add rate limits to API routes (use Vercel Rate Limiting or Upstash)

### 1.3 Tighten RLS Policies

**File to Review:** [supabase/migrations/003_rls_policies.sql](supabase/migrations/003_rls_policies.sql)

**Issues to Address:**
1. Line 23-25: "Organizations are viewable by everyone" - Should restrict to authenticated users with org membership
2. Add policies for `ai_insights`, `ai_processing_logs`, `ai_feedback` tables
3. Add policy for `organization_invitations` table
4. Add policy for `organization_members` table

**Create new migration:** `supabase/migrations/014_tighten_rls_policies.sql`

**Changes:**
```sql
-- Restrict organization visibility
DROP POLICY "Organizations are viewable by everyone" ON public.organizations;
CREATE POLICY "Organizations viewable by members"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- Add AI insights policies
CREATE POLICY "View AI insights on accessible boards"
ON public.ai_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true
  )
);

-- Only editors/admins can create AI insights
CREATE POLICY "Create AI insights"
ON public.ai_insights FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM check_board_access(board_id, auth.uid())
    WHERE has_access = true AND access_role IN ('editor', 'admin')
  )
);

-- Add similar policies for ai_processing_logs, ai_feedback, organization_invitations, organization_members
```

### 1.4 Add Input Validation Middleware

**Create new file:** [src/middleware/validation.ts](src/middleware/validation.ts)

**Features:**
- UUID validation helper
- Email validation helper
- Sanitization for all text inputs
- File type/size validation
- Request body size limits

**Usage in API routes:**
```typescript
import { validateUUID, sanitizeInput } from '@/middleware/validation';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!validateUUID(body.boardId)) {
    return NextResponse.json({ error: 'Invalid board ID' }, { status: 400 });
  }

  const sanitizedContent = sanitizeInput(body.content);
  // ...
}
```

### 1.5 Add Rate Limiting

**Service:** Upstash Redis ([Free tier](https://upstash.com/docs/redis/overall/pricing): 256MB storage, 500K commands/month, 10 databases)

**Install dependency:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Setup Upstash:**
1. Create free account at [console.upstash.com](https://console.upstash.com/)
2. Create a Redis database (select Global for best latency)
3. Copy REST URL and Token

**Add to `.env.local`:**
```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Create new file:** [src/lib/rate-limit.ts](src/lib/rate-limit.ts)

**Implementation:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// API rate limiter: 100 requests per minute per IP/user
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true, // Enable analytics dashboard
  prefix: "api", // Namespace for better organization
});

// AI rate limiter: 10 requests per minute per user
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ai",
});

// Auth rate limiter: 5 attempts per minute (stricter)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "auth",
});

/**
 * Helper function to get client identifier
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting with proper error handling
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number; retryAfter?: number }> {
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
```

**Usage in API routes:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit, apiRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  const identifier = getClientIdentifier(req, session?.user?.id);

  const result = await checkRateLimit(apiRateLimit, identifier);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    );
  }

  // Process request...
  const response = NextResponse.json({ success: true });

  // Add rate limit info to response headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  return response;
}
```

**Apply to API routes:**
- All `/api/ai/*` routes - use `aiRateLimit` with user ID
- `/api/board-images/upload` - use `apiRateLimit` with user ID
- `/api/invitations/*` - use `authRateLimit` with IP or email
- `/api/auth/*` - use `authRateLimit` with IP
- Public API `/api/v1/*` - use `apiRateLimit` with API key

**Benefits:**
- ✅ **Generous free tier** - 500K commands/month (enough for ~16.6K rate-checked requests/day)
- ✅ **Analytics dashboard** - Built-in rate limit analytics at [console.upstash.com](https://console.upstash.com/)
- ✅ **Serverless-optimized** - HTTP/REST-based, no connection pooling issues
- ✅ **Global edge** - Low latency worldwide
- ✅ **Fail-open strategy** - Service remains available if Redis is down
- ✅ **Scales with your growth** - Pay-as-you-go pricing when you exceed free tier ($0.20 per 100K requests)

**Cost projection for scale:**
- Free tier: 500K commands/month = 0 cost
- 1M requests/month: $2/month
- 5M requests/month: $10/month
- 10M requests/month: $20/month

### 1.6 Add Content Security Policy (CSP)

**Modify file:** [next.config.ts](next.config.ts)

**Add headers:**
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.supabase.co",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
            "frame-src https://accounts.google.com"
          ].join('; ')
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]
    }
  ];
}
```

### 1.7 Add Security Testing

**Create test file:** [cypress/e2e/security.cy.ts](cypress/e2e/security.cy.ts)

**Test cases:**
1. Attempt to access another user's board by manipulating URL
2. Attempt to trigger AI operations on inaccessible board
3. Attempt to upload malicious file types
4. Attempt to inject XSS in sticky note content
5. Verify rate limiting works

### 1.8 Security Documentation

**Create file:** [docs/SECURITY.md](docs/SECURITY.md)

**Content:**
- Security practices implemented
- Responsible disclosure policy
- Bug bounty information (if applicable)
- Contact for security issues

---

## Epic 2: Stripe Payment Integration (CRITICAL)

**Priority:** P0 - Revenue blocker
**Complexity:** Large
**Estimated Tasks:** 15

### 2.1 Database Schema for Subscriptions

**Create new migration:** `supabase/migrations/015_subscription_system.sql`

**Tables to create:**

```sql
-- Subscription plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, -- 'free', 'monthly', 'yearly'
  display_name VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(255), -- Stripe Price ID
  price_cents INTEGER NOT NULL,
  billing_interval VARCHAR(20), -- 'month', 'year', null for free
  features JSONB NOT NULL, -- Feature limits
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Usage tracking
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'ai_operations', 'image_storage'
  usage_count INTEGER DEFAULT 0,
  usage_bytes BIGINT DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type, period_start)
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans viewable by all authenticated"
ON public.subscription_plans FOR SELECT
TO authenticated USING (is_active = true);

CREATE POLICY "Users view own subscription"
ON public.user_subscriptions FOR SELECT
TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users view own usage"
ON public.usage_tracking FOR SELECT
TO authenticated USING (user_id = auth.uid());
```

### 2.2 Seed Subscription Plans

**Append to migration:** `supabase/migrations/015_subscription_system.sql`

```sql
-- Insert default plans
INSERT INTO public.subscription_plans (name, display_name, price_cents, billing_interval, features) VALUES
('free', 'Free Plan', 0, NULL, '{
  "ai_operations_per_month": 20,
  "image_storage_mb": 500,
  "max_image_size_mb": 3,
  "boards_limit": 10,
  "collaborators_per_board": 5
}'),
('monthly', 'Pro Monthly', 1500, 'month', '{
  "ai_operations_per_month": 1000,
  "image_storage_mb": 10000,
  "max_image_size_mb": 10,
  "boards_limit": null,
  "collaborators_per_board": null
}'),
('yearly', 'Pro Yearly', 15000, 'year', '{
  "ai_operations_per_month": 1000,
  "image_storage_mb": 10000,
  "max_image_size_mb": 10,
  "boards_limit": null,
  "collaborators_per_board": null
}');
```

### 2.3 Stripe Environment Setup

**Add to `.env.local`:**
```bash
# Stripe Keys (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

**Install Stripe SDK:**
```bash
npm install stripe @stripe/stripe-js
```

### 2.4 Stripe Client Configuration

**Create file:** [src/lib/stripe.ts](src/lib/stripe.ts)

```typescript
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  appInfo: {
    name: 'Edeastorm',
    version: '1.0.0',
  },
});

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

### 2.5 Subscription Management API Routes

**Create file:** [src/app/api/stripe/create-checkout-session/route.ts](src/app/api/stripe/create-checkout-session/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('email')
      .eq('id', session.user.id)
      .single();

    const { data: subscription } = await supabaseAdmin()
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
```

**Create file:** [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts)

**Handle events:**
- `checkout.session.completed` - Create subscription record
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_failed` - Mark as past_due

**Create file:** [src/app/api/stripe/create-portal-session/route.ts](src/app/api/stripe/create-portal-session/route.ts)

**Purpose:** Allow users to manage subscription, update payment method, cancel

### 2.6 Subscription Helper Functions

**Create file:** [src/lib/subscription.ts](src/lib/subscription.ts)

```typescript
import { supabaseAdmin } from './supabase';

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabaseAdmin()
    .from('user_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function getUserPlanFeatures(userId: string) {
  const subscription = await getUserSubscription(userId);
  return subscription?.plan?.features || getFreePlanFeatures();
}

function getFreePlanFeatures() {
  return {
    ai_operations_per_month: 20,
    image_storage_mb: 500,
    max_image_size_mb: 3,
    boards_limit: 10,
    collaborators_per_board: 5
  };
}

export async function hasFeatureAccess(userId: string, feature: string, currentUsage: number) {
  const features = await getUserPlanFeatures(userId);
  const limit = features[feature];

  if (limit === null || limit === undefined) return true; // Unlimited
  return currentUsage < limit;
}

export async function getBoardOwnerPlan(boardId: string) {
  const { data: board } = await supabaseAdmin()
    .from('boards')
    .select('created_by')
    .eq('id', boardId)
    .single();

  if (!board) return null;

  return getUserSubscription(board.created_by);
}
```

### 2.7 Usage Tracking System

**Create file:** [src/lib/usage-tracking.ts](src/lib/usage-tracking.ts)

```typescript
import { supabaseAdmin } from './supabase';

export async function trackAIUsage(userId: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabaseAdmin()
    .from('usage_tracking')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('resource_type', 'ai_operations')
    .eq('period_start', periodStart.toISOString())
    .single();

  if (data) {
    await supabaseAdmin()
      .from('usage_tracking')
      .update({ usage_count: data.usage_count + 1 })
      .eq('user_id', userId)
      .eq('resource_type', 'ai_operations')
      .eq('period_start', periodStart.toISOString());
  } else {
    await supabaseAdmin()
      .from('usage_tracking')
      .insert({
        user_id: userId,
        resource_type: 'ai_operations',
        usage_count: 1,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });
  }
}

export async function trackImageUpload(userId: string, fileSize: number) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data } = await supabaseAdmin()
    .from('usage_tracking')
    .select('usage_bytes')
    .eq('user_id', userId)
    .eq('resource_type', 'image_storage')
    .eq('period_start', periodStart.toISOString())
    .single();

  if (data) {
    await supabaseAdmin()
      .from('usage_tracking')
      .update({ usage_bytes: data.usage_bytes + fileSize })
      .eq('user_id', userId)
      .eq('resource_type', 'image_storage')
      .eq('period_start', periodStart.toISOString());
  } else {
    await supabaseAdmin()
      .from('usage_tracking')
      .insert({
        user_id: userId,
        resource_type: 'image_storage',
        usage_bytes: fileSize,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });
  }
}

export async function getCurrentUsage(userId: string, resourceType: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data } = await supabaseAdmin()
    .from('usage_tracking')
    .select('usage_count, usage_bytes')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .eq('period_start', periodStart.toISOString())
    .single();

  return data;
}
```

### 2.8-2.15 Continue with remaining payment tasks...

(See full plan in workspace file for complete implementation details)

---

## Implementation Timeline & Dependencies

### Phase 1 (Week 1): Critical Security & Infrastructure
**Dependencies:** None
**Tasks:**
- Epic 1: Security Hardening (all tasks)
- Epic 6: Versioning (all tasks)
- Start Epic 2: Stripe schema and setup (2.1-2.4)

**Deliverables:**
- All AI routes have board access checks
- RLS policies tightened
- Rate limiting implemented
- Version visible in UI
- Stripe configured

### Phase 2 (Week 2): Payment Integration
**Dependencies:** Phase 1 (Stripe setup)
**Tasks:**
- Epic 2: Stripe Integration (2.5-2.15)

**Deliverables:**
- Subscription plans working
- Quota enforcement on AI and images
- Plan cascading functional
- Usage dashboard visible
- Stripe webhooks handling events

### Phase 3 (Week 3): Public API & Documentation
**Dependencies:** Phase 1 (security)
**Tasks:**
- Epic 3: Public API (all tasks)

**Deliverables:**
- API key system working
- All 4 API endpoints live
- Mintlify documentation published
- API key management UI

### Phase 4 (Week 4): Legal & Auth Enhancements
**Dependencies:** None
**Tasks:**
- Epic 4: Legal & Compliance (all tasks)
- Epic 5: Authentication (all tasks)

**Deliverables:**
- Privacy Policy published
- Terms of Service published
- Cookie consent banner
- Data export/deletion working
- GitLab and Discord OAuth providers
- Invitation flow polished

### Phase 5 (Week 5): Canvas & Export Features
**Dependencies:** None
**Tasks:**
- Epic 7: Canvas Improvements (all tasks)
- Epic 8: Export Features (all tasks)

**Deliverables:**
- Canvas performance optimized
- Smart save implemented
- Arrows and shapes added
- PNG, SVG, PDF export working

### Phase 6 (Week 6): Testing & Polish
**Dependencies:** All previous phases
**Tasks:**
- Epic 9: Testing (all tasks)
- Bug fixes from testing
- Performance tuning
- Final security audit

**Deliverables:**
- All smoke tests passing
- Regression suite passing
- Performance metrics meeting targets
- Security checklist completed

---

## Success Criteria for v1.0 Launch

**Must Have:**
- ✅ All critical security vulnerabilities fixed
- ✅ Payment integration functional
- ✅ Public API available with documentation
- ✅ Legal pages published
- ✅ Basic smoke tests passing
- ✅ No known data loss bugs
- ✅ Authentication with 4+ providers
- ✅ Export to PNG, SVG, PDF

**Launch Readiness:**
- [ ] All "Must Have" criteria met
- [ ] Security audit passed
- [ ] Payment testing completed
- [ ] Legal review (if budget allows)
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Support email configured
- [ ] Launch announcement prepared

---

**End of v1.0 Implementation Plan**

*For complete details on all 10 epics and 87 tasks, refer to the full sections above.*
