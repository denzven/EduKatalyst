/**
 * Lightweight Markdown & Frontmatter Parser
 * Dynamically parses YAML frontmatter headers and converts Markdown text into HTML / structured objects.
 */

export function parseFrontmatter(rawText) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = rawText.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: rawText };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const metadata = {};

  yamlBlock.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let val = line.slice(colonIndex + 1).trim();

      // Parse array syntax [item1, item2]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim().replace(/^["']|["']$/g, ''));
      } else {
        val = val.replace(/^["']|["']$/g, '');
      }

      metadata[key] = val;
    }
  });

  return { metadata, body };
}

/**
 * Resolve short media asset keys (e.g. img_1, vid_1) to full Data URLs
 */
export function resolveMediaUrls(markdownText, mediaAssets = {}) {
  if (!markdownText) return '';
  if (!mediaAssets || Object.keys(mediaAssets).length === 0) return markdownText;

  let resolved = markdownText;
  Object.keys(mediaAssets).forEach((key) => {
    const dataUrl = mediaAssets[key];
    if (dataUrl) {
      resolved = resolved.split(`(${key})`).join(`(${dataUrl})`);
    }
  });
  return resolved;
}

/**
 * Rich Markdown to HTML Converter with Support for Codelets, Images, GIFs, Videos, and Callouts
 */
export function compileMarkdown(markdownText) {
  if (!markdownText) return '';

  let html = markdownText
    // Video Markdown syntax ![video](url)
    .replace(/!\[video\]\((.*?)\)/gim, (match, url) => {
      return `<div class="my-4 rounded-2xl overflow-hidden border border-[#343842] bg-black shadow-lg">
        <video src="${url.trim()}" controls preload="metadata" class="w-full h-auto max-h-96"></video>
      </div>`;
    })
    // Image & GIF Markdown syntax ![alt](url)
    .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, url) => {
      const isGif = url.toLowerCase().includes('.gif') || url.toLowerCase().includes('data:image/gif');
      return `<figure class="my-4 overflow-hidden rounded-2xl border border-[#343842] bg-[#15171B] group shadow-lg">
        <img src="${url.trim()}" alt="${alt.trim() || 'Visual Illustration'}" loading="lazy" class="w-full h-auto max-h-96 object-cover transition-transform duration-300 group-hover:scale-105" />
        <figcaption class="px-4 py-2 text-[11px] font-mono text-[#A0AAB2] bg-[#1D2127] border-t border-[#343842] flex items-center justify-between">
          <span>${alt.trim() || 'Visual Illustration'}</span>
          <span class="text-[10px] text-[#D49A6A] font-bold uppercase tracking-wider">${isGif ? 'GIF Animation' : 'Image'}</span>
        </figcaption>
      </figure>`;
    })
    // Codelet Blocks ```lang ... ```
    .replace(/```([a-z0-9+#]*)\s*([\s\S]*?)```/gim, (match, lang, code) => {
      const displayLang = (lang || 'codelet').toUpperCase();
      const escapedCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="codelet-card my-4 rounded-2xl border border-[#343842] bg-[#15171B] overflow-hidden shadow-lg">
        <div class="px-4 py-2 bg-[#1D2127] border-b border-[#343842] flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#C8795A]"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#D49A6A]"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#6EB88F]"></span>
            <span class="text-[10px] font-mono font-bold text-[#D49A6A] uppercase ml-2 tracking-wider">Codelet • ${displayLang}</span>
          </div>
          <button onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText)" class="text-[10px] font-mono font-bold text-[#A0AAB2] hover:text-[#E4E6EB] px-2 py-0.5 rounded bg-[#272B33] border border-[#343842] transition">
            Copy Codelet
          </button>
          <span className="hidden"></span>
        </div>
        <pre class="p-4 font-mono text-xs text-[#D49A6A] formula-scroll-container leading-relaxed overflow-x-auto"><code>${escapedCode}</code></pre>
      </div>`;
    })
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#15171B] font-mono text-xs text-[#D49A6A] border border-[#343842]">$1</code>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold font-heading text-[#E4E6EB] mt-5 mb-2 flex items-center gap-1.5"><span class="w-1.5 h-3 bg-[#C8795A] rounded-full inline-block"></span>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold font-heading text-[#E4E6EB] mt-6 mb-3 pb-1 border-b border-[#343842]">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold font-heading text-[#E4E6EB] mt-7 mb-4">$1</h1>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#E4E6EB]">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-[#A0AAB2]">$1</em>')
    // GitHub Callout Alerts: > [!TIP], > [!NOTE], > [!WARNING]
    .replace(/^> \[\!TIP\]\s*(.*$)/gim, '<div class="p-4 rounded-2xl bg-[#6EB88F]/10 border border-[#6EB88F]/30 text-xs text-[#E4E6EB] my-3 space-y-1"><span class="font-bold text-[#6EB88F] block flex items-center gap-1">💡 Pro Tip</span><p>$1</p></div>')
    .replace(/^> \[\!WARNING\]\s*(.*$)/gim, '<div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-[#E4E6EB] my-3 space-y-1"><span class="font-bold text-rose-400 block flex items-center gap-1">⚠️ Warning</span><p>$1</p></div>')
    .replace(/^> \[\!NOTE\]\s*(.*$)/gim, '<div class="p-4 rounded-2xl bg-[#D49A6A]/10 border border-[#D49A6A]/30 text-xs text-[#E4E6EB] my-3 space-y-1"><span class="font-bold text-[#D49A6A] block flex items-center gap-1">📌 Key Takeaway</span><p>$1</p></div>')
    // Generic Blockquotes
    .replace(/^> (.*$)/gim, '<div class="exam-tip-box p-4 rounded-2xl text-xs text-[#E4E6EB] my-3"><span class="font-bold text-[#C8795A] block mb-1">Exam Strategy:</span>$1</div>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-xs text-[#A0AAB2] my-1 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-xs text-[#A0AAB2] my-1 leading-relaxed">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/>');

  return html;
}

/**
 * Parse Markdown text into structured section objects (by # or ## headers)
 */
export function parseNoteSections(markdownText) {
  if (!markdownText) return [];

  const lines = markdownText.split('\n');
  const sections = [];
  let currentSection = {
    id: 'sec-0',
    title: 'Overview',
    level: 2,
    lines: []
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (currentSection.lines.length > 0 || currentSection.title !== 'Overview') {
        const rawContent = currentSection.lines.join('\n').trim();
        if (rawContent || currentSection.title !== 'Overview') {
          sections.push({
            id: currentSection.id,
            title: currentSection.title,
            level: currentSection.level,
            rawContent,
            bodyHtml: compileMarkdown(rawContent)
          });
        }
      }
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      currentSection = {
        id: `sec-${sections.length + 1}`,
        title,
        level,
        lines: []
      };
    } else {
      currentSection.lines.push(line);
    }
  });

  if (currentSection.lines.length > 0 || currentSection.title) {
    const rawContent = currentSection.lines.join('\n').trim();
    if (rawContent || currentSection.title) {
      sections.push({
        id: currentSection.id,
        title: currentSection.title,
        level: currentSection.level,
        rawContent,
        bodyHtml: compileMarkdown(rawContent)
      });
    }
  }

  return sections.filter(s => s.title || s.rawContent);
}

/**
 * Dynamically load all Markdown notes from /src/content/notes/*.md using Vite import.meta.glob
 */
export function loadMarkdownNotes() {
  const modules = import.meta.glob('/src/content/notes/*.md', {
    eager: true,
    query: '?raw',
    import: 'default'
  });

  const notesList = [];

  for (const path in modules) {
    const rawContent = modules[path];
    const { metadata, body } = parseFrontmatter(rawContent);
    const sections = parseNoteSections(body);

    notesList.push({
      id: path.split('/').pop().replace('.md', ''),
      path,
      title: metadata.title || 'Untitled Note',
      subject: metadata.subject || 'General',
      category: metadata.category || metadata.subject || 'General',
      tags: Array.isArray(metadata.tags) ? metadata.tags : (metadata.tags ? [metadata.tags] : []),
      examTip: metadata.examTip || '',
      summary: metadata.summary || '',
      formula: metadata.formula || '',
      bodyHtml: compileMarkdown(body),
      rawBody: body,
      sections
    });
  }

  return notesList;
}

/**
 * Dynamically load all Markdown quizzes from /src/content/quizzes/*.md using Vite import.meta.glob
 */
export function loadMarkdownQuizzes() {
  const modules = import.meta.glob('/src/content/quizzes/*.md', {
    eager: true,
    query: '?raw',
    import: 'default'
  });

  const quizzesList = [];

  for (const path in modules) {
    const rawContent = modules[path];
    const { metadata, body } = parseFrontmatter(rawContent);

    // Parse Markdown questions formatted in body
    const questionBlocks = body.split(/### /).filter(b => b.trim().length > 0);

    questionBlocks.forEach((block, idx) => {
      const lines = block.trim().split('\n');
      const questionText = lines[0].replace(/^Q\d+:\s*/i, '').trim();

      const options = [];
      let correctIndex = 0;
      let explanation = '';

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
          correctIndex = options.length;
          options.push(trimmed.replace(/^- \[[xX]\]\s*/, ''));
        } else if (trimmed.startsWith('- [ ]')) {
          options.push(trimmed.replace(/^- \[ \]\s*/, ''));
        } else if (trimmed.startsWith('Explanation:')) {
          explanation = trimmed.replace(/^Explanation:\s*/, '');
        }
      });

      if (options.length > 0) {
        quizzesList.push({
          id: `${path.split('/').pop().replace('.md', '')}_${idx}`,
          subject: metadata.subject || 'General',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          question: questionText,
          options,
          correctIndex,
          explanation: explanation || 'Refer to course study notes for full derivation.'
        });
      }
    });
  }

  return quizzesList;
}
