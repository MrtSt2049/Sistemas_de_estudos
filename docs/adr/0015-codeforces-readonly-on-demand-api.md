# ADR-015: Integração somente leitura e sob demanda com a API do Codeforces

- **Status:** Aceita (aprovada pelo proprietário do projeto em 2026-11-27)
- **Data:** 2026-11-27

## Contexto
A seção 3.1.7 do `DEVELOPMENT_PLAN.md` excluía qualquer integração automática com plataformas externas. No treino para a Maratona SBC, digitar cada submissão à mão é o principal atrito, e o Codeforces publica submissões e histórico de rating em uma API que não exige autenticação.

## Decisão
Autorizar uma única integração externa, com os seguintes limites:

1. **Somente leitura**, restrita aos métodos públicos `user.status` e `user.rating`. Nenhuma escrita na plataforma externa.
2. **Somente sob demanda:** a sincronização acontece quando a pessoa aciona o botão. Não há agendamento, tarefa em segundo plano, Celery ou fila (ADR-009 permanece válida).
3. **Sem credenciais:** apenas o *handle* público é informado e guardado. Nenhuma chave de API, senha, cookie ou token é solicitado ou armazenado.
4. **Isolada no backend** (`apps/cp/client.py`), com host fixo, HTTPS, tempo limite, limite de tamanho de resposta e intervalo mínimo entre chamadas (a API aceita cerca de uma requisição a cada 2 segundos). O frontend não chama o Codeforces.
5. **Falha segura:** as duas consultas são concluídas antes de qualquer escrita; se uma falhar, os dados já importados não mudam.
6. **Testes sem rede:** o cliente é injetável e os testes usam respostas simuladas.

## Alternativas descartadas
- **Digitação manual ou CSV:** mantém o atrito que motivou a decisão.
- **Sincronização periódica em segundo plano:** exigiria infraestrutura de filas (contraria a ADR-009).
- **Leitura de páginas HTML (*scraping*):** frágil e desnecessária, já que existe API pública.
- **Chamada direta pelo navegador:** colocaria regra de importação no frontend.

## Consequências
- A plataforma passa a depender, de forma opcional, da disponibilidade da API do Codeforces. Todas as outras funções continuam sem rede externa.
- A requisição de sincronização é síncrona e pode demorar alguns segundos para históricos grandes; o endpoint tem limite de frequência próprio.
- AtCoder e outras plataformas **continuam fora do escopo**; cada nova integração exige nova ADR.
