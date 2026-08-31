import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  ListTree, 
  Eye, 
  Star, 
  Copy, 
  Check 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadMarkdownNotes, parseNoteSections } from '../../utils/markdownParser';
import { useAppShell } from '../../core/AppShellContext';

export default function NotesModule({ 
  selectedSubject = 'All', 
  selectedTag = 'All', 
  searchQuery = '', 
  routeParams = {} 
}) {
  const { eventMediator, navigateToTab } = useAppShell();

  const markdownNotes = useMemo(() => loadMarkdownNotes(), []);

  const [expandedNotes, setExpandedNotes] = useState({});
  const [activeSectionMap, setActiveSectionMap] = useState({});
  const [focusedModeMap, setFocusedModeMap] = useState({});
  const [copiedSectionMap, setCopiedSectionMap] = useState({});
  const [bookmarkedSections, setBookmarkedSections] = useState({});

  useEffect(() => {
    if (routeParams.id) {
      setExpandedNotes({ [routeParams.id]: true });
    } else {
      setExpandedNotes({});
    }
  }, [routeParams.id]);

  const toggleNoteAccordion = (noteId) => {
    setExpandedNotes((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

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

  const filteredNotes = useMemo(() => {
    return markdownNotes.filter((nItem) => {
      const matchesSubject = selectedSubject === 'All' || nItem.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (nItem.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        nItem.title.toLowerCase().includes(q) ||
        (nItem.summary || '').toLowerCase().includes(q) ||
        (nItem.subject || '').toLowerCase().includes(q) ||
        (nItem.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [markdownNotes, selectedSubject, selectedTag, searchQuery]);

  return (
    <div className="space-y-4">
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
          No markdown notes found for the selected filter.
        </div>
      ) : (
        filteredNotes.map((note) => {
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
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigateToTab('notes', { subject: selectedSubject, tag });
                          }}
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
                                <div className="flex items-center justify-between border-b border-[var(--border-color)]/60 pb-2">
                                  <h5 className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--accent-coral)]/20 text-[var(--accent-coral)]">
                                      #{idx + 1}
                                    </span>
                                    <span>{sec.title}</span>
                                  </h5>

                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBookmarkSection(secDomId)}
                                      className={`p-1.5 rounded-lg border transition ${
                                        isBookmarked 
                                          ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' 
                                          : 'bg-[var(--bg-ground)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                                      }`}
                                      title="Bookmark section"
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleCopySection(secDomId, sec.content || sec.title)}
                                      className="p-1.5 rounded-lg bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition"
                                      title="Copy section snippet"
                                    >
                                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                <div 
                                  className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: sec.htmlContent || sec.content }}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: note.htmlBody || note.rawBody }}
                    />
                  )}

                </motion.div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
