# 🚀 Build the Future - START HERE

Welcome! This is a complete, production-ready innovation contest judging application. Here's how to get started.

## What You Have

✅ **Complete web application** built with Next.js + TypeScript + Tailwind  
✅ **Database schema** ready for Supabase PostgreSQL  
✅ **All 8 core pages** (landing, participant, judge, moderator, results)  
✅ **Real-time scoring** with judge progress tracking  
✅ **Automated leaderboard** with tie-breaking logic  
✅ **CSV export** for results  
✅ **Mobile-responsive** design for phones and tablets  
✅ **Sample data** script for testing  

## 5-Minute Quick Start

### 1. **Prerequisites**
- Node.js 16+ (install from nodejs.org)
- A Supabase account (free at supabase.com)

### 2. **Install**
```bash
cd "/Users/abhishek/Desktop/July Offsite/build-the-future"
npm install
```

### 3. **Set Up Database**
1. Create a Supabase project at https://supabase.com (takes 2 min)
2. Go to SQL Editor
3. Copy contents of `db/schema.sql`
4. Paste and run in Supabase SQL Editor ✓

### 4. **Configure**
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MODERATOR_PASSWORD=mypassword123
NEXT_PUBLIC_SESSION_SECRET=somethingsecret
```

**Find these values in Supabase Dashboard:**
- `Settings > API > URL` → SUPABASE_URL
- `Settings > API > anon public` → SUPABASE_ANON_KEY

### 5. **Seed Sample Data** (optional)
```bash
npm run seed
```

This creates sample judges and teams for testing.

### 6. **Run**
```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## Testing the App (5 min)

### Participant Flow
1. Click "Join or Create a Team"
2. Enter name: `John Doe` | Email: `john@example.com`
3. Create team `Team Alpha`
4. Click "Submit Team Entry"
5. Fill form and submit
6. See confirmation ✓

### Judge Flow
1. Click "Judge Login"
2. Enter access code: `JUDGE001`
3. Score team on 3 criteria (1-10)
4. Submit scores ✓

### Moderator Flow
1. Click "Moderator Login"
2. Password: whatever you set in `.env.local`
3. Overview tab: Select team, toggle "Judging Open"
4. Judging tab: Watch judge progress
5. Leaderboard tab: View rankings ✓

## Deploying to Vercel (10 min)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/build-the-future.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com/new
2. Select your GitHub repo
3. Click Deploy
4. Go to Settings > Environment Variables
5. Add all 4 variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MODERATOR_PASSWORD`
   - `NEXT_PUBLIC_SESSION_SECRET`
6. Redeploy

Your app is live! 🌍

## Documentation

📖 **Choose your next step:**

- **🏃 Running the Event?**  
  → Read **[MODERATOR_GUIDE.md](./MODERATOR_GUIDE.md)**  
  (Pre-event checklist, step-by-step event flow, troubleshooting)

- **⚙️ Deploying or Setting Up?**  
  → Read **[SETUP.md](./SETUP.md)**  
  (Detailed setup, environment variables, Vercel deployment, database backup)

- **📋 Project Overview?**  
  → Read **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)**  
  (What's built, architecture, testing checklist, known limitations)

- **❓ Quick Help?**  
  → Read **[README.md](./README.md)**  
  (Features, tech stack, troubleshooting quick links)

## File Structure

```
build-the-future/
├── 📄 START_HERE.md           ← You are here
├── 📄 README.md               ← Project overview
├── 📄 SETUP.md                ← Setup & deployment
├── 📄 MODERATOR_GUIDE.md      ← Run the event
├── 📄 PROJECT_SUMMARY.md      ← Technical details
│
├── 🌐 app/                    ← All pages
│   ├── page.tsx               ← Landing page
│   ├── participant/           ← Team creation & submission
│   ├── judge/                 ← Judge scoring
│   ├── moderator/             ← Admin dashboard
│   └── results/               ← Public leaderboard
│
├── 📚 lib/                    ← Core logic
│   ├── supabase.ts            ← Database client
│   ├── auth.ts                ← Authentication
│   └── scoring.ts             ← Calculations
│
├── 🗂️ db/                     ← Database
│   ├── schema.sql             ← Create tables (run in Supabase)
│   └── seed.ts                ← Sample data
│
└── ⚙️ Config files
    ├── .env.example           ← Copy to .env.local
    ├── package.json           ← Dependencies
    ├── tailwind.config.ts     ← Styles
    └── tsconfig.json          ← TypeScript
```

## Key Concepts

### Roles
- **Participant:** Joins team, submits innovation
- **Judge:** Scores team on 3 criteria (1-10)
- **Moderator:** Controls event flow, reveals results

### Event States
The moderator controls these toggles:
- `Registration Open` - Teams can form
- `Submissions Open` - Teams can submit
- `Judging Open` - Judges can score
- `Judging Locked` - Scores are final
- `Leaderboard Visible` - Results shown publicly

### Scoring
Each team gets:
- 3 scores per judge (Customer Outcome, AI-Native Thinking, Innovation & Vision)
- Average across judges per criterion
- Overall = (avg1 + avg2 + avg3) / 3
- Automatically ranked with tie-breaking

### Real-Time Updates
- Judges see new team instantly when moderator selects it
- Moderator sees judge scores within seconds
- Uses Supabase Realtime WebSockets (built-in)

## Common Questions

**Q: Do judges need passwords?**  
A: No. They use access codes (faster to share).

**Q: Can participants see judges' scores?**  
A: No. Scores hidden until leaderboard revealed.

**Q: What if the internet drops?**  
A: Scores still save (auto-save on submit). Refresh page to resync.

**Q: Can judges edit their scores?**  
A: Yes, until moderator locks judging.

**Q: How do I export results?**  
A: Moderator Dashboard → Leaderboard tab → Export CSV

**Q: Can I host on Netlify instead of Vercel?**  
A: Yes. Same steps, just go to netlify.com instead.

## Troubleshooting

### npm install fails
- Ensure Node.js 16+: `node --version`
- Delete `node_modules` and try again
- Use `npm install --legacy-peer-deps` if it persists

### Supabase connection errors
- Verify `.env.local` has correct URL and key
- Make sure you're using **anon key**, not service role key
- Check Supabase project isn't paused

### Judges can't login
- Verify access codes in `db/seed.ts` match database
- Default codes: `JUDGE001`, `JUDGE002`, etc.
- Check judge's `active` status is `true` in Supabase

### Real-time updates not working
- Check browser's WebSocket connection (DevTools > Network)
- Try refreshing page
- Ensure Supabase Realtime is enabled in project settings

**Still stuck?** See Troubleshooting section in SETUP.md.

## What's Next?

### To Get Started Today
1. ✅ Install dependencies: `npm install`
2. ✅ Set up Supabase (2 min)
3. ✅ Create `.env.local`
4. ✅ Run: `npm run dev`
5. ✅ Test locally

### Before Your Event
1. ✅ Deploy to Vercel
2. ✅ Run through moderator checklist (MODERATOR_GUIDE.md)
3. ✅ Share judge access codes
4. ✅ Do a dry run with one team

### During Your Event
1. ✅ Follow moderator guide step-by-step
2. ✅ Keep judge progress visible on your dashboard
3. ✅ Reveal results progressively
4. ✅ Export CSV after for records

## One Last Thing

This app is designed to be:
- 🎯 **Simple** - No unnecessary features, focus on judging
- 📱 **Mobile-first** - Works great on phones
- ⚡ **Fast** - Sub-second responses
- 🔒 **Secure** - Access controlled by role
- 🎨 **Professional** - Modern tech-forward design

It's ready to deploy right now. No additional coding needed.

---

**Ready to go?** Start with `/judge` or `/moderator` on http://localhost:3000 🚀

**Questions?** Check MODERATOR_GUIDE.md (event operations) or SETUP.md (technical).

**Good luck with Build the Future!** 🌟
