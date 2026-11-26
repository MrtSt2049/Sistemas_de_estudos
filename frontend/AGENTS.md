# frontend/AGENTS.md — Regras de Desenvolvimento do Frontend

Este arquivo define as regras específicas para `frontend/` (Next.js App Router, TypeScript, Tailwind CSS e shadcn/ui) e complementa o [`AGENTS.md`](../AGENTS.md) da raiz.

> **Estado atual (pré-Fase 0):** o diretório `frontend/` contém apenas `.gitkeep`. A estrutura, dependências e scripts listados abaixo são o padrão oficial aprovado em [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) (seções 3.7, 3.9 e 3.11) a ser criado na **Fase 0**. Não presuma que arquivos ou comandos já estejam disponíveis antes de verificar.

---

## 1. TypeScript Rigoroso

- **MUST**: habilitar `"strict": true` em `tsconfig.json`.
- **MUST NOT**: usar `any` (exceto em casos extremos de tipagem de biblioteca externa, com comentário explícito justificando e plano de remoção). Preferir `unknown` com estreitamento de tipo (*type narrowing*).
- **MUST**: derivar todos os tipos de requisição e resposta da API a partir de `src/types/api.ts`, gerado automaticamente via `openapi-typescript` a partir de `/api/schema/` (ADR-08).
- **MUST NOT**: editar `src/types/api.ts` manualmente ou duplicar interfaces de entidades da API à mão.
- **MUST** (a partir da F0): manter `npx tsc --noEmit` sem erros antes de concluir qualquer tarefa.

---

## 2. Next.js App Router, Server Components e Client Components

- **MUST**: usar **Server Components por padrão** em páginas (`page.tsx`) e layouts (`layout.tsx`).
- **MUST**: adicionar `"use client"` apenas nos componentes folha ou contêineres que realmente exigem estado React, efeitos, eventos de DOM, hooks de navegador ou TanStack Query.
- **MUST**: manter arquivos `page.tsx` finos — eles compõem componentes e dados oriundos de `src/features/<módulo>/`, sem lógica complexa embutida.
- **MUST**: separar rotas em grupos:
  - `(auth)/`: rotas públicas de autenticação (sem sidebar/topbar);
  - `(app)/`: área autenticada com shell (`Sidebar`, `Topbar`) e verificação de sessão (redireciona para `/login` quando não autenticado).
- **MUST**: fornecer `loading.tsx`, `error.tsx` e `not-found.tsx` adequados aos segmentos.
- **MUST**: em Server Components que consultam o backend, usar `API_INTERNAL_URL` e repassar explicitamente o cookie de sessão recebido na requisição.
- **MUST**: carregar componentes pesados (editor **Tiptap** e gráficos **Recharts**) sob demanda com `next/dynamic` (`dynamic import`). No Tiptap, validar a configuração de SSR (`immediatelyRender: false`) para evitar erros de hidratação (R12).

---

## 3. Estrutura de Diretórios e Organização de Componentes

```text
frontend/src/
├── app/                   # rotas App Router ((auth), (app))
├── components/
│   ├── ui/                # primitivos shadcn/ui (customizados pelos tokens)
│   ├── layout/            # Sidebar, Topbar, PageHeader, Shell
│   ├── feedback/          # EmptyState, ErrorState, Skeletons, Toaster
│   ├── charts/            # wrappers Recharts alinhados ao tema
│   ├── markdown/          # <MarkdownView> com KaTeX e realce de código
│   └── editor/            # <RichEditor> (Tiptap)
├── features/<módulo>/     # código coeso por módulo de domínio
│   ├── api.ts             # funções tipadas que chamam lib/api-client.ts
│   ├── queries.ts         # hooks TanStack Query e query keys do módulo
│   ├── schemas.ts         # schemas Zod de formulários
│   ├── components/        # componentes específicos do módulo
│   └── utils.ts
├── hooks/                 # hooks genéricos reutilizáveis (useDebounce, useHotkeys…)
├── lib/
│   ├── api-client.ts      # cliente HTTP centralizado
│   ├── query-client.ts
│   ├── errors.ts          # ApiError e mapeamento code -> mensagem pt-BR
│   ├── dates.ts           # date-fns + date-fns-tz (fuso do perfil)
│   ├── format.ts
│   └── utils.ts
├── stores/                # Zustand (apenas estado efêmero de UI)
├── types/
│   └── api.ts             # GERADO do OpenAPI — não editar à mão
└── styles/
    └── globals.css        # tokens CSS do design system Voltage
```

- **MUST**: cada componente **MUST** ter responsabilidade clara e única.
- **MUST**: promover um componente para `src/components/` apenas quando ele for reutilizado por **2 ou mais módulos**; componentes específicos pertencem a `src/features/<módulo>/components/`.
- **MUST**: usar componentes do **shadcn/ui** de forma consistente em toda a interface, evitando criar primitivos paralelos para botões, inputs, diálogos, tabelas ou menus.

---

## 4. Hooks e Gerenciamento de Estado

- **MUST**: usar **TanStack Query** para todo dado proveniente do servidor (cache, sincronização, paginação, invalidação e estados de carregamento/erro).
- **MUST**: definir um hook por operação em `src/features/<módulo>/queries.ts` (ex.: `useExercises`, `useRecordAttempt`) com *query keys* centralizadas no módulo.
- **MUST**: usar **Zustand** (`src/stores/`) **exclusivamente** para estado efêmero de interface (ex.: estado da sidebar, cronômetro exibido da sessão ativa).
- **MUST NOT**: armazenar ou duplicar dados do servidor em stores Zustand ou `localStorage`. A sessão ativa de estudo, por exemplo, tem como fonte de verdade o servidor (RF071).
- **MAY**: aplicar atualizações otimistas no TanStack Query apenas em ações simples e reversíveis (ex.: marcar tarefa), sempre com *rollback* em caso de erro.

---

## 5. Formulários e Validação

- **MUST**: construir formulários com **React Hook Form + Zod** (schemas em `src/features/<módulo>/schemas.ts`).
- **MUST**: espelhar validações visíveis da API (campos obrigatórios, faixas numéricas, URLs) para feedback imediato, sem jamais substituir ou duplicar regras de negócio do backend.
- **MUST**: mapear erros de validação retornados pela API (`error.details`) para os respectivos campos via `setError`.
- **MUST**: desabilitar o botão de envio e exibir indicador pendente durante submissões para evitar envios duplicados.

---

## 6. Consumo da API, Segurança e Tratamento de Erros

- **MUST**: centralizar toda comunicação HTTP em `src/lib/api-client.ts` e expor chamadas tipadas em `src/features/<módulo>/api.ts`.
- **MUST NOT**: chamar `fetch` diretamente em páginas (`page.tsx`) ou componentes visuais.
- **MUST**: o `api-client` **MUST**:
  - enviar `credentials: "include"` para cookies `HttpOnly`;
  - anexar `X-CSRFToken` em métodos não seguros (`POST`, `PATCH`, `DELETE`);
  - tentar **uma única vez** `POST /api/v1/auth/refresh/` ao receber `401` com `code: "token_expired"` antes de falhar/redirecionar para `/login`;
  - converter qualquer resposta de erro em `ApiError` tipado com tradução de `code` para mensagem em pt-BR (`src/lib/errors.ts`).
- **MUST NOT**: expor segredos, chaves privadas ou credenciais no código cliente ou em variáveis `NEXT_PUBLIC_*`. Lembrar que `NEXT_PUBLIC_*` é pública e embutida em tempo de build.
- **MUST**: renderizar Markdown de enunciados, soluções e flashcards de forma segura (sem HTML bruto), com suporte a **KaTeX** e realce de código.

---

## 7. Identidade Visual, Estilização e Estados de Interface

- **MUST**: preservar rigorosamente a identidade visual **"Voltage"** (ver `DEVELOPMENT_PLAN.md`, seção 3.9, e `docs/design/prompt-master-identidade-visual.md`), utilizando exclusivamente os tokens semânticos definidos como variáveis CSS em `src/styles/globals.css` e mapeados no Tailwind (`bg-surface`, `text-muted`, etc.).
- **MUST NOT**: usar cores hexadecimais soltas, espaçamentos arbitrários fora da grade de 4 px, gradientes decorativos, glassmorphism, ilustrações genéricas ou emojis na interface.
- **MUST**: suportar temas **claro, escuro e sistema** sem *flash* de tema incorreto na carga inicial e com contraste AA nos dois temas.
- **MUST**: todo fluxo ou tela com dados assíncronos **MUST** cobrir explicitamente os 5 estados:
  1. **Carregando**: *skeleton* no formato do conteúdo (nunca tela em branco);
  2. **Vazio**: `EmptyState` com título curto, explicação objetiva e uma ação primária;
  3. **Erro**: `ErrorState` em pt-BR com ação "Tentar de novo" e exibição discreta do `request_id`;
  4. **Sucesso**: toast discreto (`aria-live`) e atualização visual coerente;
  5. **Destrutivo**: diálogo de confirmação informando o que será removido e itens afetados.
- **MUST**: seguir o tom de voz do produto — português do Brasil direto, sóbrio, sem exclamações nem jargão motivacional.

---

## 8. Responsividade e Acessibilidade

- **MUST**: seguir abordagem desktop-first funcional em celular, validada nas larguras `1440px`, `1024px`, `768px` e `390px`.
- **MUST**: garantir alvos de toque ≥ `44px` em dispositivos móveis e adaptar tabelas para visualização legível em telas estreitas.
- **MUST**: atender **WCAG 2.2 nível AA** (RNF021):
  - contraste ≥ 4,5:1 para texto normal nos temas claro e escuro;
  - foco visível sempre e navegação completa por teclado (incluindo atalhos como `/` para busca e `1–4` na revisão);
  - rótulos reais (`<label>`) em campos e `aria-label` em botões de ícone;
  - `aria-live` para toasts e feedback de revisão;
  - respeito a `prefers-reduced-motion` e `prefers-color-scheme`;
  - cor nunca como único indicador de estado (combinar com texto/ícone);
  - alternativa acessível em tabela para gráficos (Recharts).

---

## 9. Testes e Qualidade no Frontend

- **SHOULD** (configurar na Fase 0):
  - **Lint e formatação**: ESLint (Next.js + acessibilidade) e Prettier.
  - **Unitário e componentes**: Vitest + Testing Library + MSW (mock de API) cobrindo schemas Zod, formulários e estados de carregamento/vazio/erro/sucesso.
  - **Acessibilidade**: `axe` nos testes de componente e no Playwright (zero violações sérias).
  - **E2E**: Playwright nos fluxos críticos contra a pilha completa (`local-db`).

---

## 10. Git e Commits no Frontend

Complementando a seção 8 do [`AGENTS.md`](../AGENTS.md):

- **MUST**: usar escopos claros nos commits (ex.: `feat(dashboard): add weekly metrics cards`, `fix(review): handle keyboard shortcuts 1-4`, `refactor(frontend): centralize api error mapping`).
- **MUST**: sempre que um contrato de API mudar, regenerar `src/types/api.ts` e incluir a atualização de forma coerente no PR.
- **MUST NOT**: commitar `frontend/.env.local`, `node_modules/`, `.next/`, `out/`, relatórios temporários do Playwright ou caches locais.
- **MUST NOT**: executar `git commit` ou `git push` sem autorização explícita do proprietário, nem atribuir autoria/coautoria a ferramentas de IA.
