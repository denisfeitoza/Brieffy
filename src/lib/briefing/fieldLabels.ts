/**
 * Centralized field labels, grouping, and formatting for briefing company_info data.
 * Used by CollectedBriefingData, Visão Geral (strong/weak fields), and anywhere
 * structured briefing data needs human-readable presentation.
 */

// ================================================================
// BASAL FIELD LABELS — Must mirror UNIVERSAL_BASAL_FIELDS in route.ts
// ================================================================
export const BASAL_FIELD_LABELS: Record<string, { pt: string; en: string; es: string }> = {
  company_name:                { pt: 'Nome da Empresa',           en: 'Company Name',              es: 'Nombre de la Empresa' },
  sector_segment:              { pt: 'Segmento / Setor',          en: 'Sector / Segment',          es: 'Sector / Segmento' },
  company_age:                 { pt: 'Tempo de Mercado',          en: 'Time in Market',            es: 'Tiempo en el Mercado' },
  services_offered:            { pt: 'Serviços Oferecidos',       en: 'Services Offered',          es: 'Servicios Ofrecidos' },
  owner_relationship:          { pt: 'Relação do Fundador',       en: "Founder's Relationship",    es: 'Relación del Fundador' },
  brand_name_meaning:          { pt: 'Significado da Marca',      en: 'Brand Name Meaning',        es: 'Significado de la Marca' },
  keywords:                    { pt: 'Palavras-Chave',            en: 'Keywords',                  es: 'Palabras Clave' },
  mission_vision_values:       { pt: 'Missão, Visão e Valores',   en: 'Mission, Vision & Values',  es: 'Misión, Visión y Valores' },
  target_audience_demographics:{ pt: 'Público-Alvo',              en: 'Target Audience',           es: 'Público Objetivo' },
  competitors:                 { pt: 'Concorrentes',              en: 'Competitors',               es: 'Competidores' },
  competitive_differentiator:  { pt: 'Diferenciais Competitivos', en: 'Competitive Differentiators',es: 'Diferenciadores Competitivos' },
  communication_channels:      { pt: 'Canais de Comunicação',     en: 'Communication Channels',    es: 'Canales de Comunicación' },
  geographic_reach:            { pt: 'Abrangência Geográfica',    en: 'Geographic Reach',          es: 'Alcance Geográfico' },
  brand_personality:           { pt: 'Personalidade da Marca',    en: 'Brand Personality',         es: 'Personalidad de la Marca' },
  tone_of_voice:               { pt: 'Tom de Voz',                en: 'Tone of Voice',             es: 'Tono de Voz' },
};

// ================================================================
// FIELD GROUPS — Mirrors SECTION_PIPELINE in route.ts
// ================================================================
export interface FieldGroup {
  id: string;
  label: { pt: string; en: string; es: string };
  fields: string[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'company',
    label: { pt: 'Sobre a Empresa', en: 'About the Company', es: 'Sobre la Empresa' },
    fields: ['company_name', 'sector_segment', 'company_age', 'services_offered', 'owner_relationship'],
  },
  {
    id: 'market',
    label: { pt: 'Mercado & Posicionamento', en: 'Market & Positioning', es: 'Mercado & Posicionamiento' },
    fields: ['competitors', 'competitive_differentiator', 'geographic_reach'],
  },
  {
    id: 'audience',
    label: { pt: 'Público-Alvo', en: 'Target Audience', es: 'Público Objetivo' },
    fields: ['target_audience_demographics'],
  },
  {
    id: 'identity',
    label: { pt: 'Identidade & Personalidade', en: 'Identity & Personality', es: 'Identidad & Personalidad' },
    fields: ['brand_name_meaning', 'keywords', 'mission_vision_values', 'brand_personality', 'tone_of_voice'],
  },
  {
    id: 'communication',
    label: { pt: 'Comunicação', en: 'Communication', es: 'Comunicación' },
    fields: ['communication_channels'],
  },
];

// All known basal field keys — used for partitioning basal vs extras
const ALL_BASAL_KEYS = new Set(Object.keys(BASAL_FIELD_LABELS));

// ================================================================
// HUMANIZE FIELD KEY — Fallback for unknown keys
// ================================================================
export function humanizeFieldKey(key: string, lang: string = 'pt'): string {
  const mapped = BASAL_FIELD_LABELS[key];
  if (mapped) return mapped[lang as keyof typeof mapped] || mapped.pt;

  // Fallback: snake_case → Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ================================================================
// FORMAT FIELD VALUE — Smart rendering for different value types
// ================================================================
const URL_REGEX = /^https?:\/\//i;
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type FormattedValue =
  | { type: 'text'; value: string }
  | { type: 'tags'; values: string[] }
  | { type: 'url'; url: string; label: string }
  | { type: 'color'; hex: string }
  | { type: 'keyvalue'; entries: { key: string; value: string }[] }
  | { type: 'empty' };

export function formatFieldValue(value: unknown): FormattedValue {
  if (value === null || value === undefined || value === '') {
    return { type: 'empty' };
  }

  // String values
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return { type: 'empty' };
    if (HEX_COLOR_REGEX.test(trimmed)) return { type: 'color', hex: trimmed };
    if (URL_REGEX.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        return { type: 'url', url: trimmed, label: url.hostname };
      } catch {
        return { type: 'text', value: trimmed };
      }
    }
    return { type: 'text', value: trimmed };
  }

  // Number / Boolean
  if (typeof value === 'number' || typeof value === 'boolean') {
    return { type: 'text', value: String(value) };
  }

  // Arrays → tags
  if (Array.isArray(value)) {
    const stringVals = value
      .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .filter(Boolean);
    if (stringVals.length === 0) return { type: 'empty' };
    // If only one long entry, treat as text
    if (stringVals.length === 1 && stringVals[0].length > 80) {
      return { type: 'text', value: stringVals[0] };
    }
    return { type: 'tags', values: stringVals };
  }

  // Objects → key:value pairs
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({
        key: humanizeFieldKey(k),
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
    if (entries.length === 0) return { type: 'empty' };
    return { type: 'keyvalue', entries };
  }

  return { type: 'text', value: String(value) };
}

// ================================================================
// PARTITION COMPANY INFO — Split into grouped basals + extras
// ================================================================
export interface PartitionedData {
  groups: {
    id: string;
    label: string;
    fields: { key: string; label: string; value: FormattedValue }[];
    filledCount: number;
    totalCount: number;
  }[];
  extras: { key: string; label: string; value: FormattedValue }[];
}

export function partitionCompanyInfo(
  data: Record<string, unknown> | null | undefined,
  lang: string = 'pt'
): PartitionedData {
  if (!data || typeof data !== 'object') {
    return { groups: [], extras: [] };
  }

  const usedKeys = new Set<string>();

  const groups = FIELD_GROUPS.map((group) => {
    const fields = group.fields.map((key) => {
      usedKeys.add(key);
      return {
        key,
        label: humanizeFieldKey(key, lang),
        value: formatFieldValue(data[key]),
      };
    });

    const filledCount = fields.filter((f) => f.value.type !== 'empty').length;

    return {
      id: group.id,
      label: group.label[lang as keyof typeof group.label] || group.label.pt,
      fields,
      filledCount,
      totalCount: fields.length,
    };
  });

  // Extras: keys not in any basal group
  const extras = Object.entries(data)
    .filter(([key]) => !usedKeys.has(key) && !ALL_BASAL_KEYS.has(key))
    .filter(([, val]) => {
      const formatted = formatFieldValue(val);
      return formatted.type !== 'empty';
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      key,
      label: humanizeFieldKey(key, lang),
      value: formatFieldValue(val),
    }));

  return { groups, extras };
}
