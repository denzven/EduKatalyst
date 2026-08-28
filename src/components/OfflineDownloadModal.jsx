import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  Database
} from 'lucide-react';
import { exportMasterBundle } from '../utils/zipHelper';
import { subscribeToOnlineStatus, isOnline } from '../utils/pwaHelper';

export default function OfflineDownloadModal({ isOpen, onClose, sessions = [], onRefreshSessions }) {
  const [online, setOnline] = useState(isOnline());
  const [isExporting, setIsExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [swCacheInfo, setSwCacheInfo] = useState({ sizeMB: '0.00', cachedItems: 0 });

  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus((status) => {
      setOnline(status);
    });
    inspectStorageCache();
    return unsubscribe;
  }, [sessions]);

  const inspectStorageCache = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        let totalItems = 0;
        for (const key of cacheKeys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          totalItems += requests.length;
        }
        setSwCacheInfo({ sizeMB: 'Cached', cachedItems: totalItems });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleDownloadFullOfflineBundle = async () => {
    if (sessions.length === 0) {
      setStatusMsg({ error: true, text: 'No video sessions stored locally. Encrypt or import a lecture first.' });
      return;
    }

    setIsExporting(true);
    setStatusMsg({ error: false, text: `Packaging ${sessions.length} lecture session(s) into offline archive...` });

    try {
      await exportMasterBundle(sessions);
      setStatusMsg({ error: false, text: 'Offline master bundle downloaded successfully!' });
    } catch (err) {
      setStatusMsg({ error: true, text: `Offline bundle export failed: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Clear Service Worker offline cache assets? Local IndexedDB videos will be preserved.')) {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
          await inspectStorageCache();
          setStatusMsg({ error: false, text: 'Service worker cache cleared successfully.' });
        }
      } catch (err) {
        setStatusMsg({ error: true, text: err.message });
      }
    }
  };

  const totalBytes = sessions.reduce((acc, s) => acc + (s.totalSizeBytes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1A1C20] border border-[#343842] rounded-3xl shadow-2xl overflow-hidden my-8 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#25282E]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#C8795A]/15 text-[#C8795A] border border-[#C8795A]/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#E4E6EB]">
                Offline Download & Storage Center
              </h3>
              <p className="text-[11px] text-[#A0AAB2]">
                Manage offline cached lectures, service worker assets, and network connectivity
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
          
          {/* Network Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            online ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
          }`}>
            <div className="flex items-center space-x-3">
              {online ? (
                <Wifi className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
              )}
              <div>
                <strong className="text-sm font-bold block">
                  {online ? 'Online Network Connection Active' : 'Offline Mode Active'}
                </strong>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {online 
                    ? 'Connected to web services. Changes can be synced to cloud.' 
                    : 'No internet connection. Running 100% offline from local cache & IndexedDB.'}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 ${
              online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              statusMsg.error ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
              <button onClick={() => setStatusMsg(null)} className="text-[#A0AAB2] hover:text-white">✕</button>
            </div>
          )}

          {/* Storage Usage Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842]">
              <span className="text-[#A0AAB2] block text-[10px]">Stored Lectures</span>
              <span className="text-[#E4E6EB] text-sm font-bold">{sessions.length} Sessions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842]">
              <span className="text-[#A0AAB2] block text-[10px]">Total Encrypted Data</span>
              <span className="text-[#D49A6A] text-sm font-bold">
                {(totalBytes / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#25282E] border border-[#343842]">
              <span className="text-[#A0AAB2] block text-[10px]">Service Worker Cache</span>
              <span className="text-emerald-400 text-sm font-bold">{swCacheInfo.cachedItems} Assets</span>
            </div>
          </div>

          {/* Download Offline Package Card */}
          <div className="p-5 rounded-2xl bg-[#25282E] border border-[#343842] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#E4E6EB] text-sm font-serif">
                  Download Full Master Package for Offline Setup
                </h4>
                <p className="text-[#A0AAB2] text-[11px] mt-0.5">
                  Bundles all encrypted HLS lectures, AES-128 keys, and setup.bat scripts into a single zip file.
                </p>
              </div>

              <button
                onClick={handleDownloadFullOfflineBundle}
                disabled={isExporting || sessions.length === 0}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C8795A] to-[#D49A6A] hover:opacity-95 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition shrink-0 disabled:opacity-40"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isExporting ? 'Packaging...' : 'Download Zip'}</span>
              </button>
            </div>
          </div>

          {/* Service Worker Controls */}
          <div className="flex items-center justify-between border-t border-[#343842] pt-4">
            <div className="flex items-center space-x-2 text-[#A0AAB2] text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#C8795A]" />
              <span>PWA Workbox Offline Service Worker Active</span>
            </div>

            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center space-x-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear SW Cache</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
