'use client';

import { Check, X, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { PlayerWithAvailability } from '@/lib/types';

interface PlayerCardProps {
  playerData: PlayerWithAvailability;
  onToggle: (playerId: string, newValue: boolean) => void;
}

export function PlayerCard({ playerData, onToggle }: PlayerCardProps) {
  const { player, isAvailable, isBye, isLocked } = playerData;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
        isAvailable
          ? 'bg-green-50 border-traffic-green'
          : 'bg-red-50 border-traffic-red',
        isLocked && 'opacity-60',
        isBye && 'border-dashed'
      )}
    >
      {/* Left side - Player info */}
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isAvailable ? 'bg-traffic-green' : 'bg-traffic-red'
          )}
        >
          {isAvailable ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <X className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Name and badge */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-gray-900">
              {player.name}
            </span>
            {isBye && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <Crown className="w-3 h-3" />
                BYE
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {isAvailable ? "I'm in!" : "I'm out"}
            {isLocked && ' (locked)'}
          </span>
        </div>
      </div>

      {/* Right side - Toggle */}
      <Switch
        checked={isAvailable}
        onCheckedChange={(checked) => onToggle(player.id, checked)}
        disabled={isLocked}
      />
    </div>
  );
}
