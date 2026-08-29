import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Folder, 
  Lock,
  PlusCircle,
  ListTree,
  ShieldCheck,
  Image,
  Film,
  Eye,
  Edit3,
  Columns
} from 'lucide-react';
import { saveVideoSession } from '../utils/storage';
import { parseFrontmatter, parseNoteSections, compileMarkdown, resolveMediaUrls } from '../utils/markdownParser';
import { encryptNoteData } from '../utils/contentEncryption';

export default function StudioNotesManager({ onRefreshSessions }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [examTip, setExamTip] = useState('');
  const [formula, setFormula] = useState('');
  const [markdownBody, setMarkdownBody] = useState('');
  const [mediaAssets, setMediaAssets] = useState({});

  const [editorTab, setEditorTab] = useState('split'); // 'edit' | 'preview' | 'split'
  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const textareaRef = useRef(null);
  const mdInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [activeOutlineId, setActiveOutlineId] = useState(null);

  const handleUploadMediaFile = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const assetKey = type === 'video'
        ? `vid_${Date.now()}`
        : `img_${Date.now()}`;

      setMediaAssets((prev) => ({ ...prev, [assetKey]: dataUrl }));

      const snippet = type === 'video'
        ? `\n\n![video](${assetKey})\n`
        : `\n\n![${cleanName}](${assetKey})\n`;

      setMarkdownBody((prev) => prev + snippet);
      setStatusMsg({ error: false, text: `Attached ${file.name} as clean asset (${assetKey})` });
    };
    reader.onerror = () => {
      setStatusMsg({ error: true, text: `Failed to read media file "${file.name}"` });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextareaDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (isVideo || isImage) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          const assetKey = isVideo
            ? `vid_${Date.now()}`
            : `img_${Date.now()}`;

          setMediaAssets((prev) => ({ ...prev, [assetKey]: dataUrl }));

          const snippet = isVideo
            ? `\n\n![video](${assetKey})\n`
            : `\n\n![${cleanName}](${assetKey})\n`;

          setMarkdownBody((prev) => prev + snippet);
          setStatusMsg({ error: false, text: `Dropped ${file.name} as clean asset (${assetKey})` });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleJumpToSectionInEditor = (secTitle, secId) => {
    setActiveOutlineId(secId);
    if (!textareaRef.current || !markdownBody) return;

    const lowerBody = markdownBody.toLowerCase();
    const lowerTitle = secTitle.toLowerCase();
    const pos = lowerBody.indexOf(lowerTitle);

    if (pos !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + secTitle.length);
      
      const lineCount = markdownBody.substring(0, pos).split('\n').length;
      const lineHeight = 18;
      textareaRef.current.scrollTop = Math.max(0, (lineCount - 3) * lineHeight);
    }
  };

  // Dynamically compute note section outline
  const detectedSections = useMemo(() => {
    return parseNoteSections(markdownBody);
  }, [markdownBody]);

  // Live compiled Markdown HTML preview
  const renderedPreviewHtml = useMemo(() => {
    if (!markdownBody) return '';
    const resolvedText = resolveMediaUrls(markdownBody, mediaAssets);
    return compileMarkdown(resolvedText);
  }, [markdownBody, mediaAssets]);

  const handleInsertSection = (templateType) => {
    let snippet = '';
    const sectionIndex = detectedSections.length + 1;

    switch (templateType) {
      case 'overview':
        snippet = `\n\n## Section ${sectionIndex}: Overview & Background\n\nProvide core concepts, historical context, and fundamental definitions here.`;
        break;
      case 'formula':
        snippet = `\n\n## Section ${sectionIndex}: Core Formulas & Derivations\n\nKey mathematical relationship:\n\\[ f(x) = \\int_{a}^{b} g(t) \\, dt \\]\n\nWhere:\n- $f(x)$: Output function\n- $g(t)$: Kernel function`;
        break;
      case 'codelet':
        snippet = `\n\n## Section ${sectionIndex}: Interactive Codelet\n\n\`\`\`javascript\n// Solution Algorithm\nfunction solveWaveEquation(c, dx, dt) {\n  const r = (c * dt) / dx;\n  console.log("Courant Number r =", r);\n  return r <= 1.0;\n}\n\`\`\``;
        break;
      case 'image':
        snippet = `\n\n![Visual Schematic Diagram](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80)`;
        break;
      case 'video':
        snippet = `\n\n![video](https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4)`;
        break;
      case 'callout':
        snippet = `\n\n> [!TIP]\n> **Key Principle:** Always check boundary limits before applying separation of variables.`;
        break;
      case 'example':
        snippet = `\n\n## Section ${sectionIndex}: Worked Practice Example\n\n**Problem Statement:** Calculate the derivative of $f(x) = x^3 \\sin(x)$.\n\n**Solution:**\nUsing the product rule $(uv)' = u'v + uv'$:\n1. $u = x^3 \\implies u' = 3x^2$\n2. $v = \\sin(x) \\implies v' = \\cos(x)$\n3. $f'(x) = 3x^2 \\sin(x) + x^3 \\cos(x)$`;
        break;
      case 'summary':
        snippet = `\n\n## Section ${sectionIndex}: Summary & Exam Strategy\n\n> **Exam Tip:** Double check units and boundary limits during problem setup.`;
        break;
      default:
        snippet = `\n\n## Section ${sectionIndex}: New Section Header\n\nEnter section content...`;
    }

    setMarkdownBody((prev) => prev + snippet);
  };

  const handleCreateCustomNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ error: true, text: 'Please enter a note title.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const noteCategory = subject.trim() || 'General';
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const rawBodyText = markdownBody.trim() || `# ${title}\n\n## Section 1: Overview\n\nCourse study notes.`;
      const resolvedBodyText = resolveMediaUrls(rawBodyText, mediaAssets);
      const resolvedSections = parseNoteSections(resolvedBodyText);

      // Reconstruct Markdown text
      const fullMarkdown = `---
title: ${title}
subject: ${noteCategory}
tags: [${parsedTags.join(', ')}]
examTip: ${examTip}
formula: ${formula}
---

${resolvedBodyText}`;

      const rawNoteRecord = {
        id: `note_${Date.now()}`,
        title: title,
        category: noteCategory,
        tags: parsedTags,
        description: examTip || resolvedBodyText.slice(0, 120),
        playlistText: fullMarkdown,
        rawBody: resolvedBodyText,
        formula: formula,
        sections: resolvedSections,
        keyHex: 'AES-128-ENCRYPTED-NOTE',
        keyBlob: new Blob([fullMarkdown], { type: 'text/markdown' }),
        segments: { 'note_content.md': new Blob([fullMarkdown], { type: 'text/markdown' }) },
        totalSizeBytes: new Blob([fullMarkdown]).size
      };

      // Encrypt note payload before storing
      const encryptedNoteRecord = await encryptNoteData(rawNoteRecord);

      await saveVideoSession(encryptedNoteRecord);

      setStatusMsg({ error: false, text: `Successfully published encrypted note "${title}" (${detectedSections.length} sections)!` });
      setTitle('');
      setMarkdownBody('');
      setFormula('');
      setExamTip('');
      setTagsInput('');
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
      const sections = parseNoteSections(body);

      const noteTitle = metadata.title || file.name.replace(/\.md$/i, '');
      const noteSubject = metadata.subject || metadata.category || 'General';
      const noteTags = Array.isArray(metadata.tags) ? metadata.tags : [];

      const rawRecord = {
        id: `note_${Date.now()}`,
        title: noteTitle,
        category: noteSubject,
        tags: noteTags,
        description: metadata.examTip || metadata.summary || body.slice(0, 120),
        playlistText: text,
        rawBody: body,
        formula: metadata.formula || '',
        sections,
        keyHex: 'AES-128-ENCRYPTED-NOTE',
        keyBlob: new Blob([text], { type: 'text/markdown' }),
        segments: { [file.name]: new Blob([text], { type: 'text/markdown' }) },
        totalSizeBytes: file.size
      };

      const encryptedRecord = await encryptNoteData(rawRecord);
      await saveVideoSession(encryptedRecord);

      setStatusMsg({ error: false, text: `Uploaded & encrypted note "${noteTitle}" (${sections.length} sections)!` });
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ error: true, text: `Failed to parse .md file: ${err.message}` });
    } finally {
      setIsProcessing(false);
      if (mdInputRef.current) mdInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto transition-colors duration-300">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent-coral)]" />
            Note Creator & Applet Editor
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Create multi-section Markdown notes for courses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-x-1">
            <button
              type="button"
              onClick={() => setEditorTab('edit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                editorTab === 'edit'
                  ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorTab('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                editorTab === 'split'
                  ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorTab('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                editorTab === 'preview'
                  ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

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

      {/* Main Form Grid */}
      <form onSubmit={handleCreateCustomNote} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Column (Editor inputs) */}
        {editorTab !== 'preview' && (
          <div className={`${editorTab === 'split' ? 'lg:col-span-6' : 'lg:col-span-8'} p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-sm transition-all`}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="Title (e.g. Calculus Chapter 4)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Subject Category
                </label>
                <input
                  type="text"
                  placeholder="Category (e.g. Mathematics)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
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
                  placeholder="Tags (e.g. calculus, physics)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Core Formula / Key Equation
                </label>
                <input
                  type="text"
                  placeholder="Key formula (e.g. E = mc²)"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--accent-peach)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Exam Tip / Strategy Callout
              </label>
              <input
                type="text"
                placeholder="Exam tip or key takeaway..."
                value={examTip}
                onChange={(e) => setExamTip(e.target.value)}
                className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
              />
            </div>

            {/* Section Builder Toolbar */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Markdown Body Content (Sections in One File)
                </label>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Use ## to define new sections
                </span>
              </div>

              {/* Hidden Media File Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.gif"
                onChange={(e) => handleUploadMediaFile(e, 'image')}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleUploadMediaFile(e, 'video')}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)]">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] mr-1">Attach Media:</span>
                
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 transition flex items-center gap-1.5 shadow-sm"
                  title="Upload local Image or GIF file directly into note"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Upload Image/GIF</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 transition flex items-center gap-1.5 shadow-sm"
                  title="Upload local Video clip directly into note"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Upload Video</span>
                </button>

                <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>

                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] mr-1">Insert Template:</span>

                <button
                  type="button"
                  onClick={() => handleInsertSection('overview')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[10px] font-mono font-semibold text-[var(--accent-coral)] transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSection('formula')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[10px] font-mono font-semibold text-[var(--accent-peach)] transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Formula</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSection('codelet')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[10px] font-mono font-semibold text-amber-400 transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Codelet</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSection('callout')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[10px] font-mono font-semibold text-emerald-400 transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Callout</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows="9"
                  placeholder="Write notes here... Use ## for sections. Drag & drop images or videos directly into this editor!"
                  value={markdownBody}
                  onChange={(e) => setMarkdownBody(e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleTextareaDrop}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl p-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition leading-relaxed resize-y"
                />
                <span className="text-[10px] font-mono text-[var(--text-muted)] block text-right mt-1">
                  💡 Tip: Drag & drop image/video files into the box above to embed
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-extrabold text-xs transition shadow-md flex items-center justify-center space-x-2 hover:opacity-90"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Publish Encrypted Note ({detectedSections.length} Sections)</span>
            </button>

          </div>
        )}

        {/* Right Side Column (Live Preview Card & Live Sections Outline) */}
        <div className={`${editorTab === 'preview' ? 'lg:col-span-12' : editorTab === 'split' ? 'lg:col-span-6' : 'lg:col-span-4'} space-y-4 transition-all`}>
          
          {/* Live Rendered Note Preview Card */}
          {(editorTab === 'split' || editorTab === 'preview') && (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[var(--accent-coral)]" />
                    <span>Live Rendered Note Preview</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                    {subject || 'General'}
                  </span>
                </div>
              </div>

              {title && (
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  {title}
                </h3>
              )}

              {formula && (
                <div className="p-3 rounded-xl bg-[var(--code-bg)] border border-[var(--border-color)] font-mono text-xs text-[var(--accent-peach)] formula-scroll-container">
                  <span className="text-[10px] font-sans font-bold text-[var(--text-muted)] block mb-1 uppercase tracking-wider">Core Formula / Key Equation:</span>
                  <code>{formula}</code>
                </div>
              )}

              {examTip && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-[var(--text-primary)] space-y-0.5">
                  <span className="font-bold text-amber-400 block text-[10px] uppercase font-mono tracking-wider">💡 Exam Strategy:</span>
                  <p>{examTip}</p>
                </div>
              )}

              {renderedPreviewHtml ? (
                <div 
                  className="markdown-body space-y-3 text-xs text-[var(--text-primary)] leading-relaxed max-h-[500px] overflow-y-auto pr-1 border-t border-[var(--border-color)]/60 pt-3"
                  dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                />
              ) : (
                <div className="p-8 rounded-xl bg-[var(--bg-ground)] border border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
                  Start typing notes or insert templates to view live rendered HTML preview here...
                </div>
              )}
            </div>
          )}

          {/* Live Sections Outline Tree Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 sticky top-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center gap-1.5">
                <ListTree className="w-4 h-4 text-[var(--accent-coral)]" />
                <span>Live Sections Outline</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-peach)] font-bold">
                {detectedSections.length} section(s)
              </span>
            </div>

            {detectedSections.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">No sections detected yet</p>
                <p className="text-[11px]">Click the section buttons above or type <code className="text-[var(--accent-coral)]">## Section Name</code> in markdown.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {detectedSections.map((sec, idx) => {
                  const isActive = activeOutlineId === sec.id;
                  return (
                    <button
                      type="button"
                      key={sec.id}
                      onClick={() => handleJumpToSectionInEditor(sec.title, sec.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold border-[var(--accent-coral)] shadow-md'
                          : 'bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-color)] text-[var(--text-primary)]'
                      }`}
                      title={`Click to jump to "${sec.title}" in editor`}
                    >
                      <span className="truncate max-w-[170px]">
                        {idx + 1}. {sec.title}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isActive ? 'bg-black/20 border-white/20' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}>
                        H{sec.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </form>

    </div>
  );
}
