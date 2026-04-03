"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const getFooterLinks = (t: (key: string) => string) => ({
  [t("footer.col1.title")]: [
    { label: t("footer.col1.link1"), href: "#features" },
    { label: t("footer.col1.link2"), href: "#audience" },
    { label: t("footer.col1.link3"), href: "#how-it-works" },
  ],
  [t("footer.col2.title")]: [
    { label: t("footer.col2.link1"), href: "#" },
    { label: t("footer.col2.link2"), href: "#" },
    { label: t("footer.col2.link3"), href: "#" },
  ],
  [t("footer.col3.title")]: [
    { label: t("footer.col3.link1"), href: "#" },
    { label: t("footer.col3.link2"), href: "#" },
  ],
});

export function LandingFooter() {
  const { t } = useLanguage();
  const footerLinks = getFooterLinks(t);

  return (
    <footer className="relative border-t border-white/[0.06] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                }}
              >
                B
              </div>
              <span
                className="text-lg font-bold text-white tracking-tight"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                Brief
                <span
                  style={{
                    background: `linear-gradient(90deg, ${BRAND}, ${ACCENT})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  fy
                </span>
              </span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
              {t("footer.desc")}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4
                className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-semibold mb-4"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-neutral-500 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-neutral-700">
            © {new Date().getFullYear()} {t("footer.copy")}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-700">
              Powered by
            </span>
            <span
              className="text-xs font-bold"
              style={{
                background: `linear-gradient(90deg, ${BRAND}, ${ACCENT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Brief.i
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
