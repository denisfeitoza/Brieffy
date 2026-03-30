export type BriefingState = {
  // Campos dinâmicos baseados no template
  [key: string]: unknown;
};

export type QuestionType = 
  | 'text'              // Campo de input de texto ou áudio (padrão)
  | 'single_choice'     // Escolha única (Botões grandes ou Radio)
  | 'multiple_choice'   // Escolhas múltiplas (Checkboxes)
  | 'slider'            // Slider (0-10 ou 0-100)
  | 'color_picker'      // Escolha de paleta base de cores
  | 'card_selector'     // Seleção única com Cards grandes (título, texto)
  | 'boolean_toggle'    // Chave tipo Yes/No neon
  | 'file_upload'       // Dropzone para upload de arquivos (ex: logotipo, PDF)
  | 'multi_slider';     // Múltiplos sliders em uma só pergunta (ex: perfil de marketing)

export type MultiSliderOption = {
  label: string;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  defaultValue?: number;
};

// ================================================================
// ACTIVE LISTENING — Signal types for intelligent depth probing
// ================================================================
export type SignalCategory = 
  | 'contradiction'    // Says one thing, implies another
  | 'implicit_pain'    // Frustration hidden between the lines
  | 'evasion'          // Deflects or avoids a topic
  | 'hidden_ambition'  // Accidentally reveals a big dream
  | 'strategic_gap';   // Missing knowledge they should have

export type BriefingSignal = {
  id: string;
  category: SignalCategory;
  summary: string;          // Short description of what was detected
  source_answer: string;    // The answer that triggered this signal
  relevance_score: number;  // 0.0–1.0 relevance to briefing purpose
  step_index: number;       // Which step triggered this
  timestamp: number;        // Date.now()
};

export type Message = {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  type?: 'question' | 'suggestion' | 'insight' | 'assets';
  
  // Dynamic UI Rendering
  questionType?: QuestionType;
  options?: unknown[]; // Opções para choices, colors ou cards (objetos)
  allowMoreOptions?: boolean; 
  minOption?: number; // Para slider
  maxOption?: number; // Para slider
  
  userAnswer?: string | string[] | number; // O que o usuario respondeu

  // Active Listening: marks intercalated depth probe questions
  isDepthQuestion?: boolean;
  depthSignalCategory?: SignalCategory;

  // Consultant Persona: micro-insight from AI between questions
  microFeedback?: string;
};

export type BasalCoverageInfo = {
  basalCoverage: number; // 0.0 a 1.0
  currentSection: string;
  basalFieldsCollected: string[];
  basalFieldsMissing: string[];
};

export type SuggestedQuestion = {
  text: string;
  questionType: QuestionType;
  section: string;
  options?: unknown[];
  field: string;
};

export type TemplateSection = {
  id: string;
  title: string;
  priority: number;
};

export type FinalAssets = {
  slogans?: string[];
  cores?: { name: string; hex: string }[];
  score?: {
    clareza_marca: number;
    clareza_dono: number;
    publico: number;
    maturidade: number;
  };
  insights?: string[];
  estrategia?: string;
  document?: string; // The final generated briefing document (Markdown)
};

export type BrandingInfo = {
  display_name: string;
  company_name: string;
  logo_url: string;
  brand_color: string;
  brand_accent: string;
  tagline: string;
  website: string;
  brand_font?: string;
};

export type PackageDetail = {
  slug: string;
  name: string;
  icon: string;
  department: string;
  tier?: string;
  briefing_purpose?: string;
};

export type BriefingContextType = {
  briefingState: BriefingState;
  updateBriefingState: (updates: Partial<BriefingState>) => void;
  messages: Message[];
  currentStepIndex: number;
  goBack: () => void;
  goNext: () => void;
  addMessage: (message: Omit<Message, 'id'>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isGeneratingMore: boolean;
  isFinished: boolean;
  isUploadStep: boolean;
  setIsFinished: (finished: boolean) => void;
  finishBriefing: () => void;
  assets: FinalAssets | null;
  setAssets: (assets: FinalAssets) => void;
  submitAnswer: (answer: string | string[] | number) => Promise<void>;
  generateMoreOptions: () => Promise<void>;
  basalInfo: BasalCoverageInfo;
  chosenLanguage: string; // ISO code from initial language selection (pt, en, es)
  generatedDocument: string | null;
  isGeneratingDocument: boolean;
  documentError: string | null;
  generateDocument: () => Promise<void>;
  selectedPackages: string[];
  selectedPackageDetails: PackageDetail[];
  branding: BrandingInfo;
  editToken: string | null;
  editPassphrase: string | null;
  isOnboarding?: boolean;
  isOwner: boolean; // true = agency owner can see InsightsPanel; false = client respondent
  // Active Listening
  detectedSignals: BriefingSignal[];
  // Consultant Persona
  engagementLevel: 'high' | 'medium' | 'low';
};
