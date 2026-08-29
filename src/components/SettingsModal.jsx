import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Palette, 
  Sliders, 
  ShieldCheck, 
  HardDrive, 
  Check, 
  Info, 
  Zap, 
  Moon, 
  Sun,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_PRESETS, getStoredPreset, setStoredPreset, toggleLightDarkMode } from '../utils/theme';
import { triggerPWAInstall, isAppInstalled } from '../utils/pwaHelper';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentPreset, 
  onSelectPreset,
  videoCount = 0 
}) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance'); // 'appearance' | 'playback' | 'security'
  
  if (!isOpen) return null;

  const activePresetId = currentPreset || getStoredPreset();
  const installed = isAppInstalled();

  const handleSelectThemePreset = (presetId) => {
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
          className="relative w-full max-w-4xl bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden my-8 transition-colors duration-300"
        >
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Platform Settings
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Manage theme presets, player performance, and security options
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

          {/* Modal Navigation & Content */}
          <div className="p-6 space-y-6">
            
            {/* Sub-Nav Bar inside Settings */}
            <div className="flex items-center space-x-2 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-color)] overflow-x-auto">
              <button
                onClick={() => setActiveSettingsTab('appearance')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  activeSettingsTab === 'appearance'
                    ? 'bg-[var(--accent-coral)] text-white dark:text-[#1D1214] font-bold shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Appearance & Themes</span>
              </button>

              <button
                onClick={() => setActiveSettingsTab('playback')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  activeSettingsTab === 'playback'
                    ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Playback & Engine</span>
              </button>

              <button
                onClick={() => setActiveSettingsTab('security')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  activeSettingsTab === 'security'
                    ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Cheat & Security</span>
              </button>
            </div>

            {/* TAB 1: APPEARANCE & THEMES GALLERY */}
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] uppercase tracking-wider">
                    Theme Presets ({THEME_PRESETS.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    const style = preset.cardStyle;

                    return (
                      <motion.div
                        key={preset.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectThemePreset(preset.id)}
                        style={{
                          backgroundColor: style.bg,
                          borderColor: isSelected ? style.accent : style.border,
                          color: style.text
                        }}
                        className={`p-4 rounded-2xl cursor-pointer border-2 flex flex-col justify-between space-y-3 transition-all relative shadow-md`}
                      >
                        {/* Preset Card Header */}
                        <div className="flex items-center justify-between">
                          <span 
                            style={{ backgroundColor: style.surface, color: style.accent, borderColor: style.border }}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
                          >
                            {preset.category}
                          </span>

                          {isSelected && (
                            <div 
                              style={{ backgroundColor: style.accent, color: style.accentText }}
                              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                          <h5 style={{ color: style.text }} className="text-base font-extrabold font-heading flex items-center gap-1.5">
                            <span>{preset.icon}</span>
                            <span>{preset.name}</span>
                          </h5>

                          <p style={{ color: style.muted }} className="text-[11px] leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PLAYBACK & ENGINE */}
            {activeSettingsTab === 'playback' && (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
                  <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[var(--accent-coral)]" />
                    Storage & Cache
                  </h4>

                  <div className="p-3 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-1 text-xs">
                    <span className="font-bold text-[var(--text-primary)] block">Local Storage Quota</span>
                    <span className="text-[11px] text-[var(--text-muted)] block">Cached lectures: {videoCount} session(s)</span>
                  </div>
                </div>

                {!installed && (
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold font-heading text-[var(--text-primary)]">Progressive Web App (PWA)</h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Install EduKatalyst for offline access</p>
                    </div>

                    <button
                      onClick={() => triggerPWAInstall()}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold text-xs flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install PWA</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SECURITY & ANTI-CHEAT */}
            {activeSettingsTab === 'security' && (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
                  <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-coral)]" />
                    Quiz Integrity Protection
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    EduKatalyst protects active quiz sessions by detecting browser DevTools inspection during peer assessments.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>EduKatalyst Settings • v1.3.0</span>
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
