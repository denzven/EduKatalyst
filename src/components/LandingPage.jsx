import React from 'react';
import { 
  ArrowRight, 
  Lock, 
  FileText, 
  ShieldCheck, 
  Download,
  Video,
  PlusCircle,
  Layers,
  Wrench,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import KatalystLogo from './KatalystLogo';
import ContactCard from './ContactCard';

export default function LandingPage({ onProceed, onOpenStudio }) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollVariant = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 max-w-5xl mx-auto space-y-14">
      
      {/* Hero Header Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={scrollVariant}
        className="text-center space-y-5 pt-4 max-w-2xl mx-auto"
      >
        <motion.div 
          whileHover={{ scale: 1.06, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="flex justify-center mb-1 cursor-pointer"
        >
          <KatalystLogo className="w-20 h-20 sm:w-24 sm:h-24" glow={true} />
        </motion.div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
          <span>By students. For students.</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
            EduKatalyst <span className="text-[var(--accent-coral)]">by DZVN</span>
          </h1>

          <p className="text-base sm:text-lg font-heading text-[var(--accent-peach)] italic">
            "Katalyze the Change"
          </p>
        </div>

        {/* Short, Punchy Subheadline */}
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-lg mx-auto font-sans leading-relaxed">
          Distraction-free lectures, Markdown notes, and assessment quizzes for engineers.
        </p>

        {/* Primary CTA Button */}
        <div className="pt-2 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onProceed}
            className="px-8 py-3.5 rounded-2xl bg-[var(--accent-coral)] hover:opacity-90 text-white dark:text-[#261619] font-extrabold text-sm transition-all duration-300 shadow-lg shadow-[var(--shadow-glow)] flex items-center space-x-2.5 group"
          >
            <span>Proceed to Content</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

      </motion.div>

      {/* Section 1: 4 Platform Pillars */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        variants={scrollVariant}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -4 }} className="katalyst-card katalyst-card-hover p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] flex items-center justify-center border border-[var(--accent-coral)]/30">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold font-heading text-[var(--text-primary)]">
              AES-128 Video Streams
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              In-browser WASM chunking and Web Crypto encrypted playback.
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="katalyst-card katalyst-card-hover p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] flex items-center justify-center border border-[var(--accent-coral)]/30">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold font-heading text-[var(--text-primary)]">
              Markdown Engine
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Dynamic loading of raw `.md` notes and derivation formulas.
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="katalyst-card katalyst-card-hover p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] flex items-center justify-center border border-[var(--accent-coral)]/30">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold font-heading text-[var(--text-primary)]">
              Anti-Cheat Shield
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              DevTools detection to preserve assessment integrity.
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="katalyst-card katalyst-card-hover p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] flex items-center justify-center border border-[var(--accent-coral)]/30">
              <Download className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold font-heading text-[var(--text-primary)]">
              Static Zip Export
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              1-click `.zip` bundle export for static GitHub Pages hosting.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Section 2: Streamlined Creator Authoring Banner */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        variants={scrollVariant}
        className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] text-[11px] font-mono border border-[var(--accent-coral)]/30">
              <Wrench className="w-3 h-3 text-[var(--accent-coral)]" />
              <span>Authoring Suite</span>
            </div>
            <h2 className="text-lg font-bold font-heading text-[var(--text-primary)]">
              Creator Studio Toolkit
            </h2>
          </div>
        </div>

        {/* 3 Compact Creator Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold font-heading text-[var(--text-primary)]">
              <Video className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
              <span>1. Video Encrypter</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              FFmpeg WASM AES-128 chunking monitor.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold font-heading text-[var(--text-primary)]">
              <PlusCircle className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
              <span>2. Markdown Editor</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              In-browser YAML frontmatter notes publisher.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold font-heading text-[var(--text-primary)]">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
              <span>3. Taxonomy Manager</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Dynamic subject directory controller.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Contact Card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        variants={scrollVariant}
      >
        <ContactCard onOpenStudio={onOpenStudio} />
      </motion.div>

    </div>
  );
}
