# Bowling Availability App - Database Schema

## Overview
This schema supports the Office 10's Bowling Availability tracking system with player management, match day scheduling, and availability tracking.

## Tables

### 1. players
Stores the bowling team members.

```sql
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rotation_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data (rotation order determines bye sequence)
INSERT INTO players (name, rotation_order) VALUES
  ('Jeff', 1),
  ('Neil', 2),
  ('Peter', 3),
  ('Tim', 4),
  ('Jay', 5);
```

### 2. match_days
Tracks each Thursday bowling session.

```sql
CREATE TABLE match_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_date DATE NOT NULL UNIQUE,
  bye_player_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX idx_match_days_date ON match_days(match_date);
```

### 3. availability
Tracks player availability for each match day.

```sql
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_day_id UUID REFERENCES match_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_day_id, player_id)
);

-- Index for fast lookups
CREATE INDEX idx_availability_match_day ON availability(match_day_id);
CREATE INDEX idx_availability_player ON availability(player_id);
```

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Public read access (authenticated via app password)
CREATE POLICY "Allow public read access on players"
  ON players FOR SELECT USING (true);

CREATE POLICY "Allow public read access on match_days"
  ON match_days FOR SELECT USING (true);

CREATE POLICY "Allow public read access on availability"
  ON availability FOR SELECT USING (true);

-- Public write access for availability (protected by app-level password)
CREATE POLICY "Allow public insert on match_days"
  ON match_days FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on availability"
  ON availability FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on availability"
  ON availability FOR UPDATE USING (true);
```

## Functions

### Get or Create Current Match Day
```sql
CREATE OR REPLACE FUNCTION get_or_create_match_day(target_date DATE)
RETURNS UUID AS $$
DECLARE
  match_id UUID;
BEGIN
  -- Try to find existing match day
  SELECT id INTO match_id FROM match_days WHERE match_date = target_date;

  -- If not found, create it
  IF match_id IS NULL THEN
    INSERT INTO match_days (match_date) VALUES (target_date)
    RETURNING id INTO match_id;
  END IF;

  RETURN match_id;
END;
$$ LANGUAGE plpgsql;
```

### Initialize Availability for Match Day
```sql
CREATE OR REPLACE FUNCTION initialize_availability(match_id UUID, bye_player_name TEXT)
RETURNS VOID AS $$
DECLARE
  player_rec RECORD;
BEGIN
  FOR player_rec IN SELECT id, name FROM players LOOP
    INSERT INTO availability (match_day_id, player_id, is_available)
    VALUES (
      match_id,
      player_rec.id,
      player_rec.name != bye_player_name  -- Bye player starts as unavailable
    )
    ON CONFLICT (match_day_id, player_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Rotation Logic
The bye rotation is calculated in the application layer:

- **Start Date**: February 6, 2025 (Thursday)
- **Initial Bye**: Jeff (rotation_order = 1)
- **Rotation Order**: Jeff -> Neil -> Peter -> Tim -> Jay -> Jeff...
- **Calculation**: `weeks_since_start % 5` gives the rotation_order of the current bye player

## Quick Setup Commands

Run these in your Supabase SQL Editor:

```sql
-- 1. Create tables
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rotation_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_date DATE NOT NULL UNIQUE,
  bye_player_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_day_id UUID REFERENCES match_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_day_id, player_id)
);

-- 2. Create indexes
CREATE INDEX idx_match_days_date ON match_days(match_date);
CREATE INDEX idx_availability_match_day ON availability(match_day_id);
CREATE INDEX idx_availability_player ON availability(player_id);

-- 3. Insert initial players
INSERT INTO players (name, rotation_order) VALUES
  ('Jeff', 1),
  ('Neil', 2),
  ('Peter', 3),
  ('Tim', 4),
  ('Jay', 5);

-- 4. Enable RLS and create policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read on match_days" ON match_days FOR SELECT USING (true);
CREATE POLICY "Allow public read on availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Allow public insert on match_days" ON match_days FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on availability" ON availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on availability" ON availability FOR UPDATE USING (true);
```
