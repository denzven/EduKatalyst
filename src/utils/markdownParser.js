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
 * Basic Markdown to HTML Converter for Rendered Notes Body
 */
export function compileMarkdown(markdownText) {
  if (!markdownText) return '';

  let html = markdownText
    // Code / Math blocks ``` ... ```
    .replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="p-4 rounded-xl bg-[#15171B] border border-[#343842] font-mono text-xs text-[#D49A6A] formula-scroll-container my-3 leading-relaxed"><code>${code.trim()}</code></pre>`;
    })
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#15171B] font-mono text-xs text-[#D49A6A] border border-[#343842]">$1</code>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold font-heading text-[#E4E6EB] mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold font-heading text-[#E4E6EB] mt-5 mb-2.5">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold font-heading text-[#E4E6EB] mt-6 mb-3">$1</h1>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#E4E6EB]">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-[#A0AAB2]">$1</em>')
    // Blockquotes / Callout Exam Tips
    .replace(/^> (.*$)/gim, '<div class="exam-tip-box p-4 rounded-xl text-xs text-[#E4E6EB] my-3"><span class="font-bold text-[#C8795A] block mb-1">Exam Tip:</span>$1</div>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-xs text-[#A0AAB2] my-1 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-xs text-[#A0AAB2] my-1 leading-relaxed">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/>');

  return html;
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
      rawBody: body
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
