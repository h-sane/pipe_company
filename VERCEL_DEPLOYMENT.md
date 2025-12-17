# 🚀 Quick Vercel Deployment Guide

## Why Vercel?

Vercel is the **recommended platform** for this Next.js application:
- ✅ Zero-configuration deployment
- ✅ Automatic HTTPS & CDN
- ✅ Free tier available
- ✅ Built-in database (Vercel Postgres)
- ✅ Automatic preview deployments
- ✅ **Deployment time: 10-15 minutes**

---

## Step-by-Step Deployment

### 1. Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

### 2. Import Your Project

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "Import Git Repository"
4. Choose `h-sane/pipe_company` from the list
5. Click "Import"

### 3. Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js ✅ (auto-detected)
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

Click "Deploy" to continue (we'll add environment variables next).

### 4. Add Database (Vercel Postgres)

1. After initial deployment, go to your project dashboard
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a region (select closest to your users)
6. Click "Create"

Vercel will automatically:
- Create a PostgreSQL database
- Add `DATABASE_URL` to your environment variables
- Connect it to your project

### 5. Generate Required Secrets

Open your terminal and run:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy these values - you'll need them in the next step.

### 6. Add Environment Variables

1. In your Vercel project dashboard, go to "Settings"
2. Click "Environment Variables"
3. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | (auto-added by Vercel Postgres) | Already set ✅ |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Use your Vercel URL |
| `NEXTAUTH_SECRET` | (paste generated value) | From step 5 |
| `ENCRYPTION_KEY` | (paste generated value) | From step 5 |
| `NODE_ENV` | `production` | Set to production |

4. Click "Save" for each variable

### 7. Redeploy with Environment Variables

1. Go to "Deployments" tab
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache"
5. Click "Redeploy"

Wait 2-3 minutes for the build to complete.

### 8. Run Database Migrations

After deployment completes:

1. Install Vercel CLI locally:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```
   - Select your team/account
   - Select the project: `pipe_company`
   - Link to existing project: Yes

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

### 9. Verify Deployment

Visit your application at `https://your-app.vercel.app`

Check these endpoints:
- ✅ Homepage: `https://your-app.vercel.app`
- ✅ Health check: `https://your-app.vercel.app/api/health`
- ✅ Products: `https://your-app.vercel.app/products` (if you seeded data)

### 10. (Optional) Add Custom Domain

1. Go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` environment variable to your custom domain
6. Redeploy

---

## 🎉 You're Live!

Your pipe supply website is now deployed and accessible worldwide!

### What's Included:

✅ Product catalog with search and filtering
✅ Quote request system
✅ Admin dashboard
✅ Document management
✅ Media gallery
✅ Company information pages
✅ Contact forms
✅ Authentication system
✅ Health monitoring
✅ Automatic HTTPS
✅ Global CDN

---

## 📊 Post-Deployment

### Monitor Your Application

1. **Analytics**: Enable Vercel Analytics in project settings
2. **Logs**: View real-time logs in the "Logs" tab
3. **Performance**: Check "Speed Insights" for performance metrics

### Health Checks

- **Detailed Health**: `GET /api/health`
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-12-17T...",
    "database": "connected",
    "uptime": 12345
  }
  ```

- **Quick Check**: `GET /api/ready`
  ```json
  {
    "status": "ready"
  }
  ```

### Automatic Deployments

Every push to `main` branch will automatically:
1. Trigger a new deployment
2. Run tests
3. Build the application
4. Deploy to production

Preview deployments are created for pull requests.

---

## 🔧 Common Issues & Solutions

### Issue: Build Fails

**Solution**: Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check for TypeScript errors
- Ensure dependencies are installed

### Issue: Database Connection Error

**Solution**: 
1. Verify `DATABASE_URL` is set correctly
2. Check Vercel Postgres is active
3. Run migrations: `npx prisma migrate deploy`

### Issue: 404 on API Routes

**Solution**:
1. Verify routes are in `src/app/api/` directory
2. Check file naming: `route.ts` not `route.tsx`
3. Redeploy the application

### Issue: Environment Variables Not Working

**Solution**:
1. Ensure variables are added in Vercel dashboard
2. Redeploy after adding variables
3. Don't use `.env` file in production (use Vercel dashboard)

---

## 🚀 Next Steps

1. **Configure Authentication**
   - Set up OAuth providers (Google, GitHub, etc.)
   - Configure admin users

2. **Add Content**
   - Upload product images
   - Add product information
   - Update company details

3. **Customize**
   - Update branding and colors
   - Modify content
   - Add additional features

4. **Monitor**
   - Set up alerts
   - Review analytics
   - Monitor performance

---

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma with Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Vercel Support**: https://vercel.com/support

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes before merging to main
2. **Enable Analytics**: Track user behavior and performance
3. **Set Up Monitoring**: Use health check endpoints with uptime monitors
4. **Regular Backups**: Use `npm run backup` to backup your database
5. **Keep Dependencies Updated**: Regularly update packages for security

---

**Estimated Total Time**: 10-15 minutes
**Difficulty**: Easy ⭐
**Cost**: Free tier available (sufficient for most use cases)

**Your application is now live and ready to serve customers! 🎉**
