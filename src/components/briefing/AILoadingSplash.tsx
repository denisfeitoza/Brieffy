"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useCallback } from "react";
import { getContrastColor } from "@/lib/utils";

interface AILoadingSplashProps {
  branding: {
    logo_url: string;
    company_name: string;
    brand_color: string;
    brand_accent?: string;
    tagline?: string;
  };
  language?: string;
  skillCount?: number;
  requirePassword?: boolean;
  sessionId?: string;
  onAccessUnlocked?: () => void;
  onComplete?: () => void;
}

// Translations only for the password gate. 
// We removed the generic loading messages so international users 
// aren't greeted in Portuguese before they even pick a language.
const SPLASH_I18N: Record<string, {
  passwordTitle: string; passwordPlaceholder: string; passwordButton: string;
  passwordError: string; passwordHint: string;
}> = {
  pt: {
    passwordTitle: "Acesso Protegido",
    passwordPlaceholder: "Digite a senha de acesso",
    passwordButton: "Entrar",
    passwordError: "Senha incorreta. Tente novamente.",
    passwordHint: "Solicite a senha ao responsável pelo briefing.",
  },
  en: {
    passwordTitle: "Protected Access",
    passwordPlaceholder: "Enter the access password",
    passwordButton: "Enter",
    passwordError: "Incorrect password. Please try again.",
    passwordHint: "Ask the briefing owner for the password.",
  },
  es: {
    passwordTitle: "Acceso Protegido",
    passwordPlaceholder: "Ingrese la contraseña de acceso",
    passwordButton: "Entrar",
    passwordError: "Contraseña incorrecta. Intente de nuevo.",
    passwordHint: "Solicite la contraseña al responsable del briefing.",
  },
};

export const AILoadingSplash = memo(function AILoadingSplash({
  branding,
  language = "pt",
  requirePassword = false,
  sessionId,
  onAccessUnlocked,
  onComplete,
}: AILoadingSplashProps) {
  const t = SPLASH_I18N[language] || SPLASH_I18N.pt;
  
  // Password gate state
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(!requirePassword);

  const handleVerifyPassword = useCallback(async () => {
    if (!password.trim() || isVerifying) return;
    setIsVerifying(true);
    setPasswordError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch("/api/briefing/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ sessionId, password: password.trim() }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.valid) {
        setUnlocked(true);
        onAccessUnlocked?.();
      } else {
        setPasswordError(data.error || t.passwordError);
      }
    } catch {
      setPasswordError(t.passwordError);
    } finally {
      setIsVerifying(false);
    }
  }, [password, isVerifying, sessionId, onAccessUnlocked, t.passwordError]);

  const brandColor = branding.brand_color || "#ff6029";
  const contrastColor = getContrastColor(brandColor);

  const initials = branding.company_name
    ? branding.company_name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "BR";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(5px)", scale: 1.03 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* LOGO */}
        <motion.div 
           className="relative z-10"
           animate={requirePassword && !unlocked ? {} : { scale: [1, 1.05, 1] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-[18px] object-contain bg-white shadow-sm border border-gray-100 p-2"
            />
          ) : (
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-[18px] flex items-center justify-center font-bold text-2xl shadow-sm border border-gray-100"
              style={{
                background: brandColor,
                color: contrastColor,
                fontFamily: '"Outfit", sans-serif'
              }}
            >
              {initials}
            </div>
          )}
        </motion.div>

        {/* Dynamic Content: Progress Bar OR Password Gate */}
        <div className="min-h-[140px] pt-6 flex flex-col items-center justify-start w-full">
          <AnimatePresence mode="wait">
            {requirePassword && !unlocked ? (
              <motion.div
                key="password-gate"
                className="w-full flex flex-col gap-4 text-center mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div>
                   <h2 className="text-lg md:text-xl font-semibold text-[var(--text)] tracking-tight" style={{ fontFamily: '"Outfit", sans-serif' }}>
                     {t.passwordTitle}
                   </h2>
                   <p className="text-xs md:text-sm text-gray-500 mt-1">{t.passwordHint}</p>
                </div>

                <div className="relative mt-2">
                  <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleVerifyPassword();
                      }}
                      placeholder={t.passwordPlaceholder}
                      autoFocus
                      className="w-full h-12 px-4 bg-gray-50/80 border border-gray-200 rounded-xl text-[var(--text)] text-sm placeholder:text-gray-400 outline-none transition-all focus:border-[var(--orange)] focus:bg-white focus:ring-4 focus:ring-[var(--orange)]/10"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                    <AnimatePresence>
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        className="text-xs text-red-500 mt-2 text-left px-1"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={handleVerifyPassword}
                  disabled={!password.trim() || isVerifying}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm hover:shadow-md hover:opacity-95"
                  style={{
                    background: brandColor,
                    color: contrastColor,
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                    {isVerifying ? (
                      <motion.div
                        className="w-4 h-4 border-2 rounded-full border-current border-t-transparent origin-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      t.passwordButton
                    )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                 key="progress-bar"
                 className="w-32 h-[3px] bg-gray-100 rounded-full overflow-hidden mt-6"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0, transition: { duration: 0.2 } }}
                 transition={{ duration: 0.3 }}
              >
                 <motion.div
                   className="h-full rounded-full"
                   style={{ background: brandColor }}
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   onAnimationComplete={() => {
                     // small delay for UX before dismissing
                     setTimeout(() => onComplete?.(), 400);
                   }}
                 />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
