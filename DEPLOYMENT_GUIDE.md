# Deployment Guide - Pipe Supply Website

## 🚀 Quick Deployment to Vercel (Recommended)

Vercel is the recommended platform for this Next.js application.

### Prerequisites
- GitHub account
- Vercel account (free tier available at https://vercel.com)
- PostgreSQL database (we'll use Vercel Postgres)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Pipe supply website"

# Add remote
git remote add origin https://github.com/h-sane/pipe_company.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Project"
   - Select your GitHub repository: `h-sane/pipe_company`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=<your-postgres-connection-string>
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=<generate-with-command-below>
   ENCRYPTION_KEY=<generate-with-command-below>
   NODE_ENV=production
   ```

   **Generate secrets:**
   ```bash
   # NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # ENCRYPTION_KEY
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Set up Vercel Postgres (Recommended)**
   - In your Vercel project dashboard, go to "Storage"
   - Click "Create Database"
   - Select "Postgres"
   - Choose a region close to your users
   - Click "Create"
   - Vercel will automatically add `DATABASE_URL` to your environment variables

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your site will be live at `https://your-app.vercel.app`

### Step 3: Run Database Migrations

After first deployment:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Run migrations:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

4. Seed database (optional):
   ```bash
   npm run db:seed
   ```

### Step 4: Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable to your custom domain

---

## 🐳 Alternative: Docker Deployment

### Build Docker Image

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
EOF

# Build image
docker build -t pipe-supply-website .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e ENCRYPTION_KEY="your-key" \
  pipe-supply-website
```

---

## 🖥️ Alternative: VPS/Traditional Server

### Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- PostgreSQL 14+
- Nginx (for reverse proxy)
- PM2 (for process management)

### Setup Steps

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install -y nginx
   ```

2. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE pipe_supply_db;
   CREATE USER pipe_user WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE pipe_supply_db TO pipe_user;
   \q
   ```

3. **Clone and Setup Application**
   ```bash
   cd /var/www
   git clone https://github.com/h-sane/pipe_company.git
   cd pipe_company

   # Install dependencies
   npm ci --only=production

   # Create .env file
   cp .env.example .env
   nano .env  # Edit with your values

   # Run migrations
   npx prisma migrate deploy

   # Build application
   npm run build
   ```

4. **Setup PM2**
   ```bash
   # Start application
   pm2 start npm --name "pipe-supply" -- start

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/pipe-supply
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pipe-supply /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 📊 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Database connection works
- [ ] Health check endpoint responds: `/api/health`
- [ ] Authentication works (if configured)
- [ ] Product catalog displays
- [ ] Quote request form works
- [ ] Admin panel accessible (if configured)
- [ ] SSL certificate installed (production)
- [ ] Environment variables secured
- [ ] Monitoring setup (optional)
- [ ] Backup strategy configured

---

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version: `node -v` (should be 18+)
- Clear cache: `rm -rf .next node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Database Connection Issues
- Verify DATABASE_URL format
- Check database is accessible from deployment environment
- Ensure Prisma client is generated: `npx prisma generate`

### Application Won't Start
- Check logs: `pm2 logs pipe-supply` (PM2) or Vercel logs
- Verify all environment variables are set
- Check port 3000 is available

### Performance Issues
- Enable caching in production
- Optimize images
- Use CDN for static assets
- Monitor with Vercel Analytics or similar

---

## 📈 Monitoring & Maintenance

### Health Checks
- `/api/health` - Detailed system health
- `/api/ready` - Readiness probe for load balancers

### Logs
- **Vercel**: View in dashboard under "Logs"
- **PM2**: `pm2 logs pipe-supply`
- **Docker**: `docker logs <container-id>`

### Backups
```bash
# Create backup
npm run backup

# Restore from backup
npm run restore
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart (PM2)
pm2 restart pipe-supply

# Or redeploy (Vercel)
vercel --prod
```

---

## 🎯 Recommended: Vercel Deployment

For this Next.js application, **Vercel is the recommended deployment platform** because:

✅ Zero-configuration deployment
✅ Automatic HTTPS
✅ Built-in CDN
✅ Serverless functions
✅ Easy database integration (Vercel Postgres)
✅ Automatic preview deployments
✅ Free tier available
✅ Excellent Next.js optimization

**Estimated deployment time: 10-15 minutes**

---

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Vercel documentation: https://vercel.com/docs
3. Check Next.js deployment guide: https://nextjs.org/docs/deployment

---

**Ready to deploy? Start with Vercel for the fastest path to production!**
