import React from 'react';

export default function KatalystLogo({ className = "w-8 h-8", glow = false }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${glow ? 'drop-shadow-[0_0_15px_rgba(200,121,90,0.4)]' : ''}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="katalyst-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8795A" />
            <stop offset="100%" stopColor="#D49A6A" />
          </linearGradient>

          <linearGradient id="katalyst-inner-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E4E6EB" />
            <stop offset="100%" stopColor="#D49A6A" />
          </linearGradient>

          <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Hexagonal Lattice Outer Boundary */}
        <polygon
          points="50,8 88,30 88,70 50,92 12,70 12,30"
          stroke="url(#katalyst-primary-grad)"
          strokeWidth="7"
          strokeLinejoin="round"
          fill="#1F2228"
        />

        {/* Inner Catalytic Orbital Rings / Reaction Nodes */}
        <circle cx="50" cy="50" r="24" stroke="url(#katalyst-primary-grad)" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
        
        {/* Core Catalytic Spark Triangle / Energy Node */}
        <path
          d="M50 28 L68 64 L32 64 Z"
          fill="url(#katalyst-primary-grad)"
        />

        {/* Center Catalytic Nucleus Point */}
        <circle cx="50" cy="52" r="6" fill="url(#katalyst-inner-grad)" />

        {/* Orbital Reaction Sparks */}
        <circle cx="50" cy="18" r="3.5" fill="#D49A6A" />
        <circle cx="78" cy="35" r="3.5" fill="#C8795A" />
        <circle cx="78" cy="65" r="3.5" fill="#D49A6A" />
        <circle cx="22" cy="35" r="3.5" fill="#C8795A" />
        <circle cx="22" cy="65" r="3.5" fill="#D49A6A" />
        <circle cx="50" cy="82" r="3.5" fill="#C8795A" />
      </svg>
    </div>
  );
}
