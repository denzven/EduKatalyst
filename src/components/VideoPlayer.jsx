import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ChevronDown,
  ChevronUp,
  Tag,
  Folder,
  RotateCcw,
  RotateCw,
  Gauge,
  Tv2
} from 'lucide-react';

import assetDeliveryService from '../services/assets/AssetDeliveryService';

import contentService from '../services/contentService';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

class CustomFragmentLoader {
  constructor(config) {
    this.stats = { trequest: performance.now(), retry: 0 };
  }
  destroy() {}
  abort() {}
  load(context, config, callbacks) {
    const rawUrl = context.url;
    if (rawUrl.startsWith('blob:')) {
      fetch(rawUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          const now = performance.now();
          callbacks.onSuccess(
            { url: rawUrl, data: buf },
            { trequest: this.stats.trequest, tfirst: now, tload: now, loaded: buf.byteLength, total: buf.byteLength },
            context
          );
        })
        .catch((err) => callbacks.onError({ code: 404, text: err.message }, context));
      return;
    }

    let assetPath = rawUrl;
    let fileId = null;

    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      fileId = parsed.searchParams.get('fileId');
      assetPath = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    } catch {}

    contentService.getAssetBlob(assetPath, 'video/mp2t', fileId)
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const now = performance.now();
        callbacks.onSuccess(
          { url: context.url, data: arrayBuffer },
          { trequest: this.stats.trequest, tfirst: now, tload: now, loaded: arrayBuffer.byteLength, total: arrayBuffer.byteLength },
          context
        );
      })
      .catch((err) => {
        console.error('[VideoPlayer] On-demand segment load error:', err);
        callbacks.onError({ code: 404, text: err.message }, context);
      });
  }
}

export default function VideoPlayer({ session }) {
  const videoRef = useRef(null);
  const rawVideoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [feedbackText, setFeedbackText] = useState(null);

  // Developer Accordion State
  const [showDevSandbox, setShowDevSandbox] = useState(false);
  const [rawSegmentUrl, setRawSegmentUrl] = useState(null);
  const [rawErrorMsg, setRawErrorMsg] = useState(null);

  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!session || !videoRef.current) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isSubscribed = true;

    async function loadSource() {
      try {
        const { playlistBlobUrl, firstSegmentUrl, cleanup } = await assetDeliveryService.getPlaybackSource(session);
        if (!isSubscribed) {
          cleanup();
          return;
        }

        cleanupRef.current = cleanup;
        if (firstSegmentUrl) {
          setRawSegmentUrl(firstSegmentUrl);
        }

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: false,
            fLoader: CustomFragmentLoader,
          });
          hlsRef.current = hls;

          hls.loadSource(playlistBlobUrl);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration || 0);
              videoRef.current.playbackRate = playbackSpeed;
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = playlistBlobUrl;
        }
      } catch (err) {
        console.error('[VideoPlayer] Player setup error:', err);
      }
    }

    loadSource();

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [session]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, currentTime, volume, isMuted]);

  const triggerFeedback = (text) => {
    setFeedbackText(text);
    setTimeout(() => {
      setFeedbackText((prev) => (prev === text ? null : prev));
    }, 800);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        triggerFeedback('Paused');
      } else {
        videoRef.current.play();
        triggerFeedback('Play');
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleSkip = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration || Infinity, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      triggerFeedback(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    }
  };

  const handleSpeedSelect = (rate) => {
    setPlaybackSpeed(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
    triggerFeedback(`${rate}x Speed`);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
      triggerFeedback(`Volume ${Math.round(newVol * 100)}%`);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        const restoredVol = volume > 0 ? volume : 0.8;
        videoRef.current.volume = restoredVol;
        setVolume(restoredVol);
        setIsMuted(false);
        triggerFeedback(`Volume ${Math.round(restoredVol * 100)}%`);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
        triggerFeedback('Muted');
      }
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRawVideoPlay = () => {
    if (rawVideoRef.current) {
      setRawErrorMsg(null);
      rawVideoRef.current.play().catch(err => {
        setRawErrorMsg(`Playback Error: ${err.message || 'Media source error (Encrypted TS)'}`);
      });
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto select-none transition-colors duration-300">
      
      {/* Title & Category Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] text-[var(--accent-coral)] border border-[var(--border-color)] flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            <span>{session.category || 'General'}</span>
          </span>
          <h2 className="text-lg font-bold font-serif text-[var(--text-primary)] truncate max-w-lg">
            {session.title}
          </h2>
        </div>
      </div>

      {/* Main Video Container */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        className="relative aspect-video bg-[var(--bg-ground)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl group transition-colors duration-300"
      >
        <video
          ref={videoRef}
          poster={session.thumbnailUrl || session.posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* On-Screen Action Feedback Overlay */}
        {feedbackText && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="px-5 py-2.5 rounded-2xl bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--accent-coral)]/40 text-[var(--text-primary)] text-sm font-bold font-mono shadow-2xl animate-fade-in">
              {feedbackText}
            </div>
          </div>
        )}

        {/* Big Center Play Overlay Button */}
        {!isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="p-4 rounded-full bg-[var(--accent-coral)] text-[#1D1214] shadow-xl hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className={`absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-[var(--bg-ground)]/95 via-[var(--bg-ground)]/75 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          
          {/* Progress Seek Bar */}
          <div className="relative mb-3 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-coral)] hover:h-2.5 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            
            {/* Left Controls */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={togglePlay} 
                className="text-[var(--text-primary)] hover:text-[var(--accent-coral)] transition p-1"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={() => handleSkip(-10)}
                className="text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-lg transition relative group/skip flex items-center"
                title="Rewind 10 seconds (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4 text-[var(--accent-coral)]" />
                <span className="text-[10px] font-mono font-bold ml-1">10s</span>
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => handleSkip(10)}
                className="text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-lg transition relative group/skip flex items-center"
                title="Forward 10 seconds (Right Arrow)"
              >
                <span className="text-[10px] font-mono font-bold mr-1">10s</span>
                <RotateCw className="w-4 h-4 text-[var(--accent-coral)]" />
              </button>

              {/* Volume Controller */}
              <div className="flex items-center space-x-1.5">
                <button onClick={toggleMute} className="text-[var(--text-primary)] hover:text-[var(--accent-coral)] transition p-1" title={isMuted ? "Unmute Audio (M)" : "Mute Audio (M)"}>
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden sm:block w-16 h-1 bg-[var(--border-color)] rounded appearance-none cursor-pointer accent-[var(--accent-coral)]"
                />
              </div>

              {/* Time Display */}
              <div className="text-xs font-mono text-[var(--text-primary)]">
                <span>{formatTime(currentTime)}</span>
                <span className="text-[var(--text-muted)] mx-1">/</span>
                <span className="text-[var(--text-muted)]">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              
              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center space-x-1 text-xs font-mono font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] px-2.5 py-1 rounded-lg transition border border-[var(--border-color)]"
                  title="Playback Speed"
                >
                  <Gauge className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-28 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl p-1.5 z-40 font-mono text-xs space-y-0.5">
                    <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase font-bold border-b border-[var(--border-color)]">
                      Speed Rate
                    </div>
                    {SPEED_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedSelect(rate)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                          playbackSpeed === rate 
                            ? 'bg-[var(--accent-coral)] text-[#1D1214] font-bold' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <span>{rate === 1.0 ? 'Normal' : `${rate}x`}</span>
                        {playbackSpeed === rate && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button 
                onClick={togglePictureInPicture} 
                className="text-[var(--text-primary)] hover:text-[var(--accent-coral)] p-1 rounded hover:bg-[var(--bg-surface-hover)] transition hidden sm:block"
                title="Picture in Picture (Floating Window)"
              >
                <Tv2 className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen} 
                className="text-[var(--text-primary)] hover:text-[var(--accent-coral)] p-1 rounded hover:bg-[var(--bg-surface-hover)] transition"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Lesson Description & Tags Card */}
      {(session.description || (Array.isArray(session.tags) && session.tags.length > 0)) && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
          {session.description && (
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {session.description}
            </p>
          )}

          {Array.isArray(session.tags) && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {session.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded bg-[var(--bg-ground)] text-[var(--text-muted)] border border-[var(--border-color)] text-[11px] font-mono flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-[var(--accent-coral)]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
