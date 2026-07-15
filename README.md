# Build the Future - Innovation Contest App

A polished, mobile-first web application for managing an internal innovation contest with team formation, submissions, executive judging, and live leaderboard.

**Theme:** Betting the Farm on AI  
**Contest:** Build the Future  
**Award:** Future Builder Award

## Features

### For Participants
- ✅ Join or create teams with shareable codes
- ✅ Manage team membership (2-5 members)
- ✅ Submit and edit team innovations
- ✅ See submission status in real-time

### For Judges
- ✅ Secure login with access codes
- ✅ Mobile-optimized scoring interface
- ✅ Score on 3 criteria (1-10 scale)
- ✅ Add optional comments
- ✅ Track scoring progress
- ✅ Cannot see other judges' scores

### For Moderators
- ✅ Password-protected admin dashboard
- ✅ Manage participants and teams
- ✅ Review submissions
- ✅ Control judging flow in real-time
- ✅ View live leaderboard with rankings
- ✅ Reveal results progressively
- ✅ Export scores to CSV

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL) with Realtime
- **Hosting:** Vercel
- **Real-time Updates:** Supabase Realtime subscriptions

## Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase (see SETUP.md)
# Copy .env.example to .env.local and fill in credentials

# 3. Seed sample data (optional)
npm run seed

# 4. Start dev server
npm run dev
```

Visit http://localhost:3000

### Deploy to Vercel
```bash
# Push to GitHub
git push

# Vercel auto-deploys on push
# Set environment variables in Vercel dashboard
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## Judging Criteria

Teams are scored on three equally-weighted dimensions (1-10):

1. **Customer Outcome** — Does it solve a meaningful problem with significantly better outcomes?
2. **AI-Native Thinking** — Does it fundamentally reimagine the experience using AI?
3. **Innovation and Vision** — Is it creative, bold, and forward-looking?

**Overall Score** = (Criterion 1 + Criterion 2 + Criterion 3) / 3

**Tie-Breaking:**
1. Higher Customer Outcome score
2. Higher AI-Native Thinking score
3. Higher Innovation and Vision score
4. Flag complete ties for moderator decision

## Submission Form

Teams submit:
- Prototype name
- Current product/process being reimagined
- Customer/employee persona
- Job to be done
- Problem statement
- AI-native solution summary
- Expected outcomes
- Demo URL
- Supporting URL (optional)
- Screenshot (optional)

## Event Flow

1. **Registration Opens** → Participants create/join teams
2. **Submissions Open** → Teams submit entries
3. **Judging Opens** → Moderator selects team, judges score
4. **Teams Rotate** → Repeat until all teams are scored
5. **Judging Locks** → No more score edits
6. **Results Reveal** → Progressively show leaderboard

## Architecture

### Database Schema
- **participants** — Users with team assignments
- **teams** — Team data and join codes
- **submissions** — Team entries and innovation details
- **judges** — Judges with access codes
- **scores** — Judge ratings per team
- **event_state** — Global event configuration

### Pages
- `/` — Landing page with role selection
- `/participant` — Team creation and joining
- `/participant/team` — Team management
- `/participant/submit` — Submission form
- `/judge` — Judge login
- `/judge/dashboard` — Scoring interface
- `/moderator` — Moderator login
- `/moderator/dashboard` — Admin panel
- `/results` — Public results display

### Key Features
- Realtime updates (judges see current team instantly)
- Duplicate submission prevention
- Tie-breaking logic
- CSV export
- Mobile-responsive design
- No passwords required (except moderator)

## Security

- **Participants:** Session-based (localStorage token)
- **Judges:** Access codes (no passwords)
- **Moderator:** Password-protected
- **Judging Isolation:** Judges cannot see other scores
- **Result Isolation:** Results hidden until moderator reveals

## Deployment

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MODERATOR_PASSWORD=...
NEXT_PUBLIC_SESSION_SECRET=...
```

### Hosts Supported
- Vercel (recommended)
- Netlify
- Any Node.js 16+ host

## Testing Scenarios

### Participant
- [ ] Create team
- [ ] Other participants join with code
- [ ] Invite 3-5 members
- [ ] Submit entry
- [ ] Edit before deadline
- [ ] Cannot edit after deadline

### Judge
- [ ] Login with access code
- [ ] Score team on 3 criteria
- [ ] Add comment
- [ ] See progress (X of Y teams)
- [ ] Cannot edit after judging locked
- [ ] Cannot see other judges' scores

### Moderator
- [ ] Control event states
- [ ] Select presenting team
- [ ] Open/close judging
- [ ] Monitor judge completion
- [ ] View leaderboard
- [ ] Export CSV

## Support & Documentation

- [Setup Instructions](./SETUP.md) — Detailed setup guide
- [Database Schema](./db/schema.sql) — Table definitions
- [Seed Data](./db/seed.ts) — Sample data script

## License

Internal Eltropy use only.

---

**Build the Future** — Reimagining products as AI-native experiences.
