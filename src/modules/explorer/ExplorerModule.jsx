import React, { useMemo, useState } from 'react';
import { Folder, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import FolderExplorer from '../../components/FolderExplorer';
import { loadMarkdownNotes, loadMarkdownQuizzes } from '../../utils/markdownParser';
import { aggregateAllSubjects, aggregateAllTags } from '../../utils/taxonomyController';
import { useAppShell } from '../../core/AppShellContext';

export default function ExplorerModule({ 
  selectedSubject = 'All', 
  onSelectSubject, 
  selectedTag = 'All', 
  onSelectTag, 
  searchQuery = '' 
}) {
  const { sessions, navigateToTab } = useAppShell();
  const [sortOption, setSortOption] = useState('title_asc');

  const markdownNotes = useMemo(() => loadMarkdownNotes(), []);
  const markdownQuizzes = useMemo(() => loadMarkdownQuizzes(), []);

  const subjectsWithCounts = useMemo(() => {
    return aggregateAllSubjects(sessions, markdownNotes, markdownQuizzes);
  }, [sessions, markdownNotes, markdownQuizzes]);

  const tagsWithCounts = useMemo(() => {
    return aggregateAllTags(sessions, markdownNotes, markdownQuizzes);
  }, [sessions, markdownNotes, markdownQuizzes]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSubject = selectedSubject === 'All' || s.category === selectedSubject;
      const matchesTag = selectedTag === 'All' || (s.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        s.title.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, selectedSubject, selectedTag, searchQuery]);

  const filteredNotes = useMemo(() => {
    return markdownNotes.filter((n) => {
      const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (n.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        n.title.toLowerCase().includes(q) ||
        (n.summary || '').toLowerCase().includes(q)
      );
    });
  }, [markdownNotes, selectedSubject, selectedTag, searchQuery]);

  const filteredQuizzes = useMemo(() => {
    return markdownQuizzes.filter((qItem) => {
      const matchesSubject = selectedSubject === 'All' || qItem.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (qItem.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && qItem.question.toLowerCase().includes(q);
    });
  }, [markdownQuizzes, selectedSubject, selectedTag, searchQuery]);

  return (
    <div className="space-y-6">
      <FolderExplorer
        subjects={subjectsWithCounts}
        tagsWithCounts={tagsWithCounts}
        selectedSubject={selectedSubject}
        onSelectSubject={onSelectSubject}
        selectedTag={selectedTag}
        onSelectTag={onSelectTag}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      <div className="space-y-4 pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <Folder className="w-4 h-4 text-[var(--accent-coral)]" />
            {selectedSubject === 'All' ? 'All Course Resources' : `Directory: ${selectedSubject}`}
          </h3>
          <span className="text-xs font-mono text-[var(--accent-peach)]">
            {filteredSessions.length} Videos • {filteredNotes.length} Notes • {filteredQuizzes.length} Quizzes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={session.id}
              onClick={() => navigateToTab('lessons', { id: session.id, subject: selectedSubject })}
              className="katalyst-card katalyst-card-hover p-4 rounded-2xl cursor-pointer flex flex-col justify-between group space-y-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-heading text-[var(--text-primary)] truncate">
                    {session.title}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                    {session.category || 'General'}
                  </span>
                </div>

                {session.description && (
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--accent-coral)] font-semibold flex items-center gap-1">
                  <span>Play Video</span>
                  <ArrowRight className="w-3 h-3 text-[var(--accent-coral)]" />
                </span>
              </div>
            </motion.div>
          ))}

          {filteredNotes.map((note) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={note.id}
              onClick={() => navigateToTab('notes', { id: note.id, subject: selectedSubject })}
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
  );
}
