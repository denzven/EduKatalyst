import React from 'react';
import { 
  Folder, 
  FolderOpen, 
  Tag, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FolderExplorer({ 
  subjects = [], 
  tagsWithCounts = [],
  selectedSubject = 'All', 
  onSelectSubject, 
  selectedTag = 'All', 
  onSelectTag,
  sortOption = 'title_asc',
  onSortChange
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl transition-colors duration-300"
    >
      
      {/* Breadcrumb Header Bar - Theme Contrast Compliant */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
        
        <div className="flex items-center space-x-2 text-xs font-mono text-[var(--text-muted)] overflow-x-auto scrollbar-none">
          <HardDrive className="w-4 h-4 text-[var(--accent-coral)] shrink-0" />
          <span className="text-[var(--text-muted)]">Storage</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--border-color)]" />
          <span className="text-[var(--text-muted)]">Root</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--border-color)]" />
          <span className="text-[var(--text-primary)] font-bold px-2 py-0.5 rounded bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-[var(--accent-coral)] shrink-0" />
            <span>{selectedSubject === 'All' ? 'All Folders' : selectedSubject}</span>
          </span>
          {selectedTag !== 'All' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--border-color)]" />
              <span className="text-[var(--accent-sage)] font-bold px-2 py-0.5 rounded bg-[var(--bg-ground)] border border-[var(--border-color)]">
                #{selectedTag}
              </span>
            </>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
          >
            <option value="title_asc">Name (A-Z)</option>
            <option value="date_desc">Newest First</option>
            <option value="chunks_desc">Resource Count</option>
          </select>
        </div>

      </div>

      {/* OS Desktop Folder Tiles Grid with Motion Layout */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            Course Directories ({subjects.length})
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Click a box to open directory
          </span>
        </div>

        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <AnimatePresence>
            {subjects.map((subj) => {
              const isSelected = selectedSubject === subj.name;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  key={subj.name}
                  onClick={() => onSelectSubject(subj.name)}
                  className={`p-3.5 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition ${
                    isSelected
                      ? 'bg-[var(--bg-ground)] border-2 border-[var(--accent-coral)] shadow-lg'
                      : 'bg-[var(--bg-ground)] border border-[var(--border-color)] hover:border-[var(--accent-coral)]/70 hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className={`p-3 rounded-2xl transition ${
                    isSelected ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619]' : 'bg-[var(--bg-surface)] text-[var(--accent-coral)] border border-[var(--border-color)] group-hover:scale-110'
                  }`}>
                    {isSelected ? (
                      <FolderOpen className="w-6 h-6" />
                    ) : (
                      <Folder className="w-6 h-6" />
                    )}
                  </div>

                  <div className="w-full">
                    <h4 className={`text-xs font-bold font-heading truncate ${
                      isSelected ? 'text-[var(--accent-peach)] font-extrabold' : 'text-[var(--text-primary)]'
                    }`}>
                      {subj.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                      {subj.count} {subj.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Tags Classifier Cloud Bar */}
      {tagsWithCounts.length > 0 && (
        <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
              Tag Classifiers
            </span>
            {selectedTag !== 'All' && (
              <button
                onClick={() => onSelectTag('All')}
                className="text-[10px] text-[var(--accent-coral)] hover:underline font-mono"
              >
                Clear Tag Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tagsWithCounts.map((t) => {
              const isSelected = selectedTag === t.name;
              return (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={t.name}
                  onClick={() => onSelectTag(t.name)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold shadow'
                      : 'bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent-coral)]'
                  }`}
                >
                  <span>#{t.name}</span>
                  <span className="text-[9px] opacity-75">({t.count})</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

    </motion.div>
  );
}
