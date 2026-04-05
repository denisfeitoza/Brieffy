"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLogo } from "@/components/briefing/BrandedLogo";
import { Button } from "@/components/ui/button";

interface Message {
  content: string;
  userAnswer?: string | string[] | number;
}

interface Branding {
  brand_color?: string;
  company_name?: string;
  logo_url?: string;
  [key: string]: any;
}

interface Translations {
  thankYouTitle: string;
  thankYouSubtitle: string;
  thankYouBody: string;
  reviewAnswers: string;
  reviewDesc: string;
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
            <h1 className="text-3xl md:text-4xl font-outfit font-medium tracking-tight text-[var(--text)]">
              {t.thankYouTitle}
            </h1>
            <p className="text-lg text-gray-500 font-medium">
              {t.thankYouSubtitle}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="text-neutral-500 leading-relaxed max-w-md"
          >
            {t.thankYouBody}
          </motion.p>

          {/* Brand badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
            <span className="text-sm font-medium text-neutral-400" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
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
              className="w-full bg-white/50 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              onClick={() => setShowReviewModal(true)}
            >
              {t.reviewAnswers}
            </Button>
            <p className="text-xs text-neutral-500 pt-2 text-center opacity-80">
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
                className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1L13 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h2 className="text-2xl font-outfit font-semibold mb-6 text-gray-800">
                  {t.reviewAnswers}
                </h2>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left text-sm">
                  {messages.filter(m => m.userAnswer).map((m, i) => (
                    <div key={i} className="pb-4 border-b border-gray-100 last:border-0">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                        Pergunta {i + 1}
                      </p>
                      <p className="text-gray-800 font-medium mb-3">
                        {m.content}
                      </p>
                      <div className="bg-gray-50 p-3 rounded-xl inline-block max-w-full">
                        <span className="text-gray-600 block break-words">
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
