Multimodalidade Ativa: Incentivar o uso de voz quando detectar fricção na digitação.
Intervenção Inteligente da IA: Expandir respostas curtas e oferecer exemplos sem bloquear o usuário.
Reforço Positivo Contínuo: Micro-interações validadoras após boas respostas.e na transicao de temas ou pde perguntas, mostrando que voce esta construindo um dos documenteos mais imorantes da historia da empresa dele e etc (sem aumentar o tempo de carregamento) entre uma e outra
Mecânica: A primeira interação não deve induzda a voz a segunda multipla escolha so pra dar uma leveza (mas premanece o mesmo sentido de coletar bem no inicio (ver prompt)
se der skip mais de 3 vezes seguidas vamos a uma tela dessas de incentivo e mudamos bruscamente o tema, longe do que foi skipado, e cada skip é um red flag para ia de que aquele tema nao deve se repetir daqueal forma
Detecção de Fadiga (Stuck Detection):

Condição: Usuário inativo por > 15 segundos ou apagando/reescrevendo muito texto no mesmo campo.
Ação da IA: Exibir um tooltip suave encorajando o modo de voz: "Dica: Muitas pessoas preferem enviar um áudio para esta pergunta. Tente clicar no microfone!" ou mostrar um exemplo prático (Placeholder dinâmico).
Interceptador de Respostas Curtas:
Condição: Usuário enviou resposta textual contendo < 10 palavras para uma pergunta complexa (ex: "Quem é seu público alvo?" -> "Mulheres").
Ação: O algoritmo aceita a resposta, mas aciona a IA para um follow-up imediato e amigável: "Perfeito, mulheres. Você tem em mente uma faixa etária específica ou um estilo de vida que elas compartilham? (Ou clique em pular se não tiver)".

as transcicoes de incentivo sao para momentos como esse de skip e Interceptador de Respostas Curtas, momenot sque precisam de um processamento extra

Auto-Save Transparente: O algoritmo salva cada keystroke/step no banco (via Supabase).
Engagement Recovery: Se o cliente fechar a aba com < 80% do briefing concluído, o sistema agenda um gatilho (webhook) para o dono da agência repassar ao cliente: "Notamos que seu briefing tem informações ótimas salvas. Clique aqui para retomar de onde parou.

Regra de Elogio: Se o usuário enviar um áudio com > 30 segundos com sucesso, o bot da IA responde: "Excelente explicação! Isso nos dá uma clareza enorme." (nao so audio texto grande tambem)

Regra de Pulo Dinâmico (Smart Branching): Omitir perguntas contextuais se a IA julgar que a pergunta anterior já cobriu o assunto indiretamente.
 Personalização do tom por setor
As perguntas são genéricas o suficiente para qualquer negócio, mas poderiam se adaptar dinamicamente ao segmento (ex: para trading/importação, perguntas mais específicas sobre logística, compliance, etc.). mas mnao muito so uma vez ou utra para entender como a companhia supera aqueal peculariedade do mercado dela

conversa:
Follow-ups Automáticos da IA: A IA pode fazer "1 pergunta extra" de aprofundamento automaticamente se achar a reposta ruim, ou acha que isso pode irritar ou afastar o cliente final? Sim é chato ela pode esperar umas 3 a 5 rodadas e mencionar uma pergunta pque pode ter uma insercao leve do tema ignorado e tentar se nao for bem ou se conseguir ja esquece esse tema, temos o suficiente

