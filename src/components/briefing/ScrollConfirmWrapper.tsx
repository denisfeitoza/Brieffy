"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollConfirmWrapper({
  children,
  ActionComponent,
  isDisabled,
  containerClassName = "w-full flex justify-end"
}: {
  children?: React.ReactNode;
  ActionComponent: React.ReactNode;
  isDisabled?: boolean;
  containerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect mobile virtual keyboard via visualViewport API
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const initialHeight = viewport.height;
    
    const handleResize = () => {
      // If viewport shrinks by more than 150px, keyboard is likely open
      const heightDiff = initialHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > 150);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -20px 0px"
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={ref} className={containerClassName}>
        {children || ActionComponent}
      </div>
      
      {/* Floating bottom action — hidden when keyboard is open on mobile */}
      <AnimatePresence>
        {!isVisible && !isDisabled && !isKeyboardOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 40, scale: 0.9, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 z-[100] drop-shadow-2xl w-[90vw] sm:w-auto flex justify-center"
          >
            {ActionComponent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
