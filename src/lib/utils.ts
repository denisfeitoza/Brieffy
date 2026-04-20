import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getContrastColor(hexcolor: string | null | undefined): string {
  // Bulletproof against undefined/null/non-strings/garbage hex (the previous
  // version returned NaN -> "#NaNNaNNaN" which broke text rendering).
  if (typeof hexcolor !== "string" || !hexcolor) return "#ffffff";
  const hex = hexcolor.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const fullHex = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex;
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return "#ffffff";
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
