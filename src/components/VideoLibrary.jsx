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
  Cloud,
  Eye,
  X
} from 'lucide-react';
import { deleteVideoSession, clearAllSessions, saveVideoSession } from '../utils/storage';
import { exportSessionToZip, importSessionFromZip, exportMasterBundle } from '../utils/zipHelper';
import VideoPlayer from './VideoPlayer';

export default function VideoLibrary({ 
  sessions, 
  onRefreshSessions, 
  onSelectSession, 
  onSelectSessionForPlayer,
  onOpenCloudSync 
}) {
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [activePreviewSession, setActivePreviewSession] = useState(null);
  const zipInputRef = useRef(null);

  const handleSelectSession = (id) => {
    const fn = onSelectSession || onSelectSessionForPlayer;
    fn?.(id);
  };

  const handlePlayPreview = (session, e) => {
    e.stopPropagation();
    setActivePreviewSession(session);
  };

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
            Video Library
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {sessions.length} video(s) stored
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {sessions.length > 0 && (
            <button
              onClick={handleMasterExport}
              disabled={isExportingMaster}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] text-xs font-bold shadow-md transition shrink-0"
              title="Download Master Zip Archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingMaster ? 'Exporting...' : 'Export All (Zip)'}</span>
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
              onClick={() => handleSelectSession(session.id)}
              className="katalyst-card katalyst-card-hover rounded-2xl border border-[var(--border-color)] cursor-pointer overflow-hidden group flex flex-col justify-between"
            >
              {session.thumbnailUrl && (
                <div className="relative aspect-video w-full bg-[var(--bg-ground)] overflow-hidden border-b border-[var(--border-color)]">
                  <img
                    src={session.thumbnailUrl}
                    alt={session.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-40 group-hover:opacity-20 transition-opacity" />
                  <button
                    type="button"
                    onClick={(e) => handlePlayPreview(session, e)}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </button>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    {!session.thumbnailUrl && (
                      <button
                        type="button"
                        onClick={(e) => handlePlayPreview(session, e)}
                        className="p-3 bg-[var(--accent-coral)]/15 rounded-xl text-[var(--accent-coral)] border border-[var(--accent-coral)]/30 shrink-0 hover:bg-[var(--accent-coral)] hover:text-[#1D1214] transition shadow-sm"
                        title="Play Video Preview in Studio"
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    )}
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
                    type="button"
                    onClick={(e) => handlePlayPreview(session, e)}
                    className="p-2 text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                    title="Quick Preview Video"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleExportZip(session, e)}
                    className="p-2 text-[var(--accent-peach)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-ground)] rounded-lg transition"
                    title="Download Static HLS Zip Package for GitHub Pages"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--accent-coral)] group-hover:translate-x-1 transition-transform font-bold flex items-center gap-1">
                  <span>Load Lecture in Student Portal</span>
                  <span>→</span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {(session.totalSizeBytes / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* In-Studio Video Preview Player Modal */}
      {activePreviewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden my-8 space-y-4 p-6">
            
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                    In-Studio Video Preview
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activePreviewSession.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePreviewSession(null)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-lg bg-black">
              <VideoPlayer session={activePreviewSession} />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {(activePreviewSession.totalSizeBytes / 1024 / 1024).toFixed(1)} MB • {activePreviewSession.segmentCount || 1} segment(s)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewSession(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
                >
                  Close Preview
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sid = activePreviewSession.id;
                    setActivePreviewSession(null);
                    handleSelectSession(sid);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] text-xs font-extrabold shadow-md hover:opacity-90 transition"
                >
                  Open in Student Portal →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
