"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dashboardTranslations, type DashboardLanguage } from "./dashboardTranslations";

interface DashboardLanguageContextType {
  language: DashboardLanguage;
  setLanguage: (lang: DashboardLanguage) => void;
  t: (key: string) => string;
}

const DashboardLanguageContext = createContext<DashboardLanguageContextType | undefined>(undefined);

const STORAGE_KEY = "brieffy_dashboard_lang";

export function DashboardLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<DashboardLanguage>("en");

  useEffect(() => {
    // Priority: localStorage > brieffy_lang (landing) > browser language > English
    const saved = localStorage.getItem(STORAGE_KEY) as DashboardLanguage | null;
    const landingLang = localStorage.getItem("brieffy_lang") as DashboardLanguage | null;

    if (saved && ["pt", "en", "es"].includes(saved)) {
      setLanguageState(saved);
    } else if (landingLang && ["pt", "en", "es"].includes(landingLang)) {
      setLanguageState(landingLang);
    } else {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (browserLang === "pt" || browserLang === "en" || browserLang === "es") {
        setLanguageState(browserLang as DashboardLanguage);
      } else {
        setLanguageState("en");
      }
    }
  }, []);

  const setLanguage = useCallback((lang: DashboardLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string): string => {
    return dashboardTranslations[language]?.[key]
      || dashboardTranslations["en"]?.[key]
      || key;
  }, [language]);

  return (
    <DashboardLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (!context) {
    throw new Error("useDashboardLanguage must be used within a DashboardLanguageProvider");
  }
  return context;
}
