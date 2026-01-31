// Bye rotation calculation logic

import { ROTATION_ORDER, PlayerName, TrafficState, TrafficStatus } from './types';

// Start date for the rotation (February 6, 2025 - Thursday)
const ROTATION_START_DATE = new Date('2025-02-06');

/**
 * Calculate the number of weeks since the rotation start date
 */
export function getWeeksSinceStart(targetDate: Date = new Date()): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = targetDate.getTime() - ROTATION_START_DATE.getTime();
  return Math.floor(diffMs / msPerWeek);
}

/**
 * Get the current bye player based on the rotation
 * Week 0: Jeff (index 0)
 * Week 1: Neil (index 1)
 * Week 2: Peter (index 2)
 * Week 3: Tim (index 3)
 * Week 4: Jay (index 4)
 * Week 5: Jeff (index 0) - cycle repeats
 */
export function getCurrentByePlayer(targetDate: Date = new Date()): PlayerName {
  const weeks = getWeeksSinceStart(targetDate);
  const byeIndex = ((weeks % 5) + 5) % 5; // Handle negative weeks properly
  return ROTATION_ORDER[byeIndex];
}

/**
 * Get the next Thursday from a given date
 */
export function getNextThursday(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;

  // If it's Thursday, use today, otherwise get next Thursday
  if (daysUntilThursday === 0) {
    return date;
  }

  date.setDate(date.getDate() + daysUntilThursday);
  return date;
}

/**
 * Get the current match date (next Thursday)
 */
export function getCurrentMatchDate(): Date {
  return getNextThursday(new Date());
}

/**
 * Format a date for display
 */
export function formatMatchDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as YYYY-MM-DD for database storage
 */
export function formatDateForDb(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate traffic light state based on available player count
 */
export function getTrafficState(availableCount: number): TrafficState {
  if (availableCount >= 4) {
    return {
      status: 'green',
      availableCount,
      message: 'Ready to Bowl!',
      bgColor: 'bg-traffic-green',
    };
  } else if (availableCount >= 2) {
    return {
      status: 'yellow',
      availableCount,
      message: 'Almost There...',
      bgColor: 'bg-traffic-yellow',
    };
  } else {
    return {
      status: 'red',
      availableCount,
      message: 'Need More Players!',
      bgColor: 'bg-traffic-red',
    };
  }
}

/**
 * Check if bye player should be unlocked
 * Bye player becomes unlocked if any active player marks 'Out'
 */
export function shouldByePlayerBeUnlocked(
  activePlayersAvailable: boolean[],
): boolean {
  // If any active player is NOT available, bye player can sub in
  return activePlayersAvailable.some(available => !available);
}
