import { memo } from "react";
import Image from "next/image";
import { getContrastColor } from "@/lib/utils";

export const BrandedLogo = memo(function BrandedLogo({
  branding,
  size = 'md',
  isSolid = false
}: {
  branding: { logo_url?: string; company_name?: string; brand_color?: string };
  size?: 'sm' | 'md',
  isSolid?: boolean
}) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const sizePx = size === 'sm' ? 32 : 40;
  const companyName = branding.company_name || '';
  const initials = companyName
    ? companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AI';

  if (branding.logo_url) {
    return (
      <Image
        src={branding.logo_url}
        alt={companyName}
        width={sizePx}
        height={sizePx}
        unoptimized={branding.logo_url.endsWith('.svg')}
        className={`${sizeClasses} flex-shrink-0 rounded-xl object-contain bg-[var(--bg2)] border border-[var(--bd)] p-0.5 shadow-sm`}
      />
    );
  }

  const contrastColor = getContrastColor(branding.brand_color || '#000000');
  const fallbackBg = isSolid ? (contrastColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : `linear-gradient(135deg, ${branding.brand_color}40, ${branding.brand_color}20)`;
  const fallbackColor = isSolid ? contrastColor : branding.brand_color;

  return (
    <div
      className={`${sizeClasses} flex-shrink-0 rounded-xl flex items-center justify-center font-bold border ${isSolid ? 'border-transparent' : 'border-[var(--bd)]'}`}
      style={{ background: fallbackBg, color: fallbackColor }}
    >
      {initials}
    </div>
  );
});
