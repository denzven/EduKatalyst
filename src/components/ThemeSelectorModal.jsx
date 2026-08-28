import React from 'react';
import { X, Check, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_PRESETS, getStoredPreset, setStoredPreset } from '../utils/theme';

export default function ThemeSelectorModal({ isOpen, onClose, currentPreset, onSelectPreset }) {
  if (!isOpen) return null;

  const activeId = currentPreset || getStoredPreset();

  const handleChoose = (presetId) => {
    const updated = setStoredPreset(presetId);
    onSelectPreset?.(updated.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Theme Preset Gallery
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Choose a curated theme preset with WCAG contrast-verified swatches
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-ground)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Grid of Theme Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
            {THEME_PRESETS.map((preset) => {
              const isSelected = activeId === preset.id;

              return (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoose(preset.id)}
                  className={`p-5 rounded-2xl cursor-pointer border flex flex-col justify-between space-y-4 transition-all relative ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border-2 border-[var(--accent-coral)] shadow-lg'
                      : 'bg-[var(--bg-surface)]/60 border-[var(--border-color)] hover:border-[var(--accent-coral)]/60 hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  
                  {/* Card Top Row: Badge & Active Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--bg-ground)] border border-[var(--border-color)] text-[var(--accent-peach)]">
                      {preset.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Details</span>
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-coral)] text-white dark:text-[#1D1214] flex items-center justify-center font-bold text-xs shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold font-heading text-[var(--text-primary)] flex items-center gap-2">
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </h4>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="pt-1">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[var(--bg-ground)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
                        <span>🎛️</span>
                        <span>{preset.motion}</span>
                      </span>
                    </div>
                  </div>

                  {/* Interactive Accent Sample Box */}
                  <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-ground)] flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--accent-coral)] font-mono">
                      Accent Sample
                    </span>
                    <button className="px-3 py-1 rounded-full bg-[var(--accent-coral)] text-white dark:text-[#1D1214] text-xs font-bold shadow-sm">
                      Action
                    </button>
                  </div>

                  {/* 7-Swatch Palette Bar */}
                  <div className="p-2 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between gap-1">
                    {preset.swatches.map((colorHex, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-5 rounded-lg border border-black/10 shadow-inner"
                        style={{ backgroundColor: colorHex }}
                        title={colorHex}
                      />
                    ))}
                  </div>

                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>6 Curated Themes • Auto-saved to LocalStorage</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#1D1214] font-bold text-xs"
            >
              Done
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
