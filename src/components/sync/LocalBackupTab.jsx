import React, { useState } from 'react';
import { Package, Download, Upload, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { exportMasterStorageZip, importMasterStorageZip } from '../../utils/zipHelper';

export function LocalBackupTab({ onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const handleExportZip = async () => {
    setIsExporting(true);
    setError(null);
    setStatusMessage('Bundling IndexedDB sessions into Master Zip package...');
    try {
      const zipBlob = await exportMasterStorageZip();
      const filename = `edukatalyst_local_backup_${new Date().toISOString().slice(0, 10)}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Zip archive exported successfully!');
    } catch (err) {
      console.error('[LocalBackupTab] Export error:', err);
      setError(err.message || 'Failed to export local Zip archive');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportZipFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setStatusMessage('Restoring sessions from Zip package...');

    try {
      await importMasterStorageZip(file);
      setStatusMessage('Local storage restored successfully!');
      if (onClose) onClose();
    } catch (err) {
      console.error('[LocalBackupTab] Import error:', err);
      setError(err.message || 'Failed to import Zip package');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-peach)]/15 text-[var(--accent-peach)] border border-[var(--accent-peach)]/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading text-[var(--text-primary)]">Local Zip Archive Bundles</h4>
            <p className="text-xs text-[var(--text-muted)]">
              Export full offline video sessions, notes, and quiz records into portable `.zip` archives.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <p className="text-xs text-[var(--accent-peach)] font-mono flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
            <span>{statusMessage}</span>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Zip Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-[var(--text-primary)]">Export Master Zip</h5>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Packages all IndexedDB sessions, playlists, and segment blobs into a downloadable `.zip`.
              </p>
            </div>
            <button
              onClick={handleExportZip}
              disabled={isExporting || isImporting}
              className="w-full py-2 bg-[var(--accent-peach)] text-[var(--bg-ground)] font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export Package</span>
            </button>
          </div>

          {/* Import Zip Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-[var(--text-primary)]">Restore Master Zip</h5>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Select a previously exported `.zip` backup to restore sessions into IndexedDB.
              </p>
            </div>
            <label className="w-full py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold text-xs rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-ground)] transition flex items-center justify-center space-x-1.5 cursor-pointer">
              {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Select Zip File</span>
              <input
                type="file"
                accept=".zip"
                onChange={handleImportZipFile}
                disabled={isExporting || isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}
