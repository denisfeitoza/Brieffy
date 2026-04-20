"use client";

/**
 * DynamicInput — ORCHESTRATOR
 *
 * This file is intentionally slim (~200 lines).
 * All rendering logic has been extracted to:
 *   src/components/briefing/inputs/
 *
 * Responsibilities:
 *  1. Manage shared state (selectedMultiples, sliderValue, color wizard, uploads)
 *  2. Synchronize state when activeMessage changes
 *  3. Delegate rendering to the appropriate sub-component
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Message, MultiSliderOption, QuestionType } from "@/lib/types";
import { MultiSliderQuestion } from "@/components/briefing/MultiSliderQuestion";
import { CheckCircle2, Mic } from "lucide-react";
import { useBriefing } from "@/lib/BriefingContext";

import {
  I18N,
  TextAudioInput,
  SingleChoiceInput,
  MultipleChoiceInput,
  SliderInput,
  ColorPickerInput,
  BooleanToggleInput,
  CardSelectorInput,
  FileUploadInput,
} from "./inputs";

// ─── Color Helper ──────────────────────────────────────────────────────────────
async function fetchColorsFromAI(
  type: "main" | "detail",
  hint: string,
  mainColors: string[],
  messages: Message[]
): Promise<string[]> {
  const contextSummary = messages
    .filter((m) => m.userAnswer)
    .slice(-5)
    .map((m) => `${m.content}: ${Array.isArray(m.userAnswer) ? m.userAnswer.join(", ") : m.userAnswer}`)
    .join("\n");

  const res = await fetch("/api/colors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: type === "main" ? "initial" : "detail",
      context: contextSummary,
      hint: hint || undefined,
      mainColors: type === "detail" ? mainColors : undefined,
      keptColors: [],
    }),
  });

  if (!res.ok) throw new Error("Color API failed");
  const data = await res.json();
  const colors: string[] = data.colors || [];
  return colors.filter((c: string) => /^#[0-9A-Fa-f]{6}$/.test(c));
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface DynamicInputProps {
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
  isDiscoveryPhase?: boolean;
  showVoiceTutorial?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function DynamicInput({
  activeMessage,
  inputText,
  setInputText,
  submitAnswer,
  handleSend,
  isLoading,
  isRecording,
  setIsRecording,
  generateMoreOptions,
  isGeneratingMore,
  voiceLanguage = "pt",
  messages = [],
  isDiscoveryPhase = false,
  showVoiceTutorial = false,
}: DynamicInputProps) {
  const t = I18N[voiceLanguage] || I18N["pt"];
  const { isOnboarding } = useBriefing();

  // ── Shared state ──────────────────────────────────────────────────────────────
  const [selectedMultiples, setSelectedMultiples] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState<number[]>([Number(activeMessage.minOption) || 0]);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Color wizard
  const [colorWizardStep, setColorWizardStep] = useState<1 | 2 | 3>(1);
  const [suggestedMainColors, setSuggestedMainColors] = useState<string[]>([]);
  const [selectedMainColors, setSelectedMainColors] = useState<string[]>([]);
  const [mainColors, setMainColors] = useState<string[]>([]);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isFetchingColors, setIsFetchingColors] = useState(false);
  const [colorHint, setColorHint] = useState("");
  const [showHintInput, setShowHintInput] = useState(false);

  // ── Sync state when message changes ──────────────────────────────────────────
  useEffect(() => {
    const ans = activeMessage.userAnswer;
    const isEditing = ans !== undefined && ans !== null;
    if (isLoading || isSubmittingLocal) return;

    if (activeMessage.questionType === "multiple_choice" || activeMessage.questionType === "card_selector") {
      if (isEditing && Array.isArray(ans)) {
        setSelectedMultiples(ans as string[]);
        setInputText("");
      } else if (isEditing && typeof ans === "string") {
        setSelectedMultiples([]);
        setInputText(ans);
      } else {
        setSelectedMultiples([]);
        setInputText("");
      }
    } else if (activeMessage.questionType === "color_picker") {
      if (isEditing && Array.isArray(ans) && (ans as string[]).length >= 2) {
        const mc = Math.min(2, Math.ceil((ans as string[]).length / 2));
        setMainColors((ans as string[]).slice(0, mc));
        setSelectedMainColors((ans as string[]).slice(0, mc));
        setSuggestedMainColors((ans as string[]).slice(0, mc));
        setSelectedSuggestions((ans as string[]).slice(mc));
        setSuggestedColors((ans as string[]).slice(mc));
        setColorWizardStep(1);
      } else {
        setColorWizardStep(1);
        setSuggestedMainColors([]);
        setSelectedMainColors([]);
        setMainColors([]);
        setSuggestedColors([]);
        setSelectedSuggestions([]);
      }
    } else if (activeMessage.questionType === "slider") {
      if (isEditing && typeof ans === "number") {
        setSliderValue([ans]);
      } else if (isEditing && typeof ans === "string") {
        setSliderValue([parseInt((ans as string).replace("+", ""), 10) || Number(activeMessage.minOption) || 0]);
      } else {
        setSliderValue([Number(activeMessage.minOption) || 0]);
      }
    } else {
      if (isEditing && typeof ans === "string") setInputText(ans);
      else setInputText("");
    }
    setIsSubmittingLocal(false);
    // Include userAnswer so going back to a previously-answered question rehydrates
    // the saved answer (was being missed: deps were [id, questionType] only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessage.id, activeMessage.questionType, activeMessage.userAnswer]);

  useEffect(() => {
    if (!isLoading) setIsSubmittingLocal(false);
  }, [isLoading]);

  // ── Color fetch helpers ────────────────────────────────────────────────────────
  const fetchInitialColors = async () => {
    setIsFetchingColors(true);
    try {
      const colors = await fetchColorsFromAI("main", colorHint, [], messages);
      setSuggestedMainColors(colors);
    } catch (e) {
      console.error("fetchInitialColors error:", e);
      toast.error('Não foi possível sugerir cores agora. Tente novamente.');
    } finally {
      setIsFetchingColors(false);
    }
  };

  const fetchDetailColors = async () => {
    const mains = selectedMainColors.length > 0 ? selectedMainColors : mainColors;
    setMainColors(mains);
    setColorWizardStep(2);
    setIsFetchingColors(true);
    try {
      const colors = await fetchColorsFromAI("detail", colorHint, mains, messages);
      setSuggestedColors(colors);
    } catch (e) {
      console.error("fetchDetailColors error:", e);
    } finally {
      setIsFetchingColors(false);
    }
  };

  // ── Shared handlers ────────────────────────────────────────────────────────────
  const doSubmit = (answer: string | string[] | number) => {
    if (typeof answer === "string" && !answer.trim()) return;
    if (Array.isArray(answer) && answer.length === 0) return;
    setIsSubmittingLocal(true);
    submitAnswer(answer);
  };

  const handleLocalSend = () => {
    if (questionType === "multiple_choice" || questionType === "card_selector") {
      if (selectedMultiples.length > 0 || inputText.trim()) {
        setIsSubmittingLocal(true);
        const finalAnswer = [...selectedMultiples];
        if (inputText.trim() && !selectedMultiples.includes(inputText.trim())) {
          finalAnswer.push(inputText.trim());
        }
        submitAnswer(finalAnswer);
        setInputText("");
        return;
      }
    }
    if (!inputText.trim() && !activeMessage.userAnswer && selectedMultiples.length === 0) return;
    setIsSubmittingLocal(true);
    handleSend();
  };

  const handleAddCustomText = () => {
    if (!inputText.trim()) return;
    if (!selectedMultiples.includes(inputText.trim())) {
      setSelectedMultiples([...selectedMultiples, inputText.trim()]);
    }
    setInputText("");
  };

  // ── Question type resolution ───────────────────────────────────────────────────
  let questionTypeStr: string =
    activeMessage.questionType || (activeMessage.options?.length ? "single_choice" : "text");
  if (questionTypeStr === "multi_choice") questionTypeStr = "multiple_choice";
  if (questionTypeStr === "boolean") questionTypeStr = "boolean_toggle";
  if (
    (questionTypeStr === "single_choice" ||
      questionTypeStr === "multiple_choice" ||
      questionTypeStr === "card_selector" ||
      questionTypeStr === "multi_slider") &&
    (!activeMessage.options || activeMessage.options.length === 0)
  ) {
    questionTypeStr = "text";
  }
  const questionType = questionTypeStr as QuestionType;

  const hasAnswered = Boolean(
    activeMessage.userAnswer &&
      !inputText &&
      questionType !== "color_picker" &&
      questionType !== "boolean_toggle" &&
      questionType !== "slider" &&
      questionType !== "multi_slider"
  );

  const msgText = activeMessage.content?.toLowerCase() || "";
  const isFontSelection =
    msgText.includes("tipografi") || (msgText.includes("fonte") && !msgText.includes("inspiraç"));

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Already-answered badge */}
      {hasAnswered && (
        <div className="flex mb-6 mt-[-10px]">
          <div className="bg-[var(--bg2)] text-[var(--text2)] px-4 py-3 rounded-2xl flex items-center gap-3 border border-[var(--bd)] shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>
              {Array.isArray(activeMessage.userAnswer)
                ? activeMessage.userAnswer.join(", ")
                : activeMessage.userAnswer}
            </span>
          </div>
        </div>
      )}

      {/* Sub-component dispatch */}
      {questionType === "text" && (
        <>
          <TextAudioInput
            inputText={inputText}
            setInputText={setInputText}
            onSubmit={handleLocalSend}
            isLoading={isLoading}
            isSubmittingLocal={isSubmittingLocal}
            hasUserAnswer={Boolean(activeMessage.userAnswer)}
            voiceLanguage={voiceLanguage}
            isDiscoveryPhase={isDiscoveryPhase}
            showVoiceTutorial={showVoiceTutorial}
          />
          <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
            <div className="flex items-center gap-1.5 text-[var(--orange)] text-xs font-medium animate-in fade-in duration-700">
              <Mic className="w-3.5 h-3.5" />
              <span>{t.audioHint}</span>
            </div>
            <div className="text-[var(--text2)] font-inter text-sm hidden sm:flex gap-4 px-2 items-center justify-center w-full">
              <span>
                <b className="font-semibold text-[var(--text3)]">Enter</b> {t.enterToSend}
              </span>
              <span>
                <b className="font-semibold text-[var(--text3)]">Shift + Enter</b> {t.shiftToSkip}
              </span>
            </div>
          </div>
        </>
      )}

      {questionType === "single_choice" && (
        <SingleChoiceInput
          activeMessage={activeMessage}
          inputText={inputText}
          setInputText={setInputText}
          doSubmit={doSubmit}
          handleLocalSend={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          generateMoreOptions={generateMoreOptions}
          isGeneratingMore={isGeneratingMore}
          voiceLanguage={voiceLanguage}
          t={t}
        />
      )}

      {questionType === "multiple_choice" && (
        <MultipleChoiceInput
          activeMessage={activeMessage}
          inputText={inputText}
          setInputText={setInputText}
          selectedMultiples={selectedMultiples}
          setSelectedMultiples={setSelectedMultiples}
          handleLocalSend={handleLocalSend}
          handleAddCustomText={handleAddCustomText}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
          t={t}
          isFontSelection={isFontSelection}
        />
      )}

      {questionType === "slider" && (
        <SliderInput
          min={Number(activeMessage.minOption) || 0}
          max={Number(activeMessage.maxOption) || 100}
          value={sliderValue}
          onChange={setSliderValue}
          onConfirm={(val) => doSubmit(val >= (Number(activeMessage.maxOption) || 100) ? `+${val}` : val)}
          inputText={inputText}
          setInputText={setInputText}
          handleLocalSend={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
          t={t}
        />
      )}

      {questionType === "color_picker" && (
        <ColorPickerInput
          colorWizardStep={colorWizardStep}
          suggestedMainColors={suggestedMainColors}
          selectedMainColors={selectedMainColors}
          mainColors={mainColors}
          suggestedColors={suggestedColors}
          selectedSuggestions={selectedSuggestions}
          isFetchingColors={isFetchingColors}
          colorHint={colorHint}
          showHintInput={showHintInput}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          isOnboarding={Boolean(isOnboarding)}
          userAnswer={activeMessage.userAnswer}
          setColorWizardStep={setColorWizardStep}
          setSuggestedMainColors={setSuggestedMainColors}
          setSelectedMainColors={setSelectedMainColors}
          setSuggestedColors={setSuggestedColors}
          setSelectedSuggestions={setSelectedSuggestions}
          setColorHint={setColorHint}
          setShowHintInput={setShowHintInput}
          fetchInitialColors={fetchInitialColors}
          fetchDetailColors={fetchDetailColors}
          doSubmit={doSubmit}
          t={t}
        />
      )}

      {questionType === "boolean_toggle" && (
        <BooleanToggleInput
          onSelect={doSubmit}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          initialAnswer={
            activeMessage.userAnswer
              ? Array.isArray(activeMessage.userAnswer)
                ? String(activeMessage.userAnswer[0])
                : String(activeMessage.userAnswer)
              : null
          }
          inputText={inputText}
          setInputText={setInputText}
          handleLocalSend={handleLocalSend}
          voiceLanguage={voiceLanguage}
          t={t}
        />
      )}

      {questionType === "card_selector" && (
        <CardSelectorInput
          activeMessage={activeMessage}
          inputText={inputText}
          setInputText={setInputText}
          selectedMultiples={selectedMultiples}
          setSelectedMultiples={setSelectedMultiples}
          handleLocalSend={handleLocalSend}
          handleAddCustomText={handleAddCustomText}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          generateMoreOptions={generateMoreOptions}
          isGeneratingMore={isGeneratingMore}
          voiceLanguage={voiceLanguage}
          isFontSelection={isFontSelection}
          t={t}
        />
      )}

      {questionType === "file_upload" && (
        <FileUploadInput
          inputText={inputText}
          setInputText={setInputText}
          handleLocalSend={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          doSubmit={doSubmit}
          voiceLanguage={voiceLanguage}
          t={t}
        />
      )}

      {questionType === "multi_slider" && (
        <MultiSliderQuestion
          sliders={(activeMessage.options || []).map((opt: unknown) => {
            const o = opt as MultiSliderOption;
            return {
              label: o.label || "Dimension",
              min: Number(o.min) || 1,
              max: Number(o.max) || 5,
              minLabel: o.minLabel || "",
              maxLabel: o.maxLabel || "",
              defaultValue: o.defaultValue,
            };
          })}
          onConfirm={(values) => doSubmit(JSON.stringify(values))}
          disabled={isLoading || isSubmittingLocal}
          confirmLabel={t.confirmSelection}
          initialValues={
            activeMessage.userAnswer
              ? (() => {
                  try {
                    return JSON.parse(String(activeMessage.userAnswer));
                  } catch {
                    return undefined;
                  }
                })()
              : undefined
          }
        />
      )}
    </div>
  );
}
