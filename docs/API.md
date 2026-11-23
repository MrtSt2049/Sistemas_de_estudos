# Especificação da API

> Extraído de [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md), seção 3.8, em 23/11/2026. Em caso de divergência, **vale o `DEVELOPMENT_PLAN.md`**. Alterações devem ser feitas primeiro no plano e depois replicadas aqui, no mesmo pull request.

## 3.8. Especificação da API

### 3.8.1. Convenções gerais

- **Prefixo:** `/api/v1`. Todos os caminhos abaixo são relativos a ele, exceto `/healthz` e `/readyz`.
- **Autenticação:** "Sim" = cookie de acesso válido (ver 3.4.6); "Não" = público. Métodos `POST`, `PATCH` e `DELETE` autenticados exigem também o cabeçalho `X-CSRFToken`.
- **Listas:** todas as respostas de lista têm o formato `Page<T>` = `{count, next, previous, results: T[]}` e aceitam `page`, `page_size`, `ordering` e, quando indicado, `search`.
- **Criação:** `201` com o objeto criado. **Atualização:** `PATCH` parcial, `200` com o objeto. **Remoção:** `204`.
- **Erros:** formato de 3.4.9. Recurso de outro usuário responde `404`.
- **Campos de corpo:** nomes em `snake_case`; chaves estrangeiras são IDs (UUID); `*` marca campo obrigatório na criação.
- Cada linha com mais de um método descreve o conjunto padrão `GET` (detalhe), `PATCH`, `DELETE`.
- O esquema OpenAPI gerado (`/api/schema/`) é a fonte final dos campos; esta seção define o **contrato de projeto**.

### 3.8.2. Autenticação, perfil e saúde (RF088–RF093)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/auth/csrf/` | Define o cookie CSRF | — | — | `204` | Não |
| POST | `/auth/login/` | Autentica e define cookies `access` e `refresh` | — | `email*`, `password*` | `200 {user}`; `401` genérico se inválido; `429` se excedeu limite | Não |
| POST | `/auth/refresh/` | Renova o acesso e rotaciona o refresh | — | — (cookie `refresh`) | `200`; `401` se inválido | Não |
| POST | `/auth/logout/` | Encerra a sessão e bloqueia o refresh | — | — | `204` | Sim |
| POST | `/auth/register/` | Cadastro; **existe apenas se `ALLOW_REGISTRATION=true`** | — | `email*`, `password*`, `name*` | `201 {user}`; `404` se desativado | Não |
| GET, PATCH | `/me/` | Lê/atualiza o perfil | — | `name`, `timezone`, `locale`, `theme`, `daily_study_goal_minutes`, `week_starts_on`, `review_intervals_days` | `200 Me` | Sim |
| POST | `/me/password/` | Altera a senha e invalida refresh anteriores | — | `current_password*`, `new_password*` | `204`; `400` se fraca | Sim |
| GET | `/me/export/` | Exporta todos os dados do usuário (F5) | — | — | `200` JSON (anexo) | Sim |
| GET | `/healthz` (fora de `/api/v1`) | Processo vivo | — | — | `200 {status:"ok"}` | Não |
| GET | `/readyz` (fora de `/api/v1`) | Banco acessível | — | — | `200` ou `503` | Não |

### 3.8.3. Tags (núcleo)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/tags/` | Lista tags | `search` | — | `200 Page<Tag>` | Sim |
| POST | `/tags/` | Cria tag | — | `name*`, `color` | `201 Tag` | Sim |
| GET, PATCH, DELETE | `/tags/{id}/` | Detalhe, edição e remoção | — | `name`, `color` | `200 Tag` / `204` | Sim |

### 3.8.4. Disciplinas (RF013–RF016)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/disciplines/` | Lista disciplinas | `kind`, `archived` (padrão falso), `term`, `search` | — | `200 Page<Discipline>` | Sim |
| POST | `/disciplines/` | Cria disciplina | — | `name*`, `kind*`, `code`, `color`, `position` | `201 Discipline` | Sim |
| GET, PATCH, DELETE | `/disciplines/{id}/` | Detalhe, edição e remoção | — | campos de criação | `200 Discipline` / `204`; `409` se houver dependentes | Sim |
| POST | `/disciplines/{id}/archive/` | Arquiva | — | — | `200 Discipline` | Sim |
| POST | `/disciplines/{id}/unarchive/` | Reativa | — | — | `200 Discipline` | Sim |
| POST | `/disciplines/reorder/` | Define a ordem manual | — | `ids*` (lista ordenada) | `204` | Sim |
| GET | `/disciplines/{id}/overview/` | Página da disciplina (tópicos, domínio, exercícios, notas, sessões, avaliações) | — | — | `200 DisciplineOverview` | Sim |

### 3.8.5. Conteúdos e tópicos (RF017–RF021)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/topics/` | Lista plana de tópicos | `discipline`, `parent`, `status`, `search` | — | `200 Page<Topic>` | Sim |
| GET | `/topics/tree/` | Árvore completa de uma disciplina | `discipline*` | — | `200 TopicNode[]` (aninhado, com domínio agregado) | Sim |
| POST | `/topics/` | Cria tópico | — | `discipline*`, `title*`, `parent`, `description`, `position` | `201 Topic`; `400` se profundidade > 4 | Sim |
| GET, PATCH, DELETE | `/topics/{id}/` | Detalhe, edição e remoção | — | `title`, `description`, `status` | `200 Topic` / `204` | Sim |
| POST | `/topics/{id}/move/` | Muda pai e/ou posição, de forma atômica | — | `parent`, `position*` | `200 Topic`; `400` se ciclo | Sim |
| POST | `/topics/{id}/mastery/` | Define o nível de domínio e registra histórico | — | `level*` (0–5) | `200 Topic` | Sim |
| GET | `/topics/{id}/mastery-history/` | Histórico de domínio | — | — | `200 Page<MasteryLog>` | Sim |
| POST | `/topics/import/` | Importa árvore (Markdown/CSV) | — | `discipline*`, `format*` (`markdown`\|`csv`), `content*`, `dry_run` | `200 ImportPreview` (com `dry_run`) ou `201 ImportResult` | Sim |

### 3.8.6. Gestão acadêmica (RF006–RF012)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/terms/` | Lista / cria semestres | — | `name*`, `start_date*`, `end_date*` | `200 Page<Term>` / `201 Term` | Sim |
| GET, PATCH, DELETE | `/terms/{id}/` | Detalhe, edição, remoção | — | idem | `200 Term` / `204` | Sim |
| POST | `/terms/{id}/set-current/` | Define o semestre atual | — | — | `200 Term` | Sim |
| GET, PATCH | `/disciplines/{id}/course-info/` | Dados acadêmicos (cria no primeiro `PATCH`); só para `university_course` | — | `term`, `credits`, `passing_grade`, `min_attendance_percent` | `200 CourseInfo`; `409` se tipo incompatível | Sim |
| GET, PATCH | `/disciplines/{id}/grade-rule/` | Regra de média | — | `model`, `formula`, `max_grade`, `decimals` | `200 GradeRule` | Sim |
| POST | `/grade-rules/validate-formula/` | Valida fórmula sem executar código arbitrário | — | `formula*`, `variables*` (nomes) | `200 {valid, error?, position?}` | Sim |
| GET, POST | `/assessments/` | Lista / cria avaliações | `discipline`, `status`, `due_after`, `due_before` | `discipline*`, `name*`, `kind*`, `weight_percent*`, `max_score`, `score`, `due_date`, `status` | `200 Page<Assessment>` / `201 Assessment` | Sim |
| GET, PATCH, DELETE | `/assessments/{id}/` | Detalhe, edição, remoção | — | idem | `200 Assessment` / `204` | Sim |
| GET, POST | `/grade-bonuses/` | Lista / cria bônus | `discipline` | `discipline*`, `name*`, `value*`, `mode*`, `assessment` | `200 Page<Bonus>` / `201 Bonus` | Sim |
| GET, PATCH, DELETE | `/grade-bonuses/{id}/` | Detalhe, edição, remoção | — | idem | `200 Bonus` / `204` | Sim |
| GET | `/disciplines/{id}/grade/` | Cálculo atual: pontos acumulados, soma dos pesos, média parcial/final, situação | — | — | `200 GradeResult` | Sim |
| POST | `/disciplines/{id}/grade/projection/` | Nota necessária na avaliação pendente para atingir a média alvo | — | `target_grade*`, `assessment` (padrão: única pendente) | `200 {assessment, required_score, reachable}` | Sim |
| GET, POST | `/attendance/` | Lista / registra presença | `discipline`, `from`, `to` | `discipline*`, `date*`, `status*` | `200 Page<Attendance>` / `201 Attendance` | Sim |
| PATCH, DELETE | `/attendance/{id}/` | Edita / remove | — | `status` | `200` / `204` | Sim |
| GET | `/disciplines/{id}/attendance/summary/` | Percentual de presença e alerta | — | — | `200 AttendanceSummary` | Sim |

### 3.8.7. Exercícios, tentativas e caderno de erros (RF034–RF042)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/exercise-sources/` | Lista / cria fontes | `kind` | `name*`, `kind*` | `200 Page<Source>` / `201 Source` | Sim |
| GET, PATCH, DELETE | `/exercise-sources/{id}/` | Detalhe, edição, remoção | — | idem | `200` / `204`; `409` se em uso | Sim |
| GET, POST | `/error-types/` | Lista / cria tipos de erro | — | `name*` | `200 Page<ErrorType>` / `201` | Sim |
| GET, PATCH, DELETE | `/error-types/{id}/` | Detalhe, edição, remoção | — | `name` | `200` / `204`; `409` se em uso | Sim |
| GET | `/exercises/` | Lista com filtros | `discipline`, `topic`, `source`, `difficulty`, `state`, `tag`, `search`, `ordering` | — | `200 Page<ExerciseSummary>` | Sim |
| POST | `/exercises/` | Cria exercício | — | `discipline*`, `source*`, `title*`, `external_ref`, `topic`, `statement_md`, `solution_md`, `difficulty`, `url`, `tags` | `201 Exercise`; `409` se fonte+referência duplicada | Sim |
| GET, PATCH, DELETE | `/exercises/{id}/` | Detalhe, edição, remoção | — | idem | `200 Exercise` / `204` | Sim |
| POST | `/exercises/import/` | Importa CSV | — | multipart: `file*`, `source*`, `discipline*`, `on_duplicate` (`skip`\|`update`), `dry_run` | `200 ImportPreview` ou `201 ImportResult` (relatório por linha) | Sim |
| GET | `/exercises/{id}/attempts/` | Histórico de tentativas do exercício | — | — | `200 Page<Attempt>` | Sim |
| POST | `/exercises/{id}/attempts/` | Registra tentativa; atualiza o estado do exercício na mesma transação | — | `result*`, `attempted_at`, `duration_seconds`, `hint_level`, `dominant_error`, `key_technique`, `rewritten`, `notes_md`, `study_session` | `201 {attempt, exercise_state}` | Sim |
| GET | `/attempts/` | Lista global de tentativas (caderno de erros) | `exercise`, `discipline`, `result`, `has_error`, `dominant_error`, `rewritten`, `from`, `to` | — | `200 Page<Attempt>` | Sim |
| GET, PATCH, DELETE | `/attempts/{id}/` | Detalhe, edição (ex.: marcar `rewritten`), remoção | — | `key_technique`, `rewritten`, `notes_md`, `dominant_error` | `200` / `204` | Sim |

### 3.8.8. Programação competitiva (RF078–RF082)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, PATCH | `/exercises/{id}/cp-info/` | Metadados competitivos (cria no primeiro `PATCH`) | — | `platform*`, `contest_ref`, `problem_index`, `rating`, `time_limit_ms`, `memory_limit_mb` | `200 CpInfo` | Sim |
| GET, POST | `/cp-contests/` | Lista / cria contests | `platform`, `kind`, `from`, `to` | `platform*`, `name*`, `kind*`, `held_at*`, `rank`, `penalty`, `team_name`, `notes_md` | `200 Page<Contest>` / `201 Contest` | Sim |
| GET, PATCH, DELETE | `/cp-contests/{id}/` | Detalhe (inclui resolvidos derivados), edição, remoção | — | idem | `200 Contest` / `204` | Sim |
| GET, POST | `/cp-contests/{id}/results/` | Lista / registra resultado por problema | — | `label*`, `solved*`, `exercise`, `solve_minutes`, `wrong_submissions` | `200 Result[]` / `201 Result` | Sim |
| PATCH, DELETE | `/cp-contest-results/{id}/` | Edita / remove resultado | — | idem | `200` / `204` | Sim |
| GET | `/cp/upsolving/` | Problemas não resolvidos em contests, prontos para retomar | `platform` | — | `200 Page<UpsolveItem>` | Sim |

### 3.8.9. Flashcards e revisão espaçada (RF043–RF049)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/decks/` | Lista / cria decks | `discipline`, `topic` | `name*`, `discipline`, `topic` | `200 Page<Deck>` (com contagens) / `201 Deck` | Sim |
| GET, PATCH, DELETE | `/decks/{id}/` | Detalhe, edição, remoção | — | idem | `200` / `204` | Sim |
| GET, POST | `/flashcards/` | Lista / cria cartões | `deck*` (na lista), `search` | `deck*`, `front_md*`, `back_md*` | `200 Page<Flashcard>` / `201 Flashcard` (já agendado) | Sim |
| GET, PATCH, DELETE | `/flashcards/{id}/` | Detalhe, edição, remoção | — | `front_md`, `back_md`, `deck` | `200` / `204` | Sim |
| POST | `/flashcards/from-exercise/` | Cria cartão a partir de exercício | — | `exercise*`, `deck*` | `201 Flashcard` | Sim |
| POST | `/flashcards/from-note/` | Cria cartão a partir de nota | — | `note*`, `deck*`, `front_md*`, `back_md*` | `201 Flashcard` | Sim |
| GET | `/reviews/summary/` | Contagem de itens vencidos hoje, por tipo | — | — | `200 {due_today, by_type:{flashcard,exercise,topic}}` | Sim |
| GET | `/reviews/queue/` | Itens vencidos, ordenados por vencimento, com conteúdo para exibir | `type`, `deck`, `limit` (padrão 50) | — | `200 ReviewQueueItem[]` | Sim |
| POST | `/reviews/items/` | Agenda um exercício, tópico ou cartão (exatamente um) | — | `exercise` \| `topic` \| `flashcard` | `201 ReviewItem`; `409` se já agendado | Sim |
| GET | `/reviews/items/` | Lista itens de revisão | `status`, `type`, `due_before` | — | `200 Page<ReviewItem>` | Sim |
| POST | `/reviews/items/{id}/answer/` | Responde uma revisão (idempotente por `client_request_id`) | — | `rating*` (`again`\|`hard`\|`good`\|`easy`), `client_request_id*`, `duration_ms` | `200 {item, next_due_on}` | Sim |
| POST | `/reviews/items/{id}/suspend/` | Suspende | — | — | `200 ReviewItem` | Sim |
| POST | `/reviews/items/{id}/resume/` | Retoma | — | — | `200 ReviewItem` | Sim |
| POST | `/reviews/items/{id}/reset/` | Reinicia a escada | — | — | `200 ReviewItem` | Sim |
| DELETE | `/reviews/items/{id}/` | Remove o agendamento | — | — | `204` | Sim |
| GET | `/reviews/items/{id}/logs/` | Histórico de respostas | — | — | `200 Page<ReviewLog>` | Sim |

### 3.8.10. Anotações (RF028–RF033)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/notes/` | Lista/busca anotações | `search`, `discipline`, `topic`, `exercise`, `material`, `tag`, `pinned` | — | `200 Page<NoteSummary>` (com trecho destacado quando há `search`) | Sim |
| POST | `/notes/` | Cria anotação | — | `title*`, `body_json*`, `discipline`, `topic`, `exercise`, `material`, `tags`, `is_pinned` | `201 Note` (com `version`) | Sim |
| GET, DELETE | `/notes/{id}/` | Detalhe e remoção | — | — | `200 Note` / `204` | Sim |
| PATCH | `/notes/{id}/` | Atualiza (salvamento automático) | — | campos de criação + `version*` | `200 Note`; `409 conflict` se `version` desatualizada | Sim |
| GET | `/notes/{id}/export/` | Exporta em Markdown | `format=md` | — | `200` arquivo `.md` | Sim |

### 3.8.11. Biblioteca de materiais (RF022–RF027)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/materials/` | Lista/busca materiais | `kind`, `status`, `discipline`, `topic`, `tag`, `search` | — | `200 Page<Material>` | Sim |
| POST | `/materials/` | Cadastra material | — | `title*`, `kind*`, `author`, `url` (obrigatória p/ `link`), `status`, `pages_total`, `discipline`, `topic`, `tags` | `201 Material` | Sim |
| GET, PATCH, DELETE | `/materials/{id}/` | Detalhe, edição, remoção (apaga também o arquivo) | — | idem | `200` / `204` | Sim |
| PATCH | `/materials/{id}/progress/` | Atualiza páginas lidas | — | `pages_read*` | `200 Material` | Sim |
| POST | `/materials/{id}/file/` | Envia o arquivo (multipart); depende de D-02 | — | `file*` | `201 Material`; `413`/`415` se tamanho/tipo inválidos | Sim |
| GET | `/materials/{id}/file/` | Obtém acesso temporário ao arquivo (URL assinada ou *stream* autenticado) | — | — | `200 {url, expires_at}` ou fluxo de bytes | Sim |
| DELETE | `/materials/{id}/file/` | Remove só o arquivo | — | — | `204` | Sim |
| POST | `/materials/{id}/exercises/` | Vincula exercícios | — | `exercise_ids*` | `200 Material` | Sim |
| DELETE | `/materials/{id}/exercises/{exercise_id}/` | Desvincula | — | — | `204` | Sim |

### 3.8.12. Avaliações e simulados (RF050–RF054)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/mock-exams/` | Lista / cria simulados | `kind`, `discipline`, `from`, `to` | `title*`, `kind*`, `planned_minutes*`, `discipline`, `material`, `notes_md` | `200 Page<MockExam>` / `201 MockExam` | Sim |
| GET, PATCH, DELETE | `/mock-exams/{id}/` | Detalhe (com total derivado), edição, remoção | — | idem | `200` / `204` | Sim |
| POST | `/mock-exams/{id}/start/` | Inicia o cronômetro no servidor | — | — | `200 MockExam`; `409` se já iniciado | Sim |
| POST | `/mock-exams/{id}/finish/` | Encerra | — | — | `200 MockExam` | Sim |
| GET, POST | `/mock-exams/{id}/items/` | Lista / adiciona itens | — | `label*`, `position*`, `max_score*`, `exercise`, `score`, `time_spent_seconds`, `result` | `200 Item[]` / `201 Item` | Sim |
| PATCH, DELETE | `/mock-exam-items/{id}/` | Edita / remove item | — | idem | `200` / `204` | Sim |
| GET | `/mock-exams/{id}/analysis/` | Resumo por tópico, tempo por item e erros dominantes | — | — | `200 MockExamAnalysis` | Sim |

### 3.8.13. Planejamento e calendário (RF055–RF061)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/calendar-events/` | Eventos do período, já expandindo recorrências | `from*`, `to*`, `kind`, `discipline` | — | `200 EventOccurrence[]` | Sim |
| POST | `/calendar-events/` | Cria evento | — | `title*`, `kind*`, `starts_at*`, `ends_at*`, `all_day`, `discipline`, `assessment`, `recurrence_interval_weeks`, `recurrence_until`, `location` | `201 Event` | Sim |
| GET, PATCH, DELETE | `/calendar-events/{id}/` | Detalhe, edição, remoção | `scope` (`this`\|`all`, conforme D-10) e `occurrence_date` | idem | `200` / `204` | Sim |
| GET | `/calendar/feed/` | Agenda unificada: eventos + prazos de avaliações + fim de metas (derivados, sem cópia) | `from*`, `to*` | — | `200 FeedItem[]` | Sim |
| GET | `/calendar/conflicts/` | Sobreposições no período | `from*`, `to*` | — | `200 Conflict[]` | Sim |
| GET | `/calendar/export.ics` | Exporta ICS (F5) | `from`, `to` | — | `200 text/calendar` | Sim |
| GET, POST | `/weekly-plans/` | Lista / cria perfis de semana padrão | — | `name*` | `200 Page<Plan>` / `201 Plan` | Sim |
| GET, PATCH, DELETE | `/weekly-plans/{id}/` | Detalhe (com blocos), edição, remoção | — | `name` | `200` / `204` | Sim |
| POST | `/weekly-plans/{id}/activate/` | Torna o perfil ativo (desativa o anterior) | — | — | `200 Plan` | Sim |
| POST | `/weekly-plans/{id}/apply/` | Gera eventos da semana a partir do perfil, sem duplicar | — | `week_start*` (data) | `201 {created, skipped}` | Sim |
| GET, POST | `/weekly-plans/{id}/blocks/` | Lista / cria blocos | — | `weekday*`, `start_time*`, `end_time*`, `label*`, `activity_kind*`, `discipline` | `200 Block[]` / `201 Block` | Sim |
| PATCH, DELETE | `/weekly-plan-blocks/{id}/` | Edita / remove bloco | — | idem | `200` / `204` | Sim |

### 3.8.14. Metas e revisões periódicas (RF062–RF066)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/goals/` | Lista / cria metas | `status`, `scope`, `discipline`, `parent`, `active_on` | `title*`, `scope*`, `period_start*`, `period_end*`, `metric*`, `target_value*`, `description`, `discipline`, `parent` | `200 Page<Goal>` / `201 Goal` | Sim |
| GET, PATCH, DELETE | `/goals/{id}/` | Detalhe, edição, remoção | — | idem + `status` | `200` / `204` | Sim |
| GET | `/goals/{id}/progress/` | Progresso calculado (valor atual, alvo, percentual, série diária; agrega filhos) | — | — | `200 GoalProgress` | Sim |
| POST | `/goals/{id}/entries/` | Lançamento manual (metas `manual`) | — | `entry_date*`, `delta*`, `note` | `201 GoalEntry`; `409` se a meta não for manual | Sim |
| DELETE | `/goal-entries/{id}/` | Desfaz lançamento | — | — | `204` | Sim |
| GET | `/periodic-reviews/prefill/` | Números do período para preencher a revisão | `kind*`, `period_start*` | — | `200 ReviewPrefill` | Sim |
| GET, POST | `/periodic-reviews/` | Lista / cria revisão | `kind` | `kind*`, `period_start*`, `period_end*`, textos das cinco perguntas | `200 Page<PeriodicReview>` / `201`; `409` se já existe no período | Sim |
| GET, PATCH | `/periodic-reviews/{id}/` | Detalhe / edição | — | textos | `200` | Sim |

### 3.8.15. Sessões de estudo (RF067–RF071)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/study-sessions/` | Lista sessões | `discipline`, `topic`, `project`, `activity_kind`, `from`, `to` | — | `200 Page<Session>` | Sim |
| POST | `/study-sessions/` | Registro manual | — | `activity_kind*`, `started_at*`, `ended_at*`, `discipline`, `topic`, `project`, `focus_rating`, `energy_rating`, `notes` | `201 Session`; `409` se sobrepõe outra | Sim |
| GET | `/study-sessions/active/` | Sessão em andamento | — | — | `200 Session` ou `204` | Sim |
| POST | `/study-sessions/start/` | Inicia sessão (horário do servidor) | — | `activity_kind*`, `discipline`, `topic`, `project` | `201 Session`; `409` se já houver ativa | Sim |
| POST | `/study-sessions/active/pause/` | Pausa | — | — | `200 Session` | Sim |
| POST | `/study-sessions/active/resume/` | Retoma | — | — | `200 Session` | Sim |
| POST | `/study-sessions/active/finish/` | Encerra; atualiza `last_studied_at` do tópico | — | `focus_rating`, `energy_rating`, `notes` | `200 Session` (com `duration_seconds`) | Sim |
| GET, PATCH, DELETE | `/study-sessions/{id}/` | Detalhe, edição, remoção | — | campos editáveis | `200` / `204` | Sim |

### 3.8.16. Projetos (RF083–RF087)

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET, POST | `/projects/` | Lista / cria projetos | `status`, `kind`, `archived`, `tag`, `search` | `name*`, `kind*`, `status`, `description`, `start_date`, `target_date`, `repo_url`, `docs_url`, `discipline`, `tags` | `200 Page<Project>` / `201 Project` | Sim |
| GET, PATCH, DELETE | `/projects/{id}/` | Detalhe, edição, remoção | — | idem | `200` / `204` | Sim |
| POST | `/projects/{id}/archive/` | Arquiva | — | — | `200 Project` | Sim |
| GET, POST | `/projects/{id}/tasks/` | Lista / cria tarefas | `status` | `title*`, `status`, `priority`, `due_date` | `200 Task[]` / `201 Task` | Sim |
| PATCH, DELETE | `/project-tasks/{id}/` | Edita / remove tarefa | — | idem | `200` / `204` | Sim |
| POST | `/project-tasks/{id}/move/` | Move entre colunas e posições | — | `status*`, `position*` | `200 Task` | Sim |
| GET, POST | `/projects/{id}/milestones/` | Lista / cria marcos | — | `title*`, `due_date*` | `200 Milestone[]` / `201 Milestone` | Sim |
| PATCH, DELETE | `/project-milestones/{id}/` | Edita (inclui `completed_at`) / remove | — | idem | `200` / `204` | Sim |
| GET | `/projects/{id}/time/` | Tempo investido (soma das sessões) | `from`, `to` | — | `200 {total_minutes, by_week[]}` | Sim |

### 3.8.17. Dashboard e estatísticas (RF001–RF005, RF072–RF077, RF080)

Todos somente leitura; datas e agrupamentos respeitam o fuso do perfil.

| Método | URL | Descrição | Parâmetros | Corpo | Resposta | Auth |
|---|---|---|---|---|---|---|
| GET | `/dashboard/summary/` | Resumo do dia, indicadores da semana, fila de revisão, próximos prazos e sessão ativa, em **uma** resposta | — | — | `200 DashboardSummary` | Sim |
| GET | `/analytics/study-time/` | Minutos por disciplina e período | `from*`, `to*`, `group_by` (`discipline`\|`day`\|`week`\|`month`), `discipline` | — | `200 {total_minutes, series[]}` | Sim |
| GET | `/analytics/exercise-performance/` | Resultados por assunto/semana (sozinho, com dica, não resolvido) | `from`, `to`, `group_by` (`topic`\|`week`), `discipline`, `source` | — | `200 {denominator, series[]}` | Sim |
| GET | `/analytics/mastery-evolution/` | Evolução do domínio | `discipline*`, `from`, `to` | — | `200 {series[]}` | Sim |
| GET | `/analytics/consistency/` | Mapa de calor diário e sequência atual | `from`, `to` | — | `200 {days[], current_streak, longest_streak}` | Sim |
| GET | `/analytics/recurring-errors/` | Ranking de tipos de erro e tópicos com falhas | `from`, `to`, `discipline` | — | `200 {considered, by_error_type[], by_topic[]}` | Sim |
| GET | `/analytics/planned-vs-actual/` | Horas planejadas vs realizadas | `from*`, `to*` | — | `200 {series[]}` | Sim |
| GET | `/analytics/cp/` | Resolvidos por tag/rating e evolução por contest | `platform`, `from`, `to` | — | `200 CpAnalytics` | Sim |
