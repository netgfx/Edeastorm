# Security Policy

**Version:** 1.0.0
**Last Updated:** 2026-01-13

---

## Overview

At Edeastorm, we take the security of our platform and user data very seriously. This document outlines our security practices, how to report vulnerabilities, and our commitment to protecting your information.

---

## Security Practices

### 1. Authentication & Authorization

- **Multiple OAuth Providers**: We support Google, GitHub, GitLab, and Discord OAuth for secure authentication
- **NextAuth v5**: Industry-standard authentication framework with secure session management
- **Row Level Security (RLS)**: All database tables enforce RLS policies to prevent unauthorized data access
- **Board Access Verification**: Every API operation verifies user permissions before execution
- **Role-Based Access Control**: Granular permissions (viewer, contributor, editor, admin) for boards and organizations

### 2. Data Protection

- **Encryption in Transit**: All data transmitted uses TLS 1.2+ (HTTPS)
- **Encryption at Rest**: Database and file storage encrypted by Supabase infrastructure
- **Secure Session Management**: HTTPOnly, Secure, and SameSite cookie flags
- **JWT Security**: Strong secrets, signature verification, appropriate expiry times

### 3. Input Validation & Sanitization

- **Comprehensive Validation**: All user inputs validated for type, format, and length
- **XSS Prevention**: HTML sanitization using `sanitize-html` library on all user-generated content
- **SQL Injection Prevention**: Parameterized queries via Supabase client (no raw SQL)
- **File Upload Validation**: MIME type checking, size limits, and extension validation
- **UUID Validation**: All ID parameters validated against UUID v4 format

### 4. Rate Limiting

- **API Protection**: 100 requests per minute per user/IP for general API routes
- **AI Operations**: 10 requests per minute per user for AI-intensive operations
- **Authentication**: 5 attempts per minute for auth endpoints to prevent brute force
- **Upload Routes**: 30 uploads per 10 seconds to prevent abuse
- **Upstash Redis**: Distributed rate limiting with analytics and monitoring

### 5. Security Headers

We implement comprehensive security headers on all responses:

- **Content-Security-Policy (CSP)**: Restricts resource loading to trusted sources
- **X-Frame-Options**: Prevents clickjacking attacks (set to DENY)
- **X-Content-Type-Options**: Prevents MIME sniffing (set to nosniff)
- **X-XSS-Protection**: Browser XSS filter enabled
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Restricts browser features (camera, microphone, geolocation)

### 6. Third-Party Security

- **Supabase**: SOC 2 Type II certified, GDPR compliant infrastructure
- **Vercel**: Enterprise-grade hosting with DDoS protection
- **Stripe**: PCI DSS Level 1 compliant payment processing
- **Google Cloud**: Gemini AI hosted on Google's secure infrastructure
- **Upstash**: Redis-compatible serverless database with TLS encryption

### 7. Code Security

- **Dependency Scanning**: Regular `npm audit` checks for vulnerable packages
- **Security Updates**: Prompt updates for critical security patches
- **Code Review**: All changes reviewed for security implications
- **Minimal Dependencies**: Prefer established libraries over custom security code
- **No Hardcoded Secrets**: All secrets stored in environment variables

---

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities. If you discover a security issue, please follow these guidelines:

### How to Report

**Email:** security@edeastorm.com
**Subject Line:** "Security Vulnerability Report - [Brief Description]"

### What to Include

Please provide as much information as possible:

1. **Description**: Clear explanation of the vulnerability
2. **Impact**: Potential security impact and affected users
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Proof of Concept**: Code, screenshots, or video demonstration (if applicable)
5. **Affected Components**: URLs, API endpoints, or code sections involved
6. **Your Contact Information**: Email address for follow-up communication
7. **CVE ID**: If already assigned (optional)

### Example Report Format

```
Subject: Security Vulnerability Report - XSS in Board Title

Description:
Cross-site scripting vulnerability allows execution of arbitrary JavaScript
through board title field.

Impact:
Attackers could steal session tokens or perform actions on behalf of users
who view the affected board.

Steps to Reproduce:
1. Navigate to /dashboard/new-board
2. Enter <script>alert('XSS')</script> in the title field
3. Save the board
4. Share the board URL with another user
5. When they view the board, the script executes

Proof of Concept:
[Screenshot or video demonstration]

Affected Components:
- POST /api/boards endpoint
- Board detail page at /board/[shortId]

Contact: researcher@example.com
```

### Response Timeline

- **Initial Response**: Within 24 hours of report submission
- **Severity Assessment**: Within 48 hours
- **Fix Timeline**:
  - **Critical**: Emergency patch within 24-48 hours
  - **High**: Fix within 7 days
  - **Medium**: Fix within 30 days
  - **Low**: Fix in next scheduled release
- **Disclosure**: Public disclosure coordinated with reporter after fix is deployed

### Severity Classification

- **Critical**: Remote code execution, authentication bypass, data breach
- **High**: Privilege escalation, SQL injection, XSS with data exfiltration
- **Medium**: CSRF, information disclosure, denial of service
- **Low**: Missing security headers, brute force without rate limiting

---

## Bug Bounty Program

**Status:** Under Consideration for Future Implementation

We are currently evaluating a bug bounty program for v1.1+. In the meantime, we deeply appreciate responsible disclosure and will publicly acknowledge security researchers who help improve Edeastorm's security (with their permission).

**Hall of Fame:** Coming Soon

---

## Security Updates

We publish security updates and advisories through:

1. **GitHub Security Advisories**: [github.com/your-org/edeastorm/security/advisories](https://github.com/your-org/edeastorm/security/advisories)
2. **Email Notifications**: Sent to all registered users for critical vulnerabilities
3. **Status Page**: [status.edeastorm.com](https://status.edeastorm.com) (if implemented)
4. **Release Notes**: Detailed in version release changelogs

### Subscribing to Security Updates

To receive email notifications about security updates:
1. Log in to your Edeastorm account
2. Navigate to Settings → Notifications
3. Enable "Security Alerts" (enabled by default)

---

## User Security Best Practices

To keep your Edeastorm account secure:

1. **Use Strong Passwords**: If using email/password authentication, use a unique password with 12+ characters
2. **Enable OAuth**: Consider using OAuth providers (Google, GitHub) for enhanced security
3. **Review Access**: Regularly review board collaborators and organization members
4. **Be Cautious with Public Boards**: Avoid sharing sensitive information in public boards
5. **Log Out on Shared Devices**: Always log out when using public or shared computers
6. **Monitor Activity**: Check your account activity log regularly (Settings → Activity)
7. **Report Suspicious Activity**: Contact support@edeastorm.com immediately if you notice unauthorized access

---

## Compliance & Certifications

### Current Compliance

- **GDPR**: General Data Protection Regulation (EU) - See [Privacy Policy](/legal/privacy-policy)
- **CCPA**: California Consumer Privacy Act - User data export and deletion available
- **Data Residency**: Supabase PostgreSQL hosted in [region] with encryption at rest

### Planned Certifications (Post v1.0)

- **SOC 2 Type II**: Target Q3 2026
- **ISO 27001**: Under consideration for enterprise customers
- **HIPAA**: Not currently pursuing (no healthcare data)

---

## Security Incident Response

### In Case of a Security Breach

If we discover or are notified of a security incident:

1. **Immediate Assessment**: Security team evaluates scope and impact within 1 hour
2. **Containment**: Vulnerable systems isolated to prevent further compromise
3. **Investigation**: Root cause analysis and affected user identification
4. **Notification**:
   - Affected users notified within 72 hours (GDPR requirement)
   - Public disclosure if broadly impacting
5. **Remediation**: Permanent fix deployed and verified
6. **Post-Incident Review**: Document lessons learned and preventive measures

### User Notification

In the event of a data breach, we will notify affected users via:
- Email to registered address
- In-app notification banner
- Public announcement on status page (if broadly affecting)

Notification will include:
- Nature of the breach
- Data affected
- Steps we've taken
- Steps you should take
- Contact information for questions

---

## Data Retention & Deletion

### Account Deletion

When you request account deletion:
1. **Grace Period**: 30-day grace period before permanent deletion
2. **Data Removal**: All personal data removed after grace period
3. **Board Ownership**: Boards transferred or deleted based on your choice
4. **Backup Retention**: Backups purged within 90 days

### Data Export

You can export all your data at any time:
1. Navigate to Settings → Privacy
2. Click "Export My Data"
3. Receive JSON file with all boards, notes, and account information

---

## Third-Party Dependencies

We maintain an up-to-date list of third-party services with access to user data:

| Service | Purpose | Data Access | Compliance |
|---------|---------|-------------|------------|
| Supabase | Database & Storage | All user data | SOC 2, GDPR |
| Vercel | Hosting & CDN | Logs, analytics | SOC 2, GDPR |
| Google Cloud | AI Processing (Gemini) | Board content for AI operations | ISO 27001 |
| Stripe | Payment Processing | Payment info, email | PCI DSS Level 1 |
| Upstash | Rate Limiting | User IDs, request metadata | GDPR |

**Note**: We never sell user data to third parties. See our [Privacy Policy](/legal/privacy-policy) for details.

---

## Security Audits

### Internal Audits

- **Frequency**: Quarterly security audits of codebase and infrastructure
- **Scope**: Authentication, authorization, data access, API security, dependencies
- **Documentation**: See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for checklist

### External Audits

- **Status**: Planned for post-launch (Q2 2026)
- **Scope**: Penetration testing, vulnerability assessment, code review
- **Provider**: To be determined

---

## Contact Information

### Security Team

- **Email**: security@edeastorm.com
- **Response Time**: Within 24 hours
- **PGP Key**: [To be published]

### General Support

- **Email**: support@edeastorm.com
- **Response Time**: Within 48 hours

### Legal / Privacy

- **Email**: legal@edeastorm.com
- **Data Protection Officer**: dpo@edeastorm.com

---

## Additional Resources

- [Security Audit Checklist](./SECURITY_AUDIT.md)
- [Privacy Policy](/legal/privacy-policy)
- [Terms of Service](/legal/terms-of-service)
- [GDPR Compliance Documentation](./GDPR_COMPLIANCE.md) (coming soon)
- [API Security Documentation](/developers/security) (coming soon)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-13 | Initial security policy for v1.0 launch |

---

**Last Reviewed:** 2026-01-13
**Next Review:** 2026-04-13 (Quarterly)

---

*This security policy is subject to change. We will notify users of significant updates via email and in-app notifications.*
