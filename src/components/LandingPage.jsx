import React from 'react';
import { ArrowRight } from 'lucide-react';
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
    <div className="min-h-[75vh] flex flex-col justify-between py-6 px-4 max-w-4xl mx-auto space-y-12">
      
      {/* Hero Header Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={scrollVariant}
        className="text-center space-y-5 pt-8 max-w-2xl mx-auto"
      >
        <motion.div 
          whileHover={{ scale: 1.06, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="flex justify-center mb-2 cursor-pointer"
        >
          <KatalystLogo className="w-20 h-20 sm:w-24 sm:h-24" glow={true} />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
            EduKatalyst
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
        <div className="pt-4 flex justify-center">
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
