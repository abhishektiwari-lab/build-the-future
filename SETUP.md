# Build the Future - Setup Instructions

## Prerequisites

- Node.js 16+ and npm or yarn
- A Supabase account and project
- Vercel account (for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. In your Supabase project, go to SQL Editor and run the contents of `db/schema.sql`
   - This will create all tables, indexes, and views

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MODERATOR_PASSWORD=your-secure-password
NEXT_PUBLIC_SESSION_SECRET=your-random-session-secret
```

### 4. Seed Sample Data (Optional)

To populate the database with sample teams, judges, and participants:

```bash
npm run seed
```

This will create:
- 5 sample judges (Ashish Garg, Flint Brenton, Arun Rao, Abhishek Tiwari, Prasad Shrotri)
- 4 sample teams with members
- 3 sample submissions

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing the Application

### Participant Flow
1. Go to landing page
2. Click "Join or Create a Team"
3. Enter name and email
4. Create a new team or join with code `ALPHA001`
5. View team and submit entry

### Judge Flow
1. Go to landing page
2. Click "Judge Login"
3. Use access code `JUDGE001` (or another from seed data)
4. Score teams when moderator opens judging

### Moderator Flow
1. Go to landing page
2. Click "Moderator Login"
3. Use password from `.env.local`
4. Control event and judging from dashboard

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/build-the-future.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Select your GitHub repository
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MODERATOR_PASSWORD`
   - `NEXT_PUBLIC_SESSION_SECRET`
4. Deploy

The app will be live at your Vercel URL.

## Important Configuration

### Judge Access Codes
Judge access codes are configured in Supabase. Each judge has:
- **name**: Display name
- **access_code**: Code judges enter to login
- **active**: Whether they can currently login

Modify judges in the Supabase dashboard: `Tables > judges`

### Moderator Password
Change the moderator password in `.env.local` and redeploy:
```
NEXT_PUBLIC_MODERATOR_PASSWORD=your-new-password
```

### Event States
Control the event flow from the moderator dashboard:
- **Registration Open**: Participants can join/create teams
- **Submissions Open**: Participants can submit entries
- **Judging Open**: Judges can score teams
- **Judging Locked**: Scores are locked, no edits allowed
- **Leaderboard Visible**: Results are shown on `/results` page

## Moderator Quick Start Guide

### Before the Event
1. Log in as moderator
2. Add judges via Settings tab if needed
3. Ensure teams are created
4. Set presentation order on Teams tab

### During the Event
1. **Opening**: Keep "Registration Open" and "Submissions Open" enabled
2. **Transitions**: Click a team name to set it as "Current Presenting Team"
3. **Judging Start**: Toggle "Judging Open" to let judges start scoring
4. **Monitoring**: Watch judge completion status in Judging tab
5. **Next Team**: Toggle "Judging Open" off, select next team, toggle back on
6. **Close Judging**: Toggle "Judging Locked" when all teams are done
7. **Reveal Results**: 
   - Toggle "Leaderboard Visible"
   - Set "winner_reveal_state" to "top3", "full", or "winner" as desired

## Troubleshooting

### Judges Can't Login
- Check that judge access codes are in the `judges` table
- Verify `active` is set to `true`
- Check that the access code matches exactly (case-sensitive)

### Supabase Connection Issues
- Verify URL and anon key in `.env.local`
- Check that you're using the **anon key**, not the service role key
- Ensure your Supabase project is not paused

### Submissions Not Saving
- Check browser console for errors
- Verify submissions are enabled (Moderator Dashboard > Overview)
- Ensure participant has a valid session

## Database Backup

Before the event, back up your Supabase database:
1. Go to Supabase Dashboard > Backups
2. Create a manual backup

After the event, export results as CSV:
1. Moderator Dashboard > Leaderboard tab
2. Click "Export CSV" to download all results

## Support

For issues, check:
1. Browser console for JavaScript errors
2. Supabase dashboard for database issues
3. Vercel logs for deployment issues
