# Deploy to Vercel - Step by Step

Your git repository is already initialized locally. Now let's deploy to Vercel!

## Prerequisites

- GitHub account (free at github.com)
- Vercel account (free at vercel.com)
- Supabase project already created with schema.sql run

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web UI (Easiest)

1. Go to https://github.com/new
2. Enter repository name: `build-the-future`
3. Choose **Public** or **Private**
4. Do NOT initialize with README, .gitignore, or license
5. Click **Create repository**
6. Copy the HTTPS URL (looks like `https://github.com/YOUR_USERNAME/build-the-future.git`)

### Option B: Using GitHub CLI

```bash
gh repo create build-the-future --public --source=. --remote=origin --push
```

## Step 2: Push Code to GitHub

Using the URL from Step 1 (replace with YOUR repo URL):

```bash
cd "/Users/abhishek/Desktop/July Offsite/build-the-future"

git remote add origin https://github.com/YOUR_USERNAME/build-the-future.git

git branch -M main

git push -u origin main
```

**Expected output:**
```
Enumerating objects: 29, done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ Your code is now on GitHub!

## Step 3: Connect to Vercel

### 1. Sign In to Vercel
- Go to https://vercel.com
- Sign in (or create account if needed)

### 2. Create New Project
1. Click **"Add New..."** → **"Project"**
2. Select **"GitHub"** under "Import Git Repository"
3. Authorize Vercel to access your GitHub
4. Search for `build-the-future`
5. Click **Import**

### 3. Configure Project

**Framework Preset:** Next.js (should auto-detect)  
**Root Directory:** ./ (leave as default)

### 4. Add Environment Variables

Click **"Environment Variables"** and add all 4:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
| `NEXT_PUBLIC_MODERATOR_PASSWORD` | `your-secure-password` |
| `NEXT_PUBLIC_SESSION_SECRET` | `random-secret-string` |

**Where to find these:**
- Go to your Supabase project
- **Settings** > **API**
- Copy **Project URL** and **anon public** key
- Make up your own password and session secret

### 5. Deploy

Click **"Deploy"**

**Wait 3-5 minutes...**

✅ Your app is now live! You'll see a URL like:
```
https://build-the-future-xyz.vercel.app
```

## Step 4: Verify Deployment

1. Click the live URL
2. Should see your landing page
3. Try participant flow:
   - Click "Join or Create Team"
   - Enter test data
   - Should work!

## Step 5: Share with Judges

Share this URL with judges:
```
https://build-the-future-xyz.vercel.app/judge
```

(Replace with your actual Vercel URL)

## Updating After Deployment

**If you make changes locally:**

```bash
cd "/Users/abhishek/Desktop/July Offsite/build-the-future"

git add .

git commit -m "Your change description"

git push
```

Vercel automatically rebuilds and redeploys! ✅

## Troubleshooting

### Build fails on Vercel

**Check the logs:**
1. Go to Vercel dashboard
2. Click your project
3. Go to **Deployments**
4. Click the failed build
5. Go to **Build Logs** tab
6. Look for error message

**Common issues:**
- Missing environment variables → Go back to Step 3 and check all 4 are set
- Wrong Supabase credentials → Copy again carefully from Supabase settings
- Node version → Vercel uses Node 18 by default, which is fine

### App works locally but not on Vercel

**Check:**
1. Environment variables are set (Step 3)
2. Supabase URL is correct (no extra spaces)
3. Browser console for errors (F12)
4. Vercel logs for backend errors

### Judges can't login

**Check:**
1. Judge access codes exist in Supabase `judges` table
2. Make sure you ran `npm run seed` locally before deploying (or manually added judges)
3. Access code matches exactly (case-sensitive)

### Supabase connection error on Vercel

**Check:**
1. URL format: should be `https://xxxxx.supabase.co` (with `https://`)
2. No trailing slash
3. Anon key is the **public** key, not the service role key
4. Both are non-empty strings

## Redeploying

If you need to redeploy without code changes (e.g., environment variable change):

1. Go to Vercel dashboard
2. Click your project
3. Click **Deployments**
4. Find the latest deployment
5. Click the **3 dots** menu
6. Select **Redeploy**

## Custom Domain (Optional)

To use your own domain instead of vercel.app:

1. Go to Vercel project settings
2. Go to **Domains**
3. Enter your domain
4. Follow instructions to update DNS records
5. Wait for DNS to propagate (5-30 minutes)

## Performance

Your app should be **very fast** on Vercel:
- Page loads: < 1 second
- Scoring: instant
- Leaderboard: real-time (< 2 second updates)

If slow, check:
1. Network tab in browser DevTools
2. Vercel analytics (Vercel dashboard > Analytics)
3. Supabase query performance (Supabase dashboard)

## Daily Limit

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ Up to 12 serverless function invocations per day (plenty for a contest!)
- ✅ Fast static hosting
- ✅ Automatic SSL

No cost for your contest!

## After the Event

Your app stays live on Vercel indefinitely (unless you delete it). You can:
- Keep it as a portfolio piece
- Archive for next year's contest
- Share results with stakeholders anytime

---

## Quick Checklist

- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] All 4 environment variables added
- [ ] Deployment successful (green checkmark)
- [ ] Live URL works
- [ ] Judge login tested
- [ ] Moderator login tested
- [ ] Ready for event!

---

**Done!** Your app is now live at your Vercel URL. 🎉

**Next:** Follow MODERATOR_GUIDE.md to run your event.
