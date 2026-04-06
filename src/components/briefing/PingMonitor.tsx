"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";

export function PingMonitor() {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const doPing = async () => {
      const start = Date.now();
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-store' });
        if (isMounted) {
          setPing(Date.now() - start);
        }
      } catch (e) {
        // Ignora erros silenciosamente
      }
    };
    
    doPing();
    // Atualização bem mais rápida a cada 2 segundos
    const interval = setInterval(doPing, 2000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (ping === null) return null;

  const isHealthy = ping < 200;
  const isWarning = ping >= 200 && ping < 500;
  
  const iconColor = isHealthy ? 'text-[var(--orange)]' : isWarning ? 'text-orange-400' : 'text-red-500';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-[var(--bd)] bg-white cursor-default transition-colors hover:bg-gray-50 shadow-sm"
      title={`Latência da sessão: ${ping}ms`}
    >
      <Wifi className={`w-2.5 h-2.5 md:w-3 md:h-3 ${iconColor}`} strokeWidth={3} />
      <span className="font-semibold text-[7px] md:text-[8px] text-[var(--text2)] uppercase tracking-widest pt-[1px] tabular-nums min-w-[24px] md:min-w-[28px] text-right">{ping}ms</span>
    </motion.div>
  );
}
