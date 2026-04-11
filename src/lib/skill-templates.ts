// ================================================================
// SKILL TEMPLATES — Pre-crafted prompt fragments for AI packages
// Based on the documented skill architecture in ai-skills-exploration/
// Admin can select a template when creating a package instead of writing from scratch
// ================================================================

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  icon: string;
  suggested_slug: string;
  max_questions: number | null;
  briefing_purpose: string;
  depth_signals: string[];
  system_prompt_fragment: string;
}

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "brand-dna",
    name: "Brand DNA & Identidade",
    description: "Exploração profunda de identidade de marca: arquétipo, valores, mood visual, voz da marca, logo e simbolismo.",
    department: "branding",
    icon: "Palette",
    suggested_slug: "brand_dna",
    max_questions: 8,
    briefing_purpose: "Extrair a essência da marca — quem ela é, como se comporta, o que sente e como quer ser percebida.",
    depth_signals: ["identidade visual", "rebranding", "posicionamento de marca", "arquétipo"],
    system_prompt_fragment: `SKILL: Brand DNA & Identidade Visual
CAMPOS ÚNICOS PARA EXTRAIR: brand_archetype, brand_values_top3, visual_mood, typography_preference, color_palette_vibe, brand_voice_dimensions, logo_status, symbol_references

ESTRATÉGIA CONVERSACIONAL:
- Use perguntas de poder: "Se sua marca desaparecesse amanhã, que vazio ela deixaria no mundo?"
- Aborde identidade visual por EMOÇÕES primeiro, depois especificidades. Nunca pergunte "que cores você gosta" — explore o mood e sentimento.
- Use card_selector para detecção de arquétipo/personalidade (ex: O Herói, O Sábio, O Criador, O Rebelde, O Cuidador, Outro).
- Para dimensões de voz da marca, use multi_slider com escala 1-5:
  [{"label":"Formalidade","min":1,"max":5,"minLabel":"Descontraído","maxLabel":"Corporativo"},{"label":"Ousadia","min":1,"max":5,"minLabel":"Tradicional","maxLabel":"Disruptivo"},{"label":"Comunicação","min":1,"max":5,"minLabel":"Técnica/Direta","maxLabel":"Emocional/Storytelling"}]
- Explore LOGO E SÍMBOLO de forma natural: descubra se o cliente já tem um logo, se já pensou em algum símbolo, ícone ou elemento visual que represente a marca. NÃO pergunte de forma técnica — explore por significado e intenção.

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Se sua marca fosse uma pessoa, como ela entraria numa sala?" (text — warm-up)
2. Arquétipo via card_selector com 6 opções descritivas
3. "Que 3 palavras NUNCA deveriam descrever sua marca?" (text — abordagem reversa)
4. Dimensões de voz via multi_slider
5. "Pense em uma marca que você admira visualmente — o que nela te atrai?" (text — referência indireta)
6. "Sobre o logo da marca: você já tem algo definido, já pensou em algum símbolo ou elemento visual, ou está partindo do zero?" (single_choice: ["Já tenho um logo definido", "Tenho ideias/referências em mente", "Estou aberto a sugestões", "Quero partir do zero"]). Se o cliente tiver ideias, aprofunde: "Me conta mais — que símbolo, ícone ou imagem vem à sua mente quando pensa na marca?"
7. "Se sua marca fosse representada por um único símbolo ou objeto, qual seria? Pode ser algo abstrato, da natureza, um animal..." (text — extrai referência simbólica)

REGRAS:
- NÃO faça perguntas genéricas como "qual sua paleta de cores?". Explore sentimentos e referências.
- Se o color_picker estiver ativado nos formatos, use-o para paleta. Caso contrário, extraia por texto.
- Conecte cada pergunta ao contexto do negócio, não apenas à estética.
- Para logo/símbolo: se o cliente já tem logo, explore o que ele gosta e o que mudaria. Se não tem, explore referências simbólicas e visuais que ressoam com a essência da marca. NUNCA force o tema — se o cliente não se interessa por símbolo, registre e siga em frente.`,
  },
  {
    id: "market-analysis",
    name: "Análise de Mercado & Posicionamento",
    description: "Posicionamento competitivo, proposta de valor, estratégia de preço e tendências de mercado.",
    department: "marketing",
    icon: "TrendingUp",
    suggested_slug: "market_analysis",
    max_questions: 8,
    briefing_purpose: "Mapear o terreno competitivo — onde a empresa está, onde quer chegar e contra quem compete.",
    depth_signals: ["concorrentes", "pricing", "diferencial competitivo", "market share"],
    system_prompt_fragment: `SKILL: Análise de Mercado & Posicionamento
CAMPOS ÚNICOS PARA EXTRAIR: market_position, pricing_strategy, sales_cycle, competitor_strengths, competitor_weaknesses, unique_value_proposition, market_trends

ESTRATÉGIA CONVERSACIONAL:
- Aborde concorrentes por ADMIRAÇÃO, não confronto. "Qual empresa você secretamente admira — o que inveja nela?"
- Precificação por ângulos oblíquos: "Se um cliente comparasse seu preço ao do [concorrente], o que você diria?"
- Extraia tamanho de mercado por implicações, não perguntas diretas.
- Use boolean_toggle para validar hipóteses de posicionamento ("Pelo que entendi, vocês competem mais por qualidade que por preço. Está correto?")

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Se eu fosse seu cliente ideal e estivesse pesquisando, que outras 3 opções eu encontraria antes de chegar em você?" (text — extrai concorrentes naturalmente)
2. "O que te faz perder clientes? E o que te faz ganhar?" (text — dor e diferencial simultaneamente)
3. Posicionamento competitivo via multi_slider:
  [{"label":"Preço vs Mercado","min":1,"max":5,"minLabel":"Mais barato","maxLabel":"Premium"},{"label":"Inovação","min":1,"max":5,"minLabel":"Tradicional","maxLabel":"Pioneiro"},{"label":"Atendimento","min":1,"max":5,"minLabel":"Self-service","maxLabel":"High-touch"},{"label":"Escopo","min":1,"max":5,"minLabel":"Nicho","maxLabel":"Full-service"}]
4. "Qual tendência do seu mercado te preocupa ou anima mais?" (text)

REGRAS:
- NUNCA pergunte "quais são seus concorrentes?" (interrogatório). Extraia via contexto.
- Se o cliente disser explicitamente que NÃO possui concorrentes ou NÃO os conhece, RESPEITE e mude para precificação ou diferenciais imediatamente.
- Se o cliente não mencionar preço, aborde de forma natural sem intimidar.
- Cruze informações com campos basais (competitors, competitive_differentiator) — não duplique.`,
  },
  {
    id: "primal-branding",
    name: "Primal Branding® (A Base)",
    description: "Os 7 pilares para criar uma marca com fãs: História, Crença, Ícones, Rituais, Palavras Sagradas, Antagonistas e Líder.",
    department: "branding",
    icon: "Flame",
    suggested_slug: "primal_branding",
    max_questions: 10,
    briefing_purpose: "Construir a base de comunidade e lealdade da marca através dos 7 pilares do Primal Branding.",
    depth_signals: ["comunidade", "fãs", "legado", "tribo", "cultura de marca"],
    system_prompt_fragment: `SKILL: Primal Branding®
CAMPOS ÚNICOS PARA EXTRAIR: creation_story, brand_creed, brand_icons, brand_rituals, sacred_words, brand_antagonists, brand_leader

ESTRATÉGIA CONVERSACIONAL (Os 7 Pilares):
1. HISTÓRIA DA CRIAÇÃO: "Como a empresa começou de fato? Qual foi o momento da virada?"
2. A CRENÇA: "Se sua marca tivesse uma única regra de ouro, inegociável, qual seria?"
3. ÍCONES: "Tirando o logotipo, existe alguma cor, objeto ou estilo visual que se alguém bater o olho já sabe que são vocês?"
4. RITUAIS (Rotina Marcante): "Existe algum detalhe recorrente na forma como vocês entregam o produto/serviço ou atendem o cliente que virou uma 'marca registrada' de vocês?"
5. PALAVRAS SAGRADAS: "Vocês usam algum termo específico ou apelido para focar na equipe, nos clientes ou no serviço principal?" (ex: A Apple tem os 'Genius', o Nubank os 'Nubankers').
6. ANTAGONISTAS/PAGÃOS (O Inimigo): "Existe algum 'jeito padrão de fazer no mercado' que vocês odeiam e juraram nunca fazer na empresa de vocês?"
7. O LÍDER: "O rosto da frente da marca hoje é uma pessoa específica, os fundadores ou a própria marca fala por si?"

REGRAS:
- É ESTRITAMENTE PROIBIDO usar os termos teóricos da metodologia nas suas perguntas ao cliente. NUNCA use palavras exóticas como "rituais", "pagãos", "palavras sagradas", "antagonistas" ou "primal branding". Estas palavras são do seu sistema base.
- Transforme os conceitos em perguntas de negócios humanas e naturais, como nos exemplos acima.
- Extraia cada pilar através de narrativas e curiosidade genuína.
- Pule pilares que já foram respondidos em campos de Identidade.`,
  },
  {
    id: "campaign-launch",
    name: "Campanha & Lançamento",
    description: "Briefing de campanha de marketing: objetivo, público, canais, mensagens-chave e orçamento.",
    department: "marketing",
    icon: "Megaphone",
    suggested_slug: "campaign_launch",
    max_questions: 10,
    briefing_purpose: "Construir a base estratégica de uma campanha — do porquê à execução.",
    depth_signals: ["campanha", "lançamento", "mídia paga", "conversão", "ROI"],
    system_prompt_fragment: `SKILL: Campanha & Lançamento
CAMPOS ÚNICOS PARA EXTRAIR: campaign_objective, campaign_type, campaign_duration, target_channels, budget_range, success_metrics, creative_requirements, key_messages

ESTRATÉGIA CONVERSACIONAL (sequência WHY→WHO→HOW→WHAT):
1. Comece pelo PORQUÊ: "Que problema essa campanha resolve?" ou "O que muda no mundo se essa campanha funcionar?"
2. Depois QUEM: público emerge do contexto do negócio, não de formulários demográficos.
3. Então COMO: canais emergem de onde o público vive. "Onde seu cliente ideal passa o tempo online?"
4. Por fim O QUÊ: necessidades criativas seguem naturalmente de tudo acima.
5. Orçamento por ÚLTIMO — precedido por contexto de valor.

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Em uma frase, qual o grande objetivo dessa campanha?" (text)
2. Tipo de campanha via single_choice: ["Awareness/Reconhecimento", "Geração de Leads", "Lançamento de Produto", "Reposicionamento", "Sazonal/Promocional", "Outro"]
3. "Quais canais você já usa que trazem resultado?" (multiple_choice com canais relevantes)
4. Duração via slider (1-12 meses)
5. "Qual seria um resultado que te faria considerar essa campanha um sucesso?" (text)
6. "Em termos de investimento, qual faixa faz sentido para esse momento?" (single_choice com ranges)

REGRAS:
- NÃO pergunte orçamento antes de estabelecer contexto de valor.
- Se o cliente não sabe o tipo de campanha, ajude-o a descobrir via perguntas sobre objetivo.
- Cruze com campos basais (target_audience, communication_channels) — não pergunte de novo o que já sabe.`,
  },
  {
    id: "digital-presence",
    name: "Presença Digital & Conteúdo",
    description: "Estratégia digital: redes sociais, conteúdo, SEO, tom de voz online.",
    department: "digital",
    icon: "Video",
    suggested_slug: "digital_presence",
    max_questions: 7,
    briefing_purpose: "Entender como a marca se apresenta e se comunica no ambiente digital.",
    depth_signals: ["redes sociais", "conteúdo", "SEO", "digital", "engajamento"],
    system_prompt_fragment: `SKILL: Presença Digital & Conteúdo
CAMPOS ÚNICOS PARA EXTRAIR: social_platforms_active, content_frequency, content_types, digital_goals, seo_awareness, online_reputation, content_pillars

ESTRATÉGIA CONVERSACIONAL:
- Comece pelo estado atual sem julgamento: "Me conta como está a presença digital hoje — onde vocês aparecem?"
- Explore a relação com conteúdo: se é um peso ou uma oportunidade.
- Use multiple_choice para plataformas (Instagram, LinkedIn, TikTok, YouTube, Blog, Outro).
- Valide maturidade digital via slider (1-10): "De 1 a 10, quão confortável você se sente com marketing digital?"

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Hoje, quando alguém busca sua empresa no Google, o que encontra?" (text — diagnóstico)
2. Plataformas ativas via multiple_choice
3. "Qual seu maior desafio com conteúdo?" (single_choice: ["Não tenho tempo", "Não sei o que postar", "Não vejo resultado", "Não tenho equipe", "Está funcionando bem", "Outro"])
4. Maturidade digital via slider (1-10)
5. "Se pudesse escolher um resultado digital em 6 meses, qual seria?" (text)

REGRAS:
- NÃO julgue a maturidade digital do cliente. Muitos negócios excelentes têm presença digital fraca.
- Cruze com campos basais (communication_channels, target_audience) — adapte ao que já sabe.
- Se o cliente tem engajamento baixo, use tipos táteis (slider, single_choice) nessas perguntas.`,
  },
  {
    id: "customer-experience",
    name: "Experiência do Cliente & Jornada",
    description: "Mapeamento da jornada do cliente, pontos de dor, touchpoints e satisfação.",
    department: "commercial",
    icon: "Users",
    suggested_slug: "customer_experience",
    max_questions: 7,
    briefing_purpose: "Mapear como o cliente vive a experiência com a marca — do primeiro contato ao pós-venda.",
    depth_signals: ["jornada do cliente", "satisfação", "NPS", "atendimento", "retenção"],
    system_prompt_fragment: `SKILL: Experiência do Cliente & Jornada
CAMPOS ÚNICOS PARA EXTRAIR: customer_journey_stages, pain_points, satisfaction_level, retention_strategy, referral_rate, support_channels, onboarding_process

ESTRATÉGIA CONVERSACIONAL:
- Peça ao cliente contar a história de UM cliente real — da descoberta à fidelização.
- Explore pontos de dor por narrativa, não lista: "Em que momento um cliente fica frustrado?"
- Use multi_slider para mapear satisfação por etapa da jornada.

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Me conte a jornada de um cliente típico — como ele te descobre, decide comprar, e o que acontece depois?" (text)
2. "Qual momento da experiência do cliente te deixa mais orgulhoso? E qual te preocupa?" (text)
3. Satisfação por etapa via multi_slider:
  [{"label":"Descoberta","min":1,"max":5,"minLabel":"Fraco","maxLabel":"Excelente"},{"label":"Compra","min":1,"max":5,"minLabel":"Fraco","maxLabel":"Excelente"},{"label":"Entrega","min":1,"max":5,"minLabel":"Fraco","maxLabel":"Excelente"},{"label":"Pós-venda","min":1,"max":5,"minLabel":"Fraco","maxLabel":"Excelente"}]
4. "Seus clientes te indicam espontaneamente?" (boolean_toggle)
5. "O que faria um cliente voltar a comprar sem você precisar pedir?" (text)

REGRAS:
- NÃO use jargões como "NPS", "CSAT", "touchpoint" com o cliente. Fale em linguagem humana.
- Se o cliente é B2B, explore o ciclo de vendas. Se B2C, explore a experiência de compra.
- Cruze com campos basais (target_audience, services_offered) — adapte a jornada ao tipo de negócio.`,
  },
  {
    id: "business-model",
    name: "Modelo de Negócio & Estratégia",
    description: "Canvas de modelo de negócio: proposta de valor, receitas, custos, parceiros e canais.",
    department: "operations",
    icon: "Lightbulb",
    suggested_slug: "business_model",
    max_questions: 8,
    briefing_purpose: "Entender a mecânica do negócio — como gera valor, como monetiza, o que sustenta.",
    depth_signals: ["modelo de negócio", "receita", "escalabilidade", "investimento", "crescimento"],
    system_prompt_fragment: `SKILL: Modelo de Negócio & Estratégia
CAMPOS ÚNICOS PARA EXTRAIR: revenue_model, cost_structure, key_partnerships, distribution_channels, growth_strategy, scalability_assessment, business_maturity

ESTRATÉGIA CONVERSACIONAL:
- Comece pelo valor entregue: "Se eu fosse seu cliente, o que ganho ao escolher você?"
- Explore monetização de forma natural: "Como seu faturamento se distribui — muitos clientes pequenos, poucos grandes, ou um mix?"
- Use abordagem de futuro: "Se pudesse dobrar de tamanho em 1 ano, o que seria o gargalo?"

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Em poucas palavras, qual é a principal forma como sua empresa ganha dinheiro?" (text)
2. Modelo de receita via single_choice: ["Venda de produtos", "Prestação de serviços", "Assinatura/Recorrente", "Marketplace/Comissão", "Licenciamento", "Outro"]
3. "Qual seu maior custo operacional hoje?" (text)
4. Maturidade do negócio via slider (1-10): "De 1 a 10, quão estabelecido está o modelo de negócio?"
5. "Quem são seus parceiros mais estratégicos? Sem quem a operação para?" (text)
6. "Qual o maior obstáculo para crescer nos próximos 12 meses?" (text)

REGRAS:
- NÃO use jargões de startup (LTV, CAC, MRR) a menos que o cliente os use primeiro.
- Se o negócio é novo, foque em validação. Se é maduro, foque em otimização e escala.
- Cruze com campos basais (services_offered, sector_segment) — contextualize as perguntas.`,
  },
  {
    id: "paid-traffic",
    name: "Tráfego Pago & Aquisição de Clientes",
    description: "Diagnóstico completo para estratégia de mídia paga: ticket médio, recorrência, origem de leads, investimento, Google Meu Negócio e histórico com anúncios.",
    department: "marketing",
    icon: "MousePointerClick",
    suggested_slug: "paid_traffic",
    max_questions: 10,
    briefing_purpose: "Mapear o potencial e maturidade de tráfego pago do cliente — do histórico com anúncios ao investimento ideal e fontes de aquisição atuais.",
    depth_signals: ["tráfego pago", "google ads", "meta ads", "leads", "anúncios", "roas", "cpa", "conversão", "investimento"],
    system_prompt_fragment: `SKILL: Tráfego Pago & Aquisição de Clientes
CAMPOS ÚNICOS PARA EXTRAIR: avg_ticket, repurchase_frequency, lead_sources, monthly_ad_budget, has_google_business, previous_ads_experience, previous_ads_outcome, ad_goals, target_platforms, conversion_bottleneck

ESTRATÉGIA CONVERSACIONAL (sequência DIAGNÓSTICO → POTENCIAL → INTENÇÃO):
- Comece pelo que já existe e funciona — antes de falar em anúncios, entenda como o cliente adquire clientes hoje.
- Use a lógica: "Para montar uma estratégia de aquisição eficiente, preciso entender primeiro como o negócio compra e vende."
- NÃO fale "ROI", "CPA", "ROAS" — use linguagem de negócio: "retorno", "custo por cliente", "quanto vale trazer 1 cliente".
- O budget vem POR ÚLTIMO — depois de estabelecer o valor de um cliente para o negócio.

FASE 1 — O NEGÓCIO (base financeira para calcular viabilidade de anúncios)
1. Ticket médio por venda: "Qual é o valor médio de uma venda no seu negócio? Pode ser uma faixa — não precisa ser exato." (text)
2. Frequência de recompra: "Com que frequência um cliente que já comprou com você volta a comprar?" → single_choice: ["Compra única / raramente volta", "A cada 1-3 meses", "A cada 3-6 meses", "A cada 6-12 meses", "Mais de 1 vez por mês", "Assinatura / recorrência mensal"]
   → Se recorrente, aprofunde: "Legal! Clientes recorrentes tendem a ter um valor muito maior. Em média, por quanto tempo um cliente fica ativo com você?"

FASE 2 — DE ONDE VÊM OS CLIENTES HOJE
3. Fontes de leads atuais: "Hoje, de onde vêm a maioria dos seus clientes?" → multiple_choice: ["Indicação de outros clientes", "Busca no Google (orgânico)", "Redes sociais (sem anúncios)", "WhatsApp / contato direto", "Eventos / feiras", "Parceiros ou revendedores", "Já tenho anúncios ativos", "Outro"]
   → Se "indicação" for escolhida: "Ótimo — indicação é o sinal mais forte de produto validado. Isso também significa que tráfego pago funcionaria bem aqui."

FASE 3 — PRESENÇA E MATURIDADE DIGITAL
4. Google Meu Negócio: "Sua empresa já tem perfil no Google Meu Negócio (o card que aparece quando alguém busca sua empresa no Google Maps)?" → single_choice: ["Sim, está ativo e atualizado", "Sim, mas está incompleto ou desatualizado", "Não tenho / nunca configurei", "Não sei o que é isso"]
   → Se não tem: "Entendido — esse será um dos primeiros pontos a ativar, pois é tráfego 100% gratuito de quem já está procurando por você."
5. Plataforma de interesse: "Se fossemos rodar anúncios, por onde você intuitivamente sentiria que seu cliente está?" → multiple_choice: ["Google (busca ativa)", "Instagram / Facebook", "TikTok", "YouTube", "LinkedIn", "Não sei — preciso de orientação"]

FASE 4 — HISTÓRICO COM TRÁFEGO PAGO
6. Já fez anúncios antes?: "Você ou alguém da sua equipe já rodou anúncios pagos antes?" → boolean_toggle
   → Se SIM: "Me conta — o que funcionou? E o que te decepcionou ou te fez parar?"  (text — extrai: previous_ads_outcome)
   → Se NÃO: "Tudo bem! Começar do zero permite construir uma estratégia certa já de início. O que te fez querer começar agora?" (text)

FASE 5 — INVESTIMENTO & OBJETIVO
7. Objetivo com tráfego: "Qual seria o principal objetivo ao investir em anúncios hoje?" → single_choice: ["Gerar mais leads / contatos", "Aumentar vendas diretas (e-commerce ou WhatsApp)", "Trazer mais clientes para minha loja física", "Fortalecer a marca / awareness", "Reativar clientes antigos", "Testar um novo produto ou serviço"]
8. Budget estimado mensal: "Pensando em créditos de anúncios (o que você paga diretamente ao Google ou Meta), qual faixa faz sentido para começar?" → single_choice: ["Até R$500/mês", "R$500 a R$1.500/mês", "R$1.500 a R$3.000/mês", "R$3.000 a R$6.000/mês", "Acima de R$6.000/mês", "Ainda não tenho certeza"]
   → Após a resposta, valide com contexto: "Com esse investimento e um ticket de [valor informado], precisaríamos de [X vendas] para cobrir apenas o investimento. Isso parece factível para o seu negócio?"

REGRAS:
- NUNCA pergunte o budget antes de entender o ticket médio e o objetivo — sem esse contexto, o número é inútil.
- Se o cliente tiver experiência negativa com anúncios, explore o que houve com empatia — "anúncios ruins" quase sempre significam configuração errada, não produto ruim.
- Se o cliente não sabe a frequência de recompra, ajude-o a estimar: "Pense nos seus últimos 10 clientes — quantos voltaram?"
- Cruze com campos basais (target_audience, services_offered, sector_segment) — não re-pergunte o que já foi respondido.
- Se o negócio tem ticket alto (acima de R$500), enfatize o potencial de LTV e recompra — o argumento de anúncios muda completamente.
- Se o cliente fez anúncios antes e parou, trate isso como aprendizado, não fracasso.`,
  },
  {
    id: "ai-management-system",
    name: "AI Management System & Tech Stack",
    description: "Mapeamento do ecossistema de software atual (sistemas, planilhas) buscando oportunidades de unificação via IA e automação sob demanda.",
    department: "technology",
    icon: "Cpu",
    suggested_slug: "ai_management_system",
    max_questions: 6,
    briefing_purpose: "Identificar os departamentos da empresa e o que usam hoje de sistema ou planilhas, visando unificar e reconstruir as operações sob demanda com inteligência artificial.",
    depth_signals: ["sistemas legados", "automação de processos", "planilhas e controles manuais", "unificação", "AI management", "transformação digital"],
    system_prompt_fragment: `SKILL: AI Management System Architect
CAMPOS ÚNICOS PARA EXTRAIR: company_departments, current_systems_used, spreadsheet_reliance, manual_bottlenecks, unified_ai_opportunities

ESTRATÉGIA CONVERSACIONAL:
MISSÃO: Mapear todo o ecossistema tecnológico, identificando os departamentos da empresa e o que usam hoje de sistema ou planilhas, com o objetivo de unificar e reconstruir essas operações sob demanda usando Inteligência Artificial.

FASE 1 — INVENTÁRIO & DEPARTAMENTOS
- Identifique as frentes de trabalho. "Quais são os principais departamentos ou áreas da sua empresa hoje?"
- "Tirando email e WhatsApp, que sistemas, CRMs ou ferramentas cada um desses departamentos utiliza no dia a dia?"

FASE 2 — A DOR DAS PLANILHAS E GARGALOS MANUAIS
- "Até que ponto a operação ainda depende de planilhas pesadas (Excel/Google Sheets) ou de trabalho manual (controle duplo, copiar e colar)?"
- Descubra onde a informação quebra ou se perde na troca entre setores.

FASE 3 — UNIFICAÇÃO & IA SOB DEMANDA
- Baseado no diagnóstico acima, proponha a visão de um sistema único e integrado.
- "Se pudéssemos aposentar essas ferramentas desconexas e construir um sistema/dashboard interno unificado e 100% sob demanda gerido por Inteligência Artificial, qual seria o problema operacional número 1 a ser resolvido?"
- Direcione o contexto para a possível automação robótica e substituição de softwares engessados por microsserviços customizados de IA.

REGRAS:
- Evite complexidade técnica exagerada (termos como API, relacional, servidores) a menos que o cliente seja técnico.
- Foque na "dor do retrabalho" e na transição para a "eficiência centralizada".`,
  },
];

export function getSkillTemplateById(id: string): SkillTemplate | undefined {
  return SKILL_TEMPLATES.find(t => t.id === id);
}

export function getSkillTemplatesByDepartment(department: string): SkillTemplate[] {
  return SKILL_TEMPLATES.filter(t => t.department === department);
}
