# Deployment Guide

This guide covers deploying the Pipe Supply Website to production environments.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (version 14+)
- Environment variables configured
- SSL certificate for HTTPS (recommended for production)

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env` and configure the following:

```bash
# Production Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public&connection_limit=20

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Encryption
ENCRYPTION_KEY=<generate-with-node-crypto-randomBytes-32-hex>

# Security
TRUSTED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Monitoring
HEALTH_CHECK_ENABLED=true
LOG_LEVEL=warn

# Performance
CACHE_ENABLED=true
CACHE_TTL=600000
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Process

### 1. Pre-Deployment Validation

Run pre-deployment checks to verify configuration:

```bash
npm run deploy:check
```

This validates:
- Environment variables are set
- Database connectivity
- Database schema is up to date
- Production security settings

### 2. Database Migration

Apply database migrations safely:

```bash
npm run db:migrate:deploy
```

This will:
- Create a backup (in production)
- Apply pending migrations
- Generate Prisma Client
- Verify schema integrity

### 3. Build Application

Build the Next.js application:

```bash
npm run build
```

### 4. Start Application

Start the production server:

```bash
npm start
```

The application will be available on port 3000 by default.

### 5. Post-Deployment Verification

Verify the deployment was successful:

```bash
npm run deploy:verify
```

This checks:
- Health endpoint responds
- Readiness endpoint confirms migrations
- Critical endpoints are accessible

### Full Deployment (All Steps)

Run all deployment steps in sequence:

```bash
npm run deploy:full
```

## Health Checks

### Health Check Endpoint

```
GET /api/health
```

Returns system health status including:
- Database connectivity
- Memory usage
- System uptime

### Readiness Check Endpoint

```
GET /api/ready
```

Returns readiness status for load balancers:
- Database connection
- Migration status

### Example Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 15
    },
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50
    },
    "environment": {
      "nodeEnv": "production",
      "nodeVersion": "v18.0.0"
    }
  }
}
```

## Performance Optimization

### Image Optimization

Images are automatically optimized by Next.js:
- Lazy loading for off-screen images
- Responsive image sizes
- WebP/AVIF format conversion
- Automatic caching

### Database Optimization

Database queries are optimized with:
- Indexed columns for common queries
- Connection pooling
- Query result caching
- Minimal data fetching

### Caching Strategy

Static content is cached with appropriate headers:
- API responses: 60s cache with stale-while-revalidate
- Images: 1 year immutable cache
- Static assets: 1 year immutable cache

## Monitoring

### Application Logs

Configure log level in environment:

```bash
LOG_LEVEL=warn  # error | warn | info | debug
LOG_FORMAT=json # json | pretty
```

### Health Monitoring

Set up monitoring to poll health endpoints:

```bash
# Health check (detailed)
curl https://yourdomain.com/api/health

# Readiness check (lightweight)
curl -I https://yourdomain.com/api/ready
```

### Recommended Monitoring

- Set up alerts for health check failures
- Monitor database response times
- Track memory usage trends
- Monitor error rates in logs

## Backup and Recovery

### Automated Backups

Configure backup settings:

```bash
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
```

### Manual Backup

```bash
npm run backup
```

### Restore from Backup

```bash
npm run restore
```

See [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) for detailed backup procedures.

## Scaling Considerations

### Horizontal Scaling

The application is stateless and can be scaled horizontally:
- Use a load balancer to distribute traffic
- Share session storage (Redis recommended)
- Use external file storage for uploads

### Database Scaling

For high traffic:
- Increase connection pool size
- Use read replicas for queries
- Implement database caching layer

### CDN Integration

Serve static assets through a CDN:
- Configure CDN to cache `/_next/static/*`
- Configure CDN to cache `/_next/image/*`
- Set appropriate cache headers

## Troubleshooting

### Deployment Fails Pre-Check

- Verify all environment variables are set
- Check database connectivity
- Ensure migrations are up to date

### Health Check Fails

- Check database connection
- Verify environment configuration
- Check application logs

### High Memory Usage

- Monitor memory trends
- Check for memory leaks
- Consider increasing server resources
- Review cache configuration

### Slow Response Times

- Check database query performance
- Verify cache is enabled
- Review database indexes
- Consider CDN for static assets

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured (not in version control)
- [ ] NEXTAUTH_SECRET changed from default
- [ ] ENCRYPTION_KEY changed from default
- [ ] Database credentials secured
- [ ] CORS configured with TRUSTED_ORIGINS
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular security updates applied

## Rollback Procedure

If deployment fails:

1. Stop the application
2. Restore database from backup:
   ```bash
   npm run restore
   ```
3. Deploy previous version
4. Verify with health checks

## Support

For deployment issues:
- Check application logs
- Review health check responses
- Consult troubleshooting section
- Contact system administrator
