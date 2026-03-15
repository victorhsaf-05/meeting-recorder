# Project Brief: MeetingRecorder AI v2

**Versao:** 2.0
**Data:** 15/03/2026
**Status:** Aprovado para implementacao
**Autor:** Atlas (Analyst) + Victor (Stakeholder)

---

## 1. Executive Summary

MeetingRecorder AI e um aplicativo web que grava reunioes, transcreve o audio com IA, analisa automaticamente o conteudo para identificar dores (pain points) e solucoes discutidas, e gera uma tabela de to-do editavel com acoes, responsaveis, centros de custo, prazos e status.

- **Problema:** Informacoes valiosas discutidas em reunioes se perdem por falta de registro estruturado. Planilhas manuais funcionam, mas dependem de preenchimento 100% humano.
- **Mercado-alvo:** Profissionais de planejamento financeiro e equipes que fazem reunioes frequentes com multiplos setores.
- **Proposta de valor:** Automatizar o ciclo gravar → transcrever → analisar → gerar acoes, reduzindo preenchimento manual e garantindo rastreabilidade.

---

## 2. Problem Statement

- Reunioes geram discussoes ricas sobre problemas e solucoes, mas essas informacoes raramente sao capturadas de forma estruturada
- Atas manuais sao incompletas, subjetivas e consomem tempo
- Sem rastreamento formal, acoes definidas em reuniao nao sao executadas
- Planilha manual atual funciona, mas exige preenchimento completo pelo usuario
- Nao ha visao consolidada de acoes pendentes entre multiplas reunioes
- Solucoes existentes (Otter.ai, Fireflies) focam em transcricao pura, sem extracao automatica de dores/solucoes e geracao de to-do

---

## 3. Proposed Solution

Web app Next.js acessivel de qualquer dispositivo (PC, celular) com 5 etapas:

1. **Cadastro de participantes** — persistente, aprende com o uso (nome + centro de custo)
2. **Gravacao ao vivo OU upload de audio** — mesma tela, suporta m4a do Apple Watch
3. **Transcricao** — via Whisper API (PT-BR)
4. **Analise IA** — GPT extrai contexto, dores, solucoes e sugere acoes com responsaveis
5. **Tabela de To-Do editavel** — replica planilha real do usuario + extras do app

---

## 4. Target Users

### Primario: Planejamento Financeiro
- Conduz reunioes com multiplos setores da empresa
- Precisa rastrear acoes, responsaveis e centros de custo
- Quer visibilidade consolidada sobre andamento das tarefas
- Usa PC da empresa no escritorio e celular/Apple Watch em mobilidade

### Secundario: Responsaveis de outros setores
- Recebem acoes derivadas das reunioes
- Consultam o to-do para saber suas responsabilidades

---

## 5. Tech Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 14+ (App Router) | SSR, API routes, React Server Components |
| UI | Tailwind CSS + shadcn/ui | Componentes acessiveis, tema consistente, mobile-first |
| Transcricao | OpenAI Whisper API | Alta precisao, suporte PT-BR nativo |
| Analise IA | OpenAI GPT-4o-mini | Custo-beneficio para analise de texto |
| Banco de dados | PostgreSQL (Neon) | Tier gratuito, acessivel de qualquer lugar |
| ORM | Prisma | Type-safe, migrations automaticas |
| Deploy | Vercel | Integrado com Next.js, tier gratuito |
| Audio | MediaRecorder API + upload | Nativo do browser, sem dependencias |
| Excel | SheetJS (xlsx) | Exportacao/importacao de planilhas |

---

## 6. MVP Features

```
F1:  Gravacao ao vivo (browser — PC/mobile)
F2:  Upload de audio pre-gravado (m4a, mp3, wav, webm) — mesma tela
F3:  Cadastro de participantes persistente (nome + centro de custo)
F4:  Transcricao com Whisper (PT-BR) + chunking para audios > 25MB
F5:  Analise com GPT (contexto, dores, solucoes, acoes + participantes)
F6:  Visualizacao de dores e solucoes (editavel)
F7:  Tabela de To-Do editavel (dropdown participantes + texto livre)
F8:  Sugestao inteligente de responsaveis e CC (baseado em historico)
F9:  Dashboard consolidado (todos os to-dos + filtros + contadores)
F10: Historico de reunioes com busca
F11: Deploy Vercel + Neon PostgreSQL
F12: UI responsiva mobile-first
F13: Exportar tabela para Excel (.xlsx) — dashboard e pagina da reuniao
F14: Importar tabela do Excel (.xlsx) com mapeamento de colunas
```

---

## 7. Tabela de To-Do — Colunas

| Coluna | Fonte | Editavel | Interacao |
|--------|-------|----------|-----------|
| Responsavel | IA sugere / manual | Sim | Dropdown participantes + texto livre |
| Responsavel pela acao | IA sugere / manual | Sim | Dropdown participantes + texto livre |
| Centro de custo | Auto (CC do Responsavel) | Sim | Auto-preenche, pode sobrescrever |
| Data reuniao | Auto | Nao | — |
| Conta | IA sugere / manual | Sim | Texto livre |
| TO-DO (Acao) | IA gera / manual | Sim | Texto livre |
| Prazo | IA sugere / manual | Sim | Calendario (date picker) |
| Dor relacionada | IA | Nao | Referencia (da analise) |
| Status | Default: Pendente | Sim | Dropdown: Pendente, Em andamento, Concluido, Cancelado |

### Regras de negocio da tabela

- **Centro de custo do to-do = CC do Responsavel** (quem demanda a acao), nao de quem executa
- **Responsavel ≠ Responsavel pela acao** — podem ser de centros de custo diferentes
- **Nome novo digitado** (nao esta no dropdown) → salva automaticamente no cadastro de participantes
- **IA aprende CC** dos participantes progressivamente com o uso
- **Campos que a IA nao identificar** ficam vazios para preenchimento manual

---

## 8. Dashboard

### Filtros (backend — query no banco)
- Centro de custo
- Responsavel
- Responsavel pela acao
- Status (Pendente, Em andamento, Concluido, Cancelado)
- Periodo (data da reuniao: de/ate)
- Conta

### Contadores rapidos no topo
- Pendentes (amarelo)
- Em andamento (azul)
- Concluidos (verde)
- Cancelados (vermelho)

### Tabela unificada
- Todos os to-dos de todas as reunioes
- Coluna extra: referencia a reuniao de origem
- Editavel (mesmo comportamento da tabela na pagina da reuniao)
- Exportavel para Excel (respeita filtros aplicados)

---

## 9. Navegacao

| Pagina | Rota | Funcao |
|--------|------|--------|
| Home | `/` | Lista de reunioes + busca |
| Dashboard | `/dashboard` | To-dos consolidados + filtros + contadores + exportar |
| Nova Gravacao | `/recording` | Cadastrar participantes → gravar/upload → transcrever → analisar → to-do |
| Detalhes da Reuniao | `/meeting/[id]` | Dores/solucoes + to-dos + transcricao + exportar |

---

## 10. Schema do Banco

```prisma
model Meeting {
  id            String   @id @default(cuid())
  title         String?
  date          DateTime @default(now())
  audioPath     String?
  transcription String?
  context       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  pains         Pain[]
  todos         Todo[]
  participants  MeetingParticipant[]
}

model Participant {
  id         String   @id @default(cuid())
  name       String   @unique
  costCenter String?
  role       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  meetings   MeetingParticipant[]
}

model MeetingParticipant {
  id            String      @id @default(cuid())
  meetingId     String
  meeting       Meeting     @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id])

  @@unique([meetingId, participantId])
}

model Pain {
  id          String     @id @default(cuid())
  description String
  meetingId   String
  meeting     Meeting    @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  solutions   Solution[]
  todos       Todo[]
}

model Solution {
  id          String @id @default(cuid())
  description String
  painId      String
  pain        Pain   @relation(fields: [painId], references: [id], onDelete: Cascade)
}

model Todo {
  id          String    @id @default(cuid())
  action      String
  responsible String?
  actionOwner String?
  costCenter  String?
  account     String?
  deadline    DateTime?
  meetingDate DateTime
  status      String    @default("Pendente")
  painId      String?
  pain        Pain?     @relation(fields: [painId], references: [id], onDelete: SetNull)
  meetingId   String
  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 11. Fluxo Completo

```
1. Home → "Nova Gravacao"
2. Cadastrar/selecionar participantes (nome + CC)
   → Participantes ja cadastrados aparecem no dropdown
   → Novos participantes: digitar nome + CC → salva no cadastro
3. Gravar ao vivo OU upload de audio (m4a, mp3, wav, webm)
   → Gravacao: botoes gravar/pausar/parar + timer + waveform
   → Upload: aceita arquivos do Apple Watch (Voice Memos), celular, etc.
   → Chunking automatico para audios > 25MB
4. Whisper transcreve (PT-BR)
   → Indicador de progresso
   → Exibicao da transcricao completa
5. GPT analisa com lista de participantes como contexto
   → Extrai: contexto (resumo), dores, solucoes
   → Sugere: acoes, responsaveis (quando mencionados), contas, prazos
   → Puxa CC automaticamente do cadastro de participantes
6. Tela de revisao:
   → Dores & solucoes (editavel)
   → Tabela de to-do pre-preenchida pela IA
   → Campos vazios = IA nao identificou → preencher via dropdown ou texto livre
   → CC auto-preenche ao selecionar responsavel
7. Salvar reuniao
8. Acessivel por:
   → Home (historico de reunioes)
   → Dashboard (visao consolidada de todos os to-dos)
9. Exportar para Excel a qualquer momento
10. Importar planilhas existentes via upload Excel com mapeamento de colunas
```

---

## 12. Prompt de Analise GPT

```
Voce e um analista de reunioes. Analise a transcricao abaixo.

Participantes desta reuniao:
{participants_with_cost_centers}

Extraia:
1. **Contexto**: Resumo de 2-3 frases sobre o tema da reuniao
2. **Dores**: Lista de problemas/dificuldades mencionados
3. **Solucoes**: Para cada dor, liste as solucoes propostas
4. **Acoes**: Lista de tarefas com:
   - acao (descricao da tarefa)
   - responsavel (quem demanda — use os nomes dos participantes)
   - responsavel_pela_acao (quem executa — use os nomes dos participantes)
   - conta (categoria/projeto relacionado)
   - prazo (se mencionado)

O centro de custo de cada acao = centro de custo do responsavel.
Se nao conseguir identificar um campo, retorne null.

Responda SOMENTE em JSON valido:
{
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
```

---

## 13. Decisoes Tecnicas

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Diarizacao de speakers | Nao (MVP) | Whisper nao suporta, alternativas tem custo |
| Filtros do dashboard | Backend (query no banco) | Performance com muitos dados |
| Import Excel | Com mapeamento de colunas | Flexibilidade para diferentes formatos de planilha |
| Chunking de audio | Sim, automatico | Whisper tem limite de 25MB |
| Import respeita Status | Sim | Planilhas existentes podem ter tarefas ja concluidas |
| Apple Watch | Via Voice Memos nativo + upload | Zero desenvolvimento adicional |
| Centro de custo | 1 campo por to-do, vinculado ao Responsavel | Regra de negocio confirmada |

---

## 14. Out of Scope (MVP)

- Gravacao de video
- Integracao com Google Meet / Zoom / Teams (captura direta)
- Multiusuario / autenticacao
- Edicao colaborativa em tempo real
- Notificacoes de prazo
- App nativo iOS/watchOS
- Diarizacao de speakers (identificacao de voz)

---

## 15. Post-MVP Vision

### Phase 2
- PWA (instalar no celular, icone na home, offline)
- Dashboard com metricas (reunioes/semana, acoes pendentes, taxa de conclusao)
- Dark mode
- Integracao com Google Calendar (criar eventos de prazo)

### Phase 3
- Integracao com ferramentas de videochamada (capturar audio do Meet/Zoom)
- Multi-usuario com autenticacao
- Notificacoes por email quando prazo se aproxima
- Diarizacao com modelos open-source (Pyannote)

### Phase 4
- App nativo iOS/watchOS
- Integracao com Notion/Jira/Google Sheets

---

## 16. Constraints & Assumptions

### Constraints
- **Custo API:** Whisper ~$0.006/min, GPT-4o-mini ~$0.15/1M tokens
- **Audio:** Limite Whisper 25MB → chunking automatico
- **Browser:** MediaRecorder requer HTTPS ou localhost
- **Diarizacao:** Nao disponivel no MVP (limitacao do Whisper)

### Assumptions
- Usuario usara Chrome ou Firefox modernos
- Reunioes em portugues (PT-BR)
- Audio do microfone do dispositivo (nao captura de sistema)
- Uso pessoal/time pequeno (sem multitenancy)
- Apple Watch usa Voice Memos nativo para gravar

---

## 17. Verificacao / Test Plan

1. **Gravacao:** Gravar audio de 30s, verificar que salva corretamente
2. **Upload:** Enviar arquivo m4a, mp3, wav — verificar que aceita todos
3. **Chunking:** Testar com audio > 25MB
4. **Transcricao:** Validar texto retornado em PT-BR
5. **Participantes:** Cadastrar, selecionar, verificar persistencia
6. **Analise:** Validar JSON estruturado com dores/solucoes/acoes
7. **To-Do:** Criar, editar (dropdown + texto livre), deletar
8. **CC automatico:** Selecionar responsavel, verificar CC auto-preenchido
9. **Dashboard:** Filtros, contadores, tabela consolidada
10. **Exportar Excel:** Verificar que respeita filtros
11. **Importar Excel:** Upload + mapeamento + dados corretos no app
12. **Mobile:** Testar fluxo completo no celular
13. **Persistencia:** Recarregar pagina, verificar dados
14. **E2E:** Fluxo completo: gravar → transcrever → analisar → to-do → dashboard

---

## 18. Arquitetura de Alto Nivel

```
src/
├── app/
│   ├── page.tsx                    # Home — lista de reunioes
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard consolidado
│   ├── recording/
│   │   └── page.tsx                # Gravacao/upload + fluxo completo
│   ├── meeting/
│   │   └── [id]/
│   │       └── page.tsx            # Detalhes: dores + to-do + transcricao
│   └── api/
│       ├── transcribe/
│       │   └── route.ts            # POST: audio → Whisper (com chunking)
│       ├── analyze/
│       │   └── route.ts            # POST: transcricao → GPT analise
│       ├── meetings/
│       │   └── route.ts            # CRUD reunioes
│       ├── participants/
│       │   └── route.ts            # CRUD participantes
│       ├── todos/
│       │   └── route.ts            # CRUD todos + filtros dashboard
│       └── import/
│           └── route.ts            # POST: importar Excel
├── components/
│   ├── AudioRecorder.tsx           # Gravacao + upload (mesma tela)
│   ├── ParticipantSelector.tsx     # Dropdown + texto livre + cadastro
│   ├── TranscriptionView.tsx       # Exibicao da transcricao
│   ├── AnalysisView.tsx            # Dores + solucoes (editavel)
│   ├── TodoTable.tsx               # Tabela editavel
│   ├── DashboardFilters.tsx        # Filtros do dashboard
│   ├── DashboardCounters.tsx       # Contadores de status
│   ├── ExcelExport.tsx             # Botao exportar Excel
│   ├── ExcelImport.tsx             # Upload + mapeamento de colunas
│   └── MeetingCard.tsx             # Card na lista
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── openai.ts                   # OpenAI client (Whisper + GPT)
│   ├── prompts.ts                  # Prompts para GPT
│   └── excel.ts                    # Funcoes de export/import Excel
└── prisma/
    └── schema.prisma               # Schema do banco
```

---

*— Atlas, investigando a verdade*
