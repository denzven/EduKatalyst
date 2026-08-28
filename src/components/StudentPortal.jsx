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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import VideoPlayer from './VideoPlayer';
import FolderExplorer from './FolderExplorer';
import { loadMarkdownNotes, loadMarkdownQuizzes } from '../utils/markdownParser';
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
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
              placeholder="Search topics or #tags..."
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30 flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current text-[var(--accent-coral)]" /> Lecture Video
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {session.category}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent-peach)] transition truncate">
                          {session.title}
                        </h4>

                        {session.description && (
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="px-4 py-2 bg-[var(--bg-ground)] border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--accent-coral)] font-semibold flex items-center gap-1">
                          <span>Play Encrypted Video</span>
                          <ArrowRight className="w-3 h-3 text-[var(--accent-coral)]" />
                        </span>
                        <span className="text-[var(--text-muted)] font-mono">{session.segmentCount} chunks</span>
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-ground)] text-[var(--accent-sage)] border border-[var(--border-color)] flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" /> Note .md
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {note.subject}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent-peach)] transition truncate">
                          {note.title}
                        </h4>

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
                        <span className="text-[var(--text-muted)] font-mono">Markdown</span>
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
                        <div className="relative aspect-video bg-[var(--bg-ground)] flex items-center justify-center border-b border-[var(--border-color)]">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-coral)]/20 border border-[var(--accent-coral)]/40 text-[var(--accent-coral)] flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--accent-coral)] group-hover:text-white dark:group-hover:text-[#261619] transition-all duration-200">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[var(--bg-surface)]/90 border border-[var(--border-color)] text-[10px] font-mono text-[var(--accent-peach)] flex items-center gap-1">
                            <Folder className="w-2.5 h-2.5 text-[var(--accent-coral)]" />
                            <span>{session.category || 'General'}</span>
                          </div>
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
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {session.segmentCount} chunks
                        </span>
                      </div>

                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MARKDOWN NOTES */}
          {activePortalTab === 'notes' && (
            <div className="space-y-3">
              {filteredMarkdownNotes.map((note) => {
                const isExpanded = !!expandedNotes[note.id];
                return (
                  <div
                    key={note.id}
                    className="katalyst-card rounded-2xl border border-[var(--border-color)] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleNoteAccordion(note.id)}
                      className="p-4 cursor-pointer flex items-start justify-between gap-3 hover:bg-[var(--bg-surface-hover)] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                            {note.subject}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                          {note.title}
                        </h4>

                        {note.summary && (
                          <p className="text-xs text-[var(--text-muted)]">
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

                      <button className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 mt-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--accent-coral)]" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-ground)] space-y-3"
                      >
                        {note.formula && (
                          <div className="p-3 rounded-xl bg-[var(--code-bg)] border border-[var(--border-color)] font-mono text-xs text-[var(--accent-peach)] formula-scroll-container">
                            <span className="text-[10px] text-[var(--text-muted)] block mb-0.5 font-sans">Formula:</span>
                            <code>{note.formula}</code>
                          </div>
                        )}

                        <div 
                          className="markdown-body space-y-2 text-xs text-[var(--text-primary)] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: note.bodyHtml }}
                        />
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
