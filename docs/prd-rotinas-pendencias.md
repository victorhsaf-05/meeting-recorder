# MeetingRecorder AI — PRD Addendum: Rotinas & Pendencias

**Versao:** 1.0
**Data:** 29/03/2026
**Autor:** Morgan (PM) — baseado em requisitos do Victor
**Status:** Implementado (retroativo)
**PRD Base:** [prd.md](./prd.md) v1.3

---

## 1. Problema & Contexto

### 1.1 Problema

O usuario controla rotinas de trabalho num bloco de notas — nome da rotina, arquivo associado, status e data da ultima execucao. Esse metodo e fragil:

- **Sem historico:** Nao ha registro de quando cada rotina foi executada
- **Sem dependencias:** Rotinas como "Atualizar DRE" dependem de "Atualizar Razao", mas essa relacao nao e rastreada
- **Sem visao de atrasos:** Nao existe calculo automatico de quais rotinas estao atrasadas
- **Pendencias soltas:** Tarefas avulsas (nao ligadas a reunioes) nao tem onde ser rastreadas

### 1.2 Oportunidade

Criar um modulo dentro do MeetingRecorder AI que transforme o controle manual de rotinas em um sistema com:

- Historico completo de execucoes
- Calculo automatico de status (OK, Pendente, Atrasada, Desatualizada)
- Rastreamento de dependencias entre rotinas
- Gestao de pendencias avulsas separada dos to-dos de reuniao
- Dashboard "Meu Dia" com visao consolidada

---

## 2. Decisoes de Produto

| Decisao | Justificativa |
|---------|---------------|
| Sem autenticacao no MVP | Uso pessoal, consistente com o MeetingRecorder existente (NFR8) |
| Pendencias como entidade separada de Todos | Todos estao vinculados a reunioes; pendencias sao tarefas avulsas sem contexto de reuniao |
| Status computado (nao armazenado) | Evita inconsistencia — status e calculado em tempo real baseado em datas e dependencias |
| Frequencia como string enum | Simples e extensivel (daily, weekly, monthly, custom) |
| Steps como entidade separada | Permite reordenacao e edicao individual de passos |
| Seed com 3 rotinas reais | Permite teste imediato com dados do fluxo real do usuario |

---

## 3. Requisitos Funcionais

### 3.1 Rotinas

- **FR35:** O sistema deve manter um cadastro de rotinas com titulo, descricao, caminho de arquivo/rede, frequencia (diaria/semanal/mensal/personalizada), observacao permanente, e flag ativo/inativo.
- **FR36:** Cada rotina pode ter uma lista ordenada de passos (steps) que descrevem o procedimento de execucao.
- **FR37:** O sistema deve registrar cada execucao de rotina com data/hora e notas opcionais.
- **FR38:** Rotinas podem depender de outras rotinas. Se a dependencia foi executada mais recentemente que a rotina dependente, o status deve mudar para "Desatualizada".
- **FR39:** O status de cada rotina deve ser computado automaticamente em tempo real:
  - **Pendente:** Nunca foi executada
  - **OK:** Executada dentro do intervalo de frequencia
  - **Atrasada:** O intervalo de frequencia expirou sem execucao
  - **Desatualizada:** Uma dependencia foi executada mais recentemente
- **FR40:** O campo filePath deve ser copiavel com um clique na pagina de detalhe.
- **FR41:** O historico de execucoes deve ser exibido na pagina de detalhe com datas e notas.

### 3.2 Pendencias

- **FR42:** O sistema deve manter pendencias avulsas com titulo, descricao, prioridade (baixa/media/alta/urgente), status (Pendente/Em andamento/Concluida/Arquivada), prazo e observacao.
- **FR43:** O status de pendencias deve ser editavel inline via dropdown no card.
- **FR44:** Pendencias devem ter contadores por status (Pendente, Em andamento, Concluida, Arquivada) com filtro por clique.

### 3.3 Dashboard "Meu Dia"

- **FR45:** A pagina "Meu Dia" deve exibir contadores: total de rotinas, concluidas hoje, atrasadas, desatualizadas.
- **FR46:** "Meu Dia" deve listar apenas rotinas que precisam de acao (status != OK).
- **FR47:** "Meu Dia" deve listar pendencias ativas (Pendente ou Em andamento).
- **FR48:** Deve ser possivel executar uma rotina diretamente da pagina "Meu Dia" com um dialog de confirmacao e notas opcionais.

---

## 4. Interface do Usuario

### 4.1 Novas Telas

| Tela | Rota | Descricao |
|------|------|-----------|
| Meu Dia | `/meu-dia` | Dashboard diario com rotinas pendentes e pendencias ativas |
| Rotinas | `/rotinas` | Grid de todas as rotinas com status |
| Detalhe Rotina | `/rotinas/[id]` | Visao completa: steps, dependencias, historico, observacao |
| Pendencias | `/pendencias` | Grid de pendencias com filtros e contadores |

### 4.2 Navegacao

Sidebar atualizada com duas secoes:

- **Menu:** Reunioes, Dashboard, Nova Gravacao (existentes)
- **Rotinas:** Meu Dia, Rotinas, Pendencias (novas)

### 4.3 Design System

Mantido o design system Carbon Blue existente:

- Glass cards (`glass-card`) para todos os cards
- Glow effects para contadores de status (`glow-blue`, `glow-green`, `glow-red`, `glow-yellow`)
- Badges coloridos para status de rotina (verde/amarelo/vermelho/laranja) e prioridade de pendencia
- Responsivo: grid 1/2/3 colunas

---

## 5. Modelo de Dados

### 5.1 Novos Modelos

```
Routine (id, title, description, filePath, frequency, customDays, observation, active)
  └── RoutineStep (id, routineId, order, content)
  └── RoutineExecution (id, routineId, executedAt, notes)
  └── RoutineDependency (id, dependentId, dependencyId) -- M:N self-relation

Pendencia (id, title, description, priority, status, deadline, observation)
```

### 5.2 Logica de Status (Computado)

```
computeStatus(frequency, customDays, lastExec, depLastExec, today):
  if !lastExec → "Pendente"
  intervalDays = daily:1, weekly:7, monthly:30, custom:customDays
  nextDue = lastExec + intervalDays
  if depLastExec > lastExec → "Desatualizada"
  if today > nextDue → "Atrasada"
  return "OK"
```

---

## 6. API Routes

| Rota | Metodos | Descricao |
|------|---------|-----------|
| `/api/routines` | GET, POST | Lista rotinas com status computado; cria rotina + steps + deps |
| `/api/routines/[id]` | GET, PUT, DELETE | CRUD individual com historico completo |
| `/api/routines/[id]/execute` | POST | Registra execucao com notas opcionais |
| `/api/pendencias` | GET, POST | Lista com filtros + counters; cria pendencia |
| `/api/pendencias/[id]` | PUT, DELETE | Update parcial; delete |
| `/api/meu-dia` | GET | Rotinas que precisam acao + pendencias ativas + counters |

---

## 7. Epic e Stories

### Epic 6: Rotinas & Pendencias

**Objetivo:** Implementar sistema de gestao de rotinas de trabalho com historico de execucoes, dependencias entre rotinas, calculo automatico de status, e gestao de pendencias avulsas. Inclui dashboard "Meu Dia" para visao diaria consolidada.

- Story 6.1: Schema e Migration (5 modelos Prisma + types TypeScript)
- Story 6.2: API Routes de Rotinas (CRUD + execute + status computado)
- Story 6.3: API Routes de Pendencias e Meu Dia
- Story 6.4: Componentes (StatusBadge, PriorityBadge, RoutineCounters, ExecuteDialog, cards, forms)
- Story 6.5: Paginas (Meu Dia, Rotinas, Rotinas/[id], Pendencias)
- Story 6.6: Sidebar e Seed

---

## 8. Limitacoes do MVP

| Limitacao | Possivel Iteracao Futura |
|-----------|--------------------------|
| Sem notificacoes de atraso | Push notifications ou email diario |
| Sem recorrencia por dia da semana | Ex: "toda segunda e quarta" |
| Sem drag-and-drop de steps | Reordenacao visual de passos |
| Sem tags/categorias em pendencias | Agrupamento por projeto/area |
| Sem historico de alteracoes | Audit log de mudancas |
| Sem vinculo pendencia-rotina | Pendencia gerada por falha de rotina |
| Sem dashboard de tendencia | Grafico de execucoes ao longo do tempo |

---

## 9. Metricas de Sucesso

| Metrica | Alvo |
|---------|------|
| Rotinas cadastradas | >= 5 rotinas ativas em 2 semanas |
| Execucoes registradas | >= 3 execucoes/dia util |
| Atraso medio | Reduzir de "nao medido" para < 1 dia |
| Pendencias ativas | Manter < 10 pendencias abertas |
| Adocao do "Meu Dia" | Acesso diario como primeira pagina |

---

## 10. Resumo de Arquivos

### Novos (19 arquivos)

| Categoria | Arquivos |
|-----------|----------|
| API Routes (6) | `routines/route.ts`, `routines/[id]/route.ts`, `routines/[id]/execute/route.ts`, `pendencias/route.ts`, `pendencias/[id]/route.ts`, `meu-dia/route.ts` |
| Paginas (4) | `meu-dia/page.tsx`, `rotinas/page.tsx`, `rotinas/[id]/page.tsx`, `pendencias/page.tsx` |
| Componentes (9) | `StatusBadge.tsx`, `PriorityBadge.tsx`, `RoutineCounters.tsx`, `ExecuteDialog.tsx`, `RoutineDayCard.tsx`, `RoutineCard.tsx`, `RoutineForm.tsx`, `PendenciaCard.tsx`, `PendenciaForm.tsx` |
| Seed (1) | `prisma/seed.ts` |

### Editados (3 arquivos)

| Arquivo | Descricao |
|---------|-----------|
| `prisma/schema.prisma` | 5 novos modelos |
| `src/lib/types.ts` | 12 types/interfaces novos |
| `src/components/Sidebar.tsx` | Secoes de navegacao agrupadas |

### Dependencias

Nenhuma nova dependencia npm. Usa `date-fns` (ja existente) para calculo de datas.

---

## Change Log

| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 29/03/2026 | 1.0 | PRD retroativo criado apos implementacao completa | Morgan (PM) |

---

*— Morgan, planejando o futuro*
