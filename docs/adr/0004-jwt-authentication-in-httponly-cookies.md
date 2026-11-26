# ADR-004: Autenticação própria com SimpleJWT em cookies HttpOnly

- **Status:** Aceita (D-03 confirmada em 2026-11-26)
- **Data:** 2026-11-26

## Contexto
A aplicação precisa de autenticação segura para cliente desacoplado sem depender de provedor externo e sem expor tokens ao JavaScript.

## Decisão
Implementar autenticação própria com `djangorestframework-simplejwt` (rotação e blacklist de refresh) transportada em cookies `HttpOnly; Secure; SameSite=Lax`, com validação de CSRF (*double submit*) em métodos não seguros e hash Argon2id.

## Alternativas descartadas
- JWT em `localStorage` (exposto a XSS).
- Supabase Auth (violaria ADR-002).

## Consequências
Em produção, frontend e backend devem compartilhar o mesmo domínio registrável (ou usar proxy reverso sob a mesma origem).
