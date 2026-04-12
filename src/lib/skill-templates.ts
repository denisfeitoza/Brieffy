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
    id: "basic-infos",
    name: "Basic Infos",
    description: "Coleta os dados fundamentais do negócio: nome, setor, tempo de mercado, serviços, MVV, público, concorrentes, diferenciais, canais e personalidade de marca.",
    department: "general",
    icon: "Info",
    suggested_slug: "basic_infos",
    max_questions: null,
    briefing_purpose: "Construir a base completa de informações do negócio antes de qualquer especialização.",
    depth_signals: [],
    system_prompt_fragment: `SKILL: Basic Infos
CAMPOS BASAIS A EXTRAIR: company_name, sector_segment, company_age, services_offered, mission_vision_values, target_audience_demographics, competitors, competitive_differentiator, communication_channels, geographic_reach, brand_personality, tone_of_voice

CAMPOS OPCIONAIS (colete apenas se surgir naturalmente no contexto — NÃO force):
- owner_relationship: Relação do fundador com a marca (ex: fundou, herdou, é só investidor)
- brand_name_meaning: Origem ou significado do nome da marca
- keywords: Palavras-chave que o cliente usaria para descrever a empresa

REGRA DE ADAPTAÇÃO INTELIGENTE (INVIOLÁVEL):
Analise TODOS os outros pacotes de skill ativos nesta sessão. Se uma pergunta deste pacote já seria respondida naturalmente pela skill especializada, NÃO a faça. Funda os campos basais dentro das perguntas da skill ativa.
Exemplos:
- Se "Brand DNA" está ativo → brand_personality e tone_of_voice emergem automaticamente lá. Dispense-as aqui.
- Se "Market Analysis" está ativo → competitors e competitive_differentiator saem de lá. Não repita.
- Se "Paid Traffic" está ativo → sector_segment e target_audience emergem naturalmente nas perguntas de aquisição.
QUANDO NENHUMA skill está ativa: colete TODOS os campos basais de forma natural e conversacional, priorizando a sequência: empresa → mercado → público → identidade.`,
  },

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
CAMPOS ÚNICOS PARA EXTRAIR: brand_archetype, brand_values_top3, visual_mood, color_palette_vibe, brand_voice_dimensions, logo_status, symbol_references

ESTRATÉGIA CONVERSACIONAL:
- Use perguntas de poder: "Se sua marca desaparecesse amanhã, que vazio ela deixaria no mundo?"
- Aborde identidade visual por EMOÇÕES primeiro, depois especificidades. Nunca pergunte "que cores você gosta" — explore o mood e sentimento.
- Para arquétipo/personalidade, use multiple_choice com as opções: ["O Herói — corajoso e transformador", "O Sábio — especialista e confiável", "O Criador — inovador e expressivo", "O Rebelde — disruptivo e autêntico", "O Cuidador — acolhedor e solidário", "Outro — descreva com suas palavras"].
- Para dimensões de voz da marca, use perguntas multiple_choice diretas: aborde formalidade, ousadia e estilo de comunicação individualmente em perguntas separadas se necessário, ou extraia via texto aberto natural.
- Explore LOGO E SÍMBOLO de forma natural: descubra se o cliente já tem um logo, se já pensou em algum símbolo, ícone ou elemento visual que represente a marca. NÃO pergunte de forma técnica — explore por significado e intenção.

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Se sua marca fosse uma pessoa, como ela entraria numa sala?" (text — warm-up)
2. Arquétipo via multiple_choice com 6 opções descritivas
3. "Que 3 palavras NUNCA deveriam descrever sua marca?" (text — abordagem reversa)
4. "Em uma palavra, sua comunicação é mais: direta/técnica ou emocional/inspiradora?" (multiple_choice)
5. "Pense em uma marca que você admira visualmente — o que nela te atrai?" (text — referência indireta)
6. "Sobre o logo da marca: você já tem algo definido, já pensou em algum símbolo ou elemento visual, ou está partindo do zero?" (multiple_choice: ["Já tenho um logo definido", "Tenho ideias/referências em mente", "Estou aberto a sugestões", "Quero partir do zero"]). Se o cliente tiver ideias, aprofunde: "Me conta mais — que símbolo, ícone ou imagem vem à sua mente quando pensa na marca?"
7. "Se sua marca fosse representada por um único símbolo ou objeto, qual seria? Pode ser algo abstrato, da natureza, um animal..." (text — extrai referência simbólica)

REGRAS:
- Se o color_picker estiver disponível nos formatos, use-o para paleta. Caso contrário, extraia por texto.
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
3. Posicionamento de preço via multiple_choice: ["Somos os mais baratos do mercado", "Preço abaixo da média", "Na média do mercado", "Acima da média — qualidade justifica", "Premium/Luxo", "Não tenho clareza sobre isso"]
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
2. Tipo de campanha via multiple_choice: ["Awareness/Reconhecimento", "Geração de Leads", "Lançamento de Produto", "Reposicionamento", "Sazonal/Promocional", "Outro"]
3. "Quais canais você já usa que trazem resultado?" (multiple_choice com canais relevantes)
4. Duração estimada via multiple_choice: ["Menos de 1 mês", "1 a 2 meses", "3 a 6 meses", "6 a 12 meses", "Mais de 1 ano", "Ainda não definida"]
5. "Qual seria um resultado que te faria considerar essa campanha um sucesso?" (text)
6. "Em termos de investimento, qual faixa faz sentido para esse momento?" (multiple_choice com ranges)

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
- Valide maturidade digital via multiple_choice: "Como você se descreveria em relação ao marketing digital?" com opções de nível de experiência.

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Hoje, quando alguém busca sua empresa no Google, o que encontra?" (text — diagnóstico)
2. Plataformas ativas via multiple_choice
3. "Qual seu maior desafio com conteúdo?" (multiple_choice: ["Não tenho tempo", "Não sei o que postar", "Não vejo resultado", "Não tenho equipe", "Está funcionando bem", "Outro"])
4. Maturidade digital via multiple_choice: ["Iniciante — pouca ou nenhuma presença", "Em desenvolvimento — tenho algumas redes ativas", "Intermediário — produzo conteúdo com regularidade", "Avançado — tenho equipe e estratégia definida", "Especialista — digital é o núcleo do meu negócio"]
5. "Se pudesse escolher um resultado digital em 6 meses, qual seria?" (text)

REGRAS:
- NÃO julgue a maturidade digital do cliente. Muitos negócios excelentes têm presença digital fraca.
- Cruze com campos basais (communication_channels, target_audience) — adapte ao que já sabe.
- Se o cliente tem engajamento baixo, use perguntas fechadas de seleção (multiple_choice, multiple_choice).`,
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
- Para mapear satisfação por etapa, faça perguntas de texto qualitativo: "Qual etapa da jornada você acha mais frágil hoje?"

PERGUNTAS SUGERIDAS (adapte ao contexto):
1. "Me conte a jornada de um cliente típico — como ele te descobre, decide comprar, e o que acontece depois?" (text)
2. "Qual momento da experiência do cliente te deixa mais orgulhoso? E qual te preocupa?" (text)
3. "Se você pudesse melhorar UMA coisa na experiência do cliente agora, o que seria?" (text — foca no pain point mais crítico)
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
2. Modelo de receita via multiple_choice: ["Venda de produtos", "Prestação de serviços", "Assinatura/Recorrente", "Marketplace/Comissão", "Licenciamento", "Outro"]
3. "Qual seu maior custo operacional hoje?" (text)
4. Maturidade do negócio via multiple_choice: ["Está começando agora — ainda validando", "Em operação há menos de 2 anos", "Estabelecido — modelo testado e funcionando", "Maduro — já temos processos e equipe sólidos", "Em expansão — buscando escala", "Outro"]
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
2. Frequência de recompra: "Com que frequência um cliente que já comprou com você volta a comprar?" → multiple_choice: ["Compra única / raramente volta", "A cada 1-3 meses", "A cada 3-6 meses", "A cada 6-12 meses", "Mais de 1 vez por mês", "Assinatura / recorrência mensal"]
   → Se recorrente, aprofunde: "Legal! Clientes recorrentes tendem a ter um valor muito maior. Em média, por quanto tempo um cliente fica ativo com você?"

FASE 2 — DE ONDE VÊM OS CLIENTES HOJE
3. Fontes de leads atuais: "Hoje, de onde vêm a maioria dos seus clientes?" → multiple_choice: ["Indicação de outros clientes", "Busca no Google (orgânico)", "Redes sociais (sem anúncios)", "WhatsApp / contato direto", "Eventos / feiras", "Parceiros ou revendedores", "Já tenho anúncios ativos", "Outro"]
   → Se "indicação" for escolhida: "Ótimo — indicação é o sinal mais forte de produto validado. Isso também significa que tráfego pago funcionaria bem aqui."

FASE 3 — PRESENÇA E MATURIDADE DIGITAL
4. Google Meu Negócio: "Sua empresa já tem perfil no Google Meu Negócio (o card que aparece quando alguém busca sua empresa no Google Maps)?" → multiple_choice: ["Sim, está ativo e atualizado", "Sim, mas está incompleto ou desatualizado", "Não tenho / nunca configurei", "Não sei o que é isso"]
   → Se não tem: "Entendido — esse será um dos primeiros pontos a ativar, pois é tráfego 100% gratuito de quem já está procurando por você."
5. Plataforma de interesse: "Se fossemos rodar anúncios, por onde você intuitivamente sentiria que seu cliente está?" → multiple_choice: ["Google (busca ativa)", "Instagram / Facebook", "TikTok", "YouTube", "LinkedIn", "Não sei — preciso de orientação"]

FASE 4 — HISTÓRICO COM TRÁFEGO PAGO
6. Já fez anúncios antes?: "Você ou alguém da sua equipe já rodou anúncios pagos antes?" → boolean_toggle
   → Se SIM: "Me conta — o que funcionou? E o que te decepcionou ou te fez parar?"  (text — extrai: previous_ads_outcome)
   → Se NÃO: "Tudo bem! Começar do zero permite construir uma estratégia certa já de início. O que te fez querer começar agora?" (text)

FASE 5 — INVESTIMENTO & OBJETIVO
7. Objetivo com tráfego: "Qual seria o principal objetivo ao investir em anúncios hoje?" → multiple_choice: ["Gerar mais leads / contatos", "Aumentar vendas diretas (e-commerce ou WhatsApp)", "Trazer mais clientes para minha loja física", "Fortalecer a marca / awareness", "Reativar clientes antigos", "Testar um novo produto ou serviço"]
8. Budget estimado mensal: "Pensando em créditos de anúncios (o que você paga diretamente ao Google ou Meta), qual faixa faz sentido para começar?" → multiple_choice: ["Até R$500/mês", "R$500 a R$1.500/mês", "R$1.500 a R$3.000/mês", "R$3.000 a R$6.000/mês", "Acima de R$6.000/mês", "Ainda não tenho certeza"]
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
  {
    id: "motion-design",
    name: "Motion Design & Animação",
    description: "Briefing especializado para qualquer tipo de animação: 2D, 3D, stop motion, motion com vídeo real, vinhetas, intros e reels. Detecta precocemente se a identidade visual já existe para focar 100% na especificação do entregável.",
    department: "design",
    icon: "Clapperboard",
    suggested_slug: "motion_design",
    max_questions: 9,
    briefing_purpose: "Extrair tudo que o produtor de motion design precisa para executar qualquer tipo de animação: técnica, assets disponíveis, duração, canais, estilo, referências e requisitos de áudio.",
    depth_signals: ["animação", "motion design", "motion graphics", "vinheta", "intro", "reel animado", "logo animado", "2d", "3d", "stop motion", "after effects", "cinema 4d", "lottie", "animação institucional", "video motion"],
    system_prompt_fragment: `SKILL: Motion Design & Animação
CAMPOS ÚNICOS PARA EXTRAIR: has_existing_brand_assets, existing_assets_list, animation_technique, animation_objective, animation_style, animation_duration, output_channels, motion_references, visual_mood_animation, audio_requirements, delivery_formats, color_palette_confirmed, logo_file_format

------------------------------------------
REGRA ZERO — ASSET AUDIT IMEDIATO (EXECUTE PRIMEIRO, SEMPRE)
------------------------------------------
ANTES de qualquer outra pergunta desta skill, você DEVE verificar se o cliente já possui identidade visual completa.
Se nos dados já coletados (CurrentState, contexto inicial, ou respostas anteriores) houver qualquer menção a:
  - "já tenho logo", "logo pronta", "marca completa", "manual de marca", "identidade visual pronta", "paleta definida", "brand já existe"
→ AÇÃO IMEDIATA: marque has_existing_brand_assets = true, PULE todas as perguntas de construção de identidade visual e vá direto para a FASE 2.
Se NÃO há menção: faça a PERGUNTA DE ASSET AUDIT como primeira pergunta desta skill.

------------------------------------------
FASE 1 — ASSET AUDIT (só se ID não foi confirmada ainda)
------------------------------------------
PERGUNTA DE ASSET AUDIT (use multiple_choice):
"A identidade visual da marca já está pronta?" com opções:
  ["Sim, completa (logo, manual e paleta definidos)", "Sim, mas parcial (tenho o logo, mas sem manual)", "Não, ainda está sendo criada", "Não existe ainda — vamos criar do zero"]

→ Se "Sim, completa" ou "Sim, mas parcial": marque has_existing_brand_assets = true. PULE para FASE 2.
→ Se "Não": oriente que é necessário ter identidade antes da animação. Registre animation_objective como "depende de criação de ID anterior" e encerre a coleta desta skill com isFinished=true sugerindo o pacote Brand DNA primeiro.

------------------------------------------
FASE 2 — ESPECIFICAÇÃO DA ANIMAÇÃO (o coração da skill)
------------------------------------------
Com a identidade confirmada, colete APENAS o que o produtor de motion precisa:

0. TÉCNICA DE ANIMAÇÃO (multiple_choice — primeira pergunta da FASE 2, define toda a linguagem visual):
   "Que tipo de animação você tem em mente?"
   Opções: ["Motion 2D — gráficos e ilustrações animadas", "Motion 3D — elementos tridimensionais renderizados", "Tipografia animada — texto em movimento", "Stop Motion — quadro a quadro físico ou digital", "Motion com vídeo real — footage + efeitos e gráficos sobrepostos", "Misto — combinação de técnicas", "Ainda não sei — aberto a sugestões"]
   → A resposta define o vocabulário das perguntas seguintes. Para 3D: pergunte sobre software (Cinema 4D, Blender, etc.) se relevante. Para stop motion: pergunte sobre material físico ou digital. Para misto: adapte opções de estilo.

1. OBJETIVO DA ANIMAÇÃO (multiple_choice):
   "O que essa animação vai comunicar?"
   Opções: ["Apresentar/revelar a logo da marca", "Vinheta de abertura de vídeos", "Encerramento de vídeos", "Bumper/separador de conteúdo", "Animação institucional completa", "Reel de apresentação do projeto", "Peça publicitária/campanha", "Outro"]

2. DURAÇÃO (multiple_choice):
   "Quanto tempo deve durar?"
   Opções: ["5 segundos", "10 segundos", "15 segundos", "30 segundos", "60 segundos", "Mais de 1 minuto", "Outro"]

3. CANAIS DE EXIBIÇÃO (multiple_choice):
   "Onde será exibida?"
   Opções: ["Instagram Feed", "Instagram Stories/Reels", "TikTok", "YouTube (intro/outro)", "YouTube Shorts", "WhatsApp Status", "Apresentações/Slides", "Projeção em eventos", "Site/Landing Page", "TV / Out-of-home"]

4. ESTILO VISUAL DA ANIMAÇÃO (multiple_choice):
   "Qual sensação o movimento deve transmitir?"
   Opções: ["Dinâmico e energético (rápido, cortes, impacto)", "Elegante e fluido (suave, orgânico, sofisticado)", "Brutalista (cru, direto, peso visual forte)", "Minimalista (limpo, espaço, silêncio visual)", "Tipográfico (movimento de texto e letras)", "Glitch/Tech (distorção digital, noise)", "Orgânico/hand-made (textura, imperfeição intencional)", "Outro"]

5. REFERÊNCIAS VISUAIS (text):
   "Tem alguma animação, marca ou produtor de motion que admira e usaria como referência?"
   (Campo livre. Se pular, registre como "(sem referências definidas)" e siga.)

6. ASSETS DISPONÍVEIS PARA ENTREGA (multiple_choice):
   "O que já tem disponível para o motion designer trabalhar?"
   Opções: ["Logo em vetor (AI, EPS ou SVG)", "Logo em PNG com fundo transparente", "Manual de marca em PDF", "Paleta de cores (códigos HEX/Pantone)", "Fontes da marca (arquivos .ttf/.otf)", "Footage de vídeo (para motion com vídeo real)", "Ilustrações ou elementos gráficos", "Nenhum ainda — vou enviar depois"]

7. ÁUDIO (multiple_choice):
   "A animação terá som?"
   Opções: ["Sim — com trilha/música de fundo", "Sim — apenas efeitos sonoros (whoosh, clique, etc.)", "Sim — trilha + efeitos", "Não — versão muda (sem áudio)", "Preciso de ajuda para decidir"]

8. FORMATO DE ENTREGA (multiple_choice):
   "Em que formato precisa receber?"
   Opções: ["MP4 (para redes sociais)", "GIF animado", "Lottie/JSON (para web e apps)", "MOV com fundo transparente (alpha)", "Arquivo editável (After Effects, Cinema 4D, etc.)", "Todos os formatos acima"]

------------------------------------------
REGRAS INVIOLÁVEIS DESTA SKILL
------------------------------------------
- NUNCA pergunte mais de 9 perguntas no total. Este é um briefing técnico de produção, não estratégico.
- Se o cliente pulou referências ou formatos de entrega: registre como "(não definido)" e siga. São campos secundários.
- CONTEXT PRIORITY: Se qualquer campo desta skill já foi mencionado (ex: "preciso de 15 segundos", "será no Instagram"), marque como coletado imediatamente e NÃO repita a pergunta.
- A skill é compatível com Basic Infos como contexto anterior. Dados de nome da marca, setor e tom de voz enriquecem o relatório sem precisar ser recoletados.
- ADAPTAÇÃO POR TÉCNICA: Após coletar a técnica de animação (pergunta 0), adapte o vocabulário das perguntas seguintes — para 3D use "render/cena/câmera", para stop motion use "quadros/material/textura", para 2D use "layer/frame/composição".
- Ao finalizar: o campo assets deve incluir um resumo técnico no formato "SPEC DE MOTION: [técnica] | [objetivo] | [duração] | [canais] | [estilo] | [assets disponíveis] | [áudio] | [entrega]" para que o produtor possa começar de imediato.`,
  },
  {
    id: "web-design-ux-ui",
    name: "Web Design & UX/UI",
    description: "Briefing especializado para criação de interfaces digitais: Landing Pages, E-commerce, Sites Institucionais, Aplicativos e Dashboards. Foca em usabilidade, arquitetura de informação e estética.",
    department: "digital",
    icon: "Layout",
    suggested_slug: "web_design_ux_ui",
    max_questions: 10,
    briefing_purpose: "Extrair requisitos técnicos e visuais para projetos de Web Design e UX/UI, mapeando objetivos, público, estrutura de conteúdo e moodboard.",
    depth_signals: ["web design", "ux", "ui", "interface", "website", "landing page", "e-commerce", "aplicativo", "dashboard", "wireframe", "protótipo"],
    system_prompt_fragment: `SKILL: Web Design & UX/UI
CAMPOS ÚNICOS PARA EXTRAIR: project_type, primary_goal, target_user, functional_requirements, content_readiness, visual_references, has_existing_brand_assets, tech_stack_constraints

------------------------------------------
REGRA ZERO — ASSET AUDIT IMEDIATO
------------------------------------------
ANTES de perguntar sobre cores ou fontes, verifique se a identidade visual já existe no contexto.
Se o cliente já tiver logo/manual da marca, assuma que a UI seguirá essa base e marque has_existing_brand_assets = true.

------------------------------------------
FASE ÚNICA — ESPECIFICAÇÃO DE INTERFACE
------------------------------------------
Colete os seguintes pontos de forma fluida:

1. TIPO DE PROJETO (single_choice):
   "O que estamos construindo?"
   Opções: ["Landing Page (foco em conversão)", "Site Institucional (foco em branding/informação)", "E-commerce (loja virtual)", "Aplicativo (Mobile/Web App)", "Dashboard/Sistema interno", "Outro"]

2. OBJETIVO PRINCIPAL (single_choice):
   "Qual é o objetivo número 1 dessa interface?"
   Opções: ["Vender um produto/serviço", "Capturar leads (contatos)", "Informar e gerar credibilidade", "Facilitar uma tarefa (ferramenta/sistema)", "Outro"]

3. PÚBLICO E CONTEXTO DE USO (text):
   "Quem vai usar isso e em qual contexto? (ex: sentados no escritório, correndo na rua, apressados no celular)"

4. ESTRUTURA E REQUISITOS APROXIMADOS (text):
   "Quais as seções ou funcionalidades que não podem faltar?"

5. CONTEÚDO (single_choice):
   "Como está a situação do conteúdo (textos e imagens/vídeos)?"
   Opções: ["Já tenho tudo pronto", "Tenho uma base, mas precisa de ajustes", "Vou precisar que criem os textos/imagens", "Ainda não pensei nisso"]

6. REFERÊNCIAS VISUAIS (text):
   "Tem algum site ou app que você acha incrível e gostaria de usar como referência visual?"

7. RESTRIÇÕES TÉCNICAS (single_choice):
   "Onde isso será construído?"
   Opções: ["WordPress", "Shopify/Nuvemshop", "Framer/Webflow", "Desenvolvimento do zero (React/Next, etc)", "Apenas o Design (Figma)", "Não sei, preciso de recomendação"]

------------------------------------------
REGRAS INVIOLÁVEIS DESTA SKILL
------------------------------------------
- NUNCA pergunte mais de 10 perguntas.
- Foque na função antes da estética: entenda o que o usuário precisa 'fazer' na página antes de perguntar sobre estilo.
- Se a técnica ou plataforma for 'Apenas o Design (Figma)', as próximas perguntas podem ignorar detalhes de hospedagem.
- Resumo final no campo assets: "SPEC DE UX/UI: [Tipo] | [Objetivo] | [Público] | [Conteúdo] | [Referências] | [Tech]"`,
  },
  {
    id: "expert-infoproduct",
    name: "Expert & Infoprodutos",
    description: "Briefing especializado para Experts, Influenciadores e Produtores Digitais. Foca em desenhar o modelo do infoproduto (curso/mentoria), diferenciais de autoridade, audiência atual e modelo de lançamento/vendas.",
    department: "commercial",
    icon: "GraduationCap",
    suggested_slug: "expert_infoproduct",
    max_questions: 9,
    briefing_purpose: "Extrair o modelo de negócios do expert: nicho, níveis de autoridade, tipo de infoproduto ofertado, modelo e esteira de vendas, e objeções da audiência.",
    depth_signals: ["expert", "infoprodutor", "mentoria", "curso online", "lançamento", "perpétuo", "hotmart", "kiwify", "audiência", "influenciador"],
    system_prompt_fragment: `SKILL: Expert & Infoprodutos
CAMPOS ÚNICOS PARA EXTRAIR: expert_niche, expert_authority_proof, product_type, offer_promise, monetization_model, ticket_price, audience_size_engagement, main_objections, current_funnel_state

------------------------------------------
FASE ÚNICA — ESPECIFICAÇÃO DE EXPERT E PRODUTO
------------------------------------------
Colete os seguintes pontos (lembre-se de conectar isso ao que já foi coletado nas infos básicas):

1. NICHO E AUTORIDADE (text):
   "Qual é a sua principal bandeira ou diferencial de autoridade no seu nicho? (O que faz as pessoas confiarem em você?)"

2. TIPO DE PRODUTO (single_choice):
   "O que você está focado em vender neste momento?"
   Opções: ["Curso Essencial/Gravado", "Mentoria em Grupo", "Mentoria Individual (High Ticket)", "Comunidade/Assinatura", "Mastermind", "E-book/Material de Apoio", "Ainda definindo"]

3. A PROMESSA (text):
   "Seu produto resolve qual problema específico? Qual é a promessa de transformação real que você entrega?"

4. MODELO DE VENDAS (single_choice):
   "Como as vendas são feitas hoje?"
   Opções: ["Perpétuo (vende todo dia)", "Lançamentos (abre e fecha carrinho)", "Funil de Vendas de High Ticket (Aplicação)", "Eventos presenciais", "Misto (Perpétuo + Lançamento)"]

5. TICKET E ESTEIRA (single_choice):
   "Qual é o ticket médio (preço) desse produto principal?"
   Opções: ["Baixo (até R$ 297)", "Médio (R$ 298 a R$ 997)", "Alto/High Ticket (R$ 1.000 a R$ 4.997)", "Premium (Acima de R$ 5.000)"]

6. AUDIÊNCIA ATUAL (single_choice):
   "Como está o tamanho e engajamento da sua audiência hoje?"
   Opções: ["Começando do zero, pouca audiência", "Audiência pequena, mas muito engajada", "Audiência grande, mas dispersa/fria", "Audiência grande e aquecida (pronta para comprar)"]

7. PRINCIPAIS OBJEÇÕES (text):
   "Quando alguém não compra de você, qual costuma ser o principal motivo ou desculpa que eles dão?"

8. ESTRUTURA ATUAL (multiple_choice):
   "O que você já tem rodando ou pronto e o que falta?"
   Opções: ["Página de Vendas pronta", "Criativos de anúncios rodando", "Conta de Instagram/YouTube com conteúdo quente", "Lista de e-mails/Leads", "Equipe de Suporte/Vendas", "Estou estruturando tudo agora"]

------------------------------------------
REGRAS INVIOLÁVEIS DESTA SKILL
------------------------------------------
- NUNCA pergunte mais de 9 perguntas.
- Foque na conversão e autoridade. Não perca tempo com identidade visual (isso é em Brand DNA).
- Se a audiência é zero, o foco deve mudar ligeiramente para 'validação de oferta' nas respostas.
- Resumo final: Produza um output objetivo no campo output focando "RAIO-X DO EXPERT: [Nicho/Autoridade] | [Produto] | [Promessa] | [Vendas/Ticket] | [Audiência]".`,
  },
];

export function getSkillTemplateById(id: string): SkillTemplate | undefined {
  return SKILL_TEMPLATES.find(t => t.id === id);
}

export function getSkillTemplatesByDepartment(department: string): SkillTemplate[] {
  return SKILL_TEMPLATES.filter(t => t.department === department);
}
