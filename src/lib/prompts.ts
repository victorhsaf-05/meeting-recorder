export function buildAnalysisPrompt(
  transcription: string,
  participants: { name: string; costCenter: string | null }[]
): string {
  const participantList = participants
    .map((p) => `- ${p.name}${p.costCenter ? ` (CC: ${p.costCenter})` : ''}`)
    .join('\n');

  return `Voce e um analista de reunioes. Analise a transcricao abaixo.

Participantes desta reuniao:
${participantList}

Extraia:
1. **title**: Titulo curto da reuniao (~5 palavras)
2. **context**: Resumo de 2-3 frases sobre o tema da reuniao
3. **pains**: Lista de problemas/dificuldades mencionados, cada um com:
   - description: descricao do problema
   - solutions: lista de solucoes propostas
   - actions: lista de tarefas, cada uma com:
     - action: descricao da tarefa
     - responsible: quem demanda (use nomes dos participantes, ou null)
     - actionOwner: quem executa (use nomes dos participantes, ou null)
     - account: categoria/projeto relacionado (ou null)
     - deadline: prazo se mencionado (formato YYYY-MM-DD, ou null)

O centro de custo de cada acao = centro de custo do responsavel.
Se nao conseguir identificar um campo, retorne null.

Responda SOMENTE em JSON valido:
{
  "title": "...",
  "context": "...",
  "pains": [
    {
      "description": "...",
      "solutions": ["..."],
      "actions": [
        {
          "action": "...",
          "responsible": "..." ou null,
          "actionOwner": "..." ou null,
          "account": "..." ou null,
          "deadline": "..." ou null
        }
      ]
    }
  ]
}

Transcricao:
---
${transcription}
---`;
}
