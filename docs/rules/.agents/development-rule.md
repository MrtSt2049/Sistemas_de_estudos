---
trigger: always_on
# DEVELOPMENT RULES — STUDY PLATFORM

## 1. Contexto e objetivo do projeto

A Study Platform é uma aplicação web pessoal de gerenciamento e acompanhamento de estudos, desenvolvida inicialmente para um único usuário, mas com arquitetura preparada para suportar múltiplos usuários com isolamento rigoroso de dados.

A plataforma centraliza:
- Disciplinas, semestres e tópicos.
- Exercícios, questões, resoluções e tentativas.
- Revisão espaçada.
- Anotações com suporte a fórmulas matemáticas via KaTeX.
- Notas acadêmicas e avaliações.
- Calendário, planejamento e metas.
- Estatísticas e acompanhamento de desempenho.

**Não existe integração com inteligência artificial.** Não implementar funcionalidades de IA, agentes ou automações inteligentes.

## 2. Princípios fundamentais

Toda implementação deve seguir estes princípios:

1. **Simplicidade:** preferir soluções simples, legíveis e sustentáveis.
2. **Separação de responsabilidades:** cada camada deve ter uma função bem definida.
3. **Segurança por padrão:** proteger dados, autenticação e autorização desde o início.
4. **Consistência:** seguir os padrões existentes no projeto.
5. **Manutenibilidade:** escrever código que possa ser compreendido e evoluído.
6. **Testabilidade:** funcionalidades devem ser implementadas considerando seus testes.
7. **Documentação:** decisões relevantes devem ser registradas.
8. **Evolução incremental:** respeitar as fases e os requisitos definidos.

Não criar abstrações, camadas ou complexidades sem necessidade comprovada.

## 3. Arquitetura e tecnologias

### Backend
- Django 5.2 LTS.
- Django REST Framework.
- Python 3.13.
- PostgreSQL.
- API REST versionada em `/api/v1`.

### Frontend
- Next.js com App Router.
- TypeScript em modo `strict`.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query.
- React Hook Form e Zod.
- Recharts.
- KaTeX.
- Tiptap.

### Infraestrutura
- Docker e Docker Compose.
- Supabase exclusivamente como provedor de PostgreSQL.

O frontend e o backend devem permanecer separados, comunicando-se exclusivamente por meio da API REST.

Não introduzir novas tecnologias sem justificativa técnica e aprovação.

## 4. Regras de arquitetura do backend

Organizar o backend por módulos Django, mantendo responsabilidades bem definidas.

- `models.py`: entidades, campos e restrições de persistência.
- `serializers.py`: validação e transformação dos dados da API.
- `selectors.py`: consultas e operações de leitura.
- `services.py`: regras de negócio e operações de escrita.
- `views.py`: camada HTTP, fina e sem regras de negócio.
- `tests/`: testes organizados por responsabilidade.

### Regras obrigatórias

1. Toda regra de negócio deve permanecer no backend.
2. Views devem apenas coordenar requisições e respostas.
3. Consultas complexas devem ficar em selectors.
4. Operações de escrita e alterações de estado devem passar por services.
5. Utilizar transações atômicas quando uma operação envolver múltiplas alterações relacionadas.
6. Evitar duplicação de lógica.
7. Não criar dependências circulares entre aplicativos.
8. Respeitar a direção de dependências definida no plano arquitetural.
9. Não acessar o banco diretamente pelo frontend.

## 5. Segurança e isolamento de dados

O isolamento entre usuários é um requisito crítico.

- Toda entidade pertencente a um usuário deve possuir `owner`.
- Toda consulta de dados privados deve filtrar obrigatoriamente pelo usuário autenticado.
- Nunca confiar em `owner` enviado pelo frontend.
- O backend deve determinar o proprietário utilizando a identidade autenticada.
- Impedir acesso, edição e exclusão de recursos pertencentes a outros usuários.
- Implementar testes de isolamento para operações de leitura e escrita.
- Não expor informações privadas em logs ou mensagens de erro.

**Regra absoluta:** qualquer queryset de dados privados sem filtro de `owner` deve ser considerado um bug de segurança.

### Autenticação

A autenticação será própria, utilizando JWT armazenado em cookies `HttpOnly`.

Não utilizar:
- Supabase Auth.
- `supabase-js`.
- Supabase Data API.
- Armazenamento de tokens de autenticação em `localStorage`.

Implementar proteção adequada contra CSRF, XSS e ataques relacionados à autenticação, respeitando as características da arquitetura escolhida.

## 6. Regras de desenvolvimento do frontend

O frontend deve ser organizado por funcionalidades e componentes reutilizáveis.

- Utilizar TypeScript com `strict: true`.
- Evitar `any`.
- Separar componentes, hooks, serviços e schemas.
- Utilizar TanStack Query para gerenciamento de dados remotos.
- Utilizar React Hook Form e Zod para formulários e validações.
- Centralizar a comunicação HTTP com o backend.
- Utilizar componentes shadcn/ui como base da interface.
- Evitar componentes excessivamente grandes.
- Não duplicar lógica de negócio no frontend.

### Estado e dados

- O backend é a fonte oficial dos dados.
- O frontend não deve reproduzir regras de negócio.
- Dados remotos devem ser gerenciados de maneira consistente.
- Implementar estados de carregamento, erro, sucesso e ausência de dados.
- Atualizações devem respeitar a consistência dos dados retornados pela API.

### Interface

- Idioma da interface: português brasileiro (pt-BR).
- Código, identificadores e nomenclaturas técnicas: inglês.
- Interface responsiva.
- Suporte completo aos temas claro e escuro.
- Acessibilidade conforme WCAG 2.2 AA.
- Fórmulas matemáticas devem utilizar KaTeX.
- Evitar elementos visuais desnecessários e inconsistências de design.

Os dois temas devem apresentar a mesma qualidade visual, legibilidade e acessibilidade.

## 7. Banco de dados e persistência

- Utilizar PostgreSQL.
- Todas as chaves primárias devem utilizar UUID.
- Relacionamentos devem ser definidos explicitamente.
- Criar restrições de integridade no banco sempre que aplicável.
- Evitar consultas N+1.
- Utilizar índices quando justificados pelo padrão de consulta.
- Armazenar datas e horários em UTC.
- Manter consistência entre models, migrations e contratos da API.

### Migrações

As migrações devem ser exclusivamente gerenciadas pelo Django.

- Toda alteração de schema deve possuir migration.
- Não alterar o banco manualmente para contornar migrations.
- Não executar migrations automaticamente na inicialização dos containers.
- Nunca remover ou modificar migrations aplicadas sem avaliar seus impactos.

## 8. API e contratos

A API deve seguir padrões REST e permanecer versionada em `/api/v1`.

- Utilizar métodos HTTP adequados.
- Retornar códigos de status coerentes.
- Padronizar respostas e erros.
- Validar dados recebidos no backend.
- Implementar paginação quando necessária.
- Documentar endpoints por meio do OpenAPI.
- Manter compatibilidade entre frontend e backend.

Os tipos TypeScript devem ser gerados a partir do contrato OpenAPI.

Não duplicar manualmente definições de tipos que já possam ser geradas.

## 9. Testes e qualidade

Nenhuma funcionalidade relevante deve ser considerada concluída sem testes apropriados.

### Ferramentas

Backend:
- Ruff.
- mypy.
- pytest.

Frontend:
- ESLint.
- Prettier.
- Vitest.
- Playwright.

### Regras

1. Testar regras de negócio.
2. Testar validações e permissões.
3. Testar endpoints.
4. Testar isolamento entre usuários.
5. Testar componentes e interações relevantes.
6. Testar fluxos completos com Playwright.
7. Não utilizar o banco de produção em testes.
8. Não ignorar erros de lint, tipagem ou testes para concluir uma tarefa.

O CI deve bloquear merges quando as verificações obrigatórias falharem.

## 10. Git e versionamento

Seguir Conventional Commits.

Formato:

`<type>(<scope>): <description>`

Exemplos:
- `feat(studies): add subject management`
- `fix(auth): correct token validation`
- `refactor(exercises): simplify attempt service`
- `test(users): add ownership isolation tests`
- `docs(api): update endpoint documentation`

### Regras de Git

- Utilizar a conta e identidade Git do proprietário do projeto.
- Não alterar `user.name` ou `user.email` sem autorização.
- Nunca realizar commits utilizando identidade de terceiros ou de ferramentas.
- Não incluir segredos, arquivos temporários ou dependências desnecessárias.
- Não sobrescrever alterações existentes sem autorização.
- Não executar `git push --force` sem autorização explícita.
- Revisar o diff antes de realizar commits.
- Manter commits pequenos e com responsabilidades bem definidas.

## 11. Dependências e bibliotecas

Toda nova dependência deve possuir justificativa técnica.

Antes de adicionar uma biblioteca:
1. Verificar se a funcionalidade já existe na stack.
2. Avaliar se a implementação nativa é suficiente.
3. Avaliar manutenção, segurança e compatibilidade.
4. Considerar o impacto no tamanho e na complexidade do projeto.
5. Registrar a justificativa quando a dependência for aprovada.

Não instalar pacotes por conveniência sem necessidade real.

## 12. Infraestrutura e configuração

- Utilizar Docker e Docker Compose conforme o plano oficial.
- Não inventar portas, comandos ou variáveis de ambiente.
- Manter segredos fora do repositório.
- Disponibilizar exemplos de configuração sem credenciais reais.
- Não alterar a infraestrutura sem necessidade documentada.
- Não executar comandos destrutivos sem autorização.

## 13. Processo obrigatório de desenvolvimento

Toda alteração deve partir de um requisito identificado no formato `RFxxx`.

Antes de implementar:

1. Consultar o `DEVELOPMENT_PLAN.md`.
2. Identificar o requisito relacionado.
3. Verificar a fase atual do projeto.
4. Identificar dependências e impactos.
5. Consultar as decisões arquiteturais existentes.
6. Definir os testes necessários.
7. Implementar somente o escopo autorizado.

### Fases do projeto

- F0: preparação e estrutura inicial.
- F1: fundação técnica e arquitetura.
- F2: funcionalidades do MVP.
- F3: evolução funcional.
- F4: aprimoramentos e expansão.
- F5: estabilização e conclusão.

O MVP termina na F2.

Não antecipar funcionalidades de fases posteriores sem autorização.

## 14. Decisões arquiteturais (ADRs)

As decisões abertas identificadas como `D-01` até `D-14` não podem ser presumidas.

Antes de implementar qualquer funcionalidade dependente dessas decisões:

- Identificar a decisão envolvida.
- Verificar se existe ADR correspondente.
- Se não existir, solicitar definição e registrar a decisão.
- Não escolher silenciosamente uma alternativa técnica.

Decisões arquiteturais relevantes devem ser documentadas e justificadas.

## 15. Restrições absolutas

É proibido:

- Implementar funcionalidades de inteligência artificial.
- Introduzir Celery.
- Transformar o projeto em microsserviços.
- Colocar regras de negócio no frontend.
- Acessar Supabase diretamente pelo frontend.
- Utilizar Supabase Auth.
- Criar dependências sem justificativa.
- Ignorar isolamento por `owner`.
- Executar migrations automaticamente na inicialização.
- Inserir segredos no repositório.
- Inventar comandos, portas ou variáveis de ambiente.
- Ignorar requisitos ou decisões arquiteturais.
- Implementar funcionalidades fora do escopo sem autorização.

## 16. Critérios de conclusão de uma tarefa

Uma tarefa somente pode ser considerada concluída quando:

- [ ] O requisito `RFxxx` foi atendido.
- [ ] A implementação respeita a arquitetura.
- [ ] As regras de segurança foram respeitadas.
- [ ] Os testes necessários foram implementados e executados.
- [ ] Ruff, mypy, ESLint e Prettier foram respeitados conforme aplicável.
- [ ] Não existem erros de tipagem.
- [ ] A interface funciona nos temas claro e escuro, quando aplicável.
- [ ] A acessibilidade foi considerada.
- [ ] A documentação foi atualizada quando necessário.
- [ ] Não existem alterações não relacionadas à tarefa.

**Princípio final:** não implementar apenas para fazer funcionar. Implementar para que funcione corretamente, com segurança, consistência, simplicidade e facilidade de manutenção.
