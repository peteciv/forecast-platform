'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, LogOut, RefreshCw } from 'lucide-react';
import { PasswordGate } from '@/components/PasswordGate';
import { PlayerCard } from '@/components/PlayerCard';
import { StatusBanner } from '@/components/StatusBanner';
import { BowlingLogo } from '@/components/BowlingLogo';
import { Button } from '@/components/ui/button';
import {
  getCurrentByePlayer,
  getCurrentMatchDate,
  formatMatchDate,
  formatDateForDb,
  getTrafficState,
} from '@/lib/rotation';
import type { Player, PlayerWithAvailability } from '@/lib/types';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const matchDate = getCurrentMatchDate();
  const matchDateStr = formatDateForDb(matchDate);
  const byePlayerName = getCurrentByePlayer(matchDate);

  // Check auth on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('bowling_auth') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  // Fetch players and availability
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsSyncing(true);

      // Fetch players
      const playersRes = await fetch('/api/players');
      const playersData = await playersRes.json();

      if (playersData.players) {
        setPlayers(playersData.players);

        // Initialize availability for all players (default: active players are "in", bye is "out")
        const initialAvailability: Record<string, boolean> = {};
        playersData.players.forEach((p: Player) => {
          initialAvailability[p.id] = p.name !== byePlayerName;
        });

        // Fetch saved availability
        const availRes = await fetch(`/api/availability?date=${matchDateStr}`);
        const availData = await availRes.json();

        if (availData.availability && availData.availability.length > 0) {
          // Override with saved availability
          availData.availability.forEach(
            (a: { player_id: string; is_available: boolean }) => {
              initialAvailability[a.player_id] = a.is_available;
            }
          );
        }

        setAvailability(initialAvailability);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [isAuthenticated, byePlayerName, matchDateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle availability for a player
  const handleToggle = async (playerId: string, newValue: boolean) => {
    // Optimistic update
    setAvailability((prev) => ({ ...prev, [playerId]: newValue }));

    try {
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchDate: matchDateStr,
          playerId,
          isAvailable: newValue,
        }),
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setAvailability((prev) => ({ ...prev, [playerId]: !newValue }));
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('bowling_auth');
    setIsAuthenticated(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bowling-red">
        <BowlingLogo size={100} className="animate-pulse" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Check if any active (non-bye) player is out
  const activePlayersOut = players.some(
    (p) => p.name !== byePlayerName && !availability[p.id]
  );

  // Build player data with availability status
  const playersWithAvailability: PlayerWithAvailability[] = players.map(
    (player) => {
      const isBye = player.name === byePlayerName;
      const isAvailable = availability[player.id] ?? !isBye;
      // Bye player is locked unless an active player is out
      const isLocked = isBye && !activePlayersOut;

      return { player, isAvailable, isBye, isLocked };
    }
  );

  // Count available players
  const availableCount = playersWithAvailability.filter(
    (p) => p.isAvailable
  ).length;
  const trafficState = getTrafficState(availableCount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-bowling-red text-white p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BowlingLogo size={40} />
            <div>
              <h1 className="font-bold text-lg">Office 10&apos;s</h1>
              <p className="text-white/80 text-sm">Bowling</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isSyncing}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Date Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3">
          <div className="w-12 h-12 bg-bowling-red/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-bowling-red" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Match</p>
            <p className="font-semibold text-gray-900">
              {formatMatchDate(matchDate)}
            </p>
          </div>
        </div>

        {/* Bye Indicator */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">{byePlayerName}</span> has the bye
            this week
          </p>
        </div>

        {/* Status Banner */}
        <StatusBanner trafficState={trafficState} />

        {/* Player Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {playersWithAvailability.map((playerData) => (
              <PlayerCard
                key={playerData.player.id}
                playerData={playerData}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-400 pt-4">
          Tap the toggle to change your availability
        </p>
      </main>
    </div>
  );
}
