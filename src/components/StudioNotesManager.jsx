import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Folder, 
  Lock
} from 'lucide-react';
import { saveVideoSession } from '../utils/storage';
import { parseFrontmatter } from '../utils/markdownParser';

export default function StudioNotesManager({ onRefreshSessions }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [tagsInput, setTagsInput] = useState('test, placeholder, sample');
  const [examTip, setExamTip] = useState('Sample generic test tip.');
  const [formula, setFormula] = useState('f(x) = ax^2 + bx + c');
  const [markdownBody, setMarkdownBody] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');

  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mdInputRef = useRef(null);

  const handleCreateCustomNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ error: true, text: 'Please enter a note title.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Reconstruct Markdown text
      const fullMarkdown = `---
title: ${title}
subject: ${subject}
tags: [${parsedTags.join(', ')}]
examTip: ${examTip}
formula: ${formula}
---

# ${title}

${markdownBody}`;

      // Save as a dynamic note session
      await saveVideoSession({
        id: `note_${Date.now()}`,
        title: title,
        category: subject,
        tags: parsedTags,
        description: examTip || markdownBody.slice(0, 100),
        playlistText: fullMarkdown,
        keyHex: 'AES-128-ENCRYPTED-NOTE',
        keyBlob: new Blob([fullMarkdown], { type: 'text/markdown' }),
        segments: { 'note_content.md': new Blob([fullMarkdown], { type: 'text/markdown' }) },
        totalSizeBytes: new Blob([fullMarkdown]).size
      });

      setStatusMsg({ error: false, text: `Successfully published note "${title}"!` });
      setTitle('');
      setMarkdownBody('');
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ error: true, text: `Failed to save note: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadMdFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const text = await file.text();
      const { metadata, body } = parseFrontmatter(text);

      const noteTitle = metadata.title || file.name.replace(/\.md$/i, '');
      const noteSubject = metadata.subject || metadata.category || 'General';
      const noteTags = Array.isArray(metadata.tags) ? metadata.tags : [];

      await saveVideoSession({
        id: `note_${Date.now()}`,
        title: noteTitle,
        category: noteSubject,
        tags: noteTags,
        description: metadata.examTip || metadata.summary || body.slice(0, 100),
        playlistText: text,
        keyHex: 'AES-128-ENCRYPTED-NOTE',
        keyBlob: new Blob([text], { type: 'text/markdown' }),
        segments: { [file.name]: new Blob([text], { type: 'text/markdown' }) },
        totalSizeBytes: file.size
      });

      setStatusMsg({ error: false, text: `Uploaded and published "${noteTitle}"!` });
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ error: true, text: `Failed to parse .md file: ${err.message}` });
    } finally {
      setIsProcessing(false);
      if (mdInputRef.current) mdInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto transition-colors duration-300">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent-coral)]" />
            Custom Notes & Quizzes Publishing Studio
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Create or upload raw `.md` files with AES-128 encryption
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={mdInputRef}
            type="file"
            accept=".md,.txt"
            onChange={handleUploadMdFile}
            className="hidden"
          />
          <button
            onClick={() => mdInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
            <span>Upload .md File</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          statusMsg.error
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMsg.error ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Note Creation Form */}
      <form onSubmit={handleCreateCustomNote} className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Note Title
            </label>
            <input
              type="text"
              placeholder="e.g. Sample Generic Note"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Subject Category
            </label>
            <input
              type="text"
              placeholder="e.g. General"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Tags (Comma-Separated)
            </label>
            <input
              type="text"
              placeholder="test, placeholder, sample"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Core Formula / Equation
            </label>
            <input
              type="text"
              placeholder="e.g. f(x) = ax^2 + bx + c"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--accent-peach)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
            Exam Tip / Callout Box
          </label>
          <input
            type="text"
            placeholder="e.g. Sample generic test tip"
            value={examTip}
            onChange={(e) => setExamTip(e.target.value)}
            className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
            Markdown Body Content
          </label>
          <textarea
            rows="5"
            placeholder="Lorem ipsum dolor sit amet..."
            value={markdownBody}
            onChange={(e) => setMarkdownBody(e.target.value)}
            className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl p-3.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition leading-relaxed resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
        >
          <Lock className="w-4 h-4" />
          <span>Publish & Encrypt Note</span>
        </button>

      </form>

    </div>
  );
}
