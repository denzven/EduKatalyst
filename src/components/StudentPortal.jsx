import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  Search, 
  ArrowLeft, 
  ArrowRight,
  BookOpen,
  Tag,
  Folder,
  FileText,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  HardDrive,
  Share2,
  Check,
  Lock,
  ListTree,
  Copy,
  Star,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import VideoPlayer from './VideoPlayer';
import FolderExplorer from './FolderExplorer';
import { loadMarkdownNotes, loadMarkdownQuizzes, parseNoteSections } from '../utils/markdownParser';
import { decryptNoteData } from '../utils/contentEncryption';
import { initAntiCheatProtection } from '../utils/antiCheat';
import { aggregateAllSubjects, aggregateAllTags } from '../utils/taxonomyController';
import { navigateTo } from '../utils/router';

export default function StudentPortal({ 
  sessions, 
  onOpenDevStudio, 
  activePortalTab, 
  setActivePortalTab,
  routeParams = {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(routeParams.subject || 'All');
  const [selectedTag, setSelectedTag] = useState(routeParams.tag || 'All');
  const [sortOption, setSortOption] = useState('title_asc');
  const [activeSectionMap, setActiveSectionMap] = useState({});
  const [focusedModeMap, setFocusedModeMap] = useState({});
  const [copiedSectionMap, setCopiedSectionMap] = useState({});
  const [bookmarkedSections, setBookmarkedSections] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopySection = (secId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedSectionMap((prev) => ({ ...prev, [secId]: true }));
    setTimeout(() => {
      setCopiedSectionMap((prev) => ({ ...prev, [secId]: false }));
    }, 1500);
  };

  const handleToggleBookmarkSection = (secId) => {
    setBookmarkedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Sync state with incoming URL route parameters
  useEffect(() => {
    if (routeParams.subject) setSelectedSubject(routeParams.subject);
    if (routeParams.tag) setSelectedTag(routeParams.tag);
  }, [routeParams.subject, routeParams.tag]);

  // Anti-Cheat DevTools Overlay State
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Dynamically load markdown notes and quizzes
  const markdownNotes = useMemo(() => loadMarkdownNotes(), []);
  const markdownQuizzes = useMemo(() => loadMarkdownQuizzes(), []);

  // Accordion state for markdown notes (collapsed by default)
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    if (routeParams.id) {
      setExpandedNotes({ [routeParams.id]: true });
    } else {
      setExpandedNotes({});
    }
  }, [routeParams.id]);

  // Anti-Cheat Protection
  useEffect(() => {
    const cleanup = initAntiCheatProtection((detected) => {
      setIsDevToolsDetected(detected);
    });
    return cleanup;
  }, []);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});

  // Dynamic Taxonomy
  const subjectsWithCounts = useMemo(() => {
    return aggregateAllSubjects(sessions, markdownNotes, markdownQuizzes);
  }, [sessions, markdownNotes, markdownQuizzes]);

  const tagsWithCounts = useMemo(() => {
    return aggregateAllTags(sessions, markdownNotes, markdownQuizzes);
  }, [sessions, markdownNotes, markdownQuizzes]);

  // Handle Subject Selection with URL Hash sync
  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    navigateTo(activePortalTab, { subject, tag: selectedTag });
  };

  // Handle Tag Selection with URL Hash sync
  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    navigateTo(activePortalTab, { subject: selectedSubject, tag });
  };

  // Handle Copy Direct URL Link
  const handleCopyDirectLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Video Sessions Filtering
  const filteredSessions = useMemo(() => {
    const list = sessions.filter((s) => {
      const matchesSubject = selectedSubject === 'All' || s.category === selectedSubject;
      const matchesTag = selectedTag === 'All' || (s.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        s.title.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      if (sortOption === 'title_asc') return a.title.localeCompare(b.title);
      if (sortOption === 'date_desc') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortOption === 'chunks_desc') return (b.segmentCount || 0) - (a.segmentCount || 0);
      return 0;
    });
  }, [sessions, selectedSubject, selectedTag, searchQuery, sortOption]);

  // Markdown Notes Filtering
  const filteredMarkdownNotes = useMemo(() => {
    const list = markdownNotes.filter((n) => {
      const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (n.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      if (sortOption === 'title_asc') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [markdownNotes, selectedSubject, selectedTag, searchQuery, sortOption]);

  // Markdown Quizzes Filtering
  const filteredMarkdownQuizzes = useMemo(() => {
    return markdownQuizzes.filter((qItem) => {
      const matchesSubject = selectedSubject === 'All' || qItem.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (qItem.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        qItem.question.toLowerCase().includes(q) ||
        qItem.subject.toLowerCase().includes(q)
      );
    });
  }, [markdownQuizzes, selectedSubject, selectedTag, searchQuery]);

  // Quiz Metrics
  const quizScoreMetrics = useMemo(() => {
    let answeredCount = 0;
    let correctCount = 0;
    markdownQuizzes.forEach((q) => {
      const userAns = quizAnswers[q.id];
      if (userAns !== undefined) {
        answeredCount++;
        if (userAns === q.correctIndex) correctCount++;
      }
    });
    return { answeredCount, correctCount, total: markdownQuizzes.length };
  }, [markdownQuizzes, quizAnswers]);

  const toggleNoteAccordion = (id) => {
    setExpandedNotes((prev) => {
      const nextState = { ...prev, [id]: !prev[id] };
      if (nextState[id]) {
        navigateTo('notes', { id, subject: selectedSubject, tag: selectedTag });
      }
      return nextState;
    });
  };

  const handleQuizSelect = (quizId, optionIndex, correctIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [quizId]: optionIndex }));
    
    // Trigger celebratory confetti burst if correct!
    if (optionIndex === correctIndex) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#E26D5C', '#FFE1A8', '#C9CBA3']
      });
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
  };

  // Dedicated Player View
  if (selectedSession) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="space-y-4 max-w-5xl mx-auto"
      >
        <button
          onClick={() => setSelectedSession(null)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--accent-coral)]" />
          <span>Back to Directory</span>
        </button>

        <VideoPlayer session={selectedSession} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto relative select-none transition-colors duration-300">
      
      {/* DevTools Open Security Shield Overlay */}
      {isDevToolsDetected && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-ground)]/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">
            Anti-Cheat Speed Breaker Active
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md leading-relaxed">
            Developer tools inspection active. Close devtools to resume reading notes & taking assessment quizzes.
          </p>
          <button
            onClick={() => setIsDevToolsDetected(false)}
            className="px-4 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] text-xs font-bold hover:opacity-90 transition"
          >
            Resume Study
          </button>
        </div>
      )}

      {/* Primary Navigation & Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActivePortalTab('explorer', { subject: selectedSubject, tag: selectedTag })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activePortalTab === 'explorer'
                ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>File Explorer</span>
          </button>

          <button
            onClick={() => setActivePortalTab('lessons', { subject: selectedSubject, tag: selectedTag })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activePortalTab === 'lessons'
                ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lectures ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActivePortalTab('notes', { subject: selectedSubject, tag: selectedTag })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activePortalTab === 'notes'
                ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes ({markdownNotes.length})</span>
          </button>

          <button
            onClick={() => setActivePortalTab('quizzes', { subject: selectedSubject, tag: selectedTag })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activePortalTab === 'quizzes'
                ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Quizzes ({markdownQuizzes.length})</span>
          </button>
        </div>

        {/* Global Search Input & Share Link */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lessons, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
            />
          </div>

          <button
            onClick={() => handleCopyDirectLink()}
            className="p-2 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0"
            title="Copy Direct URL Link to clipboard"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[var(--accent-peach)]" />}
          </button>
        </div>

      </div>

      {/* Tab Switch View Transitions using AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePortalTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* TAB 0: MASTER OS FILE EXPLORER */}
          {activePortalTab === 'explorer' && (
            <div className="space-y-6">
              <FolderExplorer
                subjects={subjectsWithCounts}
                tagsWithCounts={tagsWithCounts}
                selectedSubject={selectedSubject}
                onSelectSubject={handleSelectSubject}
                selectedTag={selectedTag}
                onSelectTag={handleSelectTag}
                sortOption={sortOption}
                onSortChange={setSortOption}
              />

              {/* Focused Folder Content Overview */}
              <div className="space-y-4 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[var(--accent-coral)]" />
                    {selectedSubject === 'All' ? 'All Course Resources' : `Directory: ${selectedSubject}`}
                  </h3>
                  <span className="text-xs font-mono text-[var(--accent-peach)]">
                    {filteredSessions.length} Videos • {filteredMarkdownNotes.length} Notes • {filteredMarkdownQuizzes.length} Quizzes
                  </span>
                </div>

                {/* Folder Resources Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Video Lecture Cards */}
                  {filteredSessions.map((session) => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="katalyst-card katalyst-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {session.title}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                            {session.category}
                          </span>
                        </div>

                        {session.description && (
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="px-4 py-2.5 bg-[var(--bg-ground)] border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--accent-coral)] font-semibold flex items-center gap-1">
                          <span>Play Video</span>
                          <ArrowRight className="w-3 h-3 text-[var(--accent-coral)]" />
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Markdown Notes Cards */}
                  {filteredMarkdownNotes.map((note) => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={note.id}
                      onClick={() => { setActivePortalTab('notes', { id: note.id, subject: selectedSubject }); }}
                      className="katalyst-card katalyst-card-hover p-4 rounded-2xl cursor-pointer flex flex-col justify-between group space-y-2"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent-peach)] transition truncate">
                            {note.title}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                            {note.subject}
                          </span>
                        </div>

                        {note.summary && (
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {note.summary}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--accent-coral)] font-semibold flex items-center gap-1">
                          <span>Open Note</span>
                          <ArrowRight className="w-3 h-3 text-[var(--accent-coral)]" />
                        </span>
                      </div>
                    </motion.div>
                  ))}

                </div>
              </div>
            </div>
          )}

          {/* TAB 1: LECTURES */}
          {activePortalTab === 'lessons' && (
            <div>
              {filteredSessions.length === 0 ? (
                <div className="katalyst-card p-10 rounded-2xl text-center border border-[var(--border-color)] max-w-sm mx-auto my-8 space-y-2">
                  <div className="w-10 h-10 bg-[var(--bg-ground)] rounded-full flex items-center justify-center text-[var(--accent-coral)] mx-auto border border-[var(--border-color)]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">No Lectures Found</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    No video lectures matching your current filter.
                  </p>
                  <button
                    onClick={onOpenDevStudio}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] text-xs font-bold transition mt-1"
                  >
                    Open Creator Studio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((session) => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="katalyst-card katalyst-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="relative aspect-video bg-[var(--bg-ground)] flex items-center justify-center border-b border-[var(--border-color)] overflow-hidden group">
                          {session.thumbnailUrl ? (
                            <img
                              src={session.thumbnailUrl}
                              alt={session.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-ground)] to-[var(--bg-surface)] flex items-center justify-center opacity-80" />
                          )}

                          <div className="absolute inset-0 bg-black/30 opacity-60 group-hover:opacity-40 transition-opacity" />

                          <div className="relative z-10 w-11 h-11 rounded-full bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>

                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1 shadow-sm">
                            <Folder className="w-2.5 h-2.5 text-[var(--accent-coral)]" />
                            <span>{session.category || 'General'}</span>
                          </div>

                          {session.totalSizeBytes && (
                            <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/90 shadow-sm">
                              {(session.totalSizeBytes / 1024 / 1024).toFixed(1)} MB
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent-peach)] transition truncate">
                            {session.title}
                          </h3>

                          {session.description && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                              {session.description}
                            </p>
                          )}

                          {Array.isArray(session.tags) && session.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {session.tags.map((tag) => (
                                <span
                                  key={tag}
                                  onClick={(e) => { e.stopPropagation(); handleSelectTag(tag); }}
                                  className="px-2 py-0.5 rounded bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--accent-coral)] border border-[var(--border-color)] text-[10px] font-mono flex items-center gap-0.5"
                                >
                                  <Tag className="w-2.5 h-2.5 text-[var(--accent-coral)]" />
                                  <span>#{tag}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-[var(--bg-ground)] border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                        <span className="text-[var(--accent-coral)] font-semibold group-hover:text-[var(--accent-peach)] transition">
                          Watch Lecture →
                        </span>
                      </div>

                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MARKDOWN NOTES APPLET */}
          {activePortalTab === 'notes' && (
            <div className="space-y-4">
              {filteredMarkdownNotes.map((note) => {
                const isExpanded = !!expandedNotes[note.id];
                const noteSections = (note.sections && note.sections.length > 0)
                  ? note.sections
                  : parseNoteSections(note.rawBody || '');

                return (
                  <div
                    key={note.id}
                    className="katalyst-card rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm transition-all"
                  >
                    <div
                      onClick={() => toggleNoteAccordion(note.id)}
                      className="p-4 cursor-pointer flex items-start justify-between gap-3 hover:bg-[var(--bg-surface-hover)] transition"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                            {note.subject}
                          </span>

                          {noteSections.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-ground)] text-[var(--text-muted)] border border-[var(--border-color)]">
                              {noteSections.length} section(s)
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold font-heading text-[var(--text-primary)]">
                          {note.title}
                        </h4>

                        {note.summary && (
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {note.summary}
                          </p>
                        )}

                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {note.tags.map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => { e.stopPropagation(); handleSelectTag(tag); }}
                                className="px-2 py-0.5 rounded bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--accent-coral)] border border-[var(--border-color)] text-[10px] font-mono flex items-center gap-0.5"
                              >
                                <Tag className="w-2.5 h-2.5 text-[var(--accent-coral)]" />
                                <span>#{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button className="p-1.5 rounded-xl bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 border border-[var(--border-color)]">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--accent-coral)]" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-ground)] space-y-4"
                      >
                        {note.formula && (
                          <div className="p-3.5 rounded-xl bg-[var(--code-bg)] border border-[var(--border-color)] font-mono text-xs text-[var(--accent-peach)] formula-scroll-container shadow-inner">
                            <span className="text-[10px] font-sans font-bold text-[var(--text-muted)] block mb-1 uppercase tracking-wider">Core Formula / Equation:</span>
                            <code>{note.formula}</code>
                          </div>
                        )}

                        {/* Section Navigation Rail & Content */}
                        {noteSections.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Table of Contents Sticky Side Navigation */}
                            <div className="lg:col-span-4 space-y-3 border-r border-[var(--border-color)]/60 pr-4">
                              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                                <div className="text-[11px] font-mono font-bold text-[var(--accent-coral)] uppercase tracking-wider flex items-center gap-1.5">
                                  <ListTree className="w-3.5 h-3.5" />
                                  <span>Table of Contents</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setFocusedModeMap((prev) => ({ ...prev, [note.id]: !prev[note.id] }))}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition flex items-center gap-1 ${
                                    focusedModeMap[note.id]
                                      ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] border-[var(--accent-coral)]'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                                  }`}
                                  title="Toggle Focus Mode (show selected section only)"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{focusedModeMap[note.id] ? 'Focus Active' : 'Focus Mode'}</span>
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                                {noteSections.map((sec, idx) => {
                                  const secDomId = `${note.id}_sec_${idx}`;
                                  const isActive = activeSectionMap[note.id] === secDomId || (!activeSectionMap[note.id] && idx === 0);
                                  const isBookmarked = !!bookmarkedSections[secDomId];

                                  return (
                                    <button
                                      type="button"
                                      key={secDomId}
                                      onClick={() => {
                                        setActiveSectionMap((prev) => ({ ...prev, [note.id]: secDomId }));
                                        const el = document.getElementById(secDomId);
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }}
                                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                                        isActive
                                          ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold border-[var(--accent-coral)] shadow-md'
                                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-color)] text-[var(--text-primary)]'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          isActive ? 'bg-black/20 text-white' : 'text-[var(--accent-coral)] bg-[var(--bg-ground)] border border-[var(--border-color)]'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        <span className="truncate">{sec.title}</span>
                                      </div>

                                      {isBookmarked && (
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 ml-1" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {activeSectionMap[note.id] && (
                                <button
                                  type="button"
                                  onClick={() => setActiveSectionMap((prev) => ({ ...prev, [note.id]: null }))}
                                  className="w-full text-center py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                                >
                                  Clear Selection
                                </button>
                              )}
                            </div>

                            {/* Section Cards List */}
                            <div className="lg:col-span-8 space-y-4">
                              {noteSections
                                .filter((sec, idx) => {
                                  const secDomId = `${note.id}_sec_${idx}`;
                                  if (!focusedModeMap[note.id]) return true;
                                  const activeId = activeSectionMap[note.id] || `${note.id}_sec_0`;
                                  return secDomId === activeId;
                                })
                                .map((sec, idx) => {
                                  const originalIdx = noteSections.findIndex(s => s.id === sec.id);
                                  const secDomId = `${note.id}_sec_${originalIdx !== -1 ? originalIdx : idx}`;
                                  const isActive = (activeSectionMap[note.id] === secDomId) || (!activeSectionMap[note.id] && idx === 0);
                                  const isCopied = !!copiedSectionMap[secDomId];
                                  const isBookmarked = !!bookmarkedSections[secDomId];

                                  return (
                                    <div
                                      id={secDomId}
                                      key={secDomId}
                                      className={`p-4 rounded-2xl bg-[var(--bg-surface)] border space-y-3 shadow-sm transition-all ${
                                        isActive
                                          ? 'border-[var(--accent-coral)] ring-2 ring-[var(--accent-coral)]/30 bg-[var(--bg-surface)]'
                                          : 'border-[var(--border-color)]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                                        <h5 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[var(--accent-coral)] animate-pulse' : 'bg-[var(--text-muted)]'}`}></span>
                                          <span>{sec.title}</span>
                                        </h5>

                                        <div className="flex items-center space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleBookmarkSection(secDomId)}
                                            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                                              isBookmarked
                                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                                : 'bg-[var(--bg-ground)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                            }`}
                                            title="Bookmark section"
                                          >
                                            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleCopySection(secDomId, sec.rawContent || sec.title)}
                                            className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                                              isCopied
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-color)]'
                                            }`}
                                            title="Copy section markdown"
                                          >
                                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                          </button>
                                        </div>
                                      </div>

                                      <div 
                                        className="markdown-body space-y-2 text-xs text-[var(--text-primary)] leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                                      />
                                    </div>
                                  );
                                })}
                            </div>

                          </div>
                        ) : (
                          <div 
                            className="markdown-body space-y-2 text-xs text-[var(--text-primary)] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: note.bodyHtml }}
                          />
                        )}

                      </motion.div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: QUIZZES */}
          {activePortalTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[var(--accent-coral)]" />
                  Assessment Progress ({quizScoreMetrics.answeredCount} / {filteredMarkdownQuizzes.length} Answered)
                </span>

                <div className="flex items-center space-x-2">
                  <div className="text-xs font-mono text-[var(--accent-peach)] bg-[var(--bg-ground)] px-2.5 py-1 rounded-xl border border-[var(--border-color)] font-bold">
                    Score: {quizScoreMetrics.correctCount} / {quizScoreMetrics.total}
                  </div>

                  <button
                    onClick={handleResetQuiz}
                    className="p-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                    title="Reset Score"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredMarkdownQuizzes.map((quiz, qIdx) => {
                  const selectedOpt = quizAnswers[quiz.id];
                  const isAnswered = selectedOpt !== undefined;
                  const isCorrect = selectedOpt === quiz.correctIndex;

                  return (
                    <div
                      key={quiz.id}
                      className="katalyst-card p-5 rounded-2xl border border-[var(--border-color)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                          Q{qIdx + 1} • {quiz.subject}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] leading-relaxed">
                        {quiz.question}
                      </h4>

                      <div className="space-y-1.5">
                        {quiz.options.map((opt, oIdx) => {
                          const isThisSelected = selectedOpt === oIdx;
                          let btnStyle = 'bg-[var(--bg-ground)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-coral)]';

                          if (isAnswered) {
                            if (oIdx === quiz.correctIndex) {
                              btnStyle = 'bg-emerald-950/40 dark:bg-emerald-950/60 border-emerald-500/50 text-emerald-700 dark:text-emerald-200 font-bold';
                            } else if (isThisSelected && !isCorrect) {
                              btnStyle = 'bg-rose-950/40 dark:bg-rose-950/60 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold';
                            }
                          }

                          return (
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              key={oIdx}
                              onClick={() => handleQuizSelect(quiz.id, oIdx, quiz.correctIndex)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isAnswered && oIdx === quiz.correctIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <motion.div 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl border text-xs ${
                            isCorrect 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
                              : 'bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          <span className="font-bold block mb-0.5 font-heading">Explanation:</span>
                          <p className="leading-relaxed">{quiz.explanation}</p>
                        </motion.div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
