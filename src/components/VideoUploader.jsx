import React, { useState, useRef, useMemo } from 'react';
import { 
  FileVideo, 
  Upload, 
  Key, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Sparkles, 
  RefreshCw,
  Download,
  FileArchive,
  Tag,
  Folder,
  AlignLeft,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { encryptAndChunkVideo, validateVideoFile } from '../utils/ffmpegHelper';
import { saveVideoSession } from '../utils/storage';
import { exportSessionToZip, importSessionFromZip } from '../utils/zipHelper';
import { aggregateAllSubjects, registerSubject } from '../utils/taxonomyController';

export default function VideoUploader({ onSessionCreated, onSelectSessionForPlayer }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [tagsInput, setTagsInput] = useState('test, placeholder, demo');
  const [description, setDescription] = useState('Sample generic video lecture placeholder.');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [currentStepText, setCurrentStepText] = useState('');
  const [resultSession, setResultSession] = useState(null);
  const [error, setError] = useState(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const logTerminalRef = useRef(null);

  // Dynamically aggregate subjects from central controller
  const dynamicSubjects = useMemo(() => {
    return aggregateAllSubjects();
  }, []);

  const appendLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setCurrentStepText(msg);
    setTimeout(() => {
      if (logTerminalRef.current) {
        logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResultSession(null);
      setLogs([]);
      setProgress(0);
    }
  };

  const handleZipImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setLogs([]);
    appendLog(`Importing HLS Zip: ${file.name}...`);

    try {
      const sessionRecord = await importSessionFromZip(file);
      await saveVideoSession(sessionRecord);

      appendLog(`Imported "${sessionRecord.title}" [Subject: ${sessionRecord.category}]`);
      setResultSession(sessionRecord);
      onSessionCreated?.(sessionRecord);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleExportResultZip = async () => {
    if (!resultSession) return;
    setIsExportingZip(true);
    try {
      await exportSessionToZip(resultSession);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleGenerateSampleVideo = async () => {
    setIsGeneratingDemo(true);
    setError(null);
    setLogs([]);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
        ? 'video/mp4' 
        : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      const recordingPromise = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const file = new File([blob], 'sample_test_video.mp4', { type: mimeType });
          resolve(file);
        };
      });

      mediaRecorder.start();

      let frame = 0;
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        frame++;

        ctx.fillStyle = '#221619';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2 + Math.cos(elapsed * 2) * 100;
        const cy = canvas.height / 2 + Math.sin(elapsed * 2) * 50;
        
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.fillStyle = '#E26D5C';
        ctx.shadowColor = '#FFE09E';
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#F6EDE4';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Sample Test Encrypted Video', 165, 160);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#FFE09E';
        ctx.fillText(`Timestamp: ${elapsed.toFixed(2)}s | Frame: ${frame}`, 165, 200);

        if (elapsed >= 5) {
          clearInterval(interval);
          mediaRecorder.stop();
        }
      }, 1000 / 30);

      const generatedFile = await recordingPromise;
      setSelectedFile(generatedFile);
    } catch (err) {
      setError(`Sample creation failed: ${err.message}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const extractFrameThumbnail = (file) => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;

        const cleanup = () => {
          try { URL.revokeObjectURL(url); } catch (e) {}
        };

        video.onloadeddata = () => {
          video.currentTime = Math.min(1.0, (video.duration || 4) / 4);
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            cleanup();
            resolve(dataUrl);
          } catch (e) {
            cleanup();
            resolve(null);
          }
        };

        video.onerror = () => {
          cleanup();
          resolve(null);
        };

        setTimeout(() => {
          cleanup();
          resolve(null);
        }, 3000);
      } catch (err) {
        resolve(null);
      }
    });
  };

  const handleStartProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResultSession(null);
    setLogs([]);
    setProgress(5);

    try {
      let activeCategory = category;
      if (isAddingCustomCategory && customCategory.trim()) {
        activeCategory = registerSubject(customCategory);
      }

      appendLog(`File: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      let finalThumbnail = customThumbnailUrl;
      if (!finalThumbnail) {
        appendLog('Generating video banner thumbnail frame...');
        finalThumbnail = await extractFrameThumbnail(selectedFile);
      }

      const result = await encryptAndChunkVideo({
        file: selectedFile,
        keyDeliveryUrl: 'https://mock-worker.local/get-key?vid=demo',
        onLog: appendLog,
        onProgress: (pct) => setProgress(pct)
      });

      const sessionRecord = await saveVideoSession({
        id: `session_${Date.now()}`,
        title: selectedFile.name,
        category: activeCategory,
        tags: parsedTags,
        description: description,
        thumbnailUrl: finalThumbnail,
        keyHex: result.keyHex,
        keyBlob: result.keyBlob,
        keyUri: result.keyUri,
        playlistText: result.playlistText,
        segments: result.segments,
        totalSizeBytes: result.totalSizeBytes
      });

      appendLog(`Saved session ID: ${sessionRecord.id} [Subject: ${activeCategory}]`);
      setResultSession(sessionRecord);
      onSessionCreated?.(sessionRecord);

    } catch (err) {
      console.error(err);
      setError(`Pipeline error: ${err.message || err}`);
      appendLog(`ERROR: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto transition-colors duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--accent-coral)]" />
            Upload Video
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Upload and process video lectures for streaming playback
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            onChange={handleZipImport}
            className="hidden"
          />
          <button
            onClick={() => zipInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
          >
            <FileArchive className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
            <span>Import Zip</span>
          </button>

          <button
            onClick={handleGenerateSampleVideo}
            disabled={isProcessing || isGeneratingDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] text-xs font-bold transition disabled:opacity-50"
          >
            {isGeneratingDemo ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Sample Video</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-4">
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              selectedFile 
                ? 'border-[var(--accent-coral)] bg-[var(--accent-coral)]/10' 
                : 'border-[var(--border-color)] hover:border-[var(--accent-coral)]/60 bg-[var(--bg-ground)]'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center">
              <div className="p-3 bg-[var(--bg-surface)] rounded-full text-[var(--accent-coral)] mb-2 border border-[var(--border-color)]">
                <FileVideo className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-xs font-heading">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-[var(--accent-peach)] font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Select or drop video file
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    MP4, MOV, WebM, MKV, AVI
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)]">
                  <Folder className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                  <span>Category</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="text-[11px] text-[var(--accent-peach)] hover:underline font-mono flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingCustomCategory ? 'Select Existing' : 'New Category'}</span>
                </button>
              </div>

              {!isAddingCustomCategory ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
                >
                  {dynamicSubjects.map((subj) => (
                    <option key={subj.name} value={subj.name}>
                      {subj.name} ({subj.count})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter new category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
                />
              )}
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)] mb-1">
                <Tag className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
                <span>Tags (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Comma separated tags..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] font-mono transition"
              />
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)] mb-1">
                <AlignLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Description (Optional)</span>
              </label>
              <textarea
                rows="2"
                placeholder="Video description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleStartProcess}
            disabled={!selectedFile || isProcessing}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md ${
              !selectedFile || isProcessing
                ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--accent-coral)] text-[#1D1214] hover:opacity-90'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#1D1214]" />
                <span>Processing... ({progress}%)</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Process Video</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Upload Progress Monitor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col h-[380px] shadow-lg">
            
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[var(--accent-coral)]" />
                <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                  Upload Progress
                </span>
              </div>
            </div>

            {isProcessing && (
              <div className="mb-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
                  <span className="truncate">{currentStepText || 'Processing...'}</span>
                  <span className="text-[var(--accent-peach)] font-bold ml-2">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div 
                    className="h-full bg-[var(--accent-coral)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div 
              ref={logTerminalRef}
              className="flex-1 bg-[var(--code-bg)] rounded-xl p-3 font-mono text-[11px] text-[var(--text-primary)] overflow-y-auto space-y-1 border border-[var(--border-color)]"
            >
              {logs.length === 0 ? (
                <div className="text-[var(--text-muted)] italic py-12 text-center">
                  Logs will display here during encryption...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-relaxed whitespace-pre-wrap">
                    <span className="text-[var(--accent-coral)]">{log.slice(0, 10)}</span>
                    <span className="text-[var(--text-primary)]">{log.slice(10)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Success Banner */}
          {resultSession && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block font-heading">
                    Video Encrypted Successfully ({resultSession.segmentCount} chunks)
                  </span>
                  <span className="text-[11px] text-[var(--accent-peach)] font-mono">
                    Subject: {resultSession.category} | Tags: {resultSession.tags?.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleExportResultZip}
                  disabled={isExportingZip}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--accent-peach)] font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Zip</span>
                </button>

                <button
                  onClick={() => onSelectSessionForPlayer?.(resultSession.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--accent-coral)] text-[#1D1214] font-bold transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
