# Office 10's Bowling Availability App

A mobile-first PWA for tracking bowling team availability with automatic bye rotation and real-time status updates.

## Features

- **Automatic Bye Rotation**: Calculates who has the bye based on a 5-week rotation starting Feb 6, 2025
- **Traffic Light Status**: Visual indicator showing team readiness (Red/Yellow/Green)
- **Real-time Updates**: Instant availability toggling with optimistic UI updates
- **PWA Support**: Installable on iOS/Android with offline capability
- **Password Protection**: Simple team password gate for access control

## Team Members

| Player | Rotation Order |
|--------|----------------|
| Jeff   | 1 (Initial Bye) |
| Neil   | 2 |
| Peter  | 3 |
| Tim    | 4 |
| Jay    | 5 |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Hosting**: Vercel-ready

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and run the SQL from `DATABASE_SCHEMA.md`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TEAM_PASSWORD=your-team-password
```

### 4. Add PWA Icons

Create two PNG icons and place them in `/public`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

See `public/ICONS_README.txt` for design suggestions.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

## How It Works

### Bye Rotation

The bye rotates weekly starting February 6, 2025:
- Week 0: Jeff
- Week 1: Neil
- Week 2: Peter
- Week 3: Tim
- Week 4: Jay
- Week 5: Jeff (cycle repeats)

### Availability Rules

1. **4 Active Players**: Can freely toggle In/Out
2. **Bye Player**: Locked as Out by default
3. **Unlock Condition**: If any active player marks Out, the bye player can toggle In as substitute

### Traffic Light System

- **Green** (4 players): Ready to Bowl!
- **Yellow** (2-3 players): Almost There...
- **Red** (0-1 players): Need More Players!

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TEAM_PASSWORD`
4. Deploy!

### Install as PWA

After deployment:
1. Open the app URL on your phone
2. Tap "Add to Home Screen" (iOS) or the install prompt (Android)
3. Launch from home screen for full-screen experience

## Project Structure

```
bowling-app/
├── app/
│   ├── api/
│   │   ├── auth/          # Password verification
│   │   ├── players/       # Get player list
│   │   └── availability/  # Get/update availability
│   ├── layout.tsx         # Root layout with PWA meta
│   ├── page.tsx           # Main app page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Base UI components
│   ├── PasswordGate.tsx   # Login screen
│   ├── PlayerCard.tsx     # Player availability card
│   ├── StatusBanner.tsx   # Traffic light banner
│   └── BowlingLogo.tsx    # SVG logo
├── lib/
│   ├── supabase.ts        # Supabase client
│   ├── types.ts           # TypeScript types
│   ├── rotation.ts        # Bye calculation logic
│   └── utils.ts           # Utility functions
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── offline.html       # Offline fallback
├── DATABASE_SCHEMA.md     # Supabase SQL setup
└── PRD.md                 # Full requirements
```

## License

Private project - Office 10's Bowling Team
