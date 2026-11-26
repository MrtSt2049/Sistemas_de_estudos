# ADR-003: Conexão via Session Pooler do Supabase (porta 5432)

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
A conexão direta do Supabase usa IPv6 no plano gratuito, o que pode falhar em redes locais e provedores IPv4.

## Decisão
Usar o Session Pooler (porta 5432) para runtime e migrações. O modo transação (porta 6543) fica reservado como evolução futura com `DISABLE_SERVER_SIDE_CURSORS=True` e `CONN_MAX_AGE=0`.

## Alternativas descartadas
- Modo transação desde o início (exige cuidados extras com cursores do lado do servidor e estado de sessão).

## Consequências
Compatibilidade plena com IPv4 e com o comportamento padrão do Django ORM e das migrações.
