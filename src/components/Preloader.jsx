import React, { useState, useEffect } from 'react';
import KatalystLogo from './KatalystLogo';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing Encrypted Core...');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(50);
      setStatusText('Loading Dynamic Engine...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Validating Security Keys...');
    }, 800);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Katalyze the Change');
      setIsFading(true);
    }, 1200);

    const t4 = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-[var(--bg-ground)] flex flex-col items-center justify-center p-6 transition-colors duration-300 transition-opacity duration-300 ${
      isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      
      {/* Central Logo with Orbital Pulse */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-[var(--accent-coral)]/20 animate-ping" />
        <KatalystLogo className="w-20 h-20 sm:w-24 sm:h-24 relative z-10" glow={true} />
      </div>

      {/* Brand Title */}
      <div className="text-center space-y-1 mb-8">
        <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] tracking-wide">
          EduKatalyst <span className="text-[var(--accent-coral)]">by DZVN</span>
        </h1>
        <p className="text-xs text-[var(--accent-peach)] font-heading italic">
          "Katalyze the Change"
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xs space-y-2 text-center">
        <div className="flex justify-between items-center text-[11px] font-mono text-[var(--text-muted)]">
          <span>{statusText}</span>
          <span className="text-[var(--accent-peach)] font-bold">{progress}%</span>
        </div>

        <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-color)]">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent-coral)] to-[var(--accent-peach)] transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

    </div>
  );
}
