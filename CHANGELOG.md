# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento semântico a partir da `0.1.0` (ver roadmap).

## [Não lançado]

### Adicionado
- `DEVELOPMENT_PLAN.md`: plano técnico completo (requisitos, arquitetura, modelagem do banco para PostgreSQL/Supabase, API, infraestrutura, testes, roadmap, riscos e critérios de conclusão).
- `README.md`, `CONTRIBUTING.md` e `docs/` (`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ROADMAP.md`).
- `docker-compose.yml` de rascunho (os Dockerfiles serão criados na Fase 0).

### Alterado
- Consolidação das pastas `Estudos` e `Site_de_estudos` em uma só (`Site_de_estudos`). O protótipo Next.js + Drizzle foi removido; dados, regras de domínio, testes e decisões úteis foram preservados em `docs/legacy-prototype/` e o prompt do design system em `docs/design/`. PDFs e mini-sites de disciplina ficam em `Sistema_de_estudos/Materiais/`, fora do repositório.

### Decisões
- D-14 resolvida: o protótipo é apenas referência; reaproveitam-se dados e regras, não código.
- Backend Django + DRF e frontend Next.js desacoplados por API REST.
- Supabase usado **apenas como PostgreSQL gerenciado**, acessado somente pelo backend (ADR-02).
- Sem integração com inteligência artificial.

## Marcos previstos

| Versão | Fase | Conteúdo |
|---|---|---|
| 0.1.0 | F1 | Núcleo de estudo: disciplinas, tópicos, exercícios, tentativas, sessões |
| 0.2.0 | F2 | **MVP**: revisão espaçada, anotações, metas, estatísticas |
| 0.3.0 | F3 | Notas e semestres, simulados, calendário |
| 0.4.0 | F4 | Biblioteca, programação competitiva, projetos |
| 1.0.0 | F5 | Exportação, backups, endurecimento e implantação |
