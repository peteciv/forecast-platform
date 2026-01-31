# Office 10's Bowling Availability App - Product Requirements Document

## 1. Project Overview
A mobile-first PWA for the Office 10's bowling team to track player availability for weekly Thursday matches. Features automatic bye rotation, real-time availability updates, and a traffic light status system.

## 2. Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **PWA**: Web App Manifest + Service Worker

## 3. Team Members
| Name | Rotation Order |
|------|----------------|
| Jeff | 1 (Initial Bye) |
| Neil | 2 |
| Peter | 3 |
| Tim | 4 |
| Jay | 5 |

## 4. Core Logic

### A. The Rotation System
- **Start Date**: February 6, 2025 (Thursday)
- **Initial Bye**: Jeff
- **Rotation Order**: Jeff -> Neil -> Peter -> Tim -> Jay -> Jeff...
- **Calculation**:
  - Count weeks since Feb 6, 2025
  - `bye_index = weeks_since_start % 5`
  - Map to rotation order (0=Jeff, 1=Neil, 2=Peter, 3=Tim, 4=Jay)

### B. Availability Rules
1. **4 Active Players**: Can freely toggle between 'In' and 'Out'
2. **Bye Player**: Locked as 'Out' by default
3. **Bye Unlock Condition**: If ANY active player marks 'Out', the bye player becomes unlocked and can toggle 'In' as a substitute
4. **Player Count**: Always need exactly 4 players marked 'In' to bowl

### C. Traffic Light System
Visual background indicator based on available player count:
- **Red** (#EF4444): 0-1 players available - "Need More Players!"
- **Yellow** (#F59E0B): 2-3 players available - "Almost There..."
- **Green** (#22C55E): 4 players available - "Ready to Bowl!"

## 5. Functional Requirements

### A. Password Gate
- Simple team password stored in `TEAM_PASSWORD` environment variable
- Password input screen shown on first visit
- Successful login stored in LocalStorage for persistence
- No user accounts - just a shared team password

### B. Main Dashboard
- **Header**: Logo + "Office 10's Bowling" title
- **Date Display**: Current match date (next Thursday)
- **Bye Indicator**: Shows who has the bye this week
- **Player Cards**: 5 cards showing each player's status
- **Status Banner**: Traffic light background with player count message

### C. Player Cards
Each card displays:
- Player name
- Toggle switch for In/Out status
- Visual indicator (green check / red X)
- "BYE" badge when applicable
- Disabled state when bye player is locked

### D. PWA Features
- Installable on iOS/Android home screens
- Offline capability for viewing last known state
- App icon and splash screen
- Standalone display mode (no browser chrome)

## 6. UI/UX Design

### Theme Colors
- **Primary (Bowling Red)**: #D32F2F
- **White**: #FFFFFF
- **Traffic Light Red**: #EF4444
- **Traffic Light Yellow**: #F59E0B
- **Traffic Light Green**: #22C55E
- **Text Dark**: #1F2937
- **Text Muted**: #6B7280

### Logo
Placeholder: A bowling ball striking pins with "XXX" text overlay (strike symbol)

### Typography
- Font: System fonts (Inter or similar sans-serif)
- Headings: Bold, larger sizes
- Body: Regular weight, readable on mobile

## 7. Database Schema

### Tables
1. **players**: id, name, rotation_order, created_at
2. **match_days**: id, match_date, bye_player_id, created_at
3. **availability**: id, match_day_id, player_id, is_available, updated_at

See `DATABASE_SCHEMA.md` for complete SQL setup.

## 8. Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TEAM_PASSWORD=your_team_password
```

## 9. Definition of Done
- [ ] Next.js 14 project initialized with Tailwind + shadcn/ui
- [ ] Supabase client configured
- [ ] Password gate with LocalStorage persistence
- [ ] Bye rotation calculation working correctly
- [ ] Player availability toggles functional
- [ ] Traffic light system updates in real-time
- [ ] Bye player lock/unlock logic implemented
- [ ] PWA manifest and service worker configured
- [ ] Mobile-responsive design
- [ ] Deployed to Vercel
