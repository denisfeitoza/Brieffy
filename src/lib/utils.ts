import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getContrastColor(hexcolor: string) {
  if (!hexcolor) return "#ffffff";
  const hex = hexcolor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
  const fullHex = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex;
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
