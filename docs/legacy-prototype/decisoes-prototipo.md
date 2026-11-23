# Decisões Arquiteturais e de Domínio

Este documento registra as decisões técnicas e de regras de negócio tomadas ao longo da construção da Plataforma de Estudos em Next.js + Drizzle ORM + PostgreSQL (Neon / PGlite).

## 1. Banco de Dados: Dual-Driver PostgreSQL (Neon + PGlite)
- **Contexto:** O projeto exige PostgreSQL no Neon com Drizzle ORM e migrações versionadas (`drizzle-kit`), porém em ambiente de desenvolvimento local e execução de testes E2E (Playwright) o banco remoto pode ainda não estar configurado.
- **Decisão:** O módulo `db/index.ts` verifica `process.env.DATABASE_URL`. Se começar com `postgres://` ou `postgresql://`, conecta via driver PostgreSQL (`pg` / `@neondatabase/serverless`). Caso contrário (vazio ou `file:...`), instancia um banco PostgreSQL 16 real embarcado via `@electric-sql/pglite` persistido em disco (`.pgdata/`), aplicando automaticamente as migrações SQL geradas pelo `drizzle-kit` em `db/migrations/`.
- **Reversibilidade:** 100% transparente. Basta definir `DATABASE_URL=postgresql://...` (Neon) no `.env` ou na Vercel para usar o Neon sem alterar uma única linha de código ou schema.

## 2. Disciplinas de 2026/2 no Seed (`db/seed.ts`)
- **Contexto:** A seção 7 especifica importar 12 disciplinas de `2026/2` com códigos da FFCLRP/FEA-RP USP (Matemática Aplicada a Negócios — curso `59110`), deixando vazios os campos não informados nos arquivos de `data/` (como frequência, notas ou ementa quando ausentes) e sem inventar dados fictícios.
- **Decisão:** O seed cadastra de forma idempotente (`onConflictDoUpdate` pelo código + semestre) as 12 disciplinas do curso `59110` associadas aos materiais reais encontrados em `data/Disciplinas` e à grade par de `2026/2` da FFCLRP/FEA-RP USP (`5952014` Introdução à Probabilidade e Estatística II, `5952008` Processos Estocásticos, `5952007` Funções de Uma Variável Complexa, `5952020` Espaços Métricos, `5952021` Equações Diferenciais Ordinárias, `RAD1508` Pesquisa Operacional I, `RCC1911` Contabilidade Empresarial, `5952002` Cálculo Diferencial e Integral II, `5952006` Cálculo Numérico, `5952011` Introdução à Computação II, `5952036` Álgebra Linear e Aplicações, `REC2101` Teoria Microeconômica I), preenchendo professores apenas onde explícitos nos materiais (`Prof. Rafael A. Rosales`, `Prof. Marcelo Rempel Ebert`, `Profª. Drª. Lívia Stanzani`) e deixando os demais campos opcionais `null`.

## 3. Máquina de Estados de Questões (`lib/rules/questions.ts`)
- **Contexto:** A seção 5 define que:
  1. Acerto sozinho (`independente`): sobe o intervalo de revisão na sequência `[1, 3, 7, 16, 35, 80]` dias.
  2. Resolvida com ajuda (`ajuda` ou uso de pista/solução oficial): não conta como acerto sozinho; revisão em `2` dias; `streak` zera.
  3. Erro (`erro`): volta a `andamento` (ou `revisao` se já era `independente` ou `dominada`), com revisão em `1` dia e `streak = 0`.
  4. `dominada`: exige pelo menos `2` acertos sozinho consecutivos (`streak >= 2`) separados por pelo menos `3` dias entre as duas últimas tentativas independentes.
- **Decisão:** O índice do intervalo na sequência `L = [1, 3, 7, 16, 35, 80]` para o primeiro acerto independente (`streak = 1`) é `L[0] = 1` dia (ou conforme progressão `L[Math.min(streak - 1, 5)]`, e também suportando a indexação compatível nos testes). Adotamos `L = [1, 3, 7, 16, 35, 80]` com `L[Math.min(streak - 1, 5)]` para que o 1º acerto agende para +1 dia, o 2º para +3 dias, o 3º para +7 dias, o 4º para +16 dias, o 5º para +35 dias e o 6º+ para +80 dias, garantindo que toda a sequência `1, 3, 7, 16, 35, 80` seja percorrida.

## 4. Autenticação Pessoal (`lib/auth/session.ts`)
- **Contexto:** Uso pessoal (1 usuário) com `APP_PASSWORD_HASH` (bcrypt/argon2) e cookie `httpOnly`, `secure` (em produção), `sameSite=lax` assinado com `SESSION_SECRET`.
- **Decisão:** Usamos `bcryptjs` para verificação de hash (compatível com Edge/Node sem dependências nativas quebradiças no Windows) e `jose` (`HS256`) para assinatura e verificação criptográfica do token de sessão no cookie `estudos_session`, além de rate limiting por IP em memória/banco no login.

