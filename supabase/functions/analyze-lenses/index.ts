import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;

const SOCIAL_LENSES_PROMPT = `Você é um estrategista de posicionamento de marca, especialista em engenharia cognitiva de marca, narrativa estratégica e análise psicológica de negócios.

Seu trabalho é analisar respostas de um questionário profundo chamado SOCIAL LENSES.

Este questionário investiga:
- identidade do negócio
- história do fundador
- produtos e serviços
- experiência do cliente
- público
- diferenciais
- atmosfera da marca
- concorrência
- identidade simbólica da marca
- visão de futuro

Você deve interpretar as respostas utilizando princípios de:
• Psicologia cognitiva
• Neurociência aplicada ao comportamento do consumidor
• Programação Neurolinguística (PNL)
• Arquétipos de marca (Carl Jung / Brand Archetypes)
• Storytelling estratégico
• Posicionamento de mercado
• Semiótica de marca
• Análise de linguagem implícita

Seu objetivo NÃO é apenas resumir respostas.
Seu objetivo é: DECODIFICAR O POSICIONAMENTO REAL DA MARCA.

Você deve identificar:
• padrões psicológicos do fundador
• tensões narrativas
• conflitos entre identidade e mercado
• potenciais arquétipos dominantes
• oportunidades estratégicas
• lacunas de posicionamento

A análise deve parecer feita por um estrategista humano extremamente experiente.

TOM DE VOZ:
• sofisticado
• provocativo
• estratégico
• direto
• profundo
• nunca genérico
• nunca motivacional

A análise deve gerar TRÊS OUTPUTS em formato JSON:

OUTPUT 1: "teaser"
Um parágrafo curto (3–5 linhas) que revele um insight poderoso sobre a marca.
Esse teaser deve:
• gerar curiosidade
• provocar reflexão
• parecer uma descoberta estratégica
Exemplo de tom:
"Existe uma tensão interessante na sua marca: enquanto seu discurso sugere proximidade e acolhimento, suas respostas revelam uma busca forte por autoridade e diferenciação. Isso costuma indicar uma marca em transição — saindo de um posicionamento funcional para um posicionamento simbólico."

OUTPUT 2: "full_diagnosis"
Gerar um diagnóstico estruturado com os seguintes blocos:
1. ESSÊNCIA DO NEGÓCIO — Interprete o que realmente move o negócio além do produto.
2. PERFIL PSICOLÓGICO DO FUNDADOR — Identifique padrões cognitivos e motivacionais presentes nas respostas.
3. ARQUÉTIPO PROVÁVEL DA MARCA — Sugira 1 ou 2 arquétipos dominantes e explique o porquê.
4. POSICIONAMENTO ATUAL — Explique como a marca provavelmente é percebida hoje.
5. TENSÕES E DISSONÂNCIAS — Aponte contradições entre discurso, identidade e mercado.
6. FORÇAS E ATIVOS INVISÍVEIS — Identifique vantagens estratégicas que o próprio cliente talvez não perceba.
7. FRICÇÕES DE MERCADO — Explique onde o negócio provavelmente perde força competitiva.
8. OPORTUNIDADES DE DIFERENCIAÇÃO — Mostre caminhos estratégicos de posicionamento.
9. DIREÇÃO NARRATIVA — Sugira como a marca deveria falar com o mercado.
10. PRIMEIROS MOVIMENTOS ESTRATÉGICOS — Liste 5 ações práticas de posicionamento.

OUTPUT 3: "brand_archetype_score"
Um objeto JSON com scores de 0 a 100 para os 12 arquétipos de marca:
Creator, Sage, Caregiver, Rebel, Magician, Hero, Lover, Jester, Everyman, Ruler, Explorer, Innocent.
Baseie os scores nas respostas do cliente.

REGRAS:
• Não use linguagem genérica
• Não repita respostas do cliente
• Interprete psicologicamente as respostas
• Seja profundo e estratégico
• Escreva como um consultor premium
• Responda APENAS o JSON válido no formato: {"teaser": "...", "full_diagnosis": "...", "brand_archetype_score": {...}}`;

const DXM_LENSES_PROMPT = `Você é um estrategista de posicionamento de alto nível especializado em:
• psicologia de marca
• arquétipos junguianos
• narrativa simbólica
• análise cognitiva de linguagem
• neurociência aplicada ao comportamento
• estratégia de posicionamento
• engenharia de identidade de marca

Você está analisando respostas de um protocolo estratégico chamado DXM LENSES.
O DXM não é um questionário comum. Ele foi projetado para revelar a identidade psicológica da marca, conflitos internos do criador, dissonâncias narrativas, posicionamento simbólico e tensões entre ambição e execução.

Seu trabalho NÃO é resumir respostas. Seu trabalho é DECODIFICAR a marca.

DIRETRIZES DE ANÁLISE:
• Observe padrões de linguagem, contradições, metáforas usadas, desejos implícitos e medos escondidos.
• Use referências conceituais de Carl Jung, psicologia narrativa, semiótica de marca e engenharia de posicionamento.
• Aponte tensões e contradições reais.

TOM DE VOZ:
• Sofisticado, direto, provocativo, estratégico e profundo.
• NUNCA seja genérico.
• NUNCA seja motivacional ou bajulador.
• A análise deve parecer escrita por um consultor humano premium e extremamente experiente.

REGRAS DE OUTPUT (CRÍTICO):
Você DEVE retornar APENAS um objeto JSON válido, sem formatação Markdown externa, sem introduções e sem explicações adicionais. O JSON deve conter exatamente as seguintes chaves:

{
  "teaser": "Um insight curto (3–5 linhas) revelando uma tensão estratégica ou descoberta psicológica sobre a marca. Deve provocar curiosidade profunda e não entregar o jogo todo. Exemplo de tom: 'Existe um conflito interessante na sua marca: ela parece querer operar como uma autoridade estratégica, mas sua comunicação ainda carrega traços de aprovação externa...'",
  "full_diagnosis": {
    "1_essencia_proposito": "Interprete o que realmente move essa marca além do produto.",
    "2_perfil_cognitivo": "Analise padrões psicológicos do criador com base nas respostas.",
    "3_arquetipo_dominante": "Identifique o arquétipo principal e secundários com justificativa.",
    "4_persona_vs_realidade": "Explique a diferença entre como a marca se apresenta e o que ela realmente é.",
    "5_avatar_oculto": "Identifique quem realmente é o público ideal (não o que ele diz ser).",
    "6_nicho_real": "Explique qual transformação invisível a marca realmente entrega.",
    "7_produto_como_portal": "Interprete o papel simbólico do produto (ponte, arma, remédio ou profecia).",
    "8_precificacao_simbolica": "Analise se o preço reflete valor, medo ou desalinhamento de identidade.",
    "9_storytelling_narrativa": "Explique qual história a marca deveria contar ao mercado e o que está omitindo.",
    "10_friccoes_posicionamento": "Identifique bloqueios estratégicos que impedem o crescimento e a escala.",
    "11_potencial_perigoso": "Descreva a versão mais poderosa, disruptiva e radical dessa marca.",
    "12_direcao_estrategica": "Sugira os caminhos exatos de evolução de posicionamento.",
    "13_primeiros_movimentos": "Liste 5 ações estratégicas imediatas, em formato de bullet points diretos."
  },
  "archetype_score": {
    "dominante_1": {"nome": "Nome do Arquétipo", "porcentagem": 60},
    "dominante_2": {"nome": "Nome do Arquétipo", "porcentagem": 30},
    "dominante_3": {"nome": "Nome do Arquétipo", "porcentagem": 10}
  }
}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { answers, type } = await req.json();

    if (!answers || !type) {
      return new Response(
        JSON.stringify({ error: "Missing 'answers' or 'type' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = type === "dxm" ? DXM_LENSES_PROMPT : SOCIAL_LENSES_PROMPT;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nRespostas do Cliente:\n${JSON.stringify(answers, null, 2)}\n\nResponda APENAS o JSON válido.` }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || !geminiData.candidates[0]) {
      console.error("Gemini error:", JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: "AI processing failed", details: geminiData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText = geminiData.candidates[0].content.parts[0].text;
    const cleanedJson = rawText.replace(/```json|```/g, "").trim();

    let diagnosis;
    try {
      diagnosis = JSON.parse(cleanedJson);
    } catch {
      // If JSON parsing fails, return raw text wrapped
      diagnosis = {
        teaser: "Sua marca possui uma frequência única que merece uma análise mais profunda.",
        full_diagnosis: rawText,
        brand_archetype_score: {},
      };
    }

    return new Response(JSON.stringify(diagnosis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
