# Deployment Guide

This document covers deploying the AI Application Screening Platform to production.

## Pre-Deployment Checklist

- [ ] All tests passing (`pytest`)
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] Database backups configured
- [ ] SSL/HTTPS certificates obtained
- [ ] Domain registered and DNS configured
- [ ] Monitoring/logging setup
- [ ] Security review completed

---

## Environment Preparation

### 1. Create Production Environment Variables

Create `.env.production`:

```env
# Database (use managed service like RDS, Cloud SQL, etc.)
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host.rds.amazonaws.com:5432/app_db

# Caching (Redis)
REDIS_URL=redis://prod-redis-host:6379/0

# Security
SECRET_KEY=your-very-long-random-secure-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS - Restrict to your frontend domain
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Email (if enabled)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### 2. Generate Secure Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Example output: "Drmhze6EPcv0fN_81Bj-nA"
```

---

## Infrastructure Setup

### Container Orchestration (Docker Compose)

For production-like local testing or small-scale deployments:

```bash
docker-compose up -d
```

### Kubernetes (Recommended for Scale)

Ensure your `k8s/deployment.yaml` includes both the application and a Redis instance (or connection to a managed Redis service like AWS ElastiCache).

---

## Database & Caching Setup

### PostgreSQL
Use a managed service like AWS RDS, Azure Database for PostgreSQL, or Google Cloud SQL.

### Redis
Redis is used for caching and performance optimization. 
- **Internal**: `redis://redis:6379/0`
- **External**: Configure via `REDIS_URL`.
