"use client";

import { Message } from "@/lib/types";
import { DynamicInput } from "@/components/briefing/DynamicInput";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const mockQuestions: Message[] = [
  {
    id: "q_slider",
    role: "assistant",
    content: "Numa escala de 1 a 10, qual o nível de maturidade digital da sua empresa hoje?",
    questionType: "slider",
    minOption: 1,
    maxOption: 10,
  },
  {
    id: "q_multi",
    role: "assistant",
    content: "Quais dos canais abaixo você já utiliza na sua estratégia atual?",
    questionType: "multiple_choice",
    options: ["Instagram", "Google Ads", "LinkedIn B2B", "E-mail Marketing", "Nenhum de forma estruturada"],
  },
  {
    id: "q_single",
    role: "assistant",
    content: "Seu principal foco de negócio atualmente é B2B ou B2C?",
    questionType: "single_choice",
    options: ["B2B (Empresas)", "B2C (Consumidor Final)", "Ambos"],
    allowMoreOptions: true,
  },
  {
    id: "q_color",
    role: "assistant",
    content: "Se sua marca fosse uma dessas cores sólidas, qual melhor representaria sua essência?",
    questionType: "color_picker",
    options: ["#007BFF", "#00A6FF", "#5BC0EB", "#FF9F1C", "#FF4365"], // 1 Principal, 2 Destaques, 2 Complementares
  },
  {
    id: "q_file",
    role: "assistant",
    content: "Você tem algum manual da marca, logo em vetor ou material em PDF que eu possa usar como base?",
    questionType: "file_upload",
  },
  {
    id: "q_boolean",
    role: "assistant",
    content: "Sua empresa já possui uma identidade visual consolidada (Logo, Cores, Tipografia)?",
    questionType: "boolean_toggle",
  },
  {
    id: "q_text",
    role: "assistant",
    content: "Resuma em uma frase o maior diferencial competitivo que você tem hoje frente à concorrência.",
    questionType: "text",
  },
  {
    id: "q_card",
    role: "assistant",
    content: "Qual o estágio atual do seu negócio no mercado digital?",
    questionType: "card_selector",
    options: [
      {
        title: "Dando os Primeiros Passos",
        description: "Ainda não temos processos bem definidos. Tudo é feito muito manualmente."
      },
      {
        title: "Em Tração Inicial",
        description: "Já realizamos vendas, mas a operação ainda depende 100% de esforço ativo e orgânico."
      },
      {
        title: "Pronto para Escala",
        description: "Processos alinhados, CAQ e LTV mapeados. Preciso de tecnologia e tráfego para injetar volume."
      }
    ]
  }
];

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // Dummy handlers for visual testing
  const submitAnswer = (ans: unknown) => {
    alert(`Enviado para a IA: ${JSON.stringify(ans)}`);
  };
  
  const activeMessage = mockQuestions[activeTab];

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 font-inter">
      <header className="flex items-center justify-between p-6 h-20 shrink-0 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:bg-neutral-800 p-2 rounded-full transition-colors flex items-center justify-center">
             <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <span className="font-outfit font-medium text-lg tracking-tight">Sandbox UI</span>
        </div>
        
        <div className="flex gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800 overflow-x-auto max-w-full">
          {mockQuestions.map((q, i) => (
             <button
               key={q.id}
               onClick={() => { setActiveTab(i); setInputText(""); }}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                 activeTab === i ? "bg-indigo-500 text-white shadow-md" : "text-neutral-400 hover:text-white"
               }`}
             >
               {q.questionType}
             </button>
          ))}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
         <div className="w-full max-w-3xl flex flex-col space-y-12">
            <h1 className="text-3xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight">
              {activeMessage.content}
            </h1>
            
            <div className="p-8 border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/10">
              <DynamicInput 
                  activeMessage={activeMessage}
                  inputText={inputText}
                  setInputText={setInputText}
                  submitAnswer={submitAnswer}
                  handleSend={() => submitAnswer(inputText)}
                  isLoading={false}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  generateMoreOptions={() => alert("Simulando call na API: gerando mais alternativas...")}
                  isGeneratingMore={false}
                />
            </div>
         </div>
      </main>
    </div>
  )
}
