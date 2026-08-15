# Security Audit Checklist

**Last Updated:** 2026-01-13
**Version:** 1.0.0
**Status:** Pre-Launch Audit

---

## Overview

This document provides a comprehensive security audit checklist for the Edeastorm application before v1.0 launch. Each item should be verified and checked off before going to production.

---

## 1. Authentication & Authorization

### 1.1 Authentication Security
- [x] **NextAuth properly configured** with secure session handling
- [x] **Multiple OAuth providers** (Google, GitHub, GitLab, Discord)
- [x] **Session tokens** use secure random generation
- [x] **JWT secrets** are strong and not exposed
- [ ] **Session expiry** is configured appropriately (verify timeouts)
- [ ] **Refresh token rotation** implemented (if using refresh tokens)
- [ ] **CSRF protection** enabled for all state-changing operations

### 1.2 Authorization & Access Control
- [x] **RLS policies** enabled on all Supabase tables
- [x] **Board access verification** implemented in all AI routes
- [ ] **Role-based permissions** tested with different user roles
- [ ] **Organization isolation** verified (users can only see their org data)
- [ ] **Team membership** properly enforced
- [ ] **Board collaborator** permissions working correctly

**Test Cases:**
1. User A cannot access User B's private boards
2. User without editor role cannot perform AI operations
3. Organization members cannot see other organizations
4. Deleted users lose all access immediately

---

## 2. Input Validation & Sanitization

### 2.1 Data Validation
- [x] **UUID validation** for all ID parameters (boardId, userId, etc.)
- [x] **Email validation** using proper regex
- [x] **Length validation** for text inputs (titles, descriptions)
- [x] **File size validation** for uploads
- [x] **File type validation** for uploads (MIME type checking)
- [ ] **URL validation** for external links
- [ ] **Enum validation** for role/status fields

### 2.2 XSS Prevention
- [x] **HTML sanitization** using sanitize-html library
- [x] **Content Security Policy** headers configured
- [ ] **User-generated content** sanitized before display
- [ ] **Sticky note content** sanitized and validated
- [ ] **Board descriptions** sanitized
- [ ] **React dangerouslySetInnerHTML** avoided or properly sanitized

**Test Cases:**
1. Try to inject `<script>alert('XSS')</script>` in sticky notes
2. Try to inject event handlers (`<img src=x onerror=alert(1)>`)
3. Try to inject CSS with JavaScript (`<style>@import url('javascript:...')</style>`)

---

## 3. SQL Injection & Database Security

### 3.1 Query Safety
- [x] **Supabase client** used for all database queries (parameterized)
- [x] **No raw SQL** in application code (except migrations)
- [x] **RPC functions** use proper parameter binding
- [ ] **Dynamic queries** reviewed for injection risks
- [ ] **User input** never directly concatenated into queries

### 3.2 Row Level Security
- [x] **RLS enabled** on all tables
- [x] **Organizations** only visible to members
- [x] **Boards** properly isolated by access rights
- [x] **Canvas items** only accessible via board access
- [x] **AI insights** protected by board access
- [x] **Invitations** only visible to admins and invitees

**Test Cases:**
1. Try to query boards table directly with another user's board ID
2. Attempt SQL injection in text fields
3. Verify service role is only used server-side

---

## 4. Cross-Site Request Forgery (CSRF)

### 4.1 CSRF Protection
- [x] **NextAuth CSRF tokens** enabled
- [ ] **State-changing API routes** verify CSRF tokens
- [ ] **Cookie sameSite** attribute set to 'lax' or 'strict'
- [ ] **Double-submit cookies** implemented where needed

**Test Cases:**
1. Try to submit form from external site
2. Verify CSRF token in all POST/PUT/DELETE requests
3. Test with cookies disabled

---

## 5. Session Security

### 5.1 Session Management
- [ ] **Secure cookie flags** (HttpOnly, Secure, SameSite)
- [ ] **Session fixation** prevention
- [ ] **Concurrent session** limits (optional)
- [ ] **Session invalidation** on password change
- [ ] **Session timeout** after inactivity
- [ ] **Logout** properly clears all session data

### 5.2 JWT Security
- [ ] **JWT secret** is strong (minimum 32 characters)
- [ ] **JWT secret rotation** plan in place
- [ ] **JWT expiry** set appropriately (not too long)
- [ ] **JWT signature** always verified
- [ ] **Sensitive data** not stored in JWT payload

**Test Cases:**
1. Try to reuse old session tokens after logout
2. Verify session expires after timeout
3. Test session hijacking scenarios

---

## 6. File Upload Security

### 6.1 Upload Validation
- [x] **File size limits** enforced (3MB free, 10MB pro)
- [x] **MIME type validation** implemented
- [x] **File extension validation** implemented
- [ ] **Virus scanning** configured (consider ClamAV or similar)
- [ ] **Storage quotas** enforced per plan
- [ ] **Filename sanitization** to prevent path traversal

### 6.2 Supabase Storage Security
- [ ] **Storage policies** properly configured
- [ ] **Public buckets** only for appropriate files
- [ ] **Signed URLs** used for private files
- [ ] **Upload restrictions** by user role

**Test Cases:**
1. Try to upload executable files (.exe, .sh, .bat)
2. Try to upload files exceeding size limit
3. Try to upload malicious SVG with embedded scripts
4. Verify path traversal protection (../../../etc/passwd)

---

## 7. API Security

### 7.1 Rate Limiting
- [x] **Rate limiting** implemented with Upstash Redis
- [x] **API routes** protected (100 req/min)
- [x] **AI routes** rate limited (10 req/min)
- [x] **Auth routes** strictly limited (5 req/min)
- [x] **Upload routes** rate limited (30 req/10s)
- [ ] **Rate limit headers** returned (X-RateLimit-*)
- [ ] **429 responses** properly handled in UI

### 7.2 API Authentication
- [ ] **Public API** requires API key authentication
- [ ] **API keys** properly hashed in database
- [ ] **API key scopes** enforced
- [ ] **API key expiry** implemented
- [ ] **API key revocation** working

**Test Cases:**
1. Make 101 requests in 1 minute to trigger rate limit
2. Try API requests without authentication
3. Verify rate limit resets after window expires

---

## 8. Secrets Management

### 8.1 Environment Variables
- [ ] **All secrets** stored in environment variables
- [ ] **.env files** in .gitignore
- [ ] **Production secrets** rotated regularly
- [ ] **No secrets** hardcoded in source code
- [ ] **API keys** not exposed to client-side code

### 8.2 Exposed Secrets Check
- [ ] **GitHub scanning** enabled for secrets
- [ ] **Vercel environment variables** properly secured
- [ ] **Supabase keys** (anon key is expected to be public, service role key is private)
- [ ] **Stripe keys** (publishable is public, secret key is private)
- [ ] **OAuth secrets** never exposed to client

**Test Cases:**
1. Search codebase for common secret patterns
2. Verify .env.local is not committed
3. Check browser DevTools for exposed secrets

---

## 9. Dependency Security

### 9.1 Package Security
- [ ] **npm audit** shows no high/critical vulnerabilities
- [ ] **Outdated packages** reviewed and updated
- [ ] **Dependency scanning** in CI/CD pipeline
- [ ] **Supply chain attacks** mitigated (lock files used)

### 9.2 Third-Party Services
- [ ] **Supabase** connection secured (SSL/TLS)
- [ ] **Upstash Redis** connection secured
- [ ] **Google OAuth** credentials secured
- [ ] **Stripe webhooks** signature verified

**Commands to run:**
```bash
npm audit
npm audit fix
npm outdated
```

---

## 10. Transport Security

### 10.1 HTTPS/TLS
- [ ] **HTTPS enforced** on all pages (Vercel handles this)
- [ ] **Mixed content** warnings resolved
- [ ] **HSTS header** configured
- [ ] **TLS version** is 1.2 or higher
- [ ] **WebSocket connections** use WSS (secure)

### 10.2 Certificate Management
- [ ] **SSL certificate** valid and not expired (Vercel auto-renews)
- [ ] **Certificate chain** complete
- [ ] **Certificate pinning** considered for mobile (future)

---

## 11. Content Security

### 11.1 Content Security Policy
- [x] **CSP headers** configured in next.config.ts
- [x] **script-src** restrictive (no unsafe inline except where needed)
- [x] **img-src** allows only trusted sources
- [x] **connect-src** limited to Supabase and Google
- [x] **frame-ancestors** set to 'none'
- [ ] **CSP violations** monitored (add report-uri)

### 11.2 Other Security Headers
- [x] **X-Frame-Options** set to DENY
- [x] **X-Content-Type-Options** set to nosniff
- [x] **X-XSS-Protection** enabled
- [x] **Referrer-Policy** set appropriately
- [x] **Permissions-Policy** configured

**Test with:**
- https://securityheaders.com
- https://observatory.mozilla.org

---

## 12. Real-time Security

### 12.1 Supabase Realtime
- [ ] **Realtime channels** properly authenticated
- [ ] **Broadcast messages** validated
- [ ] **Presence tracking** doesn't leak sensitive data
- [ ] **Message rate limiting** in place
- [ ] **Malicious payloads** handled gracefully

### 12.2 WebSocket Security
- [ ] **WSS (secure WebSocket)** used
- [ ] **Origin validation** for WebSocket connections
- [ ] **Message size limits** enforced
- [ ] **Connection limits** per user

---

## 13. Logging & Monitoring

### 13.1 Security Logging
- [ ] **Authentication failures** logged
- [ ] **Authorization failures** logged
- [ ] **Rate limit violations** logged
- [ ] **Suspicious activity** flagged
- [ ] **PII data** not logged

### 13.2 Monitoring
- [ ] **Error monitoring** configured (consider Sentry)
- [ ] **Performance monitoring** in place
- [ ] **Security alerts** configured
- [ ] **Failed login attempts** tracked
- [ ] **Unusual API patterns** detected

---

## 14. User Privacy

### 14.1 Data Protection
- [ ] **Privacy Policy** published
- [ ] **Terms of Service** published
- [ ] **Cookie consent** banner implemented
- [ ] **Data export** functionality working
- [ ] **Account deletion** properly implemented (30-day grace period)
- [ ] **Right to be forgotten** (GDPR compliance)

### 14.2 Data Minimization
- [ ] **Only necessary data** collected
- [ ] **User data retention** policy defined
- [ ] **Anonymous analytics** considered
- [ ] **Data encryption** at rest (Supabase handles this)
- [ ] **Data encryption** in transit (HTTPS)

---

## 15. Incident Response

### 15.1 Preparedness
- [ ] **Security incident response plan** documented
- [ ] **Contact information** for security team
- [ ] **Breach notification** process defined
- [ ] **Backup and recovery** procedures tested
- [ ] **Rollback procedures** documented

### 15.2 Vulnerability Disclosure
- [ ] **Security.md** file in repository
- [ ] **Responsible disclosure policy** published
- [ ] **Security contact email** configured
- [ ] **Bug bounty program** considered (optional for v1.0)

---

## Pre-Launch Security Testing

### Manual Testing
- [ ] Test authentication flows with multiple providers
- [ ] Test authorization with different user roles
- [ ] Attempt common security exploits (XSS, CSRF, SQL injection)
- [ ] Test file upload security
- [ ] Verify rate limiting works
- [ ] Test session management and logout

### Automated Testing
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Run security headers check
- [ ] Run dependency scanning
- [ ] Execute security test suite (Cypress)

### External Review
- [ ] Security code review completed
- [ ] Penetration testing considered (optional)
- [ ] Third-party security audit (optional)

---

## Post-Launch Monitoring

### Ongoing Security
- [ ] Monitor security logs daily
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Penetration testing annually

### Incident Response
- [ ] Monitor for security incidents
- [ ] Respond to vulnerability reports within 24 hours
- [ ] Patch critical vulnerabilities immediately
- [ ] Communicate breaches transparently

---

## Sign-Off

**Audited by:** _____________________
**Date:** _____________________
**Approved by:** _____________________
**Date:** _____________________

**Notes:**
_________________________________
_________________________________
_________________________________

---

## Quick Reference: Common Security Commands

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check outdated packages
npm outdated

# Test security headers
curl -I https://your-domain.com

# Check for secrets in git history
git log -S "password" --all

# Search for hardcoded secrets
grep -r "api_key" --exclude-dir=node_modules .
grep -r "password" --exclude-dir=node_modules .
grep -r "secret" --exclude-dir=node_modules .
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vercel Security](https://vercel.com/docs/security/deployment-protection)
