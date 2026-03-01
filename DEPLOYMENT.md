# Deployment Guide Template

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

## Database Setup

### PostgreSQL on AWS RDS

1. **Create RDS instance:**
   - Engine: PostgreSQL 13+
   - Multi-AZ: Yes (for HA)
   - Storage: 20 GB (adjustable)
   - Backup retention: 30 days
   - Enable encryption at rest

2. **Create database and user:**
   ```sql
   CREATE DATABASE app_screening_db;
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE app_screening_db TO app_user;
   ```

3. **Network security:**
   - Security group: Allow inbound on port 5432 from app servers only
   - No internet access (private subnet)

4. **Run migrations:**
   ```bash
   DATABASE_URL=postgresql://... alembic upgrade head
   ```

### Alternative: Google Cloud SQL, Azure Database for PostgreSQL

Similar steps with provider-specific configuration.

---

## Application Server Deployment

### Option 1: Docker & Kubernetes (Recommended for Scale)

#### Build Docker image:

```bash
docker build -t app-screening-backend:latest .
docker tag app-screening-backend:latest your-registry.com/app-screening-backend:latest
docker push your-registry.com/app-screening-backend:latest
```

#### Deploy to Kubernetes:

```bash
kubectl apply -f k8s/deployment.yaml
```

**Example k8s/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-screening-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app-screening-backend
  template:
    metadata:
      labels:
        app: app-screening-backend
    spec:
      containers:
      - name: backend
        image: your-registry.com/app-screening-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database_url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: secret_key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: app-screening-backend
spec:
  selector:
    app: app-screening-backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
```

### Option 2: Traditional Server (EC2, DigitalOcean, etc.)

#### 1. Setup Server (Ubuntu 22.04)

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python & dependencies
sudo apt-get install -y python3.10 python3-pip python3-venv
sudo apt-get install -y postgresql-client  # For migrations

# Install Gunicorn
pip3 install gunicorn uvicorn[standard]

# Create app user
sudo useradd -m -s /bin/bash appuser
```

#### 2. Clone Repository

```bash
cd /home/appuser
git clone https://github.com/yourusername/ai-application-screening.git
cd ai-application-screening/backend

# Create venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Create Systemd Service

Create `/etc/systemd/system/app-screening.service`:

```ini
[Unit]
Description=AI Application Screening Backend
After=network.target postgresql.service

[Service]
Type=notify
User=appuser
WorkingDirectory=/home/appuser/ai-application-screening/backend
Environment="PATH=/home/appuser/ai-application-screening/backend/venv/bin"
EnvironmentFile=/home/appuser/ai-application-screening/backend/.env.production
ExecStart=/home/appuser/ai-application-screening/backend/venv/bin/gunicorn \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile - \
    app.main:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable app-screening
sudo systemctl start app-screening
sudo systemctl status app-screening
```

#### 4. Setup Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/app-screening`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Certificates (using Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain application/json;
    gzip_min_length 1000;
    
    # Proxy to backend
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/app-screening /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended for React)

1. **Push code to GitHub**
2. **Connect repository** in Vercel dashboard
3. **Configure environment variables:**
   - `VITE_API_URL=https://yourdomain.com/api`
4. **Deploy on push** to main branch

### Option 2: Static Hosting (AWS S3 + CloudFront)

```bash
# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront automatically caches
```

### Option 3: Traditional Server (Nginx)

```bash
# Build
npm run build

# Copy to server
scp -r dist/* appuser@server:/home/appuser/app-screening-frontend/

# Nginx config for frontend (in /etc/nginx/sites-available/frontend)
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    root /home/appuser/app-screening-frontend;
    index index.html;
    
    # SPA routing - return index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000/;
    }
    
    # SSL configuration (same as above)
    ssl_certificate ...
}
```

---

## Monitoring & Logging

### Application Logs

```bash
# View logs
sudo journalctl -u app-screening -f

# Persistent logging to file
tail -f /var/log/app-screening.log
```

### Database Monitoring

```sql
-- Monitor active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
    WHERE mean_time > 100 
    ORDER BY mean_time DESC;
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** – Monitor API endpoint health
- **CloudWatch** – AWS metrics and alarms
- **Datadog** – Full infrastructure monitoring
- **New Relic** – Application performance monitoring

```bash
# Health check endpoint
curl https://yourdomain.com/api/health
# Response: {"status": "ok"}
```

### Error Tracking

```bash
# Email on errors (optional)
pip install sentry-sdk
```

In `app/main.py`:
```python
import sentry_sdk
sentry_sdk.init("your-sentry-dsn")
```

---

## Backup & Disaster Recovery

### Database Backups

**AWS RDS (automatic):**
- Automated backups: 30 days retention
- Manual snapshots before major changes
- Test restore procedures monthly

**Manual backup:**
```bash
pg_dump postgresql://user:pass@host/db > backup.sql
# Restore
psql postgresql://user:pass@host/db < backup.sql
```

### Application Backups

- Source code: Git (always available)
- User uploads: S3 with versioning enabled
- Configuration: Stored in environment variables (no backup needed)

---

## Security Hardening

### Backend Security

1. **Disable debug mode in production** (automatically done with uvicorn)
2. **Set secure cookies:**
   ```python
   # In config
   SECURE_COOKIES = True
   SAME_SITE_COOKIES = "Strict"
   ```

3. **Rate limiting** (install `slowapi`):
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   @app.post("/auth/login")
   @limiter.limit("5/minute")
   def login(...):
   ```

4. **CORS in production:**
   ```python
   CORSMiddleware(
       allow_origins=["https://yourdomain.com"],
       allow_credentials=True,
       allow_methods=["GET", "POST", "PATCH"],
       allow_headers=["Authorization"],
   )
   ```

### Infrastructure Security

1. **Firewall rules** – Only expose ports 80, 443
2. **SSH keys** – No password login
3. **Security groups** – Restrict database access to app servers only
4. **OS hardening** – Use security update tools
5. **Web Application Firewall** – Enable WAF on load balancer

---

## Performance Optimization

### Database Tuning

```sql
-- Add indexes for frequent queries
CREATE INDEX idx_application_user_id ON applications(user_id);
CREATE INDEX idx_application_status ON applications(status);
CREATE INDEX idx_screening_application_id ON screening_results(application_id);
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_course(course_id: int):
    # Expensive query result cached
    return db.query(Course).get(course_id)
```

### Connection Pooling

```python
# In config
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_MAX_OVERFLOW = 40
```

---

## Scaling Strategy

### Horizontal Scaling (Multiple Servers)

1. **Load Balancer** (AWS ALB, Nginx)
   - Distributes requests across app servers
   - Health checks ensure only healthy servers receive traffic

2. **Database Replication**
   - Master: Handles writes
   - Read replicas: Handle SELECT queries
   - Automatic failover configured

3. **Caching Layer** (Redis)
   - Cache session tokens
   - Cache course/subject data
   - Reduces database load

### Vertical Scaling (Larger Server)

- Increase CPU and RAM
- Add more database connections
- Optimize queries and indexes

### Architecture

```
Clients
    |
[Load Balancer]
    |
[App Server 1] ─┐
[App Server 2] ─┼─ [Connection Pool] ─ [PostgreSQL Master]
[App Server 3] ─┘                          |
                                    [Read Replicas]
```

---

## Rollback Procedure

If deployment fails:

```bash
# Revert code
git revert <commit-hash>
git push

# Database migrations (if needed)
alembic downgrade -1

# Restart service
sudo systemctl restart app-screening
```

---

## Post-Deployment Validation

1. **Test critical flows:**
   - User registration → login → application submission
   - Admin dashboard loads
   - Scoring engine executes correctly

2. **Performance testing:**
   ```bash
   # Load test with 100 concurrent users
   ab -n 1000 -c 100 https://yourdomain.com/health
   ```

3. **Security scan:**
   ```bash
   # Check for common vulnerabilities
   bandit -r app/
   ```

4. **API contract testing:**
   - Verify all endpoints respond as documented
   - Check status codes and response formats

---

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Security updates | As released |
| Database backups | Daily |
| Log rotation | Daily |
| Backup testing | Monthly |
| Security audit | Quarterly |
| Performance review | Monthly |
| Dependency updates | Monthly |

---

## Troubleshooting

### 502 Bad Gateway
- Backend service stopped: `sudo systemctl restart app-screening`
- Check logs: `sudo journalctl -u app-screening -20`

### Slow queries
- Check indexes on frequently filtered columns
- Review slow query log
- Consider read replicas for heavy load

### High database connection usage
- Increase pool size in config
- Check for connection leaks in code
- Implement connection pooling

### Memory leaks
- Monitor memory usage over time
- Set worker restart policies in Gunicorn
- Profile with tools like `memory_profiler`

---

## References

- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Last updated:** February 2026
