# HIPAA Readiness Checklist

This document outlines the steps required outside of the codebase to achieve HIPAA compliance when deploying CareCommand.

## 1. Business Associate Agreement (BAA)

- [ ] Execute a BAA with your hosting provider (AWS, Render, Fly.io, etc.)
- [ ] Execute a BAA with any subprocessors (Stripe, error tracking, etc.)
- [ ] Maintain a list of all BAAs and subprocessors

## 2. Infrastructure

### Encryption at Rest

- [ ] PostgreSQL: Use RDS with encryption enabled, or ensure your provider encrypts database storage
- [ ] S3: Enable server-side encryption (SSE-S3 or SSE-KMS) on the bucket
- [ ] Redis: Use encryption in transit; consider encryption at rest if storing sensitive data

### Encryption in Transit

- [ ] TLS/HTTPS for all client and API traffic
- [ ] Internal service-to-service communication over TLS where applicable

### Access Controls

- [ ] Restrict database access to application only (no direct access from workstations)
- [ ] Use IAM/role-based access for cloud resources
- [ ] Enable MFA for all administrative accounts

## 3. Application-Level (Implemented in Code)

| Control | Status |
|---------|--------|
| Audit logging for PHI access | Implemented |
| RBAC (Admin, Manager, Staff) | Implemented |
| Tenant isolation (row-level) | Implemented |
| No PHI in logs (scrubber) | Implemented |
| Short-lived signed URLs for documents | Implemented |
| Encrypted file storage | Implemented (S3 SSE) |
| Session security (httpOnly cookies) | Implemented |
| MFA-ready design | Placeholder |

## 4. Operational

### Backups

- [ ] Automated database backups with point-in-time recovery
- [ ] Backup retention policy (e.g., 30 days)
- [ ] Test restore procedures

### Incident Response

- [ ] Document incident response plan
- [ ] Define breach notification procedures
- [ ] Designate a security contact

### Data Retention and Export

- [ ] Implement data retention policy per tenant
- [ ] Provide export tooling for tenant data (implemented in app)
- [ ] Document data deletion procedures

### Staff Training

- [ ] HIPAA awareness training for all staff with system access
- [ ] Document training completion

## 5. Third-Party Services

| Service | BAA Required | Notes |
|---------|--------------|-------|
| AWS | Yes | HIPAA-eligible with BAA |
| Stripe | Yes | For billing; BAA available |
| Sentry/Datadog | Yes | If used for error tracking |
| AxisCare | Yes | Integration partner |

## 6. Environment Variables for Production

Ensure these are set securely:

- `JWT_SECRET` and `JWT_REFRESH_SECRET`: Strong, unique secrets (min 32 chars)
- `DATABASE_URL`: Use SSL mode for Postgres
- `S3_*`: Production S3 credentials with minimal permissions
- `STRIPE_*`: Production Stripe keys
- `FORCE_FREE_PLAN`: Set to `false` for paid SaaS mode
