import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch availability for a match date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchDate = searchParams.get('date');

    if (!matchDate) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get the match day record
    const { data: matchDay, error: matchError } = await supabase
      .from('match_days')
      .select('id')
      .eq('match_date', matchDate)
      .single();

    if (matchError && matchError.code !== 'PGRST116') {
      throw matchError;
    }

    if (!matchDay) {
      // No match day exists yet, return empty availability
      return NextResponse.json({ availability: [] });
    }

    // Get availability for this match day
    const { data: availability, error: availError } = await supabase
      .from('availability')
      .select('player_id, is_available')
      .eq('match_day_id', matchDay.id);

    if (availError) {
      throw availError;
    }

    return NextResponse.json({
      matchDayId: matchDay.id,
      availability: availability || []
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST - Update availability for a player
export async function POST(request: NextRequest) {
  try {
    const { matchDate, playerId, isAvailable } = await request.json();

    if (!matchDate || !playerId || isAvailable === undefined) {
      return NextResponse.json(
        { error: 'matchDate, playerId, and isAvailable are required' },
        { status: 400 }
      );
    }

    // Get or create the match day
    let { data: matchDay, error: matchError } = await supabase
      .from('match_days')
      .select('id')
      .eq('match_date', matchDate)
      .single();

    if (matchError && matchError.code === 'PGRST116') {
      // Match day doesn't exist, create it
      const { data: newMatch, error: createError } = await supabase
        .from('match_days')
        .insert({ match_date: matchDate })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }
      matchDay = newMatch;
    } else if (matchError) {
      throw matchError;
    }

    if (!matchDay) {
      throw new Error('Failed to get or create match day');
    }

    // Upsert availability
    const { error: upsertError } = await supabase
      .from('availability')
      .upsert(
        {
          match_day_id: matchDay.id,
          player_id: playerId,
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_day_id,player_id' }
      );

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
