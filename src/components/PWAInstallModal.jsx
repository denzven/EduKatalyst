import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  Smartphone, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  WifiOff, 
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { triggerPWAInstall, isAppInstalled, subscribeToInstallPrompt } from '../utils/pwaHelper';

export default function PWAInstallModal({ isOpen, onClose }) {
  const [canInstallNative, setCanInstallNative] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('chrome'); // 'chrome' | 'android' | 'ios'
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    setInstalled(isAppInstalled());
    const unsubscribe = subscribeToInstallPrompt((canInstall) => {
      setCanInstallNative(canInstall);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setStatusMsg(null);
    try {
      const accepted = await triggerPWAInstall();
      if (accepted) {
        setStatusMsg({ success: true, text: 'EduKatalyst App installed successfully!' });
        setTimeout(() => onClose?.(), 1500);
      } else {
        setStatusMsg({ success: false, text: 'App installation was cancelled.' });
      }
    } catch (err) {
      setStatusMsg({ success: false, text: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#1A1C20] border border-[#343842] rounded-3xl shadow-2xl overflow-hidden my-8 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#25282E]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#C8795A]/15 text-[#C8795A] border border-[#C8795A]/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#E4E6EB]">
                Install EduKatalyst Desktop / Mobile App
              </h3>
              <p className="text-[11px] text-[#A0AAB2]">
                Standalone app with zero browser distractions & 100% offline support
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A0AAB2] hover:text-white hover:bg-[#1A1C20] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* App Highlights Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842] flex items-start space-x-2.5">
              <Zap className="w-4 h-4 text-[#C8795A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#E4E6EB] block font-semibold">Instant Launch</strong>
                <span className="text-[#A0AAB2] text-[10px]">Launch directly from desktop taskbar or home screen.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842] flex items-start space-x-2.5">
              <WifiOff className="w-4 h-4 text-[#C8795A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#E4E6EB] block font-semibold">100% Offline Access</strong>
                <span className="text-[#A0AAB2] text-[10px]">Access encrypted lectures & notes without internet.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842] flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#C8795A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#E4E6EB] block font-semibold">Distraction-Free</strong>
                <span className="text-[#A0AAB2] text-[10px]">No browser tabs, search bars, or external popups.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842] flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-[#C8795A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#E4E6EB] block font-semibold">Native Performance</strong>
                <span className="text-[#A0AAB2] text-[10px]">Smooth 60FPS WASM video transcoding & physics animations.</span>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
              statusMsg.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Primary Action Button */}
          {installed ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
              <span className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                EduKatalyst App is Already Installed!
              </span>
              <p className="text-[#A0AAB2] text-[11px]">
                You can launch EduKatalyst directly from your application launcher.
              </p>
            </div>
          ) : canInstallNative ? (
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C8795A] to-[#D49A6A] hover:opacity-95 text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition"
            >
              <Download className="w-5 h-5" />
              <span>Install EduKatalyst Desktop / Mobile App Now</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#343842] pb-2">
                <span className="text-[#E4E6EB] font-bold">Manual App Installation Guides</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveTab('chrome')}
                    className={`px-2.5 py-1 rounded-lg transition font-mono ${
                      activeTab === 'chrome' ? 'bg-[#C8795A] text-white' : 'text-[#A0AAB2] hover:text-white'
                    }`}
                  >
                    Desktop (Chrome/Edge)
                  </button>
                  <button
                    onClick={() => setActiveTab('android')}
                    className={`px-2.5 py-1 rounded-lg transition font-mono ${
                      activeTab === 'android' ? 'bg-[#C8795A] text-white' : 'text-[#A0AAB2] hover:text-white'
                    }`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setActiveTab('ios')}
                    className={`px-2.5 py-1 rounded-lg transition font-mono ${
                      activeTab === 'ios' ? 'bg-[#C8795A] text-white' : 'text-[#A0AAB2] hover:text-white'
                    }`}
                  >
                    iOS Safari
                  </button>
                </div>
              </div>

              {activeTab === 'chrome' && (
                <div className="p-4 rounded-xl bg-[#25282E] border border-[#343842] space-y-2 text-[#A0AAB2]">
                  <p className="text-[#E4E6EB] font-bold">Chrome / Edge Desktop:</p>
                  <ol className="list-decimal list-inside space-y-1 font-mono text-[11px]">
                    <li>Click the <strong>Install Icon</strong> (desktop display icon) in the right side of your browser URL bar.</li>
                    <li>Or click browser menu <span className="text-[#D49A6A]">⋮ &gt; Save and share &gt; Install EduKatalyst...</span></li>
                    <li>Click <strong>Install</strong> to add to desktop.</li>
                  </ol>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="p-4 rounded-xl bg-[#25282E] border border-[#343842] space-y-2 text-[#A0AAB2]">
                  <p className="text-[#E4E6EB] font-bold">Android Chrome:</p>
                  <ol className="list-decimal list-inside space-y-1 font-mono text-[11px]">
                    <li>Tap the <strong>⋮ Menu button</strong> in top-right corner.</li>
                    <li>Select <span className="text-[#D49A6A]">Add to Home screen</span> or <span className="text-[#D49A6A]">Install App</span>.</li>
                    <li>Follow screen prompt to install.</li>
                  </ol>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="p-4 rounded-xl bg-[#25282E] border border-[#343842] space-y-2 text-[#A0AAB2]">
                  <p className="text-[#E4E6EB] font-bold">iPhone / iPad Safari:</p>
                  <ol className="list-decimal list-inside space-y-1 font-mono text-[11px]">
                    <li>Tap the <strong>Share icon</strong> (square with up arrow) at bottom of screen.</li>
                    <li>Scroll down and tap <span className="text-[#D49A6A]">Add to Home Screen</span>.</li>
                    <li>Tap <strong>Add</strong> in top-right corner.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
