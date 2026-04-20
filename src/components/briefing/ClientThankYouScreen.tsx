"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLogo } from "@/components/briefing/BrandedLogo";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface Message {
  content: string;
  userAnswer?: string | string[] | number;
}

interface Branding {
  brand_color?: string;
  company_name?: string;
  logo_url?: string;
  [key: string]: unknown;
}

interface Translations {
  thankYouTitle: string;
  thankYouSubtitle: string;
  thankYouBody: string;
  reviewAnswers: string;
  reviewDesc: string;
  questionTitle: string;
}

interface ClientThankYouScreenProps {
  branding: Branding;
  activeColor: string;
  activeCompanyName: string;
  activeFont: string;
  t: Translations;
  messages: Message[];
}

export function ClientThankYouScreen({
  branding,
  activeColor,
  activeCompanyName,
  activeFont,
  t,
  messages,
}: ClientThankYouScreenProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = messages
      .filter(m => m.userAnswer)
      .map((m, i) => `Pergunta ${i + 1}:\n${m.content}\n\nResposta:\n${Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer}`)
      .join('\n\n-----------------\n\n');
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)]">
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-lg space-y-8 relative"
        >
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <motion.div
              className="w-72 h-72 rounded-full mx-auto"
              style={{ background: `radial-gradient(circle, ${activeColor}15 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Animated Check */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.7, type: 'spring', stiffness: 150 }}
            className="relative"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: `${activeColor}40`, background: `${activeColor}10` }}
            >
              <motion.svg
                width="48" height="48" viewBox="0 0 48 48"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
              >
                <motion.path
                  d="M14 24 L22 32 L34 16"
                  fill="none"
                  stroke={activeColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                />
              </motion.svg>
            </div>
            <motion.div
              className="absolute inset-0 w-24 h-24 rounded-full"
              style={{ boxShadow: `0 0 40px ${activeColor}25, 0 0 80px ${activeColor}10` }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-[var(--text)]" style={{ fontFamily: '"Outfit", sans-serif' }}>
              {t.thankYouTitle}
            </h1>
            <p className="text-lg text-[var(--text2)] font-medium">
              {t.thankYouSubtitle}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="text-[var(--text2)] leading-relaxed max-w-md"
          >
            {t.thankYouBody}
          </motion.p>

          {/* Brand badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[var(--bd)] bg-[var(--bg2)] shadow-sm"
          >
            <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
            <span className="text-sm font-medium text-[var(--text3)]" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
              {activeCompanyName}
            </span>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none -z-5 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: activeColor,
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Subtle footer */}
          <div className="flex flex-col gap-3 mt-8 w-full max-w-sm relative z-10">
            <Button 
              variant="outline" 
              className="w-full bg-[var(--bg2)]/60 backdrop-blur-sm border-[var(--bd)] text-[var(--text)] hover:bg-[var(--bg2)] flex items-center justify-center gap-2"
              onClick={() => setShowReviewModal(true)}
            >
              {t.reviewAnswers}
            </Button>
            <p className="text-xs text-[var(--text2)] pt-2 text-center opacity-80">
              {t.reviewDesc}
            </p>
          </div>
        </motion.div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={() => setShowReviewModal(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[var(--bg)] border border-[var(--bd)] rounded-3xl p-6 sm:p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="absolute top-4 right-4 p-2 bg-[var(--bg2)] text-[var(--text2)] rounded-full hover:bg-[var(--bg3)] transition-colors"
                  aria-label="Fechar"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-[var(--text)]" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {t.reviewAnswers}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-[var(--text2)] border-[var(--bd)] mr-8"
                    onClick={handleCopy}
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                  </Button>
                </div>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left text-sm">
                  {messages.filter(m => m.userAnswer).map((m, i) => (
                    <div key={i} className="pb-4 border-b border-[var(--bd)] last:border-0">
                      <p className="text-[var(--text3)] text-xs uppercase tracking-wider mb-1 font-semibold">
                        {t.questionTitle} {i + 1}
                      </p>
                      <p className="text-[var(--text)] font-medium mb-3">
                        {m.content}
                      </p>
                      <div className="bg-[var(--bg2)] p-3 rounded-xl inline-block max-w-full">
                        <span className="text-[var(--text2)] block break-words">
                          {Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
