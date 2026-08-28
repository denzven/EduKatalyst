import React, { useState } from 'react';
import { 
  FolderPlus, 
  Tag, 
  Plus, 
  CheckCircle2, 
  Folder, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  registerSubject, 
  registerTag, 
  aggregateAllSubjects, 
  aggregateAllTags 
} from '../utils/taxonomyController';

export default function TaxonomyManager({ sessions = [], notes = [], quizzes = [], onTaxonomyUpdated }) {
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const subjects = aggregateAllSubjects(sessions, notes, quizzes);
  const tags = aggregateAllTags(sessions, notes, quizzes);

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) return;

    const added = registerSubject(newSubjectInput);
    setFeedbackMsg(`Registered new subject folder: "${added}"`);
    setNewSubjectInput('');
    onTaxonomyUpdated?.();
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;

    const added = registerTag(newTagInput);
    setFeedbackMsg(`Registered new tag: "#${added}"`);
    setNewTagInput('');
    onTaxonomyUpdated?.();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto transition-colors duration-300">
      
      {/* Overview Header */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent-coral)]" />
          Central Taxonomy & Folder Controller
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Dynamic central manager for subject directories and tag classifications. Zero hardcoded strings.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid for Subjects & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subject Directories Manager */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-[var(--accent-coral)]" />
              Subject Directories ({subjects.length})
            </h3>
          </div>

          <form onSubmit={handleAddSubject} className="flex space-x-2">
            <input
              type="text"
              placeholder="New Subject (e.g. Mass Transfer)"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              className="flex-1 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pt-2">
            {subjects.map((subj) => (
              <div
                key={subj.name}
                className="p-2.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Folder className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                  <span className="font-semibold text-[var(--text-primary)]">{subj.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--accent-peach)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                  {subj.count} item(s)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag Cloud Manager */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[var(--accent-peach)]" />
              Tag Cloud Classifier ({tags.length})
            </h3>
          </div>

          <form onSubmit={handleAddTag} className="flex space-x-2">
            <input
              type="text"
              placeholder="New Tag (e.g. #Kinetics)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="flex-1 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-2">
            {tags.map((tag) => (
              <span
                key={tag.name}
                className="p-2 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] flex items-center space-x-1.5"
              >
                <Tag className="w-3 h-3 text-[var(--accent-coral)]" />
                <span>#{tag.name}</span>
                <span className="text-[10px] text-[var(--accent-peach)] bg-[var(--bg-surface)] px-1.5 py-0.2 rounded">
                  {tag.count}
                </span>
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
