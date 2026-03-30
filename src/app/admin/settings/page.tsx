"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, Cpu, Mic, Gauge, FileText, Save, 
  Loader2, CheckCircle2, AlertCircle, Zap, Brain, 
  Volume2, Clock, Target 
} from "lucide-react";
import { toast } from "sonner";

interface SettingRow {
  key: string;
  value: string;
  category: string;
  label: string;
  description: string;
  updated_at: string;
}

// Known model options for dropdowns
const LLM_PROVIDERS = [
  { value: "groq", label: "Groq", description: "Ultra-fast inference" },
  { value: "openrouter", label: "OpenRouter", description: "Multi-model gateway" },
];

const GROQ_MODELS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { value: "openai/gpt-oss-safeguard-20b", label: "GPT-OSS Safeguard 20B" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B" },
];

const OPENROUTER_MODELS = [
  { value: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
];

const VOICE_PROVIDERS = [
  { value: "groq", label: "Groq", description: "Fast Whisper inference" },
  { value: "openai", label: "OpenAI", description: "Original Whisper" },
];

const VOICE_MODELS = [
  { value: "whisper-large-v3-turbo", label: "Whisper V3 Turbo" },
  { value: "whisper-large-v3", label: "Whisper Large V3" },
];

const LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "auto", label: "Auto-detect" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
  const [settingsMeta, setSettingsMeta] = useState<Record<string, SettingRow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: SettingRow[] = await res.json();
        
        const map: Record<string, string> = {};
        const meta: Record<string, SettingRow> = {};
        data.forEach((s) => {
          map[s.key] = s.value;
          meta[s.key] = s;
        });
        setSettings(map);
        setOriginalSettings(map);
        setSettingsMeta(meta);
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const changed = Object.keys(settings).some(
      (key) => settings[key] !== originalSettings[key]
    );
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changedSettings = Object.keys(settings)
        .filter((key) => settings[key] !== originalSettings[key])
        .map((key) => ({ key, value: settings[key] }));

      if (changedSettings.length === 0) return;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: changedSettings }),
      });

      if (!res.ok) throw new Error("Save failed");

      setOriginalSettings({ ...settings });
      setHasChanges(false);
      toast.success("Settings saved successfully!", {
        description: `${changedSettings.length} setting(s) updated`,
      });
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
  };

  // Get correct LLM models based on selected provider
  const llmModels = settings.ai_llm_provider === "openrouter" 
    ? OPENROUTER_MODELS 
    : GROQ_MODELS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="text-zinc-400 text-lg">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Global AI Configuration
          </h2>
          <p className="text-zinc-400 mt-2">
            Configure AI providers, models, performance, and briefing parameters for all users.
          </p>
        </div>
        
        {/* Save Button */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Undo
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`rounded-xl px-6 h-11 transition-all ${
              hasChanges
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : hasChanges ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="bg-zinc-900/80 border border-purple-500/10 rounded-xl p-1 h-auto flex-wrap">
          <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300 px-4 py-2.5 gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Intelligence</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300 px-4 py-2.5 gap-2">
            <Volume2 className="w-4 h-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300 px-4 py-2.5 gap-2">
            <Gauge className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf</span>
          </TabsTrigger>
          <TabsTrigger value="briefing" className="rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300 px-4 py-2.5 gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Briefing</span>
            <span className="sm:hidden">Brief</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: AI / LLM */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <Card className="bg-zinc-900/50 backdrop-blur-md border-purple-500/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                LLM Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Provider</Label>
                  <Select 
                    value={settings.ai_llm_provider || "groq"} 
                    onValueChange={(v) => {
                      updateSetting("ai_llm_provider", v || "");
                      // Reset model when changing provider
                      if (v === "groq") updateSetting("ai_llm_model", "openai/gpt-oss-120b");
                      if (v === "openrouter") updateSetting("ai_llm_model", "x-ai/grok-4.1-fast");
                    }}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {LLM_PROVIDERS.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-white focus:bg-purple-500/10 focus:text-purple-300">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-purple-400" />
                            <span>{p.label}</span>
                            <span className="text-zinc-500 text-xs">— {p.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Model</Label>
                  <Select 
                    value={settings.ai_llm_model || ""} 
                    onValueChange={(v) => updateSetting("ai_llm_model", v || "")}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {llmModels.map(m => (
                        <SelectItem key={m.value} value={m.value} className="text-white focus:bg-purple-500/10 focus:text-purple-300">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-zinc-500">
                    Or type a custom model below
                  </p>
                  <Input
                    value={settings.ai_llm_model || ""}
                    onChange={(e) => updateSetting("ai_llm_model", e.target.value)}
                    placeholder="e.g. openai/gpt-oss-120b"
                    className="bg-black/40 border-white/10 rounded-xl h-10 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Temperature */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 text-sm font-medium">
                    Temperature
                  </Label>
                  <span className="text-purple-400 font-mono text-sm font-bold bg-purple-500/10 px-3 py-1 rounded-lg">
                    {settings.ai_llm_temperature || "0"}
                  </span>
                </div>
                <Slider
                  value={[parseFloat(settings.ai_llm_temperature || "0")]}
                  onValueChange={(v) => updateSetting("ai_llm_temperature", (v as number[])[0].toFixed(1))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Deterministic (0)</span>
                  <span>Creative (1)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-medium">Max Tokens</Label>
                <Input
                  type="number"
                  value={settings.ai_llm_max_tokens || "1200"}
                  onChange={(e) => updateSetting("ai_llm_max_tokens", e.target.value)}
                  min={200}
                  max={8000}
                  className="bg-black/40 border-white/10 rounded-xl h-12 text-white font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Maximum tokens in the response. More tokens = longer but slower.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: VOICE */}
        <TabsContent value="voice" className="mt-6 space-y-6">
          <Card className="bg-zinc-900/50 backdrop-blur-md border-purple-500/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Mic className="w-5 h-5 text-indigo-400" />
                </div>
                Voice Transcription (STT)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Provider</Label>
                  <Select 
                    value={settings.ai_voice_provider || "groq"} 
                    onValueChange={(v) => updateSetting("ai_voice_provider", v || "")}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {VOICE_PROVIDERS.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-white focus:bg-indigo-500/10 focus:text-indigo-300">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{p.label}</span>
                            <span className="text-zinc-500 text-xs">— {p.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Model</Label>
                  <Select 
                    value={settings.ai_voice_model || "whisper-large-v3-turbo"} 
                    onValueChange={(v) => updateSetting("ai_voice_model", v || "")}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {VOICE_MODELS.map(m => (
                        <SelectItem key={m.value} value={m.value} className="text-white focus:bg-indigo-500/10 focus:text-indigo-300">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-medium">Default Transcription Language</Label>
                <Select 
                  value={settings.ai_voice_language || "pt"} 
                  onValueChange={(v) => updateSetting("ai_voice_language", v || "")}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {LANGUAGES.map(l => (
                      <SelectItem key={l.value} value={l.value} className="text-white focus:bg-indigo-500/10 focus:text-indigo-300">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-zinc-500">
                  Language used for audio transcription when not specified.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PERFORMANCE */}
        <TabsContent value="performance" className="mt-6 space-y-6">
          <Card className="bg-zinc-900/50 backdrop-blur-md border-purple-500/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Gauge className="w-5 h-5 text-amber-400" />
                </div>
                Performance & Speed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300 text-sm font-medium">History Messages</Label>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      How many previous messages to send to the AI per request.
                    </p>
                  </div>
                  <span className="text-amber-400 font-mono text-sm font-bold bg-amber-500/10 px-3 py-1 rounded-lg">
                    {settings.briefing_max_history || "6"}
                  </span>
                </div>
                <Slider
                  value={[parseInt(settings.briefing_max_history || "6")]}
                  onValueChange={(v) => updateSetting("briefing_max_history", String((v as number[])[0]))}
                  max={20}
                  min={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Minimum (2) — Faster</span>
                  <span>Maximum (20) — More context</span>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300 text-sm font-medium">Request Timeout</Label>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Maximum wait time (ms) before aborting the AI call.
                    </p>
                  </div>
                  <span className="text-amber-400 font-mono text-sm font-bold bg-amber-500/10 px-3 py-1 rounded-lg">
                    {(parseInt(settings.briefing_timeout_ms || "30000") / 1000).toFixed(0)}s
                  </span>
                </div>
                <Slider
                  value={[parseInt(settings.briefing_timeout_ms || "30000")]}
                  onValueChange={(v) => updateSetting("briefing_timeout_ms", String((v as number[])[0]))}
                  max={60000}
                  min={5000}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>5s — Aggressive</span>
                  <span>60s — Patient</span>
                </div>
              </div>

              {/* Speed Tips */}
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-300">
                  <p className="font-medium text-amber-300 mb-1">Speed Tips</p>
                  <ul className="text-zinc-400 space-y-1 text-xs">
                    <li>• Use <strong className="text-zinc-300">Groq</strong> as provider for ultra-fast inference</li>
                    <li>• <strong className="text-zinc-300">Temperature 0</strong> eliminates random sampling</li>
                    <li>• Fewer history messages = fewer tokens = faster</li>
                    <li>• Aggressive timeout (10-15s) prevents hangs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: BRIEFING */}
        <TabsContent value="briefing" className="mt-6 space-y-6">
          <Card className="bg-zinc-900/50 backdrop-blur-md border-purple-500/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                Briefing Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300 text-sm font-medium">Basal Coverage Threshold</Label>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Minimum percentage of required fields to finalize the briefing.
                    </p>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-lg">
                    {Math.round(parseFloat(settings.briefing_basal_threshold || "0.85") * 100)}%
                  </span>
                </div>
                <Slider
                  value={[parseFloat(settings.briefing_basal_threshold || "0.85")]}
                  onValueChange={(v) => updateSetting("briefing_basal_threshold", (v as number[])[0].toFixed(2))}
                  max={1}
                  min={0.5}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>50% — Permissive</span>
                  <span>100% — Strict</span>
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-400">
                  <p className="font-medium text-emerald-300 mb-1">About Basal Coverage</p>
                  <p className="text-xs">
                    The AI only advances to visual questions (colors, style, logo) when this threshold 
                    is met. A higher value ensures the AI extracts more business information 
                    before making aesthetic suggestions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile-sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black/80 backdrop-blur-xl border-t border-purple-500/10 p-4 z-50">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
