# Production Setup Guide

## 🚀 Post-Deployment Setup Steps

Your Vercel deployment is successful! The 404 errors on Products and Quote pages have been **FIXED** ✅

### ✅ **What Was Fixed**

**Root Cause**: Missing page files (NOT database issues)
- Created `/app/products/page.tsx` ✅
- Created `/app/quote/page.tsx` ✅
- Both pages now work correctly

### 1. Database Setup (For Data Functionality)

**Note**: The pages now load correctly, but you need a database to store/display products and quotes.

#### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `pipe-supply-website` project
3. Click on **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose a database name (e.g., `pipe-supply-db`)
6. Copy the connection string provided
7. Go to **Settings** → **Environment Variables**
8. Add: `DATABASE_URL` = `your-connection-string`
9. **Redeploy** your project

#### Option B: External Database Provider
Choose one of these free options:

**Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to Vercel environment variables

**Railway**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy connection string
4. Add to Vercel environment variables

### 2. Environment Variables Setup

Add these to your Vercel project settings:

```bash
# Required
DATABASE_URL="your-postgres-connection-string"

# Optional but recommended
NODE_ENV="production"
ENCRYPTION_KEY="generate-32-char-hex-key"
```

**⚠️ IMPORTANT**: Do NOT add NextAuth variables:
- ❌ `NEXTAUTH_SECRET` - Not needed (custom auth system)
- ❌ `NEXTAUTH_URL` - Not needed (custom auth system)

### 3. Run Database Migrations

After setting up the database:

1. **Trigger a redeploy** in Vercel (this will run migrations automatically)
2. Or run manually via Vercel CLI:
   ```bash
   vercel env pull .env.local
   npm run db:migrate:deploy
   ```

### 4. Seed Initial Data (Optional)

To populate with sample products:
```bash
npm run db:seed
```

### 5. Test Your Site

**Current Status** (after page fixes):
- ✅ Home page works
- ✅ Products page loads (will show empty catalog until database is set up)
- ✅ Quote page loads and works
- ✅ Admin login works (admin@pipe.com / admin123)

**After database setup**:
- ✅ Products can be added via admin panel
- ✅ Quote requests are stored in database

## 🔧 Quick Fix Commands

If you encounter issues:

```bash
# Check build
npm run build

# Reset database (careful!)
npm run db:reset

# Generate Prisma client
npm run db:generate
```

## 📞 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Ensure database connection string is correct
4. Try redeploying after adding DATABASE_URL

## 🎉 Success Checklist

- [ ] Database created and connected
- [ ] Environment variables set in Vercel
- [ ] Project redeployed
- [ ] Products page loads (may be empty)
- [ ] Quote page loads
- [ ] Admin login works
- [ ] Can add products via admin panel

Once complete, your pipe supply website will be fully functional!