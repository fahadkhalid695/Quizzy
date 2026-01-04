# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy your Quiz App to Vercel.

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd "D:\Quiz App 2"
git init
git add .
git commit -m "Initial commit: Quiz App ready for deployment"
```

### 1.2 Push to GitHub
```bash
# Create a new repository on GitHub (https://github.com/new)
# Then push your code:
git remote add origin https://github.com/YOUR_USERNAME/quiz-app.git
git branch -M main
git push -u origin main
```

**Why GitHub?** Vercel integrates seamlessly with GitHub for automatic deployments.

---

## Step 2: Set Up MongoDB Atlas (Cloud Database)

### 2.1 Create MongoDB Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a new project called "quiz-app"

### 2.2 Create a Cluster
1. Click "Create a Deployment"
2. Choose **M0 (Free)** tier
3. Select your closest region
4. Create a username/password for database access
5. Whitelist IP address: **0.0.0.0/0** (allows Vercel to connect)

### 2.3 Get Connection String
1. Click "Connect"
2. Choose "Drivers"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Should look like: `mongodb+srv://username:password@cluster.mongodb.net/quiz-app?retryWrites=true&w=majority`

**⚠️ Save this string - you'll need it in Step 4!**

---

## Step 3: Get Google Gemini API Key

### 3.1 Create Google Cloud Account
1. Go to https://cloud.google.com/
2. Create a new project called "quiz-app"
3. Enable billing (free tier available)

### 3.2 Enable Gemini API
1. Go to APIs & Services → Library
2. Search for "Generative Language API"
3. Click Enable
4. Go to Credentials → Create API Key
5. Copy your API key

**⚠️ Save this key - you'll need it in Step 4!**

---

## Step 4: Deploy to Vercel

### 4.1 Connect to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New" → "Project"**
3. Import your GitHub repository
4. Select the repository you pushed in Step 1

### 4.2 Configure Environment Variables
In the "Environment Variables" section, add:

| Key | Value | Where to Get |
|-----|-------|--------------|
| `MONGODB_URI` | Your MongoDB connection string | Step 2.3 |
| `GEMINI_API_KEY` | Your Google Gemini API key | Step 3.2 |
| `JWT_SECRET` | Generate a random string (32+ chars) | Use any random string generator |
| `NEXTAUTH_SECRET` | Generate another random string | Use any random string generator |

**To generate random secrets:**
```bash
# Run this in terminal to generate secure random strings:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.3 Deploy
1. Click **"Deploy"**
2. Vercel will automatically build and deploy
3. Wait for deployment to complete (2-3 minutes)
4. You'll get a URL like `https://quiz-app-xyz.vercel.app`

---

## Step 5: Test Your Deployment

### 5.1 Test the App
1. Open your Vercel URL
2. Register as a teacher account
3. Create a class
4. Create a test
5. Register as student
6. Take the test
7. Check results

### 5.2 Common Issues & Fixes

**Issue: "Cannot connect to MongoDB"**
- ✓ Check MongoDB URI is correct
- ✓ Check IP whitelist includes 0.0.0.0/0
- ✓ Wait 5 minutes for MongoDB to activate

**Issue: "Gemini API not working"**
- ✓ Check GEMINI_API_KEY is correct
- ✓ Check Gemini API is enabled in Google Cloud
- ✓ Check billing is enabled

**Issue: "Auth not working"**
- ✓ Check JWT_SECRET is set
- ✓ Check NEXTAUTH_SECRET is set
- ✓ Clear browser cookies and try again

**Issue: "Build fails"**
- ✓ Check Vercel build logs for errors
- ✓ Ensure all dependencies are in package.json
- ✓ Try running `npm run build` locally first

---

## Step 6: Enable Auto-Deployments (Optional)

Vercel automatically deploys on every GitHub push. To disable:
1. Go to Vercel Dashboard → Settings
2. Uncheck "Auto-deploy"

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. Go to Vercel Project Settings → Domains
2. Enter your domain (e.g., `myquizapp.com`)
3. Update your domain's DNS records with Vercel's values
4. Wait 24-48 hours for DNS to propagate

---

## Step 8: Enable Analytics (Optional)

1. Go to Vercel Dashboard → Analytics
2. Click "Enable Web Analytics"
3. View real-time app performance

---

## Step 9: Monitor & Maintain

### 9.1 Logs
- View real-time logs: Vercel Dashboard → Deployments → View Logs
- Check for errors and performance issues

### 9.2 Monitoring
- Set up alerts for failed deployments
- Monitor database performance in MongoDB Atlas
- Track API usage in Google Cloud

### 9.3 Updates
- Push code updates to GitHub
- Vercel automatically redeploys
- No downtime between deployments

---

## Environment Variables Reference

All variables are required for production:

```env
# Database (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz-app?retryWrites=true&w=majority

# Authentication (generate secure random strings)
JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst5678uvwx9012yz
NEXTAUTH_SECRET=zyxw9876tsrq5432ponm1098lkji7654hgfe3210dcba9876

# AI (from Google Cloud)
GEMINI_API_KEY=AIzaSyDaP3-z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o

# Auto-set by Vercel (don't set manually)
NEXTAUTH_URL=https://quiz-app-xyz.vercel.app
NODE_ENV=production
```

---

## Troubleshooting Checklist

- [ ] GitHub repository is public
- [ ] MongoDB cluster is on free tier with IP whitelist
- [ ] Gemini API is enabled in Google Cloud
- [ ] All environment variables are set in Vercel
- [ ] package.json has build script
- [ ] No local dependencies or hardcoded paths
- [ ] App runs locally with `npm run build && npm start`
- [ ] All imports are correct
- [ ] Database models are properly defined

---

## Performance Tips

1. **Database**: Use MongoDB indexes for faster queries
2. **Images**: Use Next.js Image component for optimization
3. **API**: Add caching headers to reduce requests
4. **Frontend**: Use React.memo for expensive components
5. **Monitoring**: Set up alerts for high response times

---

## Security Checklist

- [ ] JWT_SECRET is complex (32+ characters)
- [ ] NEXTAUTH_SECRET is unique
- [ ] No secrets in source code
- [ ] MongoDB whitelist doesn't include sensitive IPs
- [ ] API rate limiting is enabled
- [ ] CORS is properly configured
- [ ] HTTPS is enforced
- [ ] Sensitive data is not logged

---

## Next Steps After Deployment

1. **Share with Users**
   - Send them the Vercel URL
   - Create teacher and student accounts
   - Have them test all features

2. **Monitor Performance**
   - Check Vercel Analytics daily
   - Monitor MongoDB performance
   - Review error logs

3. **Collect Feedback**
   - Gather user feedback
   - Fix bugs quickly
   - Deploy improvements

4. **Scale if Needed**
   - Upgrade MongoDB tier if needed
   - Add more server regions
   - Optimize slow endpoints

---

## Commands Reference

```bash
# Local testing before deployment
npm run build
npm run start

# Push to GitHub
git add .
git commit -m "message"
git push

# Check environment
node -e "console.log(process.env)"

# Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Gemini Docs**: https://ai.google.dev/docs

---

## Deployment Checklist

Before deploying to production:

- [ ] All features work locally
- [ ] No console errors
- [ ] Database connections test
- [ ] API endpoints tested
- [ ] Authentication tested
- [ ] Environment variables documented
- [ ] GitHub repo is up to date
- [ ] vercel.json is configured
- [ ] .env.example shows required vars
- [ ] Vercel environment vars are set

---

**You're all set! Your app will be live in minutes.** 🚀

Questions? Check the logs in Vercel Dashboard → Deployments → View Logs
