"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Language, landingTranslations } from "./landingTranslations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      // Attempt automatic detection on mount
      const savedLang = localStorage.getItem("brieffy_lang") as Language | null;
      if (savedLang && ["pt", "en", "es"].includes(savedLang)) {
        setLanguage(savedLang);
      } else {
        const browserLang = window.navigator.language.slice(0, 2).toLowerCase();
        if (browserLang === "pt" || browserLang === "en" || browserLang === "es") {
          setLanguage(browserLang as Language);
        } else {
          setLanguage("en"); // fallback to en if unknown language
        }
      }
      setIsInitialized(true);
    }, 0);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("brieffy_lang", lang);
  };

  const t = (key: string, values?: Record<string, string | number>): string => {
    const translation = landingTranslations[language]?.[key] || landingTranslations["pt"]?.[key] || key;
    
    if (!values) return translation;

    let interpolated = translation;
    for (const [k, v] of Object.entries(values)) {
      interpolated = interpolated.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    return interpolated;
  };

  // Avoid hydration mismatch by waiting for initialization before rendering
  if (!isInitialized) {
    return <div className="min-h-screen bg-[oklch(0.10_0.02_260)]" />; // Match landing page background while detecting
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
