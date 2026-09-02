import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseNoteSections, compileMarkdown } from '../markdownParser';

describe('markdownParser', () => {
  it('should parse YAML frontmatter correctly', () => {
    const raw = `---
title: "Quantum Physics"
subject: "Physics"
tags: [quantum, wave]
---
# Quantum Wave Mechanics`;

    const { metadata, body } = parseFrontmatter(raw);
    expect(metadata.title).toBe('Quantum Physics');
    expect(metadata.subject).toBe('Physics');
    expect(metadata.tags).toEqual(['quantum', 'wave']);
    expect(body.trim()).toBe('# Quantum Wave Mechanics');
  });

  it('should parse Markdown sections by headers', () => {
    const markdown = `# Introduction\nThis is intro.\n\n## Wave Equation\nThis is equation.`;
    const sections = parseNoteSections(markdown);

    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].title).toBe('Introduction');
    expect(sections[1].title).toBe('Wave Equation');
  });

  it('should compile Markdown formatting to HTML', () => {
    const md = `**Bold Text** and *Italic Text*`;
    const html = compileMarkdown(md);

    expect(html).toContain('<strong class="font-bold text-[#E4E6EB]">Bold Text</strong>');
    expect(html).toContain('<em class="italic text-[#A0AAB2]">Italic Text</em>');
  });

  it('should sanitize XSS script tags using DOMPurify', () => {
    const malformed = `Normal text <script>alert("xss")</script>`;
    const html = compileMarkdown(malformed);

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("xss")');
  });

  it('should strip dangerous inline event handlers like onclick per security guidelines', () => {
    const dangerous = `<button onclick="alert('hacked')">Click Me</button>`;
    const html = compileMarkdown(dangerous);

    expect(html).not.toContain('onclick');
    expect(html).not.toContain('alert');
  });
});
