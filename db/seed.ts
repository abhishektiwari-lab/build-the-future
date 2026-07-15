import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Starting seed...')

  // Create judges
  const judges = [
    { name: 'Ashish Garg', access_code: 'JUDGE001' },
    { name: 'Flint Brenton', access_code: 'JUDGE002' },
    { name: 'Arun Rao', access_code: 'JUDGE003' },
    { name: 'Abhishek Tiwari', access_code: 'JUDGE004' },
    { name: 'Prasad Shrotri', access_code: 'JUDGE005' },
  ]

  console.log('Creating judges...')
  for (const judge of judges) {
    const { error } = await supabase.from('judges').insert([judge])
    if (error) console.error('Judge error:', error)
    else console.log(`Created judge: ${judge.name}`)
  }

  // Create teams
  const teams = [
    { name: 'Team Alpha', join_code: 'ALPHA001', presentation_order: 1 },
    { name: 'Team Beta', join_code: 'BETA001', presentation_order: 2 },
    { name: 'Team Gamma', join_code: 'GAMMA001', presentation_order: 3 },
    { name: 'Team Delta', join_code: 'DELTA001', presentation_order: 4 },
  ]

  console.log('Creating teams...')
  const createdTeams: any[] = []
  for (const team of teams) {
    const { data, error } = await supabase.from('teams').insert([team]).select()
    if (error) console.error('Team error:', error)
    else {
      console.log(`Created team: ${team.name}`)
      if (data && data[0]) createdTeams.push(data[0])
    }
  }

  // Create participants
  const participants = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'participant',
      team_id: createdTeams[0]?.id,
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'participant',
      team_id: createdTeams[0]?.id,
    },
    {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      role: 'participant',
      team_id: createdTeams[0]?.id,
    },
    {
      name: 'Diana Prince',
      email: 'diana@example.com',
      role: 'participant',
      team_id: createdTeams[1]?.id,
    },
    {
      name: 'Eve Wilson',
      email: 'eve@example.com',
      role: 'participant',
      team_id: createdTeams[1]?.id,
    },
    {
      name: 'Frank Miller',
      email: 'frank@example.com',
      role: 'participant',
      team_id: createdTeams[2]?.id,
    },
    {
      name: 'Grace Lee',
      email: 'grace@example.com',
      role: 'participant',
      team_id: createdTeams[2]?.id,
    },
    {
      name: 'Henry Davis',
      email: 'henry@example.com',
      role: 'participant',
      team_id: createdTeams[2]?.id,
    },
  ]

  console.log('Creating participants...')
  for (const participant of participants) {
    const { error } = await supabase.from('participants').insert([participant])
    if (error) console.error('Participant error:', error)
    else console.log(`Created participant: ${participant.name}`)
  }

  // Create submissions
  const submissions = [
    {
      team_id: createdTeams[0]?.id,
      prototype_name: 'AI-Powered Customer Onboarding',
      current_product_or_process: 'Customer Onboarding Workflow',
      persona: 'New Banking Customer',
      job_to_be_done: 'Get verified and opened account in minutes',
      problem: 'Onboarding takes hours with manual verification steps',
      ai_native_solution:
        'AI-driven identity verification and contextual chatbot guiding users through forms in natural language',
      expected_outcomes:
        'Reduce onboarding time from 2 hours to 15 minutes, improve completion rate from 65% to 95%',
      demo_url: 'https://example.com/demo1',
      supporting_url: null,
      image_url: null,
    },
    {
      team_id: createdTeams[1]?.id,
      prototype_name: 'AI Compliance Assistant',
      current_product_or_process: 'Compliance Review Process',
      persona: 'Compliance Officer',
      job_to_be_done: 'Review transactions for regulatory risk in seconds',
      problem: 'Manual compliance review is time-consuming and error-prone',
      ai_native_solution:
        'LLM-powered assistant that analyzes transactions, flags risks, and generates explanations for audits',
      expected_outcomes:
        'Reduce review time by 70%, increase detection accuracy to 98%, enable officers to review 10x more transactions',
      demo_url: 'https://example.com/demo2',
      supporting_url: null,
      image_url: null,
    },
    {
      team_id: createdTeams[2]?.id,
      prototype_name: 'Predictive Support Bot',
      current_product_or_process: 'Customer Support Queue',
      persona: 'Support Agent',
      job_to_be_done: 'Resolve customer issues faster with AI assistance',
      problem: 'Support team spends hours researching solutions',
      ai_native_solution:
        'AI copilot that predicts customer issues before they are reported and drafts solutions for agent review',
      expected_outcomes:
        'Reduce average handle time by 40%, increase CSAT score from 3.8 to 4.5, free agents for complex issues',
      demo_url: 'https://example.com/demo3',
      supporting_url: null,
      image_url: null,
    },
  ]

  console.log('Creating submissions...')
  for (const submission of submissions) {
    const { error } = await supabase.from('submissions').insert([submission])
    if (error) console.error('Submission error:', error)
    else console.log(`Created submission: ${submission.prototype_name}`)
  }

  // Initialize event state
  console.log('Initializing event state...')
  const { error } = await supabase.from('event_state').insert([
    {
      registration_open: true,
      submissions_open: true,
      judging_open: false,
      judging_locked: false,
      current_team_id: null,
      leaderboard_visible: false,
      winner_reveal_state: 'hidden',
    },
  ])
  if (error) console.error('Event state error:', error)
  else console.log('Created event state')

  console.log('Seed complete!')
}

seed().catch(console.error)
