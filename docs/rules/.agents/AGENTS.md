# docs/AGENTS.md — Regras de Documentação Técnica

Este arquivo define os padrões para toda documentação do repositório (`docs/`, `DEVELOPMENT_PLAN.md`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`) e complementa o [`AGENTS.md`](../AGENTS.md) da raiz.

---

## 1. Hierarquia e Fonte Única de Verdade

1. **`DEVELOPMENT_PLAN.md`** é a referência técnica oficial do projeto.
2. Os arquivos extraídos em `docs/` (**`ARCHITECTURE.md`**, **`DATABASE.md`**, **`API.md`**, **`ROADMAP.md`**) espelham seções específicas do plano.
   - **MUST**: qualquer alteração estrutural **MUST** ser feita primeiro em `DEVELOPMENT_PLAN.md` e replicada no arquivo correspondente de `docs/` no **mesmo Pull Request**, evitando divergências.
3. **`README.md`** apresenta a visão resumida e instruções práticas de uso e execução. Em caso de divergência com `DEVELOPMENT_PLAN.md`, o plano prevalece e o README **MUST** ser corrigido.
4. **`docs/legacy-prototype/`** contém apenas referência histórica de dados, regras de domínio e testes do protótipo descartado (D-14).
   - **MUST NOT**: tratar código de `docs/legacy-prototype/` como código de produção ou executável. Quando um artefato for portado para Django/Next.js, registrar no `CHANGELOG.md` e remover o original legado.
5. **`docs/design/`** concentra o material de identidade visual ("Voltage") e futuras especificações de entrega de telas (*handoff*).

---

## 2. Princípios de Escrita Técnica

- **MUST**: escrever em **português do Brasil (pt-BR)**, de forma objetiva, clara e tecnicamente precisa (termos técnicos consagrados como *endpoint*, *queryset*, *payload*, *pooler* **MAY** ser mantidos em inglês).
- **MUST**: manter fidelidade estrita ao código e ao estado real do repositório.
  - **MUST NOT**: descrever funcionalidades, comandos, variáveis ou arquivos planejados como se já existissem ou tivessem sido validados.
  - **MUST**: sinalizar explicitamente itens pendentes com referência à decisão (`D-xx`) ou fase (`F0`–`F5`).
- **MUST**: referenciar requisitos (`RFxxx`, `RNFxxx`), decisões (`ADR-xx`, `D-xx`) e riscos (`Rxx`) pelos identificadores oficiais.
- **SHOULD**: evitar redundância desnecessária entre documentos; preferir links relativos para a fonte canônica.

---

## 3. Diagramas

- **MUST**: usar **Mermaid** em blocos de código cercados (```` ```mermaid ````) para diagramas de arquitetura (`flowchart`), fluxos de interação (`sequenceDiagram`) e modelagem (`erDiagram`).
- **MUST**: colocar rótulos com parênteses, colchetes ou caracteres especiais entre aspas (ex.: `id["Backend (Django + DRF)"]`) para evitar erros de sintaxe.
- **MUST**: manter todos os diagramas sincronizados com a arquitetura e o modelo de dados vigentes; diagrama desatualizado **MUST** ser corrigido no mesmo PR da mudança.

---

## 4. Modelagem de Banco de Dados (`docs/DATABASE.md`)

- **MUST**: documentar entidades, campos, tipos PostgreSQL, restrições (`PK`, `FK`, `UNIQUE`, `CHECK`, índices parciais), políticas `ON DELETE` e justificativa de índices adicionais.
- **MUST**: manter consistência exata entre `docs/DATABASE.md`, `DEVELOPMENT_PLAN.md` (seção 3.5) e as migrações Django efetivamente aplicadas.
- **MUST**: justificar explicitamente qualquer desnormalização (campo derivado armazenado) e indicar qual serviço a mantém em transação.

---

## 5. Contratos de API (`docs/API.md` e OpenAPI)

- **MUST**: `docs/API.md` define o contrato de projeto (métodos, URLs em `/api/v1/`, parâmetros, corpo, respostas, erros e autenticação); o esquema OpenAPI gerado (`/api/schema/`) é a fonte final dos campos quando implementado.
- **MUST**: todo endpoint novo, alterado ou removido **MUST** atualizar `DEVELOPMENT_PLAN.md` (seção 3.8) e `docs/API.md` no mesmo PR.
- **MUST**: documentar explicitamente códigos de erro esperados (`400`, `401`, `404`, `409`, `429`), paginação e requisitos de autenticação/CSRF.

---

## 6. Decisões Arquiteturais — ADRs (`docs/adr/`)

> **Estado atual:** a pasta `docs/adr/` ainda não existe e **MUST** ser criada na Fase 0 para registrar `ADR-01` a `ADR-14` (já resumidos em `DEVELOPMENT_PLAN.md`, seção 3.4.12) e todas as decisões futuras relevantes.

- **MUST**: nomear arquivos como `docs/adr/ADR-XX-titulo-curto-em-kebab-case.md` (ex.: `ADR-01-monolito-modular-e-frontend-desacoplado.md`).
- **MUST**: incluir em cada ADR:
  1. **Status** (`Proposta`, `Aceita`, `Substituída por ADR-YY`);
  2. **Contexto** (problema técnico e restrições);
  3. **Decisão** (o que foi escolhido);
  4. **Alternativas consideradas** (e por que foram descartadas);
  5. **Consequências** (ganhos, custos e riscos).
- **MUST**: quando uma decisão em aberto (`D-xx`) for resolvida, atualizar sua linha na seção 3.15 de `DEVELOPMENT_PLAN.md` e criar o ADR correspondente se tiver impacto arquitetural.

---

## 7. Especificações de Interface (*Handoff*)

- **SHOULD**: a partir da Fase 1, antes de implementar cada tela relevante, produzir uma especificação curta em `docs/design/` (conforme `DEVELOPMENT_PLAN.md`, seção 3.9.9) cobrindo: contexto de uso, layout responsivo, tokens utilizados por nome, componentes/variantes, estados (padrão, carregando, vazio, erro, sucesso), casos de borda e notas de acessibilidade.

---

## 8. Guias de Instalação, Contribuição, Roadmap e Changelog

- **`README.md`**:
  - **MUST**: manter pré-requisitos, variáveis de ambiente e comandos de execução/testes fiéis ao estado real do projeto.
  - **MUST**: remover avisos de "a validar na Fase 0" somente depois que os comandos forem efetivamente executados e verificados.
- **`CONTRIBUTING.md`**:
  - **MUST**: manter alinhado com as regras de fluxo, commits, checklist de PR e identidade Git definidas em [`AGENTS.md`](../AGENTS.md).
- **`docs/ROADMAP.md`**:
  - **MUST**: refletir exatamente as fases (`F0`–`F5`), requisitos (`RFxxx`) e critérios de conclusão de `DEVELOPMENT_PLAN.md` (seção 3.12). Nunca adicionar requisito a uma fase antes de suas dependências.
- **`CHANGELOG.md`**:
  - **MUST**: seguir [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e SemVer, registrando mudanças relevantes sob `## [Não lançado]` e promovendo para versões (`0.1.0`, `0.2.0`…) ao fechar marcos.

---

## 9. Revisão e Commits de Documentação

- **MUST**: commits exclusivos de documentação usam o tipo `docs(<escopo>): <descrição>` (ex.: `docs(api): document review queue filters`, `docs(adr): add ADR-01 modular monolith decision`).
- **MUST**: verificar links relativos, tabelas Markdown e sintaxe Mermaid antes de finalizar qualquer alteração em `docs/`.
- **MUST NOT**: alterar documentação de forma desconectada do código ou inventar resultados de validação que não foram executados.
