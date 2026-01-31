import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all players
export async function GET() {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('rotation_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ players: players || [] });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
