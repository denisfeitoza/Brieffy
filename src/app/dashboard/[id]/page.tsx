import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Code, FileText, Image as ImageIcon, MessageSquare, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CopyButtons } from '@/components/dashboard/CopyButtons';
export const dynamic = 'force-dynamic';

// Simple Markdown → HTML converter (server component safe)
function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^[\-\*] (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr />')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  return '<p>' + html + '</p>';
}

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionById(id);
  const interactions = await getInteractionsBySession(id);

  const summaryData = (session.summary_data as Record<string, unknown>) || {};

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-fit text-zinc-400 hover:text-white -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Sessões
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Detalhes do Briefing
            <span className="text-xs font-mono bg-cyan-950/50 text-cyan-400 px-3 py-1 rounded-full border border-cyan-900/50">
              {session.id}
            </span>
          </h2>
          <div className="flex items-center text-zinc-400 mt-2">
            <Clock className="w-4 h-4 mr-2" />
            Criado em {format(new Date(session.created_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Interactions Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Histórico da Conversa
          </h3>
          
          <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
            {interactions.map((interaction, index) => {
              const questionData = typeof interaction.question_data === 'string' 
                ? JSON.parse(interaction.question_data) 
                : interaction.question_data;
                
              const inputType = questionData?.input_type || 'text';
              
              return (
                <div key={interaction.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_2px_rgba(8,-145,178,0.5)]" />
                  
                  {/* AI Question */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-500 mb-1 inline-block">Forms AI</span>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-sm text-zinc-300">
                      <p className="font-medium text-white mb-2">{questionData?.title || 'Pergunta do AI'}</p>
                      {questionData?.description && (
                        <p className="text-sm opacity-80">{questionData.description}</p>
                      )}
                    </div>
                  </div>

                  {/* User Answer */}
                  <div className="pl-8 sm:pl-16">
                    <div className="flex justify-end relative">
                       <span className="absolute -top-5 right-2 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1 inline-block">Cliente ({inputType})</span>
                       <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl rounded-tr-sm text-emerald-100 w-fit min-w-[50%] max-w-full">
                          
                          {inputType === 'file_upload' && (
                             <div className="flex flex-col items-center gap-3">
                                {String(interaction.answer_raw).match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <img 
                                    src={interaction.answer_raw} 
                                    alt="Upload" 
                                    className="max-h-64 rounded-xl border border-white/10 object-contain bg-black/50 p-2"
                                  />
                                ) : (
                                  <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/10 w-full">
                                    <FileText className="w-8 h-8 text-emerald-400" />
                                    <span className="text-sm line-clamp-1">{String(interaction.answer_raw).split('/').pop()}</span>
                                  </div>
                                )}
                                <a 
                                  href={String(interaction.answer_raw)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full mt-2"
                                >
                                  <Button variant="secondary" size="sm" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300">
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar Arquivo
                                  </Button>
                                </a>
                             </div>
                          )}

                          {inputType === 'color_picker' && (
                             <div className="flex gap-2 flex-wrap">
                               {Array.isArray(interaction.answer_raw) 
                                  ? interaction.answer_raw.map((c: string, i: number) => (
                                      <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: c }} />
                                        <span className="text-[10px] opacity-70">{c}</span>
                                      </div>
                                    ))
                                  : <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: String(interaction.answer_raw) }} />
                               }
                             </div>
                          )}

                          {(inputType !== 'file_upload' && inputType !== 'color_picker') && (
                             <p className="whitespace-pre-wrap font-medium">
                               {typeof interaction.answer_raw === 'object' 
                                 ? JSON.stringify(interaction.answer_raw, null, 2) 
                                 : String(interaction.answer_raw)}
                             </p>
                          )}
                       </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Document & Insights */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10 sticky top-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                Documento do Briefing
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Documento gerado pela IA com base em toda a conversa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.final_assets?.document ? (
                <div className="space-y-4">
                  <div 
                    className="prose prose-invert prose-sm max-w-none 
                      prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-xl prose-h1:text-white
                      prose-h2:text-lg prose-h2:text-cyan-400 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
                      prose-h3:text-base prose-h3:text-zinc-300
                      prose-p:text-zinc-300 prose-li:text-zinc-300
                      prose-strong:text-white
                      prose-blockquote:border-l-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:rounded-r-lg prose-blockquote:px-4
                      bg-black/40 rounded-xl border border-white/5 p-6 max-h-[calc(100vh-200px)] overflow-auto custom-scrollbar"
                    dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(session.final_assets.document) }}
                  />
                  
                  <div className="flex flex-col gap-3 mt-4">
                    <CopyButtons 
                      markdown={session.final_assets.document} 
                      html={simpleMarkdownToHtml(session.final_assets.document)} 
                    />
                    
                    <a 
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(session.final_assets.document)}`}
                      download={`briefing-${session.id.split('-')[0]}.md`}
                      className="block"
                    >
                      <Button variant="outline" className="w-full bg-cyan-950/30 border-cyan-900/50 text-cyan-400 hover:bg-cyan-950/50">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Documento (.md)
                      </Button>
                    </a>
                  </div>
                </div>
              ) : Object.keys(summaryData).length === 0 ? (
                <div className="text-center p-6 text-zinc-500 italic bg-white/5 rounded-xl border border-white/5">
                  Nenhum documento foi gerado para esta sessão.
                </div>
              ) : (
                <div className="bg-black/80 rounded-xl border border-white/5 p-4 overflow-hidden">
                  <pre className="text-xs text-emerald-400 font-mono overflow-auto custom-scrollbar max-h-[600px]">
                    <code>{JSON.stringify(summaryData, null, 2)}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
