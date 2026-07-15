# Moderator Operating Guide

## Pre-Event Checklist (1-2 hours before)

### Login & Verification
- [ ] Log in to Moderator Dashboard with password
- [ ] Verify all participants are registered
- [ ] Confirm all teams are created
- [ ] Check judge names and access codes are correct

### Team Setup
- [ ] Set presentation order (Teams tab)
- [ ] Verify all submissions are complete
- [ ] Test team selection works (Overview tab)

### Judges
- [ ] Share judge access codes with judges
- [ ] Test one judge can login and see scoring interface
- [ ] Confirm judges understand 1-10 scoring scale

### Event State
- [ ] Set "Registration Open" = OFF
- [ ] Set "Submissions Open" = OFF
- [ ] Set "Judging Open" = OFF
- [ ] Set "Leaderboard Visible" = OFF

## During the Event

### Opening Remarks (5 min)
1. Welcome judges and participants
2. Explain scoring criteria
3. Preview first team

### Event Flow - Per Team (15-20 min per team)

#### Step 1: Select Team (1 min)
1. Go to **Overview** tab
2. Click the first team to set "Current Presenting Team"
3. Judges' phones will instantly show the new team

#### Step 2: Open Judging (30 sec)
1. Stay in **Overview** tab
2. Toggle "Judging Open" = ON
3. Judges now see scoring interface on their phones

#### Step 3: Judges Score (10-15 min)
1. Go to **Judging** tab
2. Watch judges' names for status (Pending → Submitted)
3. When all judges have submitted, move to Step 4

#### Step 4: Close Judging (30 sec)
1. Toggle "Judging Open" = OFF
2. Judges see "Waiting for next team..."

#### Step 5: Advance to Next Team
1. Go to **Overview** tab
2. Click next team in the list
3. Toggle "Judging Open" = ON
4. **Judges automatically see new team on their phones**

### Repeat Steps 1-5 for each team

## After All Judging

### Finalize Scores
1. Toggle "Judging Locked" = ON
2. This prevents any score changes
3. Announce "All judging is final"

## Revealing Results

### Before Announcing Winners
1. In **Leaderboard** tab, toggle "Leaderboard Visible" = ON
2. You'll see the full leaderboard with calculations

### Progressive Reveal (Recommended)
Use this to build suspense:

**Step 1: Announce Top 3**
1. Set `winner_reveal_state` to `top3`
2. Results page now shows 1st, 2nd, 3rd places
3. "The top three teams are..."

**Step 2: Show Full Leaderboard**
1. Set `winner_reveal_state` to `full`
2. Results page shows complete rankings
3. "Here's how all teams ranked..."

**Step 3: Highlight Winner (Optional)**
1. Set `winner_reveal_state` to `winner`
2. Results page emphasizes 1st place
3. "The Build the Future Award goes to..."

## Troubleshooting During Event

### Judges Can't Login
- **Problem:** Judge sees "Invalid access code"
- **Solution:** 
  1. Check Settings tab - verify judge's access code
  2. Confirm `active` = true
  3. Codes are case-sensitive (e.g., JUDGE001 not judge001)

### Judges Don't See Current Team
- **Problem:** Judge's phone still shows old team
- **Solution:**
  1. Check that "Judging Open" is OFF
  2. Click the team again in Overview tab
  3. Then toggle "Judging Open" = ON
  4. Judge phones should refresh within 5 seconds

### Judge Already Submitted, Wants to Re-Score
- **Problem:** Judge says they made a mistake
- **Solution:**
  1. If "Judging Locked" = OFF, judge can edit their score in app
  2. If "Judging Locked" = ON, only you (moderator) can edit
  3. Go to database and manually update the score if needed

### Team Submission is Missing
- **Problem:** Can't see a team's submission form details
- **Solution:**
  1. Go to Submissions tab
  2. Confirm team has completed form
  3. If missing, ask team to submit again
  4. They can edit until "Submissions Open" = OFF

### Internet Disconnect
- **Problem:** Real-time updates aren't working
- **Solution:**
  1. Refresh your dashboard browser
  2. Judges should refresh their phones
  3. Scores will still save (they auto-save)

## Judge Scoring Criteria

Judges rate each team on three dimensions (1-10):

### 1. Customer Outcome (1-10)
**Does it solve a meaningful customer or employee problem with significantly better outcomes?**
- 9-10: Solves critical problem, dramatically improves outcomes
- 7-8: Solves important problem, major improvements
- 5-6: Solves moderate problem, noticeable improvements
- 3-4: Addresses minor issue, small improvements
- 1-2: Doesn't clearly solve a problem

### 2. AI-Native Thinking (1-10)
**Does it fundamentally reimagine the experience using AI, rather than just adding an AI feature?**
- 9-10: Completely reimagined with AI at core
- 7-8: Significant reimagining with AI as primary
- 5-6: Some reimagining, AI integrated
- 3-4: AI bolted on to existing process
- 1-2: Minimal use of AI

### 3. Innovation and Vision (1-10)
**Is the idea creative, bold, and forward-looking? Does it offer a compelling vision for the future?**
- 9-10: Highly creative, bold, inspiring future vision
- 7-8: Creative approach, forward-thinking
- 5-6: Somewhat novel, reasonable vision
- 3-4: Incremental idea, limited vision
- 1-2: Derivative, no clear vision

## Scoring Calculation

**Overall Score = (Outcome + AI-Native + Innovation) / 3**

Example:
- Customer Outcome: 8
- AI-Native Thinking: 9
- Innovation and Vision: 7
- **Overall = (8 + 9 + 7) / 3 = 8.00**

## Tie-Breaking

If two teams have the same overall score:
1. **First tiebreaker:** Higher Customer Outcome score
2. **Second:** Higher AI-Native Thinking score
3. **Third:** Higher Innovation and Vision score
4. **Complete tie:** Manual decision by you

Example: Both teams score 7.50 overall
- Team A: Outcome 8.0, AI-Native 7.5, Innovation 7.0
- Team B: Outcome 7.0, AI-Native 8.0, Innovation 7.5
- **Team A wins** (higher Outcome score)

## After Results Are Revealed

### Announce Results
1. Go to `/results` page (or project it)
2. Follow progressive reveal steps above
3. Call out team names and overall scores
4. Celebrate the Future Builders!

### Export Results
1. Go to Leaderboard tab
2. Click "Export CSV" button
3. Share with stakeholders (all team scores, rankings, comments)

### Debrief
- Collect feedback from judges
- Thank participants
- Announce next innovation cycle

## Emergency Contacts

### Technical Issues
1. Refresh page (Ctrl+R or Cmd+R)
2. Check browser console for errors (F12)
3. Verify Supabase connection in environment variables
4. Restart server if deployed locally

### Event Issues
1. If judging goes wrong, toggle "Judging Open" = OFF
2. Resolve judge issues individually
3. If needed, pause and manually advance time for a team

## Quick Reference - Button States

### Overview Tab - Event Control
| Button | ON = | OFF = |
|--------|------|-------|
| Registration Open | Teams can join | Teams can't join |
| Submissions Open | Teams can submit | Teams can't submit |
| Judging Open | Judges can score | Judges can't score |
| Judging Locked | Scores locked | Scores editable |
| Leaderboard Visible | Results visible | Results hidden |

## Tips for Smooth Execution

1. **Warn before transitions:** "In 2 minutes, we'll score the next team. Judges, get ready."
2. **Set clear timing:** "You have 15 minutes to score this team."
3. **Check judge progress:** Glance at Judging tab every 2-3 minutes.
4. **Have backup internet:** Tether to mobile if WiFi fails.
5. **Print judge list:** Keep physical copy of judge names + codes.
6. **Silent judging:** Ask judges not to discuss scores while judging is open.
7. **Celebrate submissions:** Highlight each team's creativity.
8. **Show appreciation:** Thank judges publicly at end.

---

**Questions?** Check the [SETUP.md](./SETUP.md) for technical details.
