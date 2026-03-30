// Shared I18N and types for all DynamicInput sub-components
import type { Message } from "@/lib/types";

export const I18N: Record<string, Record<string, string>> = {
  pt: {
    transcribing: "Transcrevendo áudio...",
    addExtra: "Adicione um comentário extra ou opção...",
    typeFree: "Ou digite sua resposta livremente...",
    selectOnlyOne: "Selecione",
    onlyOneLabel: "apenas 1 (uma)",
    optionLabel: "opção:",
    otherOptions: "Outras Opções",
    addDetails: "Adicione detalhes via texto ou áudio (opcional):",
    confirmSelection: "Confirmar Seleção",
    exactValue: "Ou digite o valor exato no campo abaixo:",
    next: "Avançar",
    step1Title: "Passo 1: Cores Principais",
    step1Sub: "Escolha as 2 cores primárias da sua marca",
    primary: "Principal",
    fetching: "Buscando combinações...",
    step2Title: "Passo 2: Cores Complementares",
    step2Sub: "A IA sugeriu estas 4 cores baseadas nas principais. Selecione exatamente 2 cores.",
    back: "Voltar",
    generating: "Gerando...",
    generateMore: "Gerar Mais",
    continue: "Continuar",
    step3Title: "Passo 3: Cores de Detalhe",
    step3Sub: "Escolha 2 cores adicionais para botões secundários, fundos leves, etc.",
    detail: "Detalhe",
    finishPalette: "Finalizar Paleta",
    yes: "SIM",
    no: "NÃO",
    moreDetails: "Ou dê mais detalhes se preferir:",
    suggestRoutes: "Sugerir outras rotas",
    adjustPalette: "Ou ajuste a paleta com suas palavras:",
    yourResponse: "Sua Resposta",
    dragFiles: "Arraste seus arquivos aqui ou clique",
    sendingFile: "Enviando arquivo...",
    fileTooLarge: "O arquivo não pode ter mais de 5MB.",
    fileUploadError: "Houve um erro ao subir o arquivo. Tente novamente.",
    orTypeFile: "Ou se preferir não enviar nada agora, basta digitar algo:",
    enterToSend: "para enviar",
    shiftToSkip: "pular ou próximo",
    viewOptions: "Ver opções",
  },
  en: {
    transcribing: "Transcribing audio...",
    addExtra: "Add an extra comment or option...",
    typeFree: "Or type your answer freely...",
    selectOnlyOne: "Select",
    onlyOneLabel: "only 1",
    optionLabel: "option:",
    otherOptions: "Other Options",
    addDetails: "Add details via text or audio (optional):",
    confirmSelection: "Confirm Selection",
    exactValue: "Or type the exact value below:",
    next: "Next",
    step1Title: "Step 1: Main Colors",
    step1Sub: "Choose the 2 primary colors of your brand",
    primary: "Primary",
    fetching: "Fetching combinations...",
    step2Title: "Step 2: Complementary Colors",
    step2Sub: "AI suggested these 4 colors based on the main ones. Select exactly 2 colors.",
    back: "Back",
    generating: "Generating...",
    generateMore: "Generate More",
    continue: "Continue",
    step3Title: "Step 3: Detail Colors",
    step3Sub: "Choose 2 additional colors for secondary buttons, light backgrounds, etc.",
    detail: "Detail",
    finishPalette: "Finish Palette",
    yes: "YES",
    no: "NO",
    moreDetails: "Or provide more details if you prefer:",
    suggestRoutes: "Suggest other routes",
    adjustPalette: "Or adjust the palette with your words:",
    yourResponse: "Your Response",
    dragFiles: "Drag your files here or click",
    sendingFile: "Uploading file...",
    fileTooLarge: "File cannot be larger than 5MB.",
    fileUploadError: "There was an error uploading the file. Please try again.",
    orTypeFile: "Or if you prefer not to send anything now, just type something:",
    enterToSend: "to send",
    shiftToSkip: "skip or next",
    viewOptions: "View options",
  },
  es: {
    transcribing: "Transcribiendo audio...",
    addExtra: "Agregue un comentario u opción extra...",
    typeFree: "O escriba su respuesta libremente...",
    selectOnlyOne: "Seleccione",
    onlyOneLabel: "solo 1",
    optionLabel: "opción:",
    otherOptions: "Otras Opciones",
    addDetails: "Agregue detalles vía texto o audio (opcional):",
    confirmSelection: "Confirmar Selección",
    exactValue: "O escriba el valor exacto a continuación:",
    next: "Avanzar",
    step1Title: "Paso 1: Colores Principales",
    step1Sub: "Elija los 2 colores primarios de su marca",
    primary: "Principal",
    fetching: "Buscando combinaciones...",
    step2Title: "Paso 2: Colores Complementarios",
    step2Sub: "La IA sugirió estos 4 colores basados en los principales. Seleccione exactamente 2 colores.",
    back: "Volver",
    generating: "Generando...",
    generateMore: "Generar Más",
    continue: "Continuar",
    step3Title: "Paso 3: Colores de Detalle",
    step3Sub: "Elija 2 colores adicionales para botones secundarios, fondos claros, etc.",
    detail: "Detalle",
    finishPalette: "Finalizar Paleta",
    yes: "SÍ",
    no: "NO",
    moreDetails: "O dé más detalles si lo prefiere:",
    suggestRoutes: "Sugerir otras rutas",
    adjustPalette: "O ajuste la paleta con tus palabras:",
    yourResponse: "Tu Respuesta",
    dragFiles: "Arrastra tus archivos aquí o haz clic",
    sendingFile: "Subiendo archivo...",
    fileTooLarge: "El archivo no puede tener más de 5MB.",
    fileUploadError: "Hubo un error al subir el archivo. Inténtalo de nuevo.",
    orTypeFile: "O si prefieres no enviar nada ahora, solo escribe algo:",
    enterToSend: "para enviar",
    shiftToSkip: "omitir o siguiente",
    viewOptions: "Ver opciones",
  },
};

export interface DynamicInputProps {
  activeMessage: Message;
  inputText: string;
  setInputText: (text: string) => void;
  submitAnswer: (answer: string | string[] | number) => void;
  handleSend: () => void;
  isLoading: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  generateMoreOptions: () => void;
  isGeneratingMore: boolean;
  voiceLanguage?: string;
  messages?: Message[];
}

/** Parse raw option into display text and key */
export function parseOption(opt: unknown, idx: number): { text: string; key: string } {
  const optObj = typeof opt === "object" && opt !== null ? (opt as Record<string, unknown>) : null;
  const text = optObj
    ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt))
    : String(opt);
  const key = optObj ? String(optObj.id || text || idx) : String(opt);
  return { text, key };
}
