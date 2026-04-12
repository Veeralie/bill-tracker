# Dueflow

A simple manual recurring bill tracker built with Next.js for GitHub and Vercel.

## Features

- Add one-time or recurring bills
- Weekly, fortnightly, and monthly schedules
- Auto-generates upcoming due items for 180 days
- Mark due items as paid or unpaid
- Edit amount per due item for variable bills
- Stores data in browser localStorage

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repo into Vercel.
3. Deploy with the default settings.

No environment variables are required for this version.

## Next steps

- Add Supabase for login and cloud sync
- Add push reminders
- Add calendar view
- Add installment tracking for Klarna-style plans
