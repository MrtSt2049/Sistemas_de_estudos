# backend/AGENTS.md — Regras de Desenvolvimento do Backend

Este arquivo define as regras específicas para `backend/` (Python, Django, Django REST Framework e PostgreSQL) e complementa o [`AGENTS.md`](../AGENTS.md) da raiz.

> **Estado atual (pré-Fase 0):** o diretório `backend/` contém apenas `.gitkeep`. A estrutura, dependências e ferramentas listadas abaixo são o padrão oficial aprovado em [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) (seções 3.4, 3.5, 3.6 e 3.11) a ser criado na **Fase 0**. Não presuma que arquivos ou comandos já estejam disponíveis antes de verificar.

---

## 1. Python e Estilo de Código

- **MUST**: seguir **PEP 8** estritamente.
- **MUST**: usar **type hints** em todas as funções públicas, assinaturas de `services`, `selectors`, utilitários e retornos relevantes.
- **SHOULD**: adicionar docstrings concisas apenas quando agregarem valor real (regras de domínio, pré-condições, exceções lançadas); evitar docstrings que apenas repetem o nome da função.
- **SHOULD** (configurar na Fase 0 em `backend/pyproject.toml`):
  - **Lint e formatação**: `ruff check .` e `ruff format --check .`.
  - **Verificação de tipos**: `mypy .` com `django-stubs` e `djangorestframework-stubs`.
  - **Versão alvo**: Python 3.13 e Django 5.2 LTS (propostos em ADR-12 e D-13, a confirmar na F0).

---

## 2. Estrutura de Diretórios e Organização dos Apps

### 2.1. Layout Padrão do Backend

```text
backend/
├── manage.py
├── pyproject.toml               # ruff, mypy, pytest, coverage, import-linter
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── Dockerfile
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   ├── test.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/
│   ├── accounts/
│   ├── disciplines/
│   ├── curriculum/
│   ├── academic/
│   ├── exercises/
│   ├── cp/
│   ├── flashcards/
│   ├── reviews/
│   ├── notes/
│   ├── library/
│   ├── mockexams/
│   ├── planning/
│   ├── goals/
│   ├── studysessions/
│   ├── projects/
│   └── analytics/
└── tests/
```

### 2.2. Estrutura Interna de Cada App

Criar arquivos apenas quando necessários:

```text
apps/<app>/
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── services.py
├── selectors.py
├── permissions.py      # somente se houver regra além de autenticação + posse
├── filters.py
├── admin.py
├── migrations/
└── tests/
    ├── factories.py
    ├── test_models.py
    ├── test_services.py
    └── test_api.py
```

### 2.3. Fronteiras Entre Apps (Monólito Modular)

- **MUST**: manter dependências **unidirecionais** conforme o grafo da seção 3.4.5 de `DEVELOPMENT_PLAN.md` (sem ciclos).
- **MUST**: um app **MUST NOT** importar models de outro app para realizar escrita direta; operações entre apps **MUST** chamar funções públicas de `services.py` ou `selectors.py`.
- **MUST**: o app `analytics` é **somente leitura** e nenhum outro app **MUST** depender dele.
- **SHOULD**: configurar `import-linter` na Fase 0 para validar automaticamente essas fronteiras no CI.

---

## 3. Models e Django ORM

- **MUST**: todo model de negócio herda de `core.models.OwnedModel` (que inclui `id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`, `owner = ForeignKey(User, on_delete=CASCADE)`, `created_at` e `updated_at`).
- **MUST**: usar `models.TextChoices` para campos enumerados e espelhar invariantes críticos em `Meta.constraints` (`CheckConstraint`, `UniqueConstraint`, índices parciais).
- **MUST**: declarar `on_delete` explicitamente conforme a semântica do domínio (`CASCADE`, `PROTECT` ou `SET NULL`).
- **MUST NOT**: usar `GenericForeignKey` (usar FKs explícitas + `CheckConstraint`, ADR-11).
- **MUST NOT**: implementar regras de negócio multi-entidade ou relatórios complexos em métodos de model (evitar *fat models*). Métodos em models **MUST** ser triviais e sem efeitos colaterais (ex.: `__str__`).
- **MUST**: escrever QuerySets eficientes:
  - usar `select_related` para FKs/OneToOne e `prefetch_related` para M2M/reversos;
  - usar `annotate`/`aggregate` em SQL em vez de loops Python sobre QuerySets;
  - prevenir N+1 e validar endpoints agregados com `assertNumQueries`.

---

## 4. Serializers

- **MUST**: limitar serializers à validação de entrada (tipos, formatos, faixas, `choices`, regras entre campos) e serialização de saída.
- **MUST**: usar `core.fields.OwnedPrimaryKeyRelatedField` para toda referência de FK recebida, garantindo que o recurso referenciado pertence ao mesmo `owner`.
- **MUST**: declarar `fields` explicitamente; **MUST NOT** usar `fields = "__all__"`.
- **MUST NOT**: gravar em múltiplas tabelas ou invocar serviços de outros módulos dentro de `serializer.create()` / `serializer.update()` — delegar operações de negócio à view chamando `services.py`.

---

## 5. Views e ViewSets

- **MUST**: manter views enxutas (regra prática: ≤ 15 linhas por ação/método).
- **MUST NOT**: colocar regras de negócio, cálculos de domínio ou transações multi-tabela dentro de views.
- **MUST**: aplicar `core.mixins.OwnedQuerysetMixin` em todos os ViewSets/views de recursos pertencentes ao usuário, garantindo `queryset.filter(owner=request.user)` e injeção de `owner` na criação.
- **MUST**: retornar `404` (nunca `403`) quando um ID válido pertencer a outro usuário, evitando enumeração.
- **MUST**: delegar escrita a `services.py` e consultas/agregações a `selectors.py`.
- **MUST**: usar `django-filter` com `FilterSet` explícito em `filters.py` e o paginador padrão (`core.pagination`).
- **MUST**: anotar endpoints com `@extend_schema` (`drf-spectacular`) quando a inferência automática do OpenAPI não for suficiente (ex.: ações customizadas ou respostas compostas).

---

## 6. Services e Selectors

### 6.1. `services.py` (Escrita e Regras de Negócio)

- **MUST**: implementar serviços como **funções** (não classes desnecessárias) com parâmetros tipados explicitamente (ex.: `*, owner: User, ...`).
- **MUST NOT**: passar objetos `request` do Django/DRF para serviços; serviços **MUST** ser independentes de HTTP.
- **MUST**: envolver operações que alterem múltiplas tabelas ou mantenham invariantes compostos em `@transaction.atomic`.
- **MUST**: lançar exceções tipadas de domínio (`core.exceptions.DomainError` e subclasses como `Conflict`, `RuleViolation`, `NotFoundInScope`).
- **MUST**: usar relógio injetável (`core.clock.now()`) para qualquer lógica dependente de data/hora, garantindo determinismo em testes.
- **MUST**: implementar ações que exigem idempotência (ex.: resposta de revisão com `client_request_id`) de forma segura contra retentativas.

### 6.2. `selectors.py` (Leitura e Agregações)

- **MUST**: concentrar consultas reutilizáveis, filtros compostos e agregações de leitura em `selectors.py`.
- **MUST NOT**: realizar escritas ou causar efeitos colaterais em seletores.
- **MUST**: exigir `owner: User` como parâmetro explícito em seletores de dados de negócio.

---

## 7. Permissions, Autenticação e Tratamento de Exceções

- **MUST**: configurar `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]` globalmente. Endpoints públicos (`auth/csrf`, `auth/login`, `auth/refresh`, `healthz`, `readyz`) **MUST** declarar `permission_classes = [AllowAny]` explicitamente.
- **MUST**: usar `permissions.py` apenas para regras de autorização que ultrapassem `IsAuthenticated` + posse do objeto.
- **MUST**: autenticação própria via `djangorestframework-simplejwt` com rotação e blacklist de refresh, transportada em cookies `HttpOnly`, `Secure` (produção) e `SameSite=Lax`, com validação de CSRF em métodos não seguros.
- **MUST**: centralizar o mapeamento de exceções em `core.exceptions.exception_handler`, convertendo `DomainError`, erros DRF e `IntegrityError` mapeáveis para o envelope JSON padrão `{ "error": { "code", "message", "details", "request_id" } }`.
- **MUST NOT**: expor *stack traces*, SQL ou mensagens internas em respostas `500`.

---

## 8. URLs

- **MUST**: registrar rotas de cada app em `apps/<app>/urls.py` usando `DefaultRouter` (quando aplicável) e incluí-las em `config/urls.py` sob `/api/v1/`.
- **MUST**: recursos no plural em `kebab-case` (ex.: `exercise-sources`, `study-sessions`, `mock-exams`).
- **MUST**: ações customizadas via `@action(detail=True/False, methods=["post"])` no padrão `POST /recurso/{id}/acao/`.
- **MUST**: manter `/healthz` (liveness) e `/readyz` (`SELECT 1`) fora de `/api/v1/`.
- **MUST**: expor `/api/schema/` e `/api/docs/` **somente** fora de produção.

---

## 9. Signals

- **SHOULD NOT**: usar Django signals (`post_save`, `pre_save`, etc.) para regras de negócio, pois ocultam o fluxo de execução e dificultam testes e depuração.
- **MUST**: preferir chamadas explícitas dentro de `services.py` sob `transaction.atomic()`.
- **MAY**: usar signals apenas para integração estritamente técnica de ciclo de vida do framework, com justificativa documentada.

---

## 10. Migrations

- **MUST**: gerar migrações via `python manage.py makemigrations`, revisar com `sqlmigrate` e versioná-las junto com a alteração de model.
- **MUST**: garantir que migrações de dados sejam reversíveis sempre que possível e testadas com dados realistas.
- **MUST NOT**: editar migrações já aplicadas em ambientes compartilhados/produção.
- **MUST**: manter a migração de segurança RLS do Supabase com `RunSQL` condicional (verifica se os papéis `anon`/`authenticated` existem antes de executar `REVOKE`).

---

## 11. Configurações por Ambiente

- **MUST**: separar configurações em `config/settings/{base.py, local.py, test.py, production.py}`.
- **MUST**: ler segredos e parâmetros de ambiente exclusivamente de variáveis de ambiente (`django-environ`), com *fail-fast* se alguma obrigatória estiver ausente.
- **MUST**: em `production.py`, exigir `DEBUG = False`, `SECURE_SSL_REDIRECT`, HSTS, cookies `Secure` + `HttpOnly`, hosts e origens CORS/CSRF explícitos e desativar `/api/docs/`.
- **MUST**: em `test.py`, usar PostgreSQL local/CI (nunca Supabase de produção); **MAY** usar hasher rápido (ex.: MD5) exclusivamente em `test.py` para velocidade da suíte.

---

## 12. Testes do Backend

- **MUST**: usar `pytest` + `pytest-django` contra **PostgreSQL real** (nunca SQLite para validar constraints/índices/full-text).
- **MUST**: manter `factories.py` (`factory-boy`) por app e testar:
  - `test_models.py`: constraints (`CHECK`, `UNIQUE`, índices parciais) com testes que provocam violação;
  - `test_services.py`: regras de negócio, transações, idempotência, virada de dia/fuso horário;
  - `test_api.py`: sucesso, `400`, `401`, `404` para objeto de outro usuário, paginação e filtros.
- **MUST**: manter o teste de contrato global em `backend/tests/` que verifica isolamento entre dois usuários em todas as rotas registradas e validação do esquema OpenAPI (`drf-spectacular --validate`).
- **SHOULD**: atingir ≥ 85% de cobertura em `services.py` e funções puras, e ≥ 70% no restante do backend.

---

## 13. Git e Commits no Backend

Complementando a seção 8 do [`AGENTS.md`](../AGENTS.md):

- **MUST**: usar o nome do app Django como escopo nos commits (ex.: `feat(exercises): add attempt recording service`, `fix(academic): handle bonus cap in grade calculation`, `test(reviews): cover spaced repetition intervals`).
- **SHOULD**: manter migrações no mesmo commit do model correspondente, separando refatorações não relacionadas em commits próprios.
- **MUST NOT**: commitar `backend/.env`, `.venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/` ou dumps de banco.
- **MUST NOT**: executar `git commit` ou `git push` sem autorização explícita do proprietário, nem atribuir autoria/coautoria a ferramentas de IA.
