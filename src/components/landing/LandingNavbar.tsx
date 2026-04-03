"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { type Language } from "@/i18n/landingTranslations";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const NAV_LINKS = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.audience"), href: "#audience" },
    { label: t("nav.howItWorks"), href: "#how-it-works" },
  ];

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const LanguageSwitcher = () => (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
      {(['pt', 'en', 'es'] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
            language === lang ? 'bg-white/20 scale-110' : 'hover:bg-white/10 opacity-60 hover:opacity-100'
          }`}
          aria-label={`Change language to ${lang}`}
        >
          {lang === 'pt' && '🇧🇷'}
          {lang === 'en' && '🇺🇸'}
          {lang === 'es' && '🇪🇸'}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-neutral-950/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/30"
            : "bg-transparent"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-xs font-black relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.25 255), #06b6d4)",
                }}
                whileHover={{ scale: 1.08, rotate: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <span className="relative z-10 text-white">B</span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                  style={{ width: "50%", filter: "blur(8px)" }}
                />
              </motion.div>
              <span
                className="text-lg md:text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                Brief
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.65 0.25 255), #06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  fy
                </span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-[oklch(0.65_0.25_255)] to-[#06b6d4] group-hover:w-full transition-all duration-300 rounded-full" />
                </a>
              ))}
            </div>

            {/* CTA Buttons & Language Switcher */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              
              <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

              <Link
                href="/dashboard/login"
                className="text-sm text-neutral-300 hover:text-white transition-colors px-4 py-2"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/dashboard/register"
                className="relative group text-sm font-semibold text-white px-5 py-2.5 rounded-full overflow-hidden whitespace-nowrap"
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.65 0.25 255), #06b6d4)",
                  }}
                />
                <span
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.70 0.28 255), #0ed7f0)",
                  }}
                />
                <span className="relative z-10">{t("nav.getStarted")}</span>
              </Link>
            </div>

            {/* Mobile Burger & Lang */}
            <div className="md:hidden flex items-center gap-4">
              <LanguageSwitcher />
              <button
                className="flex flex-col items-center justify-center w-10 h-10 gap-1.5"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                <motion.span
                  className="block w-5 h-0.5 bg-white rounded-full"
                  animate={
                    mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }
                  }
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="block w-5 h-0.5 bg-white rounded-full"
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.15 }}
                />
                <motion.span
                  className="block w-5 h-0.5 bg-white rounded-full"
                  animate={
                    mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }
                  }
                  transition={{ duration: 0.2 }}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        className="fixed inset-0 z-40 bg-neutral-950/98 backdrop-blur-3xl flex flex-col items-center justify-center gap-6 md:hidden"
        initial={false}
        animate={
          mobileOpen
            ? { opacity: 1, pointerEvents: "auto" as const }
            : { opacity: 0, pointerEvents: "none" as const }
        }
        transition={{ duration: 0.3 }}
      >
        {NAV_LINKS.map((link, i) => (
          <motion.a
            key={link.href}
            href={link.href}
            className="text-2xl font-semibold text-white"
            style={{ fontFamily: '"Outfit", sans-serif' }}
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
          >
            {link.label}
          </motion.a>
        ))}
        <div className="flex flex-col gap-3 mt-4 w-56">
          <Link
            href="/dashboard/login"
            className="text-center text-sm text-neutral-300 border border-white/10 rounded-full py-3 hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/dashboard/register"
            className="text-center text-sm font-semibold text-white rounded-full py-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.25 255), #06b6d4)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      </motion.div>
    </>
  );
}
