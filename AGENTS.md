# AGENTS.md — Regras Globais de Desenvolvimento (Study Platform)

Este documento estabelece as regras obrigatórias e recomendações de engenharia da **Study Platform** para todos os desenvolvedores e agentes de programação.

> **Referências complementares por escopo:**
> - Backend (Python / Django / DRF): [`backend/AGENTS.md`](backend/AGENTS.md)
> - Frontend (Next.js / TypeScript / Tailwind / shadcn/ui): [`frontend/AGENTS.md`](frontend/AGENTS.md)
> - Documentação técnica e ADRs: [`docs/AGENTS.md`](docs/AGENTS.md)

Em caso de conflito sobre requisitos, modelagem ou arquitetura do produto, [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) é a referência técnica oficial. As regras específicas de subdiretórios complementam este arquivo e **MUST NOT** contradizê-lo.

---

## 0. Convenções Normativas e Estado Atual do Repositório

### 0.1. Interpretação das Palavras-Chave

Este conjunto de regras adota interpretação consistente inspirada na RFC 2119:

- **MUST / MUST NOT**: regra obrigatória. Desvios exigem aprovação explícita e registro de decisão arquitetural (ADR).
- **SHOULD / SHOULD NOT**: recomendação forte. Desvios exigem justificativa técnica clara no Pull Request.
- **MAY**: opcional ou discricionário, desde que não viole nenhuma regra `MUST`.

### 0.2. Estado Atual do Projeto

A **Fase 0** está implementada: `backend/` e `frontend/`, Dockerfiles, arquivos de exemplo de ambiente, ADRs, CI e linters. O estado de cada módulo é registrado em [`CHANGELOG.md`](CHANGELOG.md).

- **Decisões em aberto (`D-01` a `D-13`)**: registradas em `DEVELOPMENT_PLAN.md` (seção 3.15). Agentes e desenvolvedores **MUST NOT** tratar itens planejados como já implementados nem fixar decisões em aberto sem aprovação explícita.

### 0.3. Restrições Absolutas de Escopo

- **Sem Inteligência Artificial**: o projeto **MUST NOT** incluir chatbots, agentes de IA, RAG, fine-tuning, tutores com IA, geração de conteúdo por LLM ou busca semântica por embeddings.
- **Sem Complexidade Desnecessária**: o projeto **MUST NOT** introduzir microsserviços, filas distribuídas (ex.: Celery/Redis), BaaS proprietário no frontend ou abstrações prematuras sem revisão formal do plano.
- **Dependências Controladas**: nenhuma biblioteca ou ferramenta externa **MUST** ser adicionada sem necessidade técnica comprovada e justificativa explícita no PR.

---

## 1. Princípios Fundamentais de Engenharia

Todo código, arquitetura e decisão técnica **MUST** seguir estes princípios:

1. **Simplicidade**: preferir a solução mais direta que atenda aos requisitos. Evitar abstrações genéricas para problemas que ocorrem apenas uma vez.
2. **Legibilidade**: código é lido com mais frequência do que escrito. Nomes claros e fluxo explícito têm prioridade sobre concisão excessiva.
3. **Modularidade**: organizar o sistema em módulos de domínio coesos e bem delimitados.
4. **Separação de Responsabilidades**: apresentação, regras de negócio e persistência **MUST** permanecer em camadas distintas.
5. **Baixo Acoplamento e Alta Coesão**: módulos **MUST** interagir por interfaces públicas explícitas e manter responsabilidades relacionadas juntas.
6. **Reutilização Responsável**: extrair código compartilhado apenas quando houver reutilização real (em geral, a partir de 2+ módulos consumidores) e sem criar acoplamento indevido.
7. **Manutenibilidade**: priorizar código previsível, fácil de inspecionar, depurar e evoluir por outra pessoa ou agente.
8. **Segurança por Padrão**: assumir entradas não confiáveis, negar acesso por padrão e isolar dados por usuário desde o início.
9. **Testabilidade**: projetar funções puras, dependências injetáveis (ex.: relógio) e fronteiras claras para facilitar testes determinísticos.
10. **Consistência**: seguir rigorosamente os padrões já definidos no repositório antes de introduzir variações.

### 1.1. Convenção de Idioma

- **MUST**: código-fonte, nomes de arquivos de código, tabelas, colunas, URLs da API e identificadores técnicos em **inglês**.
- **MUST**: textos da interface do usuário e documentação do projeto em **português do Brasil (pt-BR)**, com tom direto e técnico.

---

## 2. Arquitetura Global

### 2.1. Separação Frontend e Backend

- **MUST**: frontend (`Next.js + TypeScript`) e backend (`Django + DRF`) **MUST** permanecer totalmente desacoplados.
- **MUST**: toda comunicação entre frontend e backend **MUST** ocorrer exclusivamente por contratos HTTP REST JSON sob `/api/v1/`.
- **MUST NOT**: o frontend **MUST NOT** acessar o banco de dados diretamente, usar `supabase-js` ou armazenar chaves do Supabase.
- **MUST NOT**: o backend **MUST NOT** renderizar páginas HTML da aplicação principal (exceto Django Admin operacional e documentação OpenAPI fora de produção).

### 2.2. Fonte de Verdade e Duplicação de Lógica

- **MUST**: o backend e o PostgreSQL são a única fonte de verdade dos dados e das regras de negócio.
- **MUST NOT**: regras de negócio que determinem cálculos ou transições de estado (ex.: cálculo de médias, projeção de notas, agendamento de revisão espaçada, estado `mastered` de exercícios, progresso de metas) **MUST NOT** ser duplicadas no frontend.
- **MAY**: o frontend **MAY** validar formato e faixas de entrada (Zod) para feedback imediato ao usuário, mas a validação autoritativa **MUST** sempre ocorrer no backend.

### 2.3. Banco de Dados como Serviço Gerenciado

- **MUST**: o Supabase é utilizado exclusivamente como **PostgreSQL gerenciado** (ADR-02), acessado somente pelo backend via `DATABASE_URL` (Session Pooler, ADR-03).
- **MUST NOT**: o código de domínio **MUST NOT** acoplar-se a recursos proprietários do Supabase (Supabase Auth, PostgREST/Data API). Qualquer eventual uso de Storage (D-02) **MUST** ficar isolado atrás de uma interface de armazenamento no backend.

### 2.4. Organização Modular e Dependências

- **MUST**: o backend segue o padrão de **monólito modular**, com um app Django por módulo de negócio e grafo de dependências unidirecional (sem ciclos), conforme `DEVELOPMENT_PLAN.md` (seção 3.4.5).
- **MUST**: módulos de backend comunicam-se via `services` e `selectors` públicos; um app **MUST NOT** escrever diretamente em models de outro app.
- **SHOULD**: configurar verificação automática de fronteiras de importação (ex.: `import-linter`) na Fase 0.
- **MUST**: mudanças estruturais relevantes na arquitetura **MUST** ser registradas em ADRs em `docs/adr/` (a criar na Fase 0).

---

## 3. Regras Gerais de Implementação

Todo código novo ou modificado **MUST**:

1. Estar vinculado a um requisito (`RFxxx`), risco (`Rxx`), decisão (`D-xx`) ou tarefa de manutenção justificada.
2. Seguir os padrões de camada e nomenclatura estabelecidos para backend (`backend/AGENTS.md`) ou frontend (`frontend/AGENTS.md`).
3. Ter responsabilidade clara e bem delimitada; funções e componentes excessivamente longos **SHOULD** ser decompostos.
4. Evitar duplicação de regras de negócio e de estruturas de contrato (usar tipos gerados do OpenAPI no frontend).
5. Utilizar tipagem estática rigorosa (`type hints` em Python; `TypeScript strict` no frontend).
6. Tratar erros de forma explícita, nunca silenciando exceções sem justificativa e contexto.
7. Ser testável e acompanhado de testes automatizados proporcionais ao risco.
8. Respeitar contratos existentes da API e do schema de banco; alterações incompatíveis **MUST** ser planejadas e versionadas.
9. Evitar efeitos colaterais ocultos (ex.: mutações implícitas em leituras, signals escondendo fluxo de negócio).
10. Armazenar instantes de tempo em UTC (`timestamptz`) e calcular o "dia do usuário" exclusivamente a partir do fuso configurado no perfil (`UserProfile.timezone`).

---

## 4. Banco de Dados

### 4.1. Modelagem e Nomenclatura

- **MUST**: o banco oficial é PostgreSQL, gerenciado exclusivamente pelo **Django ORM** e suas migrações versionadas.
- **MUST**: chaves primárias **MUST** ser `UUID v4` geradas pela aplicação (ADR-05).
- **MUST**: toda tabela de negócio **MUST** conter `owner_id` (FK para `accounts_user` com `ON DELETE CASCADE`, ADR-06), `created_at` e `updated_at` (`timestamptz`).
- **MUST**: nomenclatura de tabelas segue o padrão do Django (`<app>_<modelo>` em minúsculas) e colunas em `snake_case` em inglês.
- **MUST**: evitar `GenericForeignKey`; usar FKs explícitas com `CheckConstraint` de exclusividade quando necessário (ex.: `ReviewItem`, ADR-11).
- **MUST NOT**: armazenar valores derivados (médias, percentuais, progresso de metas), exceto desnormalizações justificadas no plano (`Exercise.state`, `Topic.last_studied_at`, `ReviewItem.due_on`) mantidas em transação atômica.

### 4.2. Integridade, Constraints e Índices

- **MUST**: regras críticas de integridade **MUST** existir tanto na camada de aplicação quanto no banco (`CheckConstraint`, `UniqueConstraint`, índices parciais e chaves estrangeiras).
- **MUST**: políticas de exclusão **MUST** ser explícitas:
  - `CASCADE` para dependentes sem existência própria (ex.: tentativas de um exercício);
  - `PROTECT` para cadastros de referência em uso (ex.: fontes de exercício, tipos de erro);
  - `SET NULL` para vínculos opcionais (ex.: tópico de uma anotação).
- **SHOULD**: adicionar índices apenas para consultas conhecidas (listadas em `docs/DATABASE.md`) ou comprovadas por `EXPLAIN ANALYZE`.

### 4.3. Migrações

- **MUST**: nenhuma alteração estrutural no banco **MUST** ser feita fora de migrações versionadas do Django. É **proibido** criar ou alterar tabelas manualmente pelo painel do Supabase.
- **MUST**: revisar o SQL gerado (`python manage.py sqlmigrate <app> <numero>`) antes de concluir o PR.
- **MUST NOT**: executar `migrate` automaticamente na inicialização de contêineres. Migrações **MUST** ser aplicadas em etapa explícita, após backup em produção.
- **MUST**: migrações destrutivas (remoção de coluna ou tabela) **MUST** ocorrer em duas fases: primeiro o código deixa de usar; na versão seguinte a migração remove.
- **MUST**: incluir migração de segurança condicional para o Supabase (habilitar RLS em todas as tabelas do schema `public` sem políticas e revogar privilégios de `anon` e `authenticated`, condicional à existência desses papéis para manter compatibilidade com PostgreSQL local).

### 4.4. Consultas, Transações e Preservação de Dados

- **MUST**: prevenir consultas N+1 usando `select_related`, `prefetch_related` e agregações em SQL (`annotate`/`aggregate`), validadas com `assertNumQueries` em endpoints agregados.
- **MUST**: operações que modificam múltiplas tabelas ou mantêm invariantes compostos **MUST** executar dentro de `transaction.atomic()`.
- **MUST**: não usar exclusão lógica (`deleted_at`) por padrão; quando houver necessidade de ocultar sem perder histórico, usar arquivamento explícito (`archived_at`) conforme o modelo de domínio.

---

## 5. Padrões de API REST

- **MUST**: prefixo `/api/v1/` para todos os endpoints de negócio (exceções: `/healthz`, `/readyz`, `/api/schema/`, `/api/docs/`).
- **MUST**: URLs com recursos no **plural** em `kebab-case` (ex.: `/api/v1/study-sessions/`), campos JSON em `snake_case` e IDs em `UUID`.
- **MUST**: métodos HTTP:
  - `GET`: leitura (seguro e idempotente);
  - `POST`: criação (`201`) e ações de domínio (`POST /recurso/{id}/acao/`);
  - `PATCH`: atualização parcial (`200`);
  - `DELETE`: remoção (`204`).
  - **MUST NOT**: usar `PUT`.
- **MUST**: todas as listagens paginadas seguem `{ "count", "next", "previous", "results" }` com `?page=` e `?page_size=` (padrão 25, máximo 100).
- **MUST**: filtros via `django-filter` com campos explicitamente declarados, ordenação via `?ordering=` e busca via `?search=`.
- **MUST**: validação em três camadas: frontend (feedback), serializer DRF (autoritativa) e banco (integridade).
- **MUST**: formato padronizado de erro produzido por `exception_handler` customizado:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Dados inválidos.",
    "details": {},
    "request_id": "..."
  }
}
```

- **MUST**: códigos HTTP consistentes: `200`, `201`, `204`, `400` (`validation_error`), `401` (`not_authenticated`/`token_expired`), `403` (`permission_denied`), `404` (`not_found`, inclusive para objetos pertencentes a outro usuário), `409` (`conflict`/violação de regra de negócio), `429` (`throttled`), `500` (`server_error` sem detalhes internos).
- **MUST**: publicar esquema OpenAPI (`/api/schema/`) via `drf-spectacular` e manter os tipos TypeScript do frontend sincronizados.
- **MUST**: mudanças incompatíveis no contrato exigem versionamento (`/api/v2/`).

---

## 6. Segurança

- **MUST NOT**: versionar senhas, tokens, chaves privadas ou arquivos `.env` / `.env.local`.
- **MUST**: fornecer arquivos `.env.example` e `.env.local.example` (a criar na Fase 0) sem valores reais e aplicar *fail-fast* na ausência de variáveis obrigatórias.
- **MUST**: todos os endpoints exigem autenticação por padrão (`IsAuthenticated`), exceto `auth/csrf`, `auth/login`, `auth/refresh`, `healthz`, `readyz` (e `auth/register` somente se `ALLOW_REGISTRATION=true`).
- **MUST**: cadastro público desativado por padrão (`ALLOW_REGISTRATION=false`).
- **MUST**: todo dado de negócio filtrado por `owner=request.user` e toda FK recebida validada quanto à posse (`OwnedPrimaryKeyRelatedField`).
- **MUST**: senhas armazenadas com Argon2id (`argon2-cffi`); tokens JWT em cookies `HttpOnly`, `Secure` (produção) e `SameSite=Lax`, com rotação e blacklist de refresh.
- **MUST**: proteção contra:
  - **SQL Injection**: usar apenas Django ORM ou consultas parametrizadas; nunca interpolar entrada do usuário em SQL;
  - **XSS**: sanitizar/rejeitar HTML bruto em Markdown; não usar `dangerouslySetInnerHTML` com conteúdo não sanitizado; configurar CSP no frontend;
  - **CSRF**: exigir `X-CSRFToken` em métodos não seguros (`POST`, `PATCH`, `DELETE`);
  - **CORS**: restringir `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` a origens explícitas por ambiente.
- **MUST**: uploads de arquivos (Fase 4, sujeitos a D-02) **MUST** validar tamanho máximo, tipo MIME real no servidor, registrar checksum SHA-256, evitar registros órfãos em falha e servir downloads apenas por URL assinada temporária ou stream autenticado.
- **MUST NOT**: registrar senhas, tokens, cookies, chaves, corpos de requisições de autenticação ou conteúdo de anotações pessoais em logs.
- **SHOULD**: executar auditoria de dependências (`pip-audit`, `npm audit`) e varredura de segredos no CI a partir da Fase 0.

---

## 7. Testes e Qualidade

### 7.1. Regra de Conclusão

- **MUST**: nenhuma funcionalidade relevante ou correção de bug **MUST** ser considerada concluída sem testes automatizados adequados cobrindo seus critérios de aceitação.
- **MUST NOT**: testes automatizados **MUST NOT** conectar-se ao banco de produção do Supabase. Usar PostgreSQL local (`local-db`) ou serviço de CI.

### 7.2. Níveis de Teste

| Nível | Escopo Mínimo | Ferramentas (planejadas para F0) |
|---|---|---|
| **Unitário (backend)** | Funções puras e serviços de domínio (médias, fórmulas, revisão, estados, datas/fuso) | `pytest`, `freezegun`, relógio injetável |
| **Integração (backend)** | Transações, `CHECK`/`UNIQUE`/índices parciais, `ON DELETE`, idempotência em PostgreSQL real | `pytest-django`, `factory-boy` |
| **API (backend)** | Sucesso, `400`, `401`, `404` de outro usuário, paginação e filtros para 100% dos endpoints | DRF `APIClient` |
| **Contrato** | Isolamento multiusuário em todas as rotas; OpenAPI e tipos TS sem divergência | Suíte de varredura + `drf-spectacular --validate` |
| **Componentes (frontend)** | Formulários, schemas Zod, estados vazio/erro/carregando e acessibilidade | Vitest, Testing Library, MSW, `axe` |
| **End-to-End (E2E)** | Fluxos críticos contra pilha completa (`local-db`) | Playwright |

### 7.3. Metas e Ferramentas de Qualidade (Recomendadas / Planejadas para F0)

- **SHOULD**: cobertura ≥ 85% em `services/` e funções puras; ≥ 70% no restante do backend (RNF026, valores propostos).
- **MUST** (uma vez configurados na F0):
  - Backend: `ruff check .`, `ruff format --check .`, `mypy .`, `import-linter`, `pytest`.
  - Frontend: `npm run lint`, Prettier, `npx tsc --noEmit`, testes Vitest e Playwright nos fluxos aplicáveis.
- **MUST**: testes **MUST** ser determinísticos, independentes de ordem, sem acesso à rede externa e sem dependência do relógio real do sistema.

---

## 8. Git, Versionamento e Identidade do Desenvolvedor

### 8.1. Identidade e Autoria

A identidade Git do projeto **MUST** corresponder exclusivamente à conta pessoal do proprietário do repositório.

- **MUST**: utilizar sempre a conta GitHub pessoal do proprietário para operações remotas e as credenciais pessoais previamente configuradas no ambiente.
- **MUST**: configurar corretamente `user.name` e `user.email` (e-mail verificado na conta GitHub ou endereço `noreply` pessoal do GitHub).
- **MUST NOT**: utilizar contas de terceiros, institucionais ou de organizações como autoria pessoal, salvo solicitação explícita.
- **MUST NOT**: atribuir commits ao GitHub Copilot, ChatGPT, OpenAI, Gemini ou qualquer ferramenta de IA.
- **MUST NOT**: adicionar coautores artificiais ou inserir trailers `Co-authored-by` para ferramentas de IA.
- **MUST NOT**: modificar artificialmente a autoria de commits ou reescrever histórico para mascarar a origem das alterações.
- **MUST NOT**: realizar `push` utilizando uma conta diferente da conta autorizada para o projeto.

O uso de ferramentas de IA como apoio não altera a autoria: o desenvolvedor **MUST** revisar, compreender e assumir responsabilidade por tudo o que envia ao repositório.

### 8.2. Verificação Inicial de Git e Conta GitHub

Antes de iniciar alterações ou operações remotas, **MUST** verificar a identidade e o remoto configurados:

```bash
git config --global user.name
git config --global user.email
git config user.name
git config user.email
git remote -v
gh auth status
```

- **MUST NOT**: alterar configurações globais (`git config --global`) sem verificar impacto em outros repositórios; preferir configuração local (`git config user.name` / `git config user.email`) quando necessário para este projeto.
- **MUST**: se a conta autenticada em `gh auth status` não for a conta proprietária autorizada, **MUST NOT** executar `push`, **MUST NOT** trocar credenciais silenciosamente e **MUST NOT** ler tokens em arquivos — solicitar orientação ao proprietário.
- **MUST NOT**: agentes **MUST NOT** pedir senhas, tokens ou credenciais privadas ao usuário.

### 8.3. Padrão de Commits (Conventional Commits)

- **MUST**: adotar **Conventional Commits**:

```text
<type>(<scope>): <description>
```

| Tipo | Finalidade |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de erro |
| `refactor` | Refatoração sem mudança funcional |
| `docs` | Documentação |
| `style` | Formatação sem mudança funcional |
| `test` | Adição ou ajuste de testes |
| `perf` | Melhoria de desempenho |
| `build` | Dependências e ferramentas de build |
| `ci` | Integração contínua |
| `chore` | Manutenção geral |

- **MUST**: mensagens objetivas, em linguagem natural e no imperativo, refletindo fielmente o que foi alterado (ex.: `feat(exercises): add attempt recording service`, `fix(auth): validate refresh token rotation`).
- **MUST**: manter consistência de idioma nas mensagens do histórico do projeto (recomenda-se inglês técnico alinhado aos exemplos e ao código, ou pt-BR se adotado de forma uniforme — evitar misturar idiomas no mesmo commit).
- **SHOULD**: referenciar o requisito no corpo do commit quando aplicável (`Refs: RF037`).
- **MUST NOT**: usar mensagens genéricas (`update files`, `fix stuff`, `changes`, `improvements`), exageradas, que afirmem conclusão de algo apenas iniciado ou que mencionem autoria de IA.

### 8.4. Commits Pequenos e Atômicos

- **MUST**: cada commit representa uma unidade lógica de trabalho. Separar funcionalidades independentes, refatorações de correções e documentação de implementação quando fizer sentido.
- **MUST**: revisar arquivos staged antes do commit (`git status`, `git diff`, `git diff --cached`, `git diff --check`).
- **SHOULD NOT**: usar `git add .` indiscriminadamente; adicionar caminhos específicos (`git add <caminho>`) para evitar incluir arquivos temporários ou sensíveis.

### 8.5. Estratégia de Branches e Fluxo Git

| Branch | Responsabilidade |
|---|---|
| `main` | Versão estável (nota: o repositório local inicia em `master`; recomenda-se padronizar para `main` na Fase 0) |
| `develop` | Integração de desenvolvimento, se necessária |
| `feat/*` | Novas funcionalidades (ex.: `feat/rf037-record-attempt`) |
| `fix/*` | Correções de erro (ex.: `fix/login-validation`) |
| `refactor/*` | Refatorações |
| `docs/*` | Documentação (ex.: `docs/development-rules`) |

- **MUST NOT**: realizar alterações diretamente na branch principal (`main`), salvo em situações explícitas e controladas pelo proprietário.
- **SHOULD**: fluxo padrão:
  1. Antes de iniciar: `git status`, `git branch --show-current`, `git pull --ff-only`.
  2. Durante o trabalho: `git status`, `git diff`.
  3. Antes do commit: `git diff --check`, `git add <arquivos>`, `git diff --cached`.
  4. Após o commit: `git log -5 --oneline`, `git status`.
  5. Envio: conferir branch e remoto antes de `git push -u origin <branch>`.

### 8.6. Comandos Proibidos Sem Autorização

- **MUST NOT** executar automaticamente:
  - `git push --force`
  - `git reset --hard`
  - `git clean -fd`
  - `git commit --amend`
  - `git rebase`
- Esses comandos exigem justificativa técnica e autorização explícita do proprietário.
- **MUST NOT**: criar commits vazios, alterações artificiais, expor segredos ou commitar arquivos `.env`.

### 8.7. Pull Requests, `.gitignore`, Versionamento e Changelog

- **MUST**: todo PR **MUST** focar em uma intenção clara e cumprir o checklist de revisão de `CONTRIBUTING.md` / `DEVELOPMENT_PLAN.md` (seção 3.11.4). Merge exige CI verde (a partir da F0).
- **MUST** (recomendação explícita para F0): criar `.gitignore` na raiz cobrindo `.env`, `.env.local`, `.venv/`, `__pycache__/`, `*.pyc`, `node_modules/`, `.next/`, arquivos de cobertura, logs e artefatos de IDE/SO.
- **MUST**: adotar Versionamento Semântico (SemVer) a partir da `0.1.0` e registrar mudanças relevantes em [`CHANGELOG.md`](CHANGELOG.md) (Keep a Changelog).

---

## 9. Documentação

- **MUST**: alterações arquiteturais atualizam `DEVELOPMENT_PLAN.md`, `docs/ARCHITECTURE.md` e geram/atualizam ADR em `docs/adr/`.
- **MUST**: endpoints novos ou alterados atualizam `DEVELOPMENT_PLAN.md`, `docs/API.md` e o esquema OpenAPI.
- **MUST**: variáveis de ambiente novas ou alteradas são documentadas em `DEVELOPMENT_PLAN.md`, `README.md` e nos arquivos `.env.example`.
- **MUST**: novos módulos têm responsabilidades descritas na documentação.
- Consultar [`docs/AGENTS.md`](docs/AGENTS.md) para regras detalhadas de escrita, diagramas, ADRs e sincronização.

---

## 10. Fluxo Obrigatório de Desenvolvimento

Toda tarefa de implementação **MUST** seguir esta sequência:

1. **Analisar o requisito**: identificar o `RFxxx`/`RNFxxx`/bug e seus critérios de aceitação.
2. **Consultar documentação e regras**: ler `DEVELOPMENT_PLAN.md`, `AGENTS.md` e o `AGENTS.md` do escopo afetado.
3. **Identificar módulos afetados**: mapear apps Django, features frontend, contratos e migrações.
4. **Avaliar impactos arquiteturais**: verificar fronteiras entre módulos, segurança (`owner`), performance e decisões em aberto (`D-xx`).
5. **Planejar a implementação**: definir etapas pequenas e verificáveis antes de editar código.
6. **Implementar em etapas pequenas**: respeitar a separação de camadas e os contratos.
7. **Criar ou atualizar testes**: cobrir casos de sucesso, erro, borda e isolamento.
8. **Executar verificações de qualidade**: rodar lint, formatação, verificação de tipos e testes aplicáveis.
9. **Revisar efeitos colaterais**: inspecionar `git diff`, consultas SQL, migrações e impacto em outros módulos.
10. **Atualizar documentação**: sincronizar `DEVELOPMENT_PLAN.md`, `docs/`, ADRs e `CHANGELOG.md` quando aplicável.
11. **Registrar alterações no Git**: seguir a seção 8 (com autorização explícita do proprietário quando executado por agente).

---

## 11. Regras para Agentes de Programação

Todo agente de programação que operar neste repositório **MUST**:

1. **Ler as regras antes de agir**: consultar este `AGENTS.md` e o `AGENTS.md` do escopo (`backend/`, `frontend/`, `docs/`) antes de propor ou executar alterações.
2. **Analisar o contexto real**: inspecionar arquivos existentes antes de editar; nunca presumir que ferramentas, arquivos ou endpoints já existem.
3. **Respeitar stack e arquitetura**: **MUST NOT** alterar tecnologias, dependências ou arquitetura sem justificativa técnica e aprovação explícita.
4. **Manter foco cirúrgico**: **MUST NOT** criar arquivos desnecessários, modificar arquivos fora do escopo da tarefa sem justificativa ou apagar funcionalidades existentes sem autorização.
5. **Planejar tarefas complexas**: antes de modificar múltiplos módulos ou introduzir alterações estruturais, **MUST** apresentar um plano de implementação claro para alinhamento.
6. **Rigor com testes e verificação**:
   - **MUST NOT** ignorar, pular ou desabilitar testes quebrados para "fazer passar".
   - **MUST NOT** afirmar que algo foi testado sem realmente executar os testes.
   - **MUST NOT** inventar ou maquiar saídas de comandos ou resultados de execução.
7. **Segurança e identidade no Git**:
   - **MUST** verificar identidade Git (`git config`) e conta GitHub (`gh auth status`, `git remote -v`) antes de operações remotas.
   - **MUST** preservar integralmente a identidade pessoal do proprietário; **MUST NOT** inserir assinaturas de IA, coautoria artificial ou alterar histórico.
   - **MUST NOT** executar `git commit` ou `git push` sem autorização explícita do proprietário.
   - **MAY** preparar comandos e sugerir mensagens de commit no padrão Conventional Commits, aguardando aprovação.
8. **Transparência na entrega**: ao concluir uma tarefa (e antes de solicitar autorização para commit), **MUST** apresentar um resumo técnico objetivo das alterações realizadas, arquivos tocados, verificações executadas e eventuais pendências ou limitações.
