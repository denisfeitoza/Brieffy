"use client";

import { motion } from "framer-motion";
import {
  Megaphone,
  Code2,
  Lightbulb,
  FolderKanban,
} from "lucide-react";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const AUDIENCES = [
  {
    icon: Megaphone,
    title: "Agências de Marketing",
    subtitle: "De onboarding a escopo completo",
    color: "#f59e0b",
    arguments: [
      "Onboarding de cliente em 5 minutos — não em 2 horas de reunião",
      "Briefings padronizados em toda a equipe",
      "White-label: seu logo, suas cores, sua experiência",
      "Score automático de maturidade do cliente",
      "Extraia posicionamento, público e dores sem esforço",
    ],
  },
  {
    icon: Lightbulb,
    title: "Consultorias",
    subtitle: "Diagnóstico inteligente de negócios",
    color: "#a855f7",
    arguments: [
      "Diagnóstico estruturado em minutos, não semanas",
      "IA extrai insights das entrelinhas automaticamente",
      "Documento profissional pronto para apresentar",
      "Combine Skills: Strategy + Branding + CX em um briefing",
      "Identifique gaps estratégicos que o cliente não percebe",
    ],
  },
  {
    icon: Code2,
    title: "Software Houses",
    subtitle: "Escopo técnico sem ambiguidade",
    color: ACCENT,
    arguments: [
      "Capture requisitos técnicos com a skill Web/App Briefing",
      "Eliminação de retrabalho por briefing incompleto",
      "Skills de IA & Automação para entender processos",
      "Output estruturado que alimenta seu backlog",
      "Envie o link e receba o escopo completo",
    ],
  },
  {
    icon: FolderKanban,
    title: "Gestores de Projeto",
    subtitle: "Extração de requisitos escalável",
    color: "#10b981",
    arguments: [
      "Padronize a coleta de informações entre equipes",
      "Histórico completo de todas as sessões de briefing",
      "Compartilhe via link — sem instalar nada",
      "Multi-idioma automático para projetos globais",
      "Integre insights ao seu pipeline de projetos",
    ],
  },
];

const containerVars = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVars = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function AudienceCards() {
  return (
    <section id="audience" className="relative py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs uppercase tracking-[0.2em] font-semibold mb-4 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Para Quem
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Feito para quem precisa de
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              briefings de verdade
            </span>
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          variants={containerVars}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {AUDIENCES.map((aud) => {
            const Icon = aud.icon;
            return (
              <motion.div
                key={aud.title}
                className="group relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8 hover:border-white/[0.12] transition-all duration-500 cursor-default overflow-hidden"
                variants={cardVars}
                whileHover={{ y: -4 }}
              >
                {/* Hover glow */}
                <div
                  className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl"
                  style={{ background: `${aud.color}15` }}
                />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: `${aud.color}12`,
                        border: `1px solid ${aud.color}25`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: aud.color }} />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold text-white"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                      >
                        {aud.title}
                      </h3>
                      <p className="text-xs text-neutral-500">{aud.subtitle}</p>
                    </div>
                  </div>

                  {/* Arguments list */}
                  <ul className="space-y-2.5">
                    {aud.arguments.map((arg, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-neutral-400"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 + 0.4 }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                          style={{ background: aud.color }}
                        />
                        <span>{arg}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
