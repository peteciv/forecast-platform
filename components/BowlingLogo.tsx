'use client';

interface BowlingLogoProps {
  size?: number;
  className?: string;
}

export function BowlingLogo({ size = 80, className = '' }: BowlingLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="white" />

      {/* Bowling pins (simplified triangle formation) */}
      <g fill="#D32F2F">
        {/* Back row */}
        <ellipse cx="30" cy="25" rx="6" ry="10" />
        <ellipse cx="43" cy="25" rx="6" ry="10" />
        <ellipse cx="57" cy="25" rx="6" ry="10" />
        <ellipse cx="70" cy="25" rx="6" ry="10" />
        {/* Middle row */}
        <ellipse cx="36" cy="38" rx="6" ry="10" />
        <ellipse cx="50" cy="38" rx="6" ry="10" />
        <ellipse cx="64" cy="38" rx="6" ry="10" />
        {/* Front row */}
        <ellipse cx="43" cy="51" rx="6" ry="10" />
        <ellipse cx="57" cy="51" rx="6" ry="10" />
        {/* Lead pin */}
        <ellipse cx="50" cy="64" rx="6" ry="10" />
      </g>

      {/* Bowling ball */}
      <circle cx="50" cy="80" r="15" fill="#1F2937" />
      {/* Ball holes */}
      <circle cx="45" cy="76" r="3" fill="#4B5563" />
      <circle cx="53" cy="74" r="3" fill="#4B5563" />
      <circle cx="55" cy="82" r="2.5" fill="#4B5563" />

      {/* XXX Strike text */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        XXX
      </text>
    </svg>
  );
}
