'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrafficState } from '@/lib/types';

interface StatusBannerProps {
  trafficState: TrafficState;
}

export function StatusBanner({ trafficState }: StatusBannerProps) {
  const { status, availableCount, message } = trafficState;

  return (
    <div
      className={cn(
        'rounded-xl p-4 flex items-center justify-between transition-all',
        status === 'green' && 'bg-traffic-green',
        status === 'yellow' && 'bg-traffic-yellow',
        status === 'red' && 'bg-traffic-red'
      )}
    >
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-white" />
        <div>
          <p className="text-white font-bold text-lg">{message}</p>
          <p className="text-white/80 text-sm">
            {availableCount} of 4 players ready
          </p>
        </div>
      </div>

      {/* Visual indicator circles */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 border-white/50',
              i < availableCount ? 'bg-white' : 'bg-white/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}
