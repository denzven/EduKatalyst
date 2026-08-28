import React, { useRef, useState } from 'react';
import { 
  Play, 
  Trash2, 
  HardDrive, 
  Calendar, 
  ShieldCheck, 
  Download, 
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { deleteVideoSession, clearAllSessions, saveVideoSession } from '../utils/storage';
import { exportSessionToZip, importSessionFromZip, exportMasterBundle } from '../utils/zipHelper';

export default function VideoLibrary({ sessions, onRefreshSessions, onSelectSession, onOpenCloudSync }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const zipInputRef = useRef(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this encrypted video session from IndexedDB?')) {
      await deleteVideoSession(id);
      onRefreshSessions?.();
    }
  };

  const handleExportZip = async (session, e) => {
    e.stopPropagation();
    try {
      await exportSessionToZip(session);
    } catch (err) {
      alert(`Export zip failed: ${err.message}`);
    }
  };

  const handleMasterExport = async () => {
    if (sessions.length === 0) {
      alert('No video sessions to export. Encrypt a lecture first.');
      return;
    }

    setIsExportingMaster(true);
    try {
      await exportMasterBundle(sessions);
      setImportStatus({ 
        success: true, 
        message: `Exported Master Archive (${sessions.length} sessions) with setup.bat & restore.py scripts!` 
      });
    } catch (err) {
      alert(`Master Export failed: ${err.message}`);
    } finally {
      setIsExportingMaster(false);
    }
  };

  const handleImportZipSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const res = await importSessionFromZip(file);
      if (res && res.isMasterBundle) {
        setImportStatus({ 
          success: true, 
          message: `Master Archive Restored! Loaded ${res.importedCount} session(s) into IndexedDB.` 
        });
      } else {
        await saveVideoSession(res);
        setImportStatus({ 
          success: true, 
          message: `Successfully imported "${res.title}" (${res.segmentCount} chunks)` 
        });
      }
      onRefreshSessions?.();
    } catch (err) {
      setImportStatus({ success: false, message: `Import failed: ${err.message}` });
    } finally {
      setIsImporting(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all stored encrypted videos from IndexedDB?')) {
      await clearAllSessions();
      onRefreshSessions?.();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto transition-colors duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-base font-bold font-serif text-[var(--text-primary)] flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[var(--accent-coral)]" />
            Encrypted Storage Manager
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {sessions.length} session(s) stored • Automated setup scripts included in Master Archive
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {sessions.length > 0 && (
            <button
              onClick={handleMasterExport}
              disabled={isExportingMaster}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] text-xs font-bold shadow-md transition shrink-0"
              title="Download Master Archive with setup.bat & restore.py automated scripts"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingMaster ? 'Building Archive...' : 'Master Download Archive'}</span>
            </button>
          )}

          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition shrink-0"
            >
              <Cloud className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
              <span>Cloud Sync</span>
            </button>
          )}

          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            onChange={handleImportZipSelect}
            className="hidden"
          />
          <button
            onClick={() => zipInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition shrink-0"
          >
            <FileArchive className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            <span>Import Zip</span>
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          importStatus.success
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="katalyst-card p-12 rounded-2xl text-center border border-[var(--border-color)] max-w-xl mx-auto my-8 space-y-3">
          <div className="w-12 h-12 bg-[var(--bg-ground)] rounded-full flex items-center justify-center text-[var(--text-muted)] mx-auto border border-[var(--border-color)]">
            <HardDrive className="w-6 h-6 text-[var(--accent-coral)]" />
          </div>
          <h3 className="text-base font-bold font-serif text-[var(--text-primary)]">No Encrypted Storage Found</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Encrypt a lecture or click "Import Zip" to load static video bundles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="katalyst-card katalyst-card-hover p-5 rounded-2xl border border-[var(--border-color)] cursor-pointer space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-3 bg-[var(--accent-coral)]/15 rounded-xl text-[var(--accent-coral)] border border-[var(--accent-coral)]/30 shrink-0 group-hover:bg-[var(--accent-coral)] group-hover:text-[#1D1214] transition">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold font-serif text-[var(--text-primary)] truncate">
                      {session.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                      <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => handleExportZip(session, e)}
                    className="p-2 text-[var(--accent-peach)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-ground)] rounded-lg transition"
                    title="Download Static HLS Zip Package for GitHub Pages"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-[var(--bg-ground)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">AES Key</span>
                  <span className="text-emerald-400 font-bold truncate block" title={session.keyHex}>
                    {session.keyHex?.substring(0, 12)}...
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--bg-ground)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">Segments</span>
                  <span className="text-[var(--text-primary)] font-bold">{session.segmentCount} chunks</span>
                </div>
                <div className="p-2 rounded bg-[var(--bg-ground)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">Size</span>
                  <span className="text-[var(--text-primary)] font-bold">
                    {(session.totalSizeBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--bg-ground)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">Protection</span>
                  <span className="text-[var(--accent-peach)] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--accent-coral)]" />
                    AES-128 HLS
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--accent-coral)] group-hover:translate-x-1 transition-transform font-medium">
                  Load Lecture →
                </span>
                <span className="text-[10px] text-[var(--accent-peach)] font-mono flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Download Zip
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
