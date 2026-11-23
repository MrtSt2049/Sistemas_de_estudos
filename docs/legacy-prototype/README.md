# Protótipo anterior (referência, não é base de código)

Esta pasta guarda o que foi aproveitado do protótipo antigo (`Estudos/Plataforma`, Next.js full-stack + Drizzle + PGlite/Neon, já removido). Pelo `DEVELOPMENT_PLAN.md` (D-14, seção 3.16 e R17), o protótipo **não** é base de código: a stack oficial é Django + DRF + Next.js desacoplados, sem IA. Aqui ficam só dados, regras de domínio e decisões que valem a pena portar.

**Nada daqui roda como está.** Os arquivos `.ts` e `.mjs` dependem do Drizzle e do Next antigos; servem de especificação e de fonte de dados. Quando um item for portado, registre no `CHANGELOG.md` e apague o original daqui.

## O que há aqui e para onde vai

| Pasta/arquivo | Conteúdo | Destino no plano novo |
|---|---|---|
| `seed-content/` | Banco de ~242 questões e ~185 tópicos escritos à mão (`grad-prob`, `grad-analise`, `grad-aplicada`, `obmu`, `cp`, `topics`) e `sites.generated.json` (importado dos mini-sites de disciplina) | F1: fixtures/`management command` Django que carrega exercícios e tópicos. O **conteúdo** vale; o código TypeScript não |
| `seed-content/seed.ts` | As 12 disciplinas de 2026/2 (códigos FFCLRP/FEA-RP), materiais, metas, calendário de 52 semanas | F1/F3: disciplinas e calendário iniciais |
| `scripts/import-sites.mjs` | Converte `Materiais/Disciplinas/site-*` em JSON | Reescrever como comando Django (RF de importação) ou rodar uma vez e guardar o JSON |
| `scripts/check-cp.ts`, `verify-seed.ts` | Validações do conteúdo (programação competitiva, seed) | Viram testes dos fixtures |
| `rules/grades.ts` | Cálculo de médias e nota necessária | `services.py` do app acadêmico (F3). O avaliador de fórmula **não** deve usar `eval` |
| `rules/questions.ts` | Máquina de estados de exercício e intervalos de revisão `[1, 3, 7, 16, 35, 80]` | `services.py` de revisão espaçada (F2). Conferir com D-xx de intervalos |
| `rules/goals.ts`, `rules/errors.ts`, `rules/calendar.ts` | Metas, caderno de erros, calendário | F2/F3 |
| `rules/latex-renderer.ts` | Pipeline remark/rehype com KaTeX e sanitização | Referência para o frontend (KaTeX/Tiptap) |
| `tests/` | Testes unitários das regras acima | Portar como casos de teste pytest (são os critérios de aceite) |
| `schema/` | Schema Drizzle e SQL gerado | Só consulta para modelagem; o schema oficial é `docs/DATABASE.md` |
| `decisoes-prototipo.md` | Decisões de domínio (disciplinas, estados, sessão) | Consulta ao escrever ADRs |
| `mockup-plataforma-de-estudos.html` | Mockup visual antigo (paleta azul, anterior ao "Voltage") | Só referência de fluxos de tela; **não** seguir as cores |

O prompt do design system vigente está em [`../design/prompt-master-identidade-visual.md`](../design/prompt-master-identidade-visual.md).

## Descartado de propósito

- Tutor com IA (`/api/tutor`, `tutor_messages`, `ANTHROPIC_API_KEY`): fora do escopo (plano 3.1.7).
- Autenticação por senha única e cookie próprio; a oficial é JWT em cookies `HttpOnly` pelo Django.
- Interface (`app/`, `components/`), `globals.css` (paleta antiga), Playwright e2e, banco local `.pgdata`, builds.
- Cópias antigas dos planos em `data/`: a versão atual está em `Sistema_de_estudos/Plano/`.

## Material de estudo (PDFs e mini-sites)

Livros, listas, provas e os mini-sites `site-vc` e `site-processos` foram movidos para `Sistema_de_estudos/Materiais/`, **fora** do repositório, por tamanho (~3 GB). A Biblioteca (F4) decidirá onde guardá-los (D-02).
