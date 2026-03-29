# MeetingRecorder AI — Fullstack Architecture Document

**Versao:** 1.2
**Data:** 15/03/2026
**Autor:** Aria (Architect) — baseado no PRD v1.3 e Project Brief v2
**Status:** Aprovado

---

## 1. Introduction

Este documento define a arquitetura tecnica completa do MeetingRecorder AI, cobrindo backend, frontend e integracao. Serve como fonte unica da verdade para o desenvolvimento orientado por IA.

### 1.1 Starter Template

N/A — Projeto greenfield. Sera criado com `create-next-app` usando App Router e TypeScript.

### 1.2 Change Log

| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 15/03/2026 | 1.0 | Versao inicial da arquitetura | Aria (Architect) |
| 15/03/2026 | 1.1 | Double check: fix counters dashboard (groupBy sem filtro status), import API com auto-criacao participantes, audioPath removido do schema, ParticipantSelector cria imediatamente, busca transcricao documentada | Aria (Architect) |
| 15/03/2026 | 1.2 | Double check 2: onDelete Cascade em MeetingParticipant→Participant, chunk filename preserva extensao original, GET /api/meetings documenta _count de todos | Aria (Architect) |
| 29/03/2026 | 1.3 | Referencia ao addendum de Rotinas & Pendencias (Epic 6). Ver [architecture-rotinas-pendencias.md](./architecture-rotinas-pendencias.md) | Aria (Architect) |

---

## 2. High Level Architecture

### 2.1 Technical Summary

MeetingRecorder AI e um monolito serverless construido com Next.js 14+ (App Router) deployado na Vercel. O frontend usa React Server Components com Tailwind CSS e shadcn/ui v4 para UI responsiva mobile-first. O backend utiliza Next.js API Routes como serverless functions, Prisma v6 como ORM conectando a PostgreSQL no Neon (free tier). Integracoes externas incluem OpenAI Whisper API (transcricao) e GPT-4o-mini (analise). O chunking de audio ocorre no client para contornar o limite de 4.5MB body da Vercel free tier. SheetJS lida com import/export Excel inteiramente no client-side.

### 2.2 Platform and Infrastructure

**Platform:** Vercel (Free Tier)
**Database:** Neon PostgreSQL (Free Tier)
**External APIs:** OpenAI (Whisper + GPT-4o-mini)

| Servico | Funcao | Tier |
|---------|--------|------|
| Vercel | Hosting, Serverless Functions, CDN | Free (body 4.5MB, timeout 10s) |
| Neon | PostgreSQL managed | Free (0.5GB storage, cold start ~500ms) |
| OpenAI | Whisper ($0.006/min) + GPT-4o-mini ($0.15/1M tokens) | Pay-as-you-go |

### 2.3 Repository Structure

**Structure:** Monorepo unico (Next.js App Router — frontend + API routes no mesmo projeto)
**Package Manager:** npm
**Rationale:** Next.js App Router unifica frontend e backend naturalmente. Nao ha necessidade de monorepo tooling (Nx/Turborepo) para um projeto deste porte.

### 2.4 High Level Architecture Diagram

```mermaid
graph TB
    subgraph Client["Browser (Client)"]
        UI[Next.js Frontend<br/>React + shadcn/ui]
        MR[MediaRecorder API]
        CS[Client State<br/>Wizard Flow]
        XLS[SheetJS<br/>Excel Export/Import]
    end

    subgraph Vercel["Vercel (Serverless)"]
        SSR[Next.js SSR/RSC]
        API_T[POST /api/transcribe]
        API_A[POST /api/analyze]
        API_M[/api/meetings/*]
        API_P[/api/participants/*]
        API_TD[/api/todos/*]
        API_PA[/api/pains/*]
        API_S[/api/solutions/*]
        API_I[POST /api/import]
    end

    subgraph External["External Services"]
        WHISPER[OpenAI Whisper API]
        GPT[OpenAI GPT-4o-mini]
        NEON[(Neon PostgreSQL)]
    end

    UI --> SSR
    MR --> CS
    CS --> API_T
    CS --> API_A
    CS --> API_M
    UI --> API_P
    UI --> API_TD
    UI --> API_PA
    UI --> API_S
    UI --> API_I
    XLS --> UI

    API_T --> WHISPER
    API_A --> GPT
    API_M --> NEON
    API_P --> NEON
    API_TD --> NEON
    API_PA --> NEON
    API_S --> NEON
    API_I --> NEON
```

### 2.5 Architectural Patterns

- **Serverless Monolith:** Next.js API Routes como backend serverless — *Rationale:* Zero config, deploy unificado na Vercel, ideal para MVP
- **Client-Side Chunking:** Audio dividido em ~4MB no browser antes de envio — *Rationale:* Contorna limite 4.5MB body da Vercel free tier
- **Wizard with Client State:** Fluxo de gravacao mantido em React state ate save final — *Rationale:* Evita persistencia parcial, permite edicao antes de commit
- **Single Transaction Save:** Todo o resultado (meeting + participants + pains + solutions + todos) salvo em uma unica transacao Prisma — *Rationale:* Atomicidade e consistencia de dados
- **Client-Side Excel:** SheetJS roda no browser para export/import — *Rationale:* Zero carga no servidor, sem limite de timeout
- **Backend Filtering:** Dashboard filtra via query Prisma no banco — *Rationale:* Performance com muitos dados, sem trazer tudo para o client

---

## 3. Tech Stack

| Categoria | Tecnologia | Versao | Proposito | Rationale |
|-----------|-----------|--------|-----------|-----------|
| Linguagem | TypeScript | 5.x | Tipagem em todo o projeto | Type safety, melhor DX |
| Framework | Next.js (App Router) | 14+ | Frontend SSR + API routes | Unifica front e back, deploy Vercel nativo |
| UI Components | shadcn/ui | v4 | Componentes acessiveis | WCAG AA, customizavel, sem vendor lock |
| CSS | Tailwind CSS | 3.x | Estilizacao utility-first | Responsivo mobile-first, rapido |
| ORM | Prisma | v6 | Acesso ao banco type-safe | Migrations, type generation (v7 incompativel com Turbopack) |
| Database | PostgreSQL (Neon) | 16 | Persistencia | Free tier, acessivel de qualquer lugar |
| IA Transcricao | OpenAI Whisper API | — | Speech-to-text PT-BR | Alta precisao, suporte nativo PT-BR |
| IA Analise | OpenAI GPT-4o-mini | — | Extracao de dores/solucoes | Melhor custo-beneficio |
| Audio Capture | MediaRecorder API | Nativo | Gravacao no browser | Zero dependencias, WebM/Opus |
| Excel | SheetJS (xlsx) | — | Export/import .xlsx | Client-side, leve, sem server |
| Testing | Vitest + React Testing Library | — | Unit + Integration tests | Rapido, compativel com Next.js |
| Deploy | Vercel | Free | Hosting + CDN | Integrado com Next.js |
| State (Wizard) | React useState/useReducer | — | Estado do wizard | Nativo React, sem lib extra |

### 3.1 Restricoes Tecnicas Criticas

| Restricao | Impacto | Mitigacao |
|-----------|---------|-----------|
| Vercel free body limit: 4.5MB | Audio nao pode ser enviado inteiro | Client-side chunking ~4MB/chunk |
| Vercel free timeout: 10s | Whisper/GPT precisam responder rapido | Chunks pequenos; GPT com transcricao truncada se necessario |
| Prisma v6 (nao v7) | v7 tem breaking changes com Turbopack | Usar generator `prisma-client-js` |
| shadcn/ui v4 sem asChild | Button nao suporta `asChild` | Usar `onClick` + hidden `<input>` para file uploads |
| Select onValueChange null | shadcn Select pode retornar null | Guard: `(v) => v && handler(v)` |
| Neon cold start ~500ms | Primeira query lenta | Aceitavel para MVP; pooling futuro |
| Whisper limit 25MB/file | Audios longos excedem | Chunking ja resolve (4MB < 25MB) |

---

## 4. Data Models

### 4.1 Entity Relationship Diagram

```mermaid
erDiagram
    Meeting ||--o{ MeetingParticipant : has
    Participant ||--o{ MeetingParticipant : participates
    Meeting ||--o{ Pain : has
    Meeting ||--o{ Todo : has
    Pain ||--o{ Solution : has
    Pain ||--o{ Todo : relates

    Meeting {
        string id PK
        string title
        datetime date
        text transcription
        text context
        datetime createdAt
        datetime updatedAt
    }

    Participant {
        string id PK
        string name UK
        string costCenter
        string role
        datetime createdAt
        datetime updatedAt
    }

    MeetingParticipant {
        string id PK
        string meetingId FK
        string participantId FK
    }

    Pain {
        string id PK
        string description
        string meetingId FK
    }

    Solution {
        string id PK
        string description
        string painId FK
    }

    Todo {
        string id PK
        string action
        string responsible
        string actionOwner
        string costCenter
        string account
        datetime deadline
        datetime meetingDate
        string status
        string painId FK
        string meetingId FK
        datetime createdAt
        datetime updatedAt
    }
```

### 4.2 TypeScript Interfaces (Shared)

```typescript
// lib/types.ts

// ===== Database Models =====

export interface Meeting {
  id: string;
  title: string | null;
  date: Date;
  transcription: string | null;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
  pains?: Pain[];
  todos?: Todo[];
  participants?: MeetingParticipant[];
}

export interface Participant {
  id: string;
  name: string;
  costCenter: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  participantId: string;
  participant?: Participant;
}

export interface Pain {
  id: string;
  description: string;
  meetingId: string;
  solutions?: Solution[];
  todos?: Todo[];
}

export interface Solution {
  id: string;
  description: string;
  painId: string;
}

export interface Todo {
  id: string;
  action: string;
  responsible: string | null;
  actionOwner: string | null;
  costCenter: string | null;
  account: string | null;
  deadline: Date | null;
  meetingDate: Date;
  status: TodoStatus;
  painId: string | null;
  meetingId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TodoStatus = 'Pendente' | 'Em andamento' | 'Concluido' | 'Cancelado';

// ===== API List Types =====

export interface MeetingListItem {
  id: string;
  title: string | null;
  date: Date;
  createdAt: Date;
  _count: { todos: number };
}

// ===== API Request/Response Types =====

export interface GPTAnalysisResponse {
  title: string;
  context: string;
  pains: GPTPain[];
}

export interface GPTPain {
  description: string;
  solutions: string[];
  actions: GPTAction[];
}

export interface GPTAction {
  action: string;
  responsible: string | null;
  actionOwner: string | null;
  account: string | null;
  deadline: string | null;
}

export interface CreateMeetingRequest {
  title: string | null;
  date: string;
  transcription: string;
  context: string | null;
  participantIds: string[];
  pains: {
    description: string;
    solutions: string[];
    todos: Omit<CreateTodoRequest, 'meetingId'>[];
  }[];
  orphanTodos?: Omit<CreateTodoRequest, 'meetingId'>[];
}

export interface CreateTodoRequest {
  action: string;
  responsible?: string;
  actionOwner?: string;
  costCenter?: string;
  account?: string;
  deadline?: string;
  meetingDate: string;
  status?: TodoStatus;
  meetingId?: string;
}

export interface ImportExcelRequest {
  title: string;
  date: string;
  todos: {
    action: string;
    responsible?: string;
    actionOwner?: string;
    costCenter?: string;
    account?: string;
    deadline?: string;
    meetingDate?: string;
    status?: TodoStatus;
  }[];
}

export interface DashboardFilters {
  costCenter?: string;
  responsible?: string;
  actionOwner?: string;
  status?: TodoStatus;
  dateFrom?: string;
  dateTo?: string;
  account?: string;
}

export interface DashboardCounters {
  pendente: number;
  emAndamento: number;
  concluido: number;
  cancelado: number;
}

// ===== Wizard State =====

export interface WizardState {
  step: WizardStep;
  selectedParticipants: Participant[];
  audioBlob: Blob | null;
  audioFileName: string | null;
  transcription: string | null;
  analysis: GPTAnalysisResponse | null;
  editedPains: EditablePain[];
  editedTodos: EditableTodo[];
  title: string | null;
}

export type WizardStep =
  | 'participants'
  | 'recording'
  | 'transcription'
  | 'analysis'
  | 'pains-solutions'
  | 'todos'
  | 'save';

export interface EditablePain {
  tempId: string;
  description: string;
  solutions: EditableSolution[];
}

export interface EditableSolution {
  tempId: string;
  description: string;
}

export interface EditableTodo {
  tempId: string;
  action: string;
  responsible: string;
  actionOwner: string;
  costCenter: string;
  account: string;
  deadline: string;
  status: TodoStatus;
  painTempId: string | null;
}
```

---

## 5. API Specification

### 5.1 Overview

REST API via Next.js API Routes. Todas as rotas em `/api/*`. JSON request/response. Sem autenticacao no MVP.

### 5.2 Endpoints

#### Participants

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| GET | `/api/participants` | Listar todos (ordenados por nome) | — | `Participant[]` |
| POST | `/api/participants` | Criar participante | `{name, costCenter?, role?}` | `Participant` |
| PUT | `/api/participants/[id]` | Atualizar participante | `{name?, costCenter?, role?}` | `Participant` |
| DELETE | `/api/participants/[id]` | Remover participante | — | `{success: true}` |

#### Transcription

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| POST | `/api/transcribe` | Transcrever chunk de audio | `FormData {audio: File}` | `{text: string}` |

#### Analysis

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| POST | `/api/analyze` | Analisar transcricao com GPT | `{transcription, participants[]}` | `GPTAnalysisResponse` |

#### Meetings

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| GET | `/api/meetings` | Listar reunioes (com busca) | Query: `?search=` | `MeetingListItem[]` (com `_count.todos`) |
| POST | `/api/meetings` | Criar reuniao completa | `CreateMeetingRequest` | `Meeting` (com relacoes) |
| GET | `/api/meetings/[id]` | Detalhes com relacoes | — | `Meeting` (completo) |
| PUT | `/api/meetings/[id]` | Atualizar titulo/campos | `{title?}` | `Meeting` |
| DELETE | `/api/meetings/[id]` | Deletar (cascade) | — | `{success: true}` |

#### Todos

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| GET | `/api/todos` | Listar com filtros (dashboard) | Query: `DashboardFilters` | `{todos: Todo[], counters: DashboardCounters}` |
| POST | `/api/todos` | Criar (ou array batch) | `CreateTodoRequest \| CreateTodoRequest[]` | `Todo \| Todo[]` |
| PUT | `/api/todos/[id]` | Atualizar individual | `Partial<Todo>` | `Todo` |
| DELETE | `/api/todos/[id]` | Deletar | — | `{success: true}` |

#### Pains

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| POST | `/api/pains` | Criar dor (vinculada a meeting) | `{description, meetingId}` | `Pain` |
| PUT | `/api/pains/[id]` | Atualizar descricao | `{description}` | `Pain` |
| DELETE | `/api/pains/[id]` | Deletar (cascade solutions) | — | `{success: true}` |

#### Solutions

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| POST | `/api/solutions` | Criar solucao (vinculada a pain) | `{description, painId}` | `Solution` |
| PUT | `/api/solutions/[id]` | Atualizar descricao | `{description}` | `Solution` |
| DELETE | `/api/solutions/[id]` | Deletar | — | `{success: true}` |

#### Import

| Method | Path | Descricao | Request Body | Response |
|--------|------|-----------|-------------|----------|
| POST | `/api/import` | Importar dados do Excel | `ImportExcelRequest` | `Meeting` |

### 5.3 Error Response Format

```typescript
// Todas as APIs retornam este formato em caso de erro
interface ApiErrorResponse {
  error: string;    // Mensagem legivel
  code?: string;    // Codigo de erro (ex: "DUPLICATE_NAME", "INVALID_FORMAT")
  details?: any;    // Detalhes extras (ex: campo invalido)
}

// HTTP Status Codes usados:
// 200 - Success
// 201 - Created
// 400 - Bad Request (validacao)
// 404 - Not Found
// 409 - Conflict (ex: nome duplicado)
// 500 - Internal Server Error
```

---

## 6. Core Workflows

### 6.1 Wizard Flow (Gravacao → Save)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant WizardState
    participant API_T as /api/transcribe
    participant API_A as /api/analyze
    participant API_M as /api/meetings
    participant Whisper
    participant GPT
    participant DB as Neon PostgreSQL

    User->>Browser: Seleciona participantes
    Browser->>WizardState: Salva participantes selecionados

    User->>Browser: Grava audio / Upload
    Browser->>WizardState: Salva audio Blob

    Note over Browser: Client-Side Chunking
    Browser->>Browser: Divide audio em chunks ~4MB

    loop Para cada chunk
        Browser->>API_T: POST FormData (chunk ~4MB)
        API_T->>Whisper: Envia chunk
        Whisper-->>API_T: Texto transcrito
        API_T-->>Browser: {text: "..."}
    end

    Browser->>WizardState: Concatena transcricoes

    User->>Browser: Solicita analise IA
    Browser->>API_A: POST {transcription, participants}
    API_A->>GPT: Prompt estruturado
    GPT-->>API_A: JSON {title, context, pains}
    API_A-->>Browser: GPTAnalysisResponse
    Browser->>WizardState: Salva analise

    User->>Browser: Edita dores/solucoes/todos
    Browser->>WizardState: Atualiza estado local

    User->>Browser: Clica "Salvar Reuniao"
    Browser->>API_M: POST CreateMeetingRequest
    API_M->>DB: Transaction: create Meeting + Participants + Pains + Solutions + Todos
    DB-->>API_M: Meeting criado
    API_M-->>Browser: Meeting {id}
    Browser->>Browser: Redirect /meeting/[id]
```

### 6.2 Client-Side Audio Chunking

```mermaid
sequenceDiagram
    participant Browser
    participant Chunker as Audio Chunker
    participant API as /api/transcribe
    participant Whisper

    Browser->>Chunker: audioBlob (ex: 15MB)
    Chunker->>Chunker: Calcula chunks: ceil(15/4) = 4

    Note over Chunker: Chunk 1: 0-4MB
    Chunker->>API: POST FormData (4MB)
    API->>Whisper: audio chunk
    Whisper-->>API: "texto parte 1..."
    API-->>Chunker: {text: "texto parte 1..."}

    Note over Chunker: Chunk 2: 4-8MB
    Chunker->>API: POST FormData (4MB)
    API->>Whisper: audio chunk
    Whisper-->>API: "texto parte 2..."
    API-->>Chunker: {text: "texto parte 2..."}

    Note over Chunker: Chunks 3-4 (similar)

    Chunker->>Browser: transcricao_completa = partes.join(" ")
    Browser->>Browser: Exibe progresso "Parte 2/4..."
```

### 6.3 Dashboard Filtering

```mermaid
sequenceDiagram
    actor User
    participant Dashboard
    participant API as /api/todos
    participant DB as Neon PostgreSQL

    User->>Dashboard: Acessa /dashboard
    Dashboard->>API: GET /api/todos (sem filtros)
    API->>DB: SELECT * FROM todos (com JOINs)
    DB-->>API: Todos + Counters
    API-->>Dashboard: {todos[], counters}
    Dashboard->>Dashboard: Renderiza tabela + contadores

    User->>Dashboard: Aplica filtro (Status: Pendente)
    Dashboard->>API: GET /api/todos?status=Pendente
    API->>DB: Todos: WHERE status='Pendente' + Counters: groupBy status (SEM filtro status)
    DB-->>API: Filtered Todos + All Counters
    API-->>Dashboard: {todos[], counters}
    Dashboard->>Dashboard: Atualiza tabela (filtrada) + contadores (todos os status visiveis)
```

---

## 7. Database Schema

### 7.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Meeting {
  id            String               @id @default(cuid())
  title         String?
  date          DateTime             @default(now())
  transcription String?
  context       String?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  pains         Pain[]
  todos         Todo[]
  participants  MeetingParticipant[]
}

model Participant {
  id         String               @id @default(cuid())
  name       String               @unique
  costCenter String?
  role       String?
  createdAt  DateTime             @default(now())
  updatedAt  DateTime             @updatedAt
  meetings   MeetingParticipant[]
}

model MeetingParticipant {
  id            String      @id @default(cuid())
  meetingId     String
  meeting       Meeting     @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

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

### 7.2 Indices Recomendados

```prisma
// Adicionar ao schema para performance do dashboard

model Todo {
  // ... campos existentes ...

  @@index([status])
  @@index([meetingId])
  @@index([responsible])
  @@index([costCenter])
  @@index([meetingDate])
}

model Pain {
  // ... campos existentes ...

  @@index([meetingId])
}
```

### 7.3 Busca na Transcricao (FR24)

A busca por texto na transcricao (`GET /api/meetings?search=`) usa `Prisma.StringFilter` com `contains` + `mode: 'insensitive'` (traduz para `ILIKE %search%` no PostgreSQL). Para o MVP com poucos dados, isso e aceitavel.

**Nota de performance:** Se o volume de reunioes crescer significativamente (>500 reunioes com transcricoes longas), considerar adicionar um indice GIN para full-text search:

```sql
-- Migracao manual pos-MVP se necessario
CREATE INDEX idx_meeting_transcription_fts ON "Meeting"
  USING GIN (to_tsvector('portuguese', coalesce("transcription", '')));
```

Para o MVP, `ILIKE` e suficiente e nao requer configuracao extra.

---

## 8. Frontend Architecture

### 8.1 Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (header, nav)
│   ├── page.tsx                  # Home — lista de reunioes
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard consolidado
│   ├── recording/
│   │   └── page.tsx              # Wizard de gravacao
│   ├── meeting/
│   │   └── [id]/
│   │       └── page.tsx          # Detalhes da reuniao
│   └── api/                      # API Routes (backend)
│       ├── transcribe/
│       │   └── route.ts
│       ├── analyze/
│       │   └── route.ts
│       ├── meetings/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts      # GET, PUT, DELETE
│       ├── participants/
│       │   ├── route.ts          # GET, POST
│       │   └── [id]/
│       │       └── route.ts      # PUT, DELETE
│       ├── todos/
│       │   ├── route.ts          # GET (with filters), POST
│       │   └── [id]/
│       │       └── route.ts      # PUT, DELETE
│       ├── pains/
│       │   ├── route.ts          # POST
│       │   └── [id]/
│       │       └── route.ts      # PUT, DELETE
│       ├── solutions/
│       │   ├── route.ts          # POST
│       │   └── [id]/
│       │       └── route.ts      # PUT, DELETE
│       └── import/
│           └── route.ts          # POST
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── AudioRecorder.tsx         # Gravacao ao vivo + waveform
│   ├── AudioUpload.tsx           # Upload de arquivo audio
│   ├── ParticipantSelector.tsx   # Dropdown searchable + add new
│   ├── TranscriptionView.tsx     # Exibicao da transcricao
│   ├── AnalysisView.tsx          # Dores + solucoes editaveis
│   ├── TodoTable.tsx             # Tabela editavel (reusavel)
│   ├── MeetingCard.tsx           # Card na lista home
│   ├── DashboardFilters.tsx      # Filtros do dashboard
│   ├── DashboardCounters.tsx     # Contadores de status
│   ├── ExcelExport.tsx           # Botao exportar Excel
│   ├── ExcelImport.tsx           # Upload + mapeamento colunas
│   ├── WizardStepper.tsx         # Indicador de progresso do wizard
│   └── Header.tsx                # Navegacao principal
├── hooks/
│   ├── useAudioRecorder.ts       # MediaRecorder logic
│   ├── useChunkedTranscription.ts # Chunking + envio sequencial
│   ├── useWizard.ts              # Wizard state management
│   └── useTodoTable.ts           # Logica da tabela editavel
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── openai.ts                 # OpenAI client config
│   ├── prompts.ts                # Prompt templates para GPT
│   ├── types.ts                  # TypeScript interfaces (shared)
│   ├── utils.ts                  # Utilidades gerais
│   ├── excel.ts                  # Funcoes SheetJS (export/import)
│   └── audio.ts                  # Funcoes de chunking de audio
└── prisma/
    └── schema.prisma
```

### 8.2 Component Hierarchy

```
RootLayout (layout.tsx)
├── Header (nav: Home, Dashboard, Nova Gravacao)
│
├── HomePage (/)
│   ├── SearchInput
│   └── MeetingCard[] → link para /meeting/[id]
│
├── DashboardPage (/dashboard)
│   ├── DashboardCounters (4 cards coloridos)
│   ├── DashboardFilters (dropdowns + date pickers)
│   ├── TodoTable (editavel, conectado a API)
│   ├── ExcelExport (respeita filtros)
│   └── ExcelImport
│
├── RecordingPage (/recording) — WIZARD
│   ├── WizardStepper (indicador de etapas)
│   ├── Step 1: ParticipantSelector
│   ├── Step 2: AudioRecorder | AudioUpload
│   ├── Step 3: TranscriptionView (com progresso chunking)
│   ├── Step 4: AnalysisView (loading → resultado)
│   ├── Step 5: AnalysisView (dores/solucoes editaveis)
│   ├── Step 6: TodoTable (pre-preenchida, editavel, client state)
│   └── Step 7: SaveForm (titulo + botao salvar)
│
└── MeetingDetailPage (/meeting/[id])
    ├── MeetingHeader (titulo editavel + data + deletar)
    ├── TranscriptionView
    ├── AnalysisView (dores/solucoes editaveis, conectado a API)
    ├── TodoTable (editavel, conectado a API)
    └── ExcelExport
```

### 8.3 State Management

**Wizard Flow (RecordingPage):** `useReducer` com `WizardState` — mantido inteiramente no client.

```typescript
// hooks/useWizard.ts — estrutura conceitual

type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_PARTICIPANTS'; participants: Participant[] }
  | { type: 'SET_AUDIO'; blob: Blob; fileName?: string }
  | { type: 'SET_TRANSCRIPTION'; text: string }
  | { type: 'SET_ANALYSIS'; analysis: GPTAnalysisResponse }
  | { type: 'UPDATE_PAIN'; index: number; pain: EditablePain }
  | { type: 'ADD_PAIN'; pain: EditablePain }
  | { type: 'REMOVE_PAIN'; index: number }
  | { type: 'UPDATE_TODO'; index: number; todo: EditableTodo }
  | { type: 'ADD_TODO'; todo: EditableTodo }
  | { type: 'REMOVE_TODO'; index: number }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  // Switch on action.type, return new state
}
```

**Participantes vs Wizard State (FR6 + FR30):** O cadastro de participantes e **global** — nao faz parte dos dados da reuniao. Quando o usuario digita um nome novo no `ParticipantSelector`, o componente cria o participante **imediatamente** via `POST /api/participants` e recebe o ID de volta. Isso nao viola o FR30 (client state ate save) porque:
- FR30 refere-se aos dados da reuniao (transcricao, pains, todos)
- Participantes sao cadastro global reutilizavel entre reunioes
- O wizard armazena apenas os `participantIds` selecionados no client state
- O link `MeetingParticipant` e criado no save final (`POST /api/meetings`)

**Paginas de detalhes e dashboard:** Fetch direto via `fetch()` + re-fetch apos mutacoes. Sem lib de state management global — simplidade para MVP.

### 8.4 Routing Architecture

```
/                       → Home (lista reunioes)
/dashboard              → Dashboard (todos consolidados)
/recording              → Wizard de gravacao
/meeting/[id]           → Detalhes da reuniao
```

Sem rotas protegidas no MVP (sem autenticacao).

### 8.5 Frontend Services Layer

```typescript
// lib/api.ts — funcoes de fetch para o frontend

const API_BASE = '/api';

// Participants
export async function getParticipants(): Promise<Participant[]> { ... }
export async function createParticipant(data: {name: string; costCenter?: string; role?: string}): Promise<Participant> { ... }
export async function updateParticipant(id: string, data: Partial<Participant>): Promise<Participant> { ... }
export async function deleteParticipant(id: string): Promise<void> { ... }

// Transcription
export async function transcribeChunk(audioChunk: Blob): Promise<string> { ... }

// Analysis
export async function analyzeTranscription(transcription: string, participants: Participant[]): Promise<GPTAnalysisResponse> { ... }

// Meetings
export async function getMeetings(search?: string): Promise<MeetingListItem[]> { ... }
export async function createMeeting(data: CreateMeetingRequest): Promise<Meeting> { ... }
export async function getMeeting(id: string): Promise<Meeting> { ... }
export async function updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> { ... }
export async function deleteMeeting(id: string): Promise<void> { ... }

// Todos
export async function getTodos(filters?: DashboardFilters): Promise<{todos: Todo[]; counters: DashboardCounters}> { ... }
export async function updateTodo(id: string, data: Partial<Todo>): Promise<Todo> { ... }
export async function deleteTodo(id: string): Promise<void> { ... }

// Pains & Solutions
export async function createPain(data: {description: string; meetingId: string}): Promise<Pain> { ... }
export async function updatePain(id: string, data: {description: string}): Promise<Pain> { ... }
export async function deletePain(id: string): Promise<void> { ... }
export async function createSolution(data: {description: string; painId: string}): Promise<Solution> { ... }
export async function updateSolution(id: string, data: {description: string}): Promise<Solution> { ... }
export async function deleteSolution(id: string): Promise<void> { ... }

// Import
export async function importExcel(data: ImportExcelRequest): Promise<Meeting> { ... }
```

---

## 9. Backend Architecture

### 9.1 API Route Organization

Cada arquivo `route.ts` exporta handlers nomeados (`GET`, `POST`, `PUT`, `DELETE`).

```typescript
// Padrao para API routes — app/api/participants/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(participants);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validacao
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Nome e obrigatorio' },
      { status: 400 }
    );
  }

  try {
    const participant = await prisma.participant.create({
      data: {
        name: body.name.trim(),
        costCenter: body.costCenter?.trim() || null,
        role: body.role?.trim() || null,
      },
    });
    return NextResponse.json(participant, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Participante com este nome ja existe', code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }
    throw error;
  }
}
```

### 9.2 Transaction Pattern (POST /api/meetings)

```typescript
// app/api/meetings/route.ts — POST handler (conceitual)

export async function POST(request: NextRequest) {
  const body: CreateMeetingRequest = await request.json();

  const meeting = await prisma.$transaction(async (tx) => {
    // 1. Criar Meeting
    const meeting = await tx.meeting.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        transcription: body.transcription,
        context: body.context,
      },
    });

    // 2. Associar Participants
    if (body.participantIds.length > 0) {
      await tx.meetingParticipant.createMany({
        data: body.participantIds.map((pid) => ({
          meetingId: meeting.id,
          participantId: pid,
        })),
      });
    }

    // 3. Criar Pains + Solutions + Todos
    for (const painData of body.pains) {
      const pain = await tx.pain.create({
        data: {
          description: painData.description,
          meetingId: meeting.id,
        },
      });

      // Solutions
      if (painData.solutions.length > 0) {
        await tx.solution.createMany({
          data: painData.solutions.map((s) => ({
            description: s,
            painId: pain.id,
          })),
        });
      }

      // Todos vinculados a esta pain
      if (painData.todos.length > 0) {
        await tx.todo.createMany({
          data: painData.todos.map((t) => ({
            ...t,
            meetingId: meeting.id,
            painId: pain.id,
            meetingDate: new Date(t.meetingDate || body.date),
            deadline: t.deadline ? new Date(t.deadline) : null,
          })),
        });
      }
    }

    // 4. Todos orfaos (sem pain vinculada)
    if (body.orphanTodos?.length) {
      await tx.todo.createMany({
        data: body.orphanTodos.map((t) => ({
          ...t,
          meetingId: meeting.id,
          meetingDate: new Date(t.meetingDate || body.date),
          deadline: t.deadline ? new Date(t.deadline) : null,
        })),
      });
    }

    return meeting;
  });

  // Retornar meeting completo com relacoes
  const full = await prisma.meeting.findUnique({
    where: { id: meeting.id },
    include: {
      pains: { include: { solutions: true } },
      todos: true,
      participants: { include: { participant: true } },
    },
  });

  return NextResponse.json(full, { status: 201 });
}
```

### 9.3 Transcription Route

```typescript
// app/api/transcribe/route.ts (conceitual)

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;

  if (!audioFile) {
    return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
  }

  // Verificar tamanho (~4MB max por chunk)
  if (audioFile.size > 4.5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Chunk excede 4.5MB. Use chunking no client.' },
      { status: 400 }
    );
  }

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'pt',
  });

  return NextResponse.json({ text: transcription.text });
}
```

### 9.4 Analysis Route

```typescript
// app/api/analyze/route.ts (conceitual)

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildAnalysisPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  const { transcription, participants } = await request.json();

  if (!transcription?.trim()) {
    return NextResponse.json({ error: 'Transcricao obrigatoria' }, { status: 400 });
  }

  // Truncar se muito longa (respeitar timeout 10s)
  const maxChars = 12000; // ~3000 tokens
  const truncated = transcription.length > maxChars
    ? transcription.substring(0, maxChars) + '\n[...transcricao truncada...]'
    : transcription;

  const prompt = buildAnalysisPrompt(truncated, participants);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: 'GPT nao retornou resposta' }, { status: 500 });
  }

  try {
    const analysis = JSON.parse(content);
    // Validar estrutura basica
    if (!analysis.context || !Array.isArray(analysis.pains)) {
      throw new Error('Estrutura invalida');
    }
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: 'GPT retornou JSON invalido', raw: content },
      { status: 422 }
    );
  }
}
```

### 9.5 Dashboard Todos Route

```typescript
// app/api/todos/route.ts — GET handler (conceitual)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Filtros SEM status (para counters)
  const baseWhere: any = {};

  if (searchParams.get('responsible')) baseWhere.responsible = { contains: searchParams.get('responsible'), mode: 'insensitive' };
  if (searchParams.get('actionOwner')) baseWhere.actionOwner = { contains: searchParams.get('actionOwner'), mode: 'insensitive' };
  if (searchParams.get('costCenter')) baseWhere.costCenter = { contains: searchParams.get('costCenter'), mode: 'insensitive' };
  if (searchParams.get('account')) baseWhere.account = { contains: searchParams.get('account'), mode: 'insensitive' };

  if (searchParams.get('dateFrom') || searchParams.get('dateTo')) {
    baseWhere.meetingDate = {};
    if (searchParams.get('dateFrom')) baseWhere.meetingDate.gte = new Date(searchParams.get('dateFrom')!);
    if (searchParams.get('dateTo')) baseWhere.meetingDate.lte = new Date(searchParams.get('dateTo')!);
  }

  // Filtro COM status (para lista de todos)
  const todosWhere = { ...baseWhere };
  if (searchParams.get('status')) todosWhere.status = searchParams.get('status');

  // Counters usam baseWhere (SEM filtro de status) — assim todos os 4 contadores
  // sempre mostram valores reais, mesmo quando o usuario filtra por status
  const [todos, statusCounts] = await Promise.all([
    prisma.todo.findMany({
      where: todosWhere,
      include: { meeting: { select: { id: true, title: true } }, pain: { select: { description: true } } },
      orderBy: { meetingDate: 'desc' },
    }),
    prisma.todo.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true,
    }),
  ]);

  // Montar counters a partir do groupBy
  const counters = { pendente: 0, emAndamento: 0, concluido: 0, cancelado: 0 };
  for (const row of statusCounts) {
    if (row.status === 'Pendente') counters.pendente = row._count;
    else if (row.status === 'Em andamento') counters.emAndamento = row._count;
    else if (row.status === 'Concluido') counters.concluido = row._count;
    else if (row.status === 'Cancelado') counters.cancelado = row._count;
  }

  return NextResponse.json({ todos, counters });
}
```

---

## 10. External APIs

### 10.1 OpenAI Whisper API

- **Purpose:** Transcricao de audio para texto em PT-BR
- **Documentation:** https://platform.openai.com/docs/api-reference/audio
- **Base URL:** `https://api.openai.com/v1/audio/transcriptions`
- **Authentication:** Bearer token (OPENAI_API_KEY)
- **Rate Limits:** 50 RPM (free tier), 500 RPM (tier 1)
- **Key Endpoint:** `POST /v1/audio/transcriptions` — envia audio, recebe texto
- **Formato:** multipart/form-data com campo `file`
- **Limite por request:** 25MB
- **Custo:** ~$0.006/minuto de audio
- **Integration Notes:** Cada chunk ~4MB e enviado individualmente. Frontend concatena resultados.

### 10.2 OpenAI Chat Completions (GPT-4o-mini)

- **Purpose:** Analise de transcricao — extracao de dores, solucoes e acoes
- **Documentation:** https://platform.openai.com/docs/api-reference/chat
- **Base URL:** `https://api.openai.com/v1/chat/completions`
- **Authentication:** Bearer token (OPENAI_API_KEY)
- **Rate Limits:** Varies by tier
- **Key Endpoint:** `POST /v1/chat/completions` — envia prompt, recebe analise JSON
- **Modelo:** `gpt-4o-mini`
- **Custo:** ~$0.15/1M input tokens, ~$0.60/1M output tokens
- **Integration Notes:** Usar `response_format: { type: "json_object" }` para forcar JSON. Truncar transcricoes >12000 chars para caber no timeout de 10s.

---

## 11. Unified Project Structure

```
meeting-recorder/
├── docs/
│   ├── prd.md                    # PRD v1.3 (aprovado)
│   ├── project-brief-v2.md       # Brief v2 (aprovado)
│   └── architecture.md           # Este documento
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home
│   │   ├── globals.css           # Tailwind globals
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── recording/
│   │   │   └── page.tsx
│   │   ├── meeting/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── transcribe/
│   │       │   └── route.ts
│   │       ├── analyze/
│   │       │   └── route.ts
│   │       ├── meetings/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── participants/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── todos/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── pains/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── solutions/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── import/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (auto-gerado)
│   │   ├── Header.tsx
│   │   ├── AudioRecorder.tsx
│   │   ├── AudioUpload.tsx
│   │   ├── ParticipantSelector.tsx
│   │   ├── TranscriptionView.tsx
│   │   ├── AnalysisView.tsx
│   │   ├── TodoTable.tsx
│   │   ├── MeetingCard.tsx
│   │   ├── DashboardFilters.tsx
│   │   ├── DashboardCounters.tsx
│   │   ├── ExcelExport.tsx
│   │   ├── ExcelImport.tsx
│   │   └── WizardStepper.tsx
│   ├── hooks/
│   │   ├── useAudioRecorder.ts
│   │   ├── useChunkedTranscription.ts
│   │   ├── useWizard.ts
│   │   └── useTodoTable.ts
│   └── lib/
│       ├── db.ts                 # Prisma client singleton
│       ├── openai.ts             # OpenAI client
│       ├── prompts.ts            # GPT prompt templates
│       ├── types.ts              # Shared TypeScript types
│       ├── utils.ts              # Utilidades gerais
│       ├── api.ts                # Frontend API service layer
│       ├── excel.ts              # SheetJS export/import
│       └── audio.ts              # Audio chunking utilities
├── .env.example                  # Template de env vars
├── .env.local                    # Env vars locais (gitignored)
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 12. Development Workflow

### 12.1 Prerequisites

```bash
# Node.js 18+
node --version  # v18.x ou superior

# npm (vem com Node.js)
npm --version
```

### 12.2 Initial Setup

```bash
# Criar projeto
npx create-next-app@latest meeting-recorder --typescript --tailwind --eslint --app --src-dir

# Instalar dependencias
cd meeting-recorder
npm install prisma @prisma/client openai xlsx
npm install -D @types/node

# Configurar Prisma
npx prisma init

# Configurar shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input card select table badge dialog dropdown-menu calendar popover
```

### 12.3 Development Commands

```bash
# Desenvolvimento
npm run dev         # Start Next.js dev server (localhost:3000)

# Database
npx prisma migrate dev    # Criar/aplicar migrations
npx prisma studio         # UI do banco (debug)
npx prisma generate       # Regenerar Prisma client

# Build & Deploy
npm run build       # Build de producao
npm run start       # Start production server

# Quality
npm run lint        # ESLint
npx tsc --noEmit    # Type check
```

### 12.4 Environment Configuration

```bash
# .env.local (NAO commitar)

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/meeting-recorder?sslmode=require"

# OpenAI
OPENAI_API_KEY="sk-proj-..."
```

---

## 13. Deployment Architecture

### 13.1 Deployment Strategy

**Platform:** Vercel (Git integration)
**Build Command:** `npm run build` (inclui `prisma generate`)
**Output:** `.next/` (auto-detectado pela Vercel)

| Environment | URL | Proposito |
|-------------|-----|-----------|
| Development | localhost:3000 | Dev local |
| Preview | *.vercel.app (por branch) | Preview de PRs |
| Production | meeting-recorder-*.vercel.app | Producao |

### 13.2 Vercel Configuration

```json
// vercel.json (se necessario)
{
  "functions": {
    "src/app/api/transcribe/route.ts": {
      "maxDuration": 10
    },
    "src/app/api/analyze/route.ts": {
      "maxDuration": 10
    }
  }
}
```

### 13.3 Environment Variables na Vercel

| Variable | Environment | Descricao |
|----------|-------------|-----------|
| `DATABASE_URL` | All | Connection string Neon PostgreSQL |
| `OPENAI_API_KEY` | All | API key OpenAI |

### 13.4 Build Script (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

---

## 14. Security and Performance

### 14.1 Security Requirements

**Frontend Security:**
- Sem dados sensiveis no client (API key nunca exposta)
- Inputs sanitizados antes de envio
- CSP headers via `next.config.js`

**Backend Security:**
- Input validation em todos os endpoints (body, params)
- Prisma previne SQL injection nativamente (parametrized queries)
- CORS: Same-origin (Next.js API routes, mesmo dominio)
- Rate limiting: Nao implementado no MVP (uso pessoal)
- API key do OpenAI somente no server (env var)

**Dados:**
- Sem autenticacao no MVP (uso pessoal/time pequeno)
- Neon PostgreSQL com SSL obrigatorio (`sslmode=require`)
- Audio NAO e persistido no servidor (processado e descartado)

### 14.2 Performance Optimization

**Frontend:**
- React Server Components para paginas estaticas (Home, Dashboard)
- Client Components apenas onde necessario (interatividade)
- Lazy loading para componentes pesados (AudioRecorder, ExcelImport)
- Debounce em campos de busca (300ms)

**Backend:**
- Indices no banco para filtros do dashboard (status, meetingDate, responsible, costCenter)
- Prisma `select` para retornar apenas campos necessarios em listagens
- Paginacao futura (nao no MVP, mas schema suporta)

**Audio:**
- Chunks ~4MB para caber no body limit e timeout
- Envio sequencial (nao paralelo) para evitar sobrecarga

---

## 15. Testing Strategy

### 15.1 Abordagem

Unit + Integration. Sem E2E no MVP (overhead alto para time de 1 pessoa).

### 15.2 O que testar

| Area | Tipo | Ferramenta | Prioridade |
|------|------|------------|------------|
| API Routes (CRUD) | Integration | Vitest | Alta |
| GPT JSON parsing | Unit | Vitest | Alta |
| Audio chunking logic | Unit | Vitest | Alta |
| CC auto-fill logic | Unit | Vitest | Media |
| Excel export/import | Unit | Vitest | Media |
| Wizard state reducer | Unit | Vitest | Media |
| Components UI | Manual | Browser | Baixa (MVP) |
| Fluxo E2E | Manual | Browser | Baixa (MVP) |

### 15.3 Test Structure

```
src/
├── __tests__/
│   ├── api/
│   │   ├── participants.test.ts
│   │   ├── meetings.test.ts
│   │   ├── todos.test.ts
│   │   └── analyze.test.ts
│   ├── lib/
│   │   ├── audio.test.ts
│   │   ├── excel.test.ts
│   │   └── prompts.test.ts
│   └── hooks/
│       └── useWizard.test.ts
```

---

## 16. Coding Standards

### 16.1 Critical Rules

- **Prisma v6 Only:** NUNCA usar Prisma v7 — incompativel com Turbopack. Generator: `prisma-client-js`
- **shadcn/ui v4 Upload:** Button NAO suporta `asChild`. Para file upload: usar `onClick` que dispara `<input type="file" hidden />`
- **Select Guard:** `onValueChange` do shadcn Select pode retornar null. Sempre: `(v) => v && handler(v)`
- **API Key Server-Only:** `OPENAI_API_KEY` NUNCA no client. Somente em API routes (server-side)
- **Prisma Singleton:** Usar pattern de singleton para evitar multiplas instancias em dev
- **Error Responses:** Sempre retornar `{ error: string }` com status HTTP correto
- **CC Business Rule:** Centro de custo do Todo = CC do Responsavel (demandante), NAO do executor
- **Audio NAO Persistido:** Audio e processado em memoria e descartado. NAO salvar no filesystem nem no banco. Campo `audioPath` removido do schema
- **Transaction para Save:** `POST /api/meetings` e `POST /api/import` DEVEM usar `prisma.$transaction` para atomicidade
- **ParticipantSelector Cria Imediatamente:** Nomes novos digitados no ParticipantSelector sao criados via `POST /api/participants` IMEDIATAMENTE (cadastro global). O wizard armazena apenas IDs no client state. O link MeetingParticipant e criado no save final
- **Import Auto-Cria Participantes:** A rota `POST /api/import` faz `upsert` de todos os nomes de responsible/actionOwner no cadastro de participantes (FR6)
- **Dashboard Counters SEM Filtro de Status:** Os counters do dashboard usam `groupBy` com filtros base (costCenter, responsible, dateRange) mas EXCLUEM o filtro de status, para que todos os 4 contadores sejam sempre visiveis

### 16.2 Naming Conventions

| Elemento | Convencao | Exemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `TodoTable.tsx` |
| Custom Hooks | camelCase com `use` | `useWizard.ts` |
| API Routes | kebab-case (dirs) | `/api/participants/[id]/route.ts` |
| Lib files | camelCase | `openai.ts`, `excel.ts` |
| Types/Interfaces | PascalCase | `CreateMeetingRequest` |
| Variaveis/funcoes | camelCase | `getParticipants()` |
| Env vars | UPPER_SNAKE | `OPENAI_API_KEY` |
| CSS classes | Tailwind utility | `className="flex items-center gap-2"` |

### 16.3 Prisma Client Singleton

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 16.4 OpenAI Client

```typescript
// lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## 17. Error Handling Strategy

### 17.1 API Error Pattern

```typescript
// lib/utils.ts

export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}

// Uso nas routes:
// return apiError('Nome obrigatorio', 400);
// return apiError('Participante ja existe', 409, 'DUPLICATE_NAME');
```

### 17.2 Frontend Error Handling

```typescript
// Pattern para chamadas API no frontend

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Componentes usam try/catch + toast/alert para feedback ao usuario
```

### 17.3 GPT Fallback (FR34)

Se a analise GPT falhar ou retornar JSON invalido:
1. API retorna status 422 com `{ error: "...", raw: "..." }`
2. Frontend exibe mensagem: "A analise IA falhou. Deseja tentar novamente ou preencher manualmente?"
3. Opcao "Tentar novamente" → re-envia para `/api/analyze`
4. Opcao "Preencher manualmente" → avanca no wizard com dores/solucoes/todos vazios para preenchimento manual

---

## 18. Audio Chunking Implementation

### 18.1 Client-Side Chunking

```typescript
// lib/audio.ts

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export function calculateChunks(blob: Blob): number {
  return Math.ceil(blob.size / CHUNK_SIZE);
}

export function getChunk(blob: Blob, index: number): Blob {
  const start = index * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, blob.size);
  return blob.slice(start, end, blob.type);
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
  };
  return map[mimeType] || 'webm';
}

export async function transcribeWithChunking(
  audioBlob: Blob,
  onProgress: (current: number, total: number) => void
): Promise<string> {
  const totalChunks = calculateChunks(audioBlob);
  const texts: string[] = [];
  const ext = getExtensionFromMime(audioBlob.type);

  for (let i = 0; i < totalChunks; i++) {
    onProgress(i + 1, totalChunks);

    const chunk = getChunk(audioBlob, i);
    const formData = new FormData();
    formData.append('audio', chunk, `chunk-${i}.${ext}`);

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Chunk ${i + 1} failed`);
    }

    const { text } = await res.json();
    texts.push(text);
  }

  return texts.join(' ');
}
```

### 18.2 Nota sobre Chunking de Audio

**Limitacao conhecida:** Cortar um blob de audio em bytes arbitrarios pode gerar chunks invalidos (header corrompido). Para o MVP, a abordagem funciona porque:
- WebM/Opus e relativamente tolerante a cortes
- Whisper aceita chunks parciais na maioria dos casos
- Para audios curtos (<4MB), nao ha chunking

**Melhoria pos-MVP:** Usar FFmpeg WASM no browser para split correto por tempo, nao por bytes.

---

## 19. GPT Prompt Template

```typescript
// lib/prompts.ts

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
```

---

## 20. Excel Implementation

### 20.1 Export (Client-Side)

```typescript
// lib/excel.ts
import * as XLSX from 'xlsx';

export function exportTodosToExcel(todos: Todo[], filename: string) {
  const data = todos.map((t) => ({
    'Responsavel': t.responsible || '',
    'Responsavel pela acao': t.actionOwner || '',
    'Centro de custo': t.costCenter || '',
    'Data reuniao': formatDate(t.meetingDate),
    'Conta': t.account || '',
    'TO-DO': t.action,
    'Prazo': t.deadline ? formatDate(t.deadline) : '',
    'Status': t.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'To-Dos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### 20.2 Import (Client-Side Parsing + Server Save)

1. **Client:** SheetJS le o `.xlsx` e extrai headers + rows
2. **Client:** Interface de mapeamento — usuario mapeia colunas do Excel para colunas do app
3. **Client:** Preview dos dados mapeados
4. **Client:** Envia dados mapeados para `POST /api/import` (`ImportExcelRequest`)
5. **Server:** Executa em transacao:
   a. Extrai nomes unicos de `responsible` e `actionOwner` de todos os todos
   b. Para cada nome, faz `upsert` no Participant (cria se nao existe, ignora se ja existe)
   c. Cria Meeting com titulo e data
   d. Cria MeetingParticipant links para todos os participantes encontrados
   e. Cria Todos vinculados ao Meeting (respeitando status da planilha — FR27)
   f. Retorna Meeting completo com relacoes

**Auto-criacao de participantes (FR6):** A rota de import garante que todos os nomes de `responsible` e `actionOwner` sao adicionados ao cadastro de participantes automaticamente via `upsert`. Isso e consistente com o comportamento do `ParticipantSelector` no wizard.

---

## 21. Monitoring (MVP)

Para o MVP, monitoramento minimo:

- **Vercel Analytics:** Metricas de deploy e performance (gratis)
- **Console.error:** Logs de erro nas API routes (visiveis no Vercel Functions log)
- **Frontend:** `try/catch` com feedback visual ao usuario (toasts/alerts)

Pos-MVP: Considerar Sentry para error tracking.

---

## 22. Checklist de Validacao

- [x] Todas as FRs do PRD v1.3 cobertas pela arquitetura
- [x] Todas as NFRs enderecadas (Vercel limits, mobile-first, HTTPS)
- [x] Schema Prisma completo e consistente com Brief v2 (audioPath removido — audio nao e persistido)
- [x] API endpoints para todos os CRUDs necessarios
- [x] Chunking de audio documentado e viavel
- [x] GPT prompt com `response_format: json_object`
- [x] Restricoes tecnicas documentadas (Prisma v6, shadcn v4, Vercel limits)
- [x] Estrutura de pastas definida
- [x] Workflow de deploy na Vercel documentado
- [x] Tipos TypeScript compartilhados entre front e back
- [x] Dashboard counters usam groupBy sem filtro de status (C1/M1 corrigido)
- [x] Import API documenta auto-criacao de participantes via upsert (C2 corrigido)
- [x] ParticipantSelector cria participante imediatamente, wizard armazena IDs (I2 corrigido)
- [x] Busca na transcricao documentada com nota de performance (I3 corrigido)
- [x] MeetingParticipant → Participant com onDelete: Cascade (v1.2 I1 corrigido)
- [x] Audio chunk filename preserva extensao original do arquivo (v1.2 M1 corrigido)
- [x] GET /api/meetings retorna _count de todos para MeetingCard (v1.2 M2 corrigido)

---

*— Aria, arquitetando o futuro*
