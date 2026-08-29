import React, { useState, useRef } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Download, 
  Copy, 
  Eye, 
  Lock, 
  Sparkles,
  Layers,
  FileCode
} from 'lucide-react';
import { saveVideoSession } from '../utils/storage';
import { parseFrontmatter } from '../utils/markdownParser';

export default function QuizStudioManager({ onRefreshSessions }) {
  // Quiz Set Metadata
  const [quizTitle, setQuizTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [tagsInput, setTagsInput] = useState('quiz, assessment, test');

  // Single Question Form State
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState([
    'Option A',
    'Option B',
    'Option C',
    'Option D'
  ]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('Refer to lecture notes for complete derivation.');

  // Questions Stack in Current Draft
  const [questionList, setQuestionList] = useState([]);

  // UI & Preview State
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  // --- Option Management Handlers ---
  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (correctIndex >= updated.length) {
      setCorrectIndex(0);
    }
  };

  // --- Add Question to Draft Stack ---
  const handleAddQuestionToStack = (e) => {
    e.preventDefault();
    if (!currentQuestion.trim()) {
      setStatusMsg({ error: true, text: 'Please enter a question prompt.' });
      return;
    }
    if (options.some(opt => !opt.trim())) {
      setStatusMsg({ error: true, text: 'Please fill out all answer options.' });
      return;
    }

    const newQuestion = {
      id: `q_${Date.now()}_${questionList.length}`,
      question: currentQuestion.trim(),
      options: [...options],
      correctIndex: correctIndex,
      explanation: explanation.trim() || 'Refer to lecture notes for complete derivation.'
    };

    setQuestionList([...questionList, newQuestion]);
    
    // Reset Question Form
    setCurrentQuestion('');
    setExplanation('Refer to lecture notes for complete derivation.');
    setStatusMsg({ error: false, text: `Added Question ${questionList.length + 1} to draft quiz!` });
  };

  const handleRemoveQuestionFromStack = (index) => {
    const updated = questionList.filter((_, i) => i !== index);
    setQuestionList(updated);
  };

  // --- Generate Markdown Text ---
  const generateMarkdownString = () => {
    const titleToUse = quizTitle.trim() || 'Custom Quiz';
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let md = `---\ntitle: ${titleToUse}\nsubject: ${subject}\ntags: [${parsedTags.join(', ')}]\n---\n\n`;

    questionList.forEach((q, idx) => {
      md += `### Q${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        if (oIdx === q.correctIndex) {
          md += `- [x] ${opt}\n`;
        } else {
          md += `- [ ] ${opt}\n`;
        }
      });
      if (q.explanation) {
        md += `Explanation: ${q.explanation}\n`;
      }
      md += `\n`;
    });

    return md;
  };

  // --- Publish Quiz to Platform (IndexedDB) ---
  const handlePublishQuiz = async () => {
    if (questionList.length === 0) {
      setStatusMsg({ error: true, text: 'Add at least 1 question to publish the quiz.' });
      return;
    }

    const titleToUse = quizTitle.trim() || `Quiz Set (${questionList.length} Questions)`;
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const fullMarkdown = generateMarkdownString();

      await saveVideoSession({
        id: `quiz_${Date.now()}`,
        title: titleToUse,
        category: subject,
        tags: parsedTags,
        description: `Assessment Quiz: ${questionList.length} Question(s)`,
        playlistText: fullMarkdown,
        keyHex: 'AES-128-ENCRYPTED-QUIZ',
        keyBlob: new Blob([fullMarkdown], { type: 'text/markdown' }),
        segments: { 'quiz_content.md': new Blob([fullMarkdown], { type: 'text/markdown' }) },
        totalSizeBytes: new Blob([fullMarkdown]).size
      });

      setStatusMsg({ error: false, text: `Successfully published quiz "${titleToUse}" to platform!` });
      setQuizTitle('');
      setQuestionList([]);
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ error: true, text: `Failed to publish quiz: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Download .md File ---
  const handleDownloadMarkdown = () => {
    if (questionList.length === 0) {
      setStatusMsg({ error: true, text: 'Add at least 1 question before downloading.' });
      return;
    }

    const fullMarkdown = generateMarkdownString();
    const filename = `${(quizTitle || 'quiz').replace(/[^a-z0-9]/gi, '_')}.md`;

    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // --- Copy Raw Markdown ---
  const handleCopyMarkdown = () => {
    if (questionList.length === 0) {
      setStatusMsg({ error: true, text: 'Add questions to copy markdown.' });
      return;
    }
    const fullMarkdown = generateMarkdownString();
    navigator.clipboard.writeText(fullMarkdown);
    setStatusMsg({ error: false, text: 'Copied raw Markdown to clipboard!' });
  };

  // --- Upload & Import Existing .md Quiz ---
  const handleUploadMdQuiz = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const text = await file.text();
      const { metadata, body } = parseFrontmatter(text);

      const parsedSubject = metadata.subject || 'General';
      const parsedTags = Array.isArray(metadata.tags) ? metadata.tags.join(', ') : 'quiz';

      const questionBlocks = body.split(/### /).filter(b => b.trim().length > 0);
      const importedQuestions = [];

      questionBlocks.forEach((block, idx) => {
        const lines = block.trim().split('\n');
        const questionText = lines[0].replace(/^Q\d+:\s*/i, '').trim();

        const opts = [];
        let cIdx = 0;
        let expl = '';

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
            cIdx = opts.length;
            opts.push(trimmed.replace(/^- \[[xX]\]\s*/, ''));
          } else if (trimmed.startsWith('- [ ]')) {
            opts.push(trimmed.replace(/^- \[ \]\s*/, ''));
          } else if (trimmed.startsWith('Explanation:')) {
            expl = trimmed.replace(/^Explanation:\s*/, '');
          }
        });

        if (opts.length > 0) {
          importedQuestions.push({
            id: `q_imp_${Date.now()}_${idx}`,
            question: questionText,
            options: opts,
            correctIndex: cIdx,
            explanation: expl || 'Refer to course study notes for full derivation.'
          });
        }
      });

      setQuizTitle(metadata.title || file.name.replace(/\.md$/i, ''));
      setSubject(parsedSubject);
      setTagsInput(parsedTags);
      setQuestionList(importedQuestions);

      setStatusMsg({ error: false, text: `Imported ${importedQuestions.length} question(s) from "${file.name}"!` });
    } catch (err) {
      setStatusMsg({ error: true, text: `Failed to parse quiz file: ${err.message}` });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs transition-colors duration-300">
      
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-base font-bold font-serif text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--accent-coral)]" />
            Quiz Creator
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Create interactive multiple-choice quizzes with answers and explanations
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            onChange={handleUploadMdQuiz}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
            <span>Import .md Quiz</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          statusMsg.error
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMsg.error ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
      )}

      {/* Quiz Set Metadata Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
          <Layers className="w-4 h-4 text-[var(--accent-coral)]" />
          Quiz Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[var(--text-primary)] mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              placeholder="e.g. Calculus III Midterm Practice Quiz"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-primary)] mb-1">
              Subject Category
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-primary)] mb-1">
              Tags (Comma-Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. calculus, derivatives, exam-prep"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-coral)]"
            />
          </div>
        </div>
      </div>

      {/* Question Builder Form */}
      <form onSubmit={handleAddQuestionToStack} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
          <Plus className="w-4 h-4 text-[var(--accent-coral)]" />
          Add Question #{questionList.length + 1}
        </h3>

        <div>
          <label className="block font-semibold text-[var(--text-primary)] mb-1">
            Question Prompt
          </label>
          <input
            type="text"
            placeholder="e.g. What is the derivative of f(x) = x^2?"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)]"
            required
          />
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[var(--text-primary)]">
              Answer Options (Select the radio button for the correct answer)
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              disabled={options.length >= 6}
              className="text-[var(--accent-peach)] hover:underline font-mono text-[11px] disabled:opacity-40"
            >
              + Add Option
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {options.map((optText, oIdx) => (
              <div 
                key={oIdx}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition ${
                  correctIndex === oIdx 
                    ? 'bg-emerald-950/40 border-emerald-500/50' 
                    : 'bg-[var(--bg-ground)] border-[var(--border-color)]'
                }`}
              >
                <input
                  type="radio"
                  name="correct_option"
                  checked={correctIndex === oIdx}
                  onChange={() => setCorrectIndex(oIdx)}
                  className="w-4 h-4 accent-[var(--accent-coral)] cursor-pointer"
                />

                <input
                  type="text"
                  value={optText}
                  onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                  className="flex-1 bg-transparent text-[var(--text-primary)] focus:outline-none font-mono text-[11px]"
                  required
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(oIdx)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[var(--text-primary)] mb-1">
            Answer Explanation / Hint Callout
          </label>
          <input
            type="text"
            placeholder="e.g. Using the power rule: d/dx(x^n) = n * x^(n-1)."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coral)]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold flex items-center justify-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4 text-[var(--accent-coral)]" />
          <span>Add Question to Quiz Stack ({questionList.length})</span>
        </button>
      </form>

      {/* Added Questions List & Live Preview */}
      {questionList.length > 0 && (
        <div className="space-y-4">
          
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[var(--accent-coral)]" />
                Draft Quiz Questions ({questionList.length})
              </h3>
            </div>

            <div className="space-y-3">
              {questionList.map((q, idx) => {
                const selectedOpt = previewAnswers[q.id];
                const isAnswered = selectedOpt !== undefined;
                const isCorrect = selectedOpt === q.correctIndex;

                return (
                  <div key={q.id || idx} className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[var(--accent-peach)] font-bold">
                          QUESTION {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold font-serif text-[var(--text-primary)]">
                          {q.question}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleRemoveQuestionFromStack(idx)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                        title="Remove Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Interactive Preview Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        let btnStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]";
                        if (isAnswered) {
                          if (oIdx === q.correctIndex) {
                            btnStyle = "bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold";
                          } else if (selectedOpt === oIdx) {
                            btnStyle = "bg-rose-950/60 border-rose-500/60 text-rose-300 font-bold";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => setPreviewAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                            className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs font-mono transition ${btnStyle}`}
                          >
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {oIdx === q.correctIndex && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className={`p-2.5 rounded-lg border text-[11px] ${
                        isCorrect ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      }`}>
                        <strong>{isCorrect ? '✓ Correct Answer!' : '✗ Incorrect'}</strong> — {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <button
              onClick={handlePublishQuiz}
              disabled={isProcessing}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold flex items-center justify-center space-x-2 transition shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Publish Quiz</span>
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadMarkdown}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Download className="w-4 h-4 text-[var(--accent-peach)]" />
                <span>Download .md</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Copy className="w-4 h-4 text-[var(--accent-coral)]" />
                <span>Copy Markdown</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
