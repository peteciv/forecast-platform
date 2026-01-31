// Type definitions for the Bowling Availability App

export interface Player {
  id: string;
  name: string;
  rotation_order: number;
  created_at: string;
}

export interface MatchDay {
  id: string;
  match_date: string;
  bye_player_id: string | null;
  created_at: string;
}

export interface Availability {
  id: string;
  match_day_id: string;
  player_id: string;
  is_available: boolean;
  updated_at: string;
}

// Combined player data with availability status
export interface PlayerWithAvailability {
  player: Player;
  isAvailable: boolean;
  isBye: boolean;
  isLocked: boolean; // Bye player is locked unless an active player is out
}

// Traffic light status for the UI
export type TrafficStatus = 'red' | 'yellow' | 'green';

export interface TrafficState {
  status: TrafficStatus;
  availableCount: number;
  message: string;
  bgColor: string;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
}

// The 5 players in rotation order
export const ROTATION_ORDER = ['Jeff', 'Neil', 'Peter', 'Tim', 'Jay'] as const;
export type PlayerName = typeof ROTATION_ORDER[number];
