# yemama - Dual Mode Health Tracker

Mobile-first health tracking web app with two full modes:
- Cycle Mode
- Pregnancy Mode

Built with Next.js App Router, Tailwind CSS, Supabase, and Gemini API.

## Core Features

- Content-rich landing page with hero, feature cards, testimonials, trust section, and footer
- Global mode toggle in navbar (`Cycle Mode` ↔ `Pregnancy Mode`)
- Mode persisted in local app state and Supabase `user_profiles.tracking_type`
- Cycle Mode:
  - current cycle day, next period, fertility window
  - color-coded calendar
  - symptom logging and ovulation prediction
  - chart insights
- Pregnancy Mode:
  - current week, baby size analogy, trimester progress
  - weekly updates, daily tips, appointment reminders
  - period/ovulation features disabled
- AI Health Assistant with Gemini API and non-diagnostic safety disclaimers
- Auth:
  - email/password
  - optional anonymous mode
- Privacy-first profile controls with PIN/biometric lock UI toggles
- Loading, empty, and friendly error states across key views

## Database Tables

Existing + required tables are supported in `lib/supabase/schema.sql`, including:
- `users`
- `cycles`
- `symptoms`
- `pregnancy_logs`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

4. Apply database schema in Supabase SQL editor using:

- `lib/supabase/schema.sql`

5. Run locally:

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Vercel Deployment

1. Push branch to GitHub
2. Import repo in Vercel
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy

## Performance Notes

- Uses Next.js `Image` for optimized image loading
- Mobile-first responsive layouts
- Mode-aware rendering hides irrelevant UI for cleaner navigation
