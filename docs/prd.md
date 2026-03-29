# MeetingRecorder AI — Product Requirements Document (PRD)

**Versao:** 1.3
**Data:** 15/03/2026
**Autor:** Morgan (PM) — baseado no Project Brief v2 (Atlas + Victor)
**Status:** Aprovado

---

## 1. Goals and Background Context

### 1.1 Goals

- Automatizar o ciclo completo de reunioes: gravar → transcrever → analisar → gerar acoes
- Eliminar a necessidade de preenchimento manual de planilhas de to-do pos-reuniao
- Permitir acesso multi-dispositivo (PC empresa, celular, Apple Watch via upload)
- Extrair automaticamente dores, solucoes e acoes com responsaveis e centros de custo
- Fornecer visao consolidada de todas as acoes pendentes via dashboard
- Manter compatibilidade com o fluxo atual do usuario (planilha Excel)

### 1.2 Background Context

O usuario atualmente registra acoes de reunioes em planilhas Excel com colunas especificas (Responsavel, Responsavel pela acao, Centro de custo, Data reuniao, Conta, TO-DO, Prazo). Esse processo funciona, mas e 100% manual — consome tempo e depende de anotacoes durante a reuniao, o que gera perda de informacoes.

MeetingRecorder AI visa automatizar esse fluxo usando IA (Whisper para transcricao, GPT para analise), mantendo a estrutura da planilha que o usuario ja conhece, mas adicionando inteligencia: sugestao de responsaveis, auto-preenchimento de centros de custo, e um dashboard para rastreamento de acoes entre reunioes.

### 1.3 Change Log

| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 15/03/2026 | 1.0 | Versao inicial do PRD baseada no Project Brief v2 | Morgan (PM) |
| 15/03/2026 | 1.1 | Double check: corrigido fluxo (participantes antes de gravacao), adicionados FR30-FR32 (salvar reuniao, CRUD meetings, entry point import), adicionados ACs faltantes em Stories 4.3, 4.4 e 5.1 | Morgan (PM) |
| 15/03/2026 | 1.2 | Analise critica: NFR11-13 (limites Vercel), FR33-34 (titulo auto-gerado, fallback GPT), CRUD completo participantes, inversao Stories 4.1/4.2 (API antes de UI), Story 4.3 wizard, chunking no client, consistencia persistencia | Morgan (PM) |
| 15/03/2026 | 1.3 | Double check v1.2: titulo Epic 4 alinhado, ref Story 3.3→4.3, NFR12 ~4MB, FR8 chunking por limite Vercel, CRUD pains/solutions na Story 4.1, Story 3.2 client state, playback na Story 2.1 | Morgan (PM) |

---

## 2. Requirements

### 2.1 Functional Requirements

- **FR1:** O sistema deve gravar audio ao vivo via microfone do browser (MediaRecorder API) com indicador visual de gravacao (timer + waveform simples).
- **FR2:** O sistema deve aceitar upload de arquivos de audio pre-gravados nos formatos m4a, mp3, wav e webm (incluindo gravacoes do Apple Watch via Voice Memos).
- **FR3:** Gravacao ao vivo e upload devem estar na mesma tela, como opcoes alternativas.
- **FR4:** O sistema deve manter um cadastro persistente de participantes (nome unico + centro de custo opcional + cargo opcional) com CRUD completo (criar, listar, atualizar e deletar).
- **FR5:** Antes de iniciar uma gravacao/upload, o usuario deve poder selecionar participantes da reuniao via dropdown com busca + opcao de digitar nome novo.
- **FR6:** Nomes novos digitados em qualquer campo de participante devem ser salvos automaticamente no cadastro de participantes.
- **FR7:** O sistema deve enviar o audio para a OpenAI Whisper API para transcricao em PT-BR.
- **FR8:** O sistema deve implementar chunking automatico no client para todo audio que exceda ~4MB (limite de body da Vercel). O frontend divide o audio em chunks, envia sequencialmente para a API, e concatena as transcricoes retornadas.
- **FR9:** O sistema deve exibir indicador de progresso durante a transcricao.
- **FR10:** O sistema deve enviar a transcricao + lista de participantes (com centros de custo) para GPT-4o-mini para analise automatica.
- **FR11:** A analise do GPT deve extrair: contexto geral (resumo 2-3 frases), dores/problemas identificados, solucoes propostas para cada dor, e acoes sugeridas com responsavel, responsavel pela acao, conta e prazo.
- **FR12:** A resposta do GPT deve ser em JSON estruturado, conforme schema definido no prompt.
- **FR13:** Dores e solucoes extraidas devem ser exibidas de forma estruturada e editavel.
- **FR14:** O sistema deve gerar automaticamente uma tabela de to-do pre-preenchida pela IA com as colunas: Responsavel, Responsavel pela acao, Centro de custo, Data reuniao, Conta, TO-DO (Acao), Prazo, Dor relacionada, Status.
- **FR15:** A tabela de to-do deve ser editavel inline — todos os campos editaveis conforme especificacao (ver secao UI).
- **FR16:** Campos de responsavel devem usar dropdown com participantes cadastrados + opcao de texto livre para nomes novos.
- **FR17:** O campo Centro de custo deve auto-preencher com o CC do Responsavel selecionado, mas permitir sobrescrita manual.
- **FR18:** O campo Status deve ser dropdown com opcoes: Pendente (default), Em andamento, Concluido, Cancelado.
- **FR19:** O usuario deve poder adicionar e remover linhas da tabela manualmente.
- **FR20:** O sistema deve fornecer um dashboard consolidado mostrando todos os to-dos de todas as reunioes.
- **FR21:** O dashboard deve ter filtros backend (query no banco): Centro de custo, Responsavel, Responsavel pela acao, Status, Periodo (data da reuniao de/ate), Conta.
- **FR22:** O dashboard deve exibir contadores rapidos no topo: Pendentes (amarelo), Em andamento (azul), Concluidos (verde), Cancelados (vermelho).
- **FR23:** O sistema deve manter historico de reunioes com data e titulo, acessivel na pagina Home.
- **FR24:** O historico deve suportar busca por texto na transcricao.
- **FR25:** O sistema deve permitir exportar a tabela de to-dos para Excel (.xlsx) — tanto da pagina da reuniao quanto do dashboard (respeitando filtros).
- **FR26:** O sistema deve permitir importar planilhas Excel (.xlsx) com interface de mapeamento de colunas (usuario mapeia colunas do Excel para colunas do app).
- **FR27:** A importacao deve respeitar o campo Status da planilha (tarefas ja concluidas nao devem virar "Pendente").
- **FR28:** A IA deve sugerir responsaveis e centros de custo baseando-se no historico de participantes e seus CCs anteriores.
- **FR29:** Campos que a IA nao conseguir identificar devem ficar vazios para preenchimento manual.
- **FR30:** O fluxo de gravacao deve manter todos os dados em estado local (client state) durante as etapas do wizard. Ao final, o botao "Salvar Reuniao" persiste tudo no banco em uma unica operacao: cria Meeting, associa participantes, salva transcricao, dores, solucoes e to-dos.
- **FR31:** O sistema deve permitir editar o titulo de uma reuniao existente e deletar reunioes do historico.
- **FR32:** A funcao de importar Excel deve ser acessivel a partir do Dashboard (botao "Importar Excel" ao lado do botao "Exportar Excel").
- **FR33:** O titulo da reuniao deve ser auto-gerado pelo GPT a partir do contexto da analise (resumo curto de ~5 palavras), mas editavel manualmente pelo usuario a qualquer momento.
- **FR34:** Se a analise GPT falhar ou retornar JSON invalido, o sistema deve exibir mensagem de erro clara e permitir que o usuario: (a) tente novamente, ou (b) preencha dores/solucoes/to-dos manualmente.

### 2.2 Non-Functional Requirements

- **NFR1:** O app deve ser responsivo mobile-first, funcionando em smartphones e tablets.
- **NFR2:** O app deve ser acessivel via HTTPS (requisito do MediaRecorder API).
- **NFR3:** O app deve funcionar em Chrome e Firefox modernos.
- **NFR4:** O deploy deve ser na Vercel com tier gratuito.
- **NFR5:** O banco de dados deve ser PostgreSQL via Neon (tier gratuito).
- **NFR6:** O tempo de transcricao do Whisper deve exibir feedback visual ao usuario.
- **NFR7:** Filtros do dashboard devem ser executados no backend (query no banco) para performance com muitos dados.
- **NFR8:** O sistema deve funcionar para uso pessoal/time pequeno (sem multitenancy nem autenticacao no MVP).
- **NFR9:** O custo de API deve ser minimizado usando GPT-4o-mini (~$0.15/1M tokens) e Whisper (~$0.006/min).
- **NFR10:** O audio deve ser salvo temporariamente antes de envio para API (resiliencia).
- **NFR11:** O upload de audio deve contornar o limite de 4.5MB do body das serverless functions da Vercel (free tier). Estrategia: chunking no client — o frontend divide o audio em partes menores e envia sequencialmente para a API, que repassa cada chunk ao Whisper e concatena as transcricoes.
- **NFR12:** As chamadas ao Whisper e GPT devem respeitar o timeout de 10s das serverless functions da Vercel (free tier). Estrategia: cada chunk individual deve ser pequeno o suficiente para transcricao em <10s (~4MB/chunk). Para GPT, transcricoes muito longas devem ser truncadas ou resumidas antes do envio.
- **NFR13:** Se o timeout de 10s for insuficiente para operacoes de IA, considerar upgrade para Vercel Pro (60s timeout) ou implementar pattern assincrono (client polling).

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

Interface limpa e funcional que replica a experiencia da planilha Excel que o usuario ja conhece, mas com inteligencia automatizada. O foco e em eficiencia: minimo de cliques para gravar, transcrever, analisar e gerar to-dos. A navegacao deve ser intuitiva com 4 telas principais.

### 3.2 Key Interaction Paradigms

- **Fluxo linear guiado:** Participantes → gravacao/upload → transcricao → analise → to-do (wizard-like na pagina de recording)
- **Edicao inline:** Tabela de to-do editavel diretamente, sem modais
- **Dropdown com autocomplete:** Para selecao de participantes com opcao de texto livre
- **Auto-preenchimento inteligente:** CC preenche ao selecionar responsavel
- **Filtros aplicados em tempo real:** Dashboard atualiza ao mudar filtros

### 3.3 Core Screens and Views

1. **Home (/)** — Lista de reunioes anteriores com cards (titulo, data, qtd de to-dos). Campo de busca no topo. Botao "Nova Gravacao" proeminente. Link para Dashboard.
2. **Dashboard (/dashboard)** — Contadores de status no topo (4 cards coloridos). Barra de filtros (dropdowns + date pickers). Tabela unificada de to-dos editavel. Botao exportar Excel.
3. **Nova Gravacao (/recording)** — Fluxo em etapas na mesma pagina: (a) Selecionar/cadastrar participantes, (b) Gravar ao vivo OU upload de audio, (c) Transcricao com progresso, (d) Analise IA com resultado, (e) Dores/solucoes editaveis, (f) Tabela de to-do editavel, (g) Salvar.
4. **Detalhes da Reuniao (/meeting/[id])** — Tabs ou secoes: Transcricao completa, Dores & Solucoes, Tabela de To-Do (editavel), Botao exportar Excel.

### 3.4 Accessibility

WCAG AA — componentes shadcn/ui ja atendem. Foco em contraste, navegacao por teclado e labels descritivos.

### 3.5 Branding

Sem branding corporativo. Usar tema padrao do shadcn/ui com cores limpas. Identidade visual minimalista e profissional.

### 3.6 Target Devices and Platforms

Web Responsivo (mobile-first). Desktop via browser do PC da empresa. Mobile via browser do celular. Nao ha app nativo no MVP.

---

## 4. Technical Assumptions

### 4.1 Repository Structure: Monorepo

Projeto unico Next.js (App Router) com frontend e API routes no mesmo repositorio.

### 4.2 Service Architecture

Monolito serverless — Next.js deployed na Vercel. API routes para backend. Prisma ORM conectando ao Neon PostgreSQL. OpenAI SDK para Whisper e GPT.

**Stack confirmada:**

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14+ |
| UI | Tailwind CSS + shadcn/ui | v4 |
| ORM | Prisma | v6 (v7 tem breaking changes com Turbopack) |
| DB | PostgreSQL (Neon) | Tier gratuito |
| IA Transcricao | OpenAI Whisper API | — |
| IA Analise | OpenAI GPT-4o-mini | — |
| Audio Browser | MediaRecorder API | Nativo |
| Excel | SheetJS (xlsx) | — |
| Deploy | Vercel | Tier gratuito |
| Linguagem | TypeScript | Strict mode |

### 4.3 Testing Requirements

Unit + Integration. Testar API routes, parsing de JSON do GPT, logica de auto-preenchimento de CC, e fluxo de import/export Excel. Testar manualmente fluxos de gravacao e transcricao (dependem de API externa).

### 4.4 Additional Technical Assumptions

- Prisma v6 obrigatorio (v7 tem incompatibilidade com Next.js Turbopack)
- shadcn/ui v4 nao suporta prop `asChild` no Button — usar onClick + hidden input para uploads
- `Select.onValueChange` pode retornar null no shadcn — guardar com `v && handler(v)`
- MediaRecorder gera formato WebM/Opus nativamente
- Whisper API aceita ate 25MB por request — implementar chunking para audios maiores
- **Vercel free tier: body limit 4.5MB, timeout 10s** — chunking DEVE ocorrer no client (frontend divide audio em chunks ~4MB, envia sequencialmente, API transcreve cada chunk e retorna texto parcial, frontend concatena)
- Neon PostgreSQL tem cold start de ~500ms na primeira query (aceitavel para MVP)
- Audio upload via FormData para API routes Next.js (respeitando limite de 4.5MB por request)

---

## 5. Epic List

### Epic 1: Fundacao e Infraestrutura
Configurar projeto Next.js, banco de dados, ORM, OpenAI SDK e deploy basico na Vercel. Entregar uma pagina funcional com health check.

### Epic 2: Gravacao e Transcricao
Implementar gravacao de audio ao vivo e upload, transcricao via Whisper com chunking, e exibicao do resultado.

### Epic 3: Participantes e Analise IA
Cadastro de participantes persistente, analise com GPT que usa contexto dos participantes, e exibicao de dores/solucoes.

### Epic 4: Tabela de To-Do, Wizard e Paginas
APIs de persistencia, tabela de to-do editavel, fluxo wizard da gravacao, pagina de detalhes e historico na Home.

### Epic 5: Dashboard e Excel
Dashboard consolidado com filtros backend e contadores, exportacao e importacao de Excel.

### Epic 6: Rotinas & Pendencias
Sistema de gestao de rotinas de trabalho com historico de execucoes, dependencias, status computado, e pendencias avulsas. Dashboard "Meu Dia" para visao diaria. Ver [PRD Addendum](./prd-rotinas-pendencias.md).

---

## 6. Epic Details

---

### Epic 1: Fundacao e Infraestrutura

**Objetivo:** Estabelecer toda a base tecnica do projeto — setup Next.js, banco de dados PostgreSQL via Neon, Prisma ORM, OpenAI SDK, UI base com shadcn/ui — e fazer deploy funcional na Vercel. Ao final, o app deve estar acessivel online com uma pagina home basica.

#### Story 1.1: Setup do Projeto Next.js com TypeScript e Tailwind

> Como desenvolvedor,
> eu quero um projeto Next.js configurado com TypeScript, Tailwind CSS e shadcn/ui,
> para que tenhamos a base do frontend pronta para desenvolvimento.

**Acceptance Criteria:**
1. Projeto Next.js 14+ criado com App Router e TypeScript strict mode
2. Tailwind CSS configurado e funcionando
3. shadcn/ui inicializado com componentes base (Button, Input, Card, Select, Table, Badge)
4. Estrutura de pastas conforme arquitetura definida (app/, components/, lib/)
5. `npm run dev` inicia sem erros
6. `npm run build` compila sem erros

#### Story 1.2: Configurar Prisma com Neon PostgreSQL e Schema

> Como desenvolvedor,
> eu quero Prisma ORM conectado ao Neon PostgreSQL com o schema completo do projeto,
> para que o banco de dados esteja pronto para uso.

**Acceptance Criteria:**
1. Prisma v6 instalado e configurado (generator `prisma-client-js`)
2. `DATABASE_URL` configurado no `.env` apontando para Neon
3. Schema completo criado: Meeting, Participant, MeetingParticipant, Pain, Solution, Todo
4. Migration executada com sucesso no Neon
5. Prisma client gerado e exportado em `lib/db.ts`
6. Seed basico (opcional) para dados de teste

#### Story 1.3: Configurar OpenAI SDK e Pagina Home Basica

> Como usuario,
> eu quero acessar a pagina inicial do app e ver que esta funcionando,
> para que eu saiba que o deploy esta correto.

**Acceptance Criteria:**
1. OpenAI SDK configurado em `lib/openai.ts` com `OPENAI_API_KEY` do `.env`
2. Pagina Home (`/`) renderiza com titulo "MeetingRecorder AI" e layout base
3. Navegacao basica com links para Home e Dashboard (placeholder)
4. Layout responsivo com header e area de conteudo
5. `npm run build` continua sem erros

#### Story 1.4: Deploy na Vercel

> Como usuario,
> eu quero acessar o app online de qualquer dispositivo,
> para que eu possa usar no PC da empresa e no celular.

**Acceptance Criteria:**
1. Projeto conectado a Vercel (via CLI ou Git integration)
2. Variaveis de ambiente configuradas na Vercel (DATABASE_URL, OPENAI_API_KEY)
3. Build e deploy bem-sucedidos
4. App acessivel via URL da Vercel
5. Pagina Home renderiza corretamente no desktop e mobile

#### Story 1.5: Configurar Vitest + React Testing Library

> Como desenvolvedor,
> eu quero um framework de testes configurado,
> para que eu possa escrever e executar testes unitarios e de componentes.

**Acceptance Criteria:**
1. Vitest instalado e configurado com `vitest.config.ts`
2. React Testing Library + jsdom configurados para testes de componentes
3. Script `npm run test` executa os testes
4. Arquivo de setup com `@testing-library/jest-dom` matchers
5. Teste de exemplo valida que o setup funciona corretamente
6. `npm run build` continua sem erros

---

### Epic 2: Gravacao e Transcricao

**Objetivo:** Permitir que o usuario grave audio ao vivo pelo browser ou faca upload de audio pre-gravado, e obtenha a transcricao automatica via Whisper API. Inclui chunking para audios grandes e feedback visual durante todo o processo.

#### Story 2.1: Componente de Gravacao de Audio ao Vivo

> Como usuario,
> eu quero gravar audio da reuniao diretamente pelo browser,
> para que eu nao precise de ferramentas externas.

**Acceptance Criteria:**
1. Componente `AudioRecorder` com botoes gravar/pausar/parar
2. Timer visivel durante gravacao (mm:ss)
3. Indicador visual de que o microfone esta ativo (waveform simples ou icone pulsante)
4. Audio salvo como Blob em formato WebM/Opus
5. Apos parar a gravacao, permitir playback do audio antes de prosseguir
6. Funciona em Chrome e Firefox modernos
7. Solicita permissao de microfone ao usuario
8. Tratamento de erro se microfone nao estiver disponivel

#### Story 2.2: Upload de Audio Pre-Gravado

> Como usuario,
> eu quero fazer upload de um audio gravado no Apple Watch ou celular,
> para que eu possa usar gravacoes feitas fora do browser.

**Acceptance Criteria:**
1. Botao de upload na mesma tela da gravacao ao vivo
2. Aceita formatos: m4a, mp3, wav, webm
3. Exibe nome e tamanho do arquivo selecionado
4. Validacao de formato (rejeitar tipos nao suportados com mensagem)
5. Preview/play do audio antes de prosseguir (opcional, desejavel)
6. Opcoes de gravar e upload sao alternativas — selecionar uma desabilita a outra

#### Story 2.3: API de Transcricao com Whisper e Chunking

> Como usuario,
> eu quero que o audio seja transcrito automaticamente em portugues,
> para que eu tenha o texto completo da reuniao.

**Acceptance Criteria:**
1. API route `POST /api/transcribe` recebe chunk de audio via FormData (max ~4MB por request, respeitando limite Vercel)
2. Envia chunk para OpenAI Whisper API com `language: "pt"` e retorna texto transcrito
3. Frontend implementa chunking no client: divide audio em partes de ~4MB, envia sequencialmente para API, concatena textos retornados
4. Indicador de progresso no frontend mostrando chunk atual / total (ex: "Transcrevendo parte 2 de 5...")
5. Componente `TranscriptionView` exibe a transcricao completa concatenada
6. Tratamento de erros da API (timeout, rate limit, formato invalido) — retry automatico por chunk falho
7. Se um chunk falhar apos retries, exibe erro parcial e permite continuar com transcricao incompleta

---

### Epic 3: Participantes e Analise IA

**Objetivo:** Implementar o cadastro persistente de participantes com centro de custo, a selecao de participantes por reuniao, e a analise automatica da transcricao via GPT que usa contexto dos participantes para extrair dores, solucoes e acoes.

#### Story 3.1: CRUD de Participantes

> Como usuario,
> eu quero cadastrar participantes com nome e centro de custo,
> para que a IA saiba quem participou da reuniao e seus centros de custo.

**Acceptance Criteria:**
1. API route `GET /api/participants` para listar participantes (ordenados por nome)
2. API route `POST /api/participants` para criar participante
3. API route `PUT /api/participants/[id]` para atualizar nome, centro de custo ou cargo
4. API route `DELETE /api/participants/[id]` para remover participante
5. Participante tem: nome (unico), centro de custo (opcional), cargo (opcional)
6. Nome duplicado retorna erro com mensagem clara

#### Story 3.2: Seletor de Participantes na Tela de Gravacao

> Como usuario,
> eu quero selecionar os participantes da reuniao antes de gravar,
> para que a IA tenha contexto sobre quem esta falando.

**Acceptance Criteria:**
1. Componente `ParticipantSelector` com dropdown searchable
2. Lista participantes cadastrados com nome e centro de custo
3. Opcao de digitar nome novo — ao digitar nome que nao existe, oferecer "Adicionar [nome]"
4. Ao adicionar novo participante, perguntar centro de custo
5. Participantes selecionados aparecem como chips/badges removiveis
6. Manter selecao de participantes no client state (persistencia via save final da reuniao — Story 4.3)

#### Story 3.3: Analise da Transcricao com GPT

> Como usuario,
> eu quero que a IA analise a transcricao e extraia dores, solucoes e acoes automaticamente,
> para que eu nao precise ler toda a transcricao manualmente.

**Acceptance Criteria:**
1. API route `POST /api/analyze` recebe transcricao + lista de participantes (com CCs)
2. Prompt estruturado conforme definido no brief (secao 12)
3. GPT retorna JSON com: title (sugestao de titulo ~5 palavras), context, pains[]{description, solutions[], actions[]}
4. Cada action tem: action, responsible, actionOwner, account, deadline (ou null)
5. Parser valida o JSON e trata erros de formato (se invalido, permite retry ou preenchimento manual — FR34)
6. Resultado retornado ao frontend como JSON estruturado (persistencia ocorre no save final da reuniao — ver Story 4.3)

#### Story 3.4: Visualizacao de Dores e Solucoes

> Como usuario,
> eu quero ver as dores e solucoes extraidas de forma organizada,
> para que eu possa revisar e editar antes de gerar os to-dos.

**Acceptance Criteria:**
1. Componente `AnalysisView` exibe contexto, dores e solucoes
2. Dores listadas com suas solucoes agrupadas
3. Campos de descricao de dor e solucao sao editaveis
4. Possibilidade de adicionar/remover dores e solucoes manualmente
5. Indicador de progresso durante analise do GPT

---

### Epic 4: Tabela de To-Do, Wizard e Paginas

**Objetivo:** Implementar APIs de persistencia (meetings + todos + pains/solutions), tabela de to-do editavel, fluxo wizard completo da pagina de gravacao com save final, pagina de detalhes da reuniao e historico na Home.

#### Story 4.1: API CRUD de Reunioes e To-Dos

> Como desenvolvedor,
> eu quero endpoints para criar, ler, atualizar e deletar reunioes e to-dos,
> para que o frontend tenha APIs para persistir todos os dados.

**Acceptance Criteria:**
1. API route `POST /api/meetings` — criar reuniao completa (titulo, transcricao, context, participantes, dores, solucoes, to-dos) em uma unica transacao
2. API route `GET /api/meetings` — listar reunioes com suporte a busca por texto na transcricao
3. API route `GET /api/meetings/[id]` — detalhes da reuniao com pains, solutions e todos
4. API route `PUT /api/meetings/[id]` — atualizar titulo e outros campos
5. API route `DELETE /api/meetings/[id]` — deletar reuniao (cascade para pains, solutions, todos)
6. API route `GET /api/todos` — listar to-dos com filtros opcionais (costCenter, responsible, actionOwner, status, dateFrom, dateTo, account) para dashboard
7. API route `POST /api/todos` — criar to-do (aceita array para criacao em lote)
8. API route `PUT /api/todos/[id]` — atualizar to-do individual
9. API route `DELETE /api/todos/[id]` — deletar to-do
10. API route `PUT /api/pains/[id]` — atualizar descricao de uma dor
11. API route `DELETE /api/pains/[id]` — deletar dor (cascade para solutions vinculadas)
12. API route `POST /api/pains` — criar dor manualmente (vinculada a um meeting)
13. API route `PUT /api/solutions/[id]` — atualizar descricao de uma solucao
14. API route `DELETE /api/solutions/[id]` — deletar solucao
15. API route `POST /api/solutions` — criar solucao manualmente (vinculada a uma dor)
16. Validacao de dados no backend
17. Retorna to-do com dados do meeting e pain relacionados

#### Story 4.2: Tabela de To-Do Editavel

> Como usuario,
> eu quero uma tabela de to-do pre-preenchida pela IA que eu possa editar,
> para que eu refine as acoes antes de salvar.

**Acceptance Criteria:**
1. Componente `TodoTable` com colunas: Responsavel, Resp. pela acao, Centro de custo, Data reuniao, Conta, TO-DO (Acao), Prazo, Dor relacionada, Status
2. Tabela pre-preenchida com acoes extraidas pela IA
3. Edicao inline de todos os campos editaveis
4. Campos Responsavel e Resp. pela acao: dropdown de participantes + texto livre
5. Campo Centro de custo: auto-preenche com CC do Responsavel, mas editavel
6. Campo Prazo: date picker
7. Campo Status: dropdown (Pendente, Em andamento, Concluido, Cancelado)
8. Data reuniao: auto-preenchida (nao editavel)
9. Dor relacionada: referencia a dor da analise (nao editavel)
10. Botoes para adicionar e remover linhas
11. Persistencia via API CRUD `/api/todos` (Story 4.1)

#### Story 4.3: Fluxo Wizard da Pagina de Gravacao

> Como usuario,
> eu quero que a pagina de gravacao me guie passo a passo pelo fluxo completo,
> para que eu nao me perca entre as etapas.

**Acceptance Criteria:**
1. Pagina `/recording` implementa wizard com etapas sequenciais: (a) Participantes, (b) Gravacao/Upload, (c) Transcricao, (d) Analise IA, (e) Dores/Solucoes, (f) Tabela de To-Do, (g) Salvar
2. Indicador visual de progresso mostrando etapa atual (stepper/breadcrumb)
3. Botoes "Proximo" e "Voltar" para navegar entre etapas
4. State management local (React state) mantendo dados entre etapas — nenhuma persistencia no banco ate o save final
5. Etapa (g) "Salvar": campo de titulo (pre-preenchido pelo GPT, editavel), botao "Salvar Reuniao" que persiste tudo via `POST /api/meetings`
6. Apos salvar, redireciona para `/meeting/[id]` (pagina de detalhes)
7. Se analise GPT falhar (FR34), permitir pular para preenchimento manual de dores/to-dos
8. Tratamento de loading states em cada etapa (transcricao e analise podem demorar)

#### Story 4.4: Pagina de Detalhes da Reuniao

> Como usuario,
> eu quero acessar os detalhes de uma reuniao passada,
> para que eu possa revisar transcricao, dores e to-dos.

**Acceptance Criteria:**
1. Pagina `/meeting/[id]` com secoes: Transcricao, Dores & Solucoes, Tabela de To-Do
2. Transcricao completa exibida
3. Dores e solucoes editaveis (com persistencia via API)
4. Tabela de to-do editavel (mesmo componente TodoTable, agora conectado a API)
5. Titulo da reuniao editavel (salva via `PUT /api/meetings/[id]`)
6. Data da reuniao exibida
7. Botao "Exportar Excel" para exportar os to-dos da reuniao (componente ExcelExport)
8. Botao "Deletar reuniao" com confirmacao

#### Story 4.5: Home com Historico de Reunioes

> Como usuario,
> eu quero ver todas as minhas reunioes anteriores na pagina inicial,
> para que eu encontre facilmente uma reuniao especifica.

**Acceptance Criteria:**
1. Pagina Home (`/`) lista reunioes como cards (MeetingCard)
2. Card mostra: titulo (auto-gerado ou editado), data, quantidade de to-dos, status resumido
3. Campo de busca filtra por texto na transcricao (via `GET /api/meetings?search=`)
4. Ordenacao por data (mais recente primeiro)
5. Botao "Nova Gravacao" proeminente no topo
6. Link para Dashboard no header/navegacao

---

### Epic 5: Dashboard e Excel

**Objetivo:** Implementar o dashboard consolidado com filtros backend, contadores de status, exportacao de to-dos para Excel e importacao de planilhas Excel existentes com mapeamento de colunas.

#### Story 5.1: Dashboard com Filtros e Contadores

> Como usuario,
> eu quero um dashboard com todos os to-dos consolidados e filtros,
> para que eu tenha visao geral de todas as acoes pendentes entre reunioes.

**Acceptance Criteria:**
1. Pagina `/dashboard` com contadores no topo: Pendentes (amarelo), Em andamento (azul), Concluidos (verde), Cancelados (vermelho)
2. Filtros: Centro de custo, Responsavel, Resp. pela acao, Status, Periodo (de/ate), Conta
3. Filtros executados no backend (query parametrizada no Prisma)
4. Tabela unificada de to-dos com coluna extra: reuniao de origem (link)
5. Tabela editavel (mesmo componente TodoTable)
6. Contadores atualizam ao aplicar filtros
7. Componentes `DashboardFilters` e `DashboardCounters`
8. Botoes "Exportar Excel" e "Importar Excel" no topo da pagina

#### Story 5.2: Exportacao para Excel

> Como usuario,
> eu quero exportar a tabela de to-dos para Excel,
> para que eu possa compartilhar ou editar no formato que ja uso.

**Acceptance Criteria:**
1. Componente `ExcelExport` com botao "Exportar Excel"
2. Disponivel na pagina da reuniao e no dashboard
3. No dashboard, exporta respeitando filtros aplicados
4. Arquivo .xlsx gerado com colunas: Responsavel, Resp. pela acao, Centro de custo, Data reuniao, Conta, TO-DO, Prazo, Status
5. Nome do arquivo: `todos-{data}.xlsx` ou `reuniao-{titulo}-{data}.xlsx`
6. Implementacao com SheetJS (xlsx)

#### Story 5.3: Importacao de Excel

> Como usuario,
> eu quero importar planilhas Excel existentes para o app,
> para que eu migre meus dados historicos sem redigitar tudo.

**Acceptance Criteria:**
1. Componente `ExcelImport` com upload de arquivo .xlsx
2. Interface de mapeamento de colunas: usuario mapeia colunas do Excel para colunas do app
3. Preview dos dados antes de confirmar importacao
4. API route `POST /api/import` processa o arquivo
5. Importacao respeita campo Status da planilha (nao sobrescreve com "Pendente")
6. Cria Meeting associada aos to-dos importados (com titulo e data)
7. Nomes de responsaveis da planilha sao adicionados ao cadastro de participantes se nao existirem
8. Tratamento de erros (colunas faltantes, dados invalidos)

---

## 7. Checklist Results Report

*Sera preenchido apos aprovacao do PRD e execucao do pm-checklist.*

---

## 8. Next Steps

### 8.1 UX Expert Prompt

> @ux-design-expert Revise o PRD do MeetingRecorder AI em `docs/prd.md`. Foque na experiencia mobile-first, fluxo de gravacao (wizard em etapas), tabela de to-do editavel com dropdowns e auto-preenchimento, e dashboard com filtros. Proponha wireframes ou mockups de baixa fidelidade para as 4 telas principais.

### 8.2 Architect Prompt

> @architect Crie a arquitetura tecnica do MeetingRecorder AI baseado no PRD em `docs/prd.md`. Stack: Next.js 14+ (App Router), Prisma v6, Neon PostgreSQL, OpenAI SDK, shadcn/ui v4, SheetJS. Foque em: estrutura de API routes, schema Prisma, chunking de audio, parsing de JSON do GPT, e deploy na Vercel. Considere as restricoes tecnicas documentadas (Prisma v6, shadcn v4 asChild).

---

*— Morgan, planejando o futuro*
