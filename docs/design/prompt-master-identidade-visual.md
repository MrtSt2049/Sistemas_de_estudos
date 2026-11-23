# PROMPT MASTER: IDENTIDADE VISUAL DA PLATAFORMA DE ESTUDOS

Atue como Product Designer sênior e Design Systems Lead. Sua missão é criar a identidade visual e o design system completo de uma plataforma pessoal de estudos, em modo claro e escuro, pronto para ser implementado em React/Next.js com TypeScript.

## 1. Contexto do produto

Plataforma de uso diário e sessões longas, de um único usuário (estudante de Matemática Aplicada a Negócios que treina para olimpíadas e maratona de programação). Ela organiza o plano estratégico 2026-2027: problemas e tentativas, revisão espaçada, caderno de erros, metas, planejador semanal, controle de notas por disciplina, biblioteca de materiais e estatísticas.

Não há IA, colaboração entre usuários nem app mobile nesta fase. A interface é responsiva (desktop primeiro, funcional em celular).

## 2. Sensação e personalidade

Energia e competição, com sobriedade profissional. A referência é a calma de uma ferramenta de trabalho (denso o suficiente para ser útil, respirado o suficiente para cansar pouco) com um acento vivo que lembra desempenho e progresso.

- Adjetivos: focado, preciso, enérgico, confiável.
- Anti-adjetivos: infantil, gamificado em excesso, corporativo genérico, poluído.
- Densidade: confortável. Mais espaço entre blocos do que o padrão de dashboards, poucos elementos por tela.

## 3. Direção já decidida (nome: "Voltage")

Parta destes valores e refine só com justificativa.

**Cor (um único acento).**

| Token | Escuro | Claro |
|---|---|---|
| bg | #0E0F13 | #F6F7F9 |
| surface | #15171C | #FFFFFF |
| surface-2 | #1B1E25 | #F1F3F7 |
| line | #262A33 | #E3E6EC |
| text | #ECEEF3 | #14161B |
| muted | #9AA1AF | #596072 |
| accent (texto, ícones) | #8B8CFF | #4338CA |
| accent-solid (botões, barras) | #5B5BF0 | #4338CA |
| accent-soft (fundos de seleção) | #1F2040 | #EEF0FF |
| ok | #4ADE80 | #15803D |
| warn | #F5B544 | #B45309 |

Regras: o acento é índigo-violeta e é o único tom de destaque. Verde significa estado "ok" e âmbar significa atenção ou pendência. Não usar vermelho como cor de decoração. Todos os pares texto e fundo devem passar WCAG AA (4,5:1; 3:1 acima de 24 px). Cores que precisam ser distinguidas devem diferir também em luminosidade, não só em matiz.

**Tipografia.** Inter para a interface e JetBrains Mono para números, horários, pontuação, IDs e código. Títulos de página 28 px/700 com espaçamento de letras levemente negativo; corpo 14 px/400; rótulos 12 px em maiúsculas com espaçamento positivo.

**Forma e espaço.** Base de 4 px. Raio 10 px em controles, 14 a 16 px em cartões. Bordas de 1 px em vez de sombras pesadas. Espaçamento entre seções de 28 a 32 px; padding interno de cartões de 28 px. Alvos de toque de pelo menos 44 px.

**Iconografia.** Ícones de traço, 1,8 px, cantos arredondados, 18 px. Sem emojis em nenhum lugar.

**Proibido.** Gradientes decorativos, cartões com borda colorida só em um lado, glassmorphism, ilustrações genéricas, excesso de cores, números inventados para parecerem reais.

## 4. O que você deve entregar

Um design system navegável, em forma de documento de referência com visualização ao vivo, contendo:

1. **Princípios** (5 a 7 linhas) e regras de uso do acento.
2. **Tokens** em claro e escuro: cor, tipografia, espaçamento, raio, borda, movimento (duração e curva), z-index. Exporte também como JSON e como variáveis CSS, e inclua o mapeamento para a configuração do Tailwind. Os tokens devem ser nomeados por função (surface, line, accent), não por valor.
3. **Componentes**, cada um com variantes, estados (padrão, hover, foco, ativo, desabilitado, erro, carregando) e orientação de uso:
   botão (primário, secundário, texto), campo de texto, área de texto, seleção, caixa de seleção, controle segmentado, chip e etiqueta de estado, barra de progresso, cartão, cartão de métrica, tabela com ordenação e filtros, lista de itens, modal, painel lateral, abas, navegação lateral, barra superior com busca, estado vazio, estado de carregamento (esqueleto), mensagem de sucesso e de erro, gráfico de barras e de linhas, campo de fórmula em fonte monoespaçada, área de arrastar arquivos.
4. **Telas de calibração.** Aplique o sistema a estas telas, em claro e escuro, em 1440 px e em 390 px:
   - Início: saudação, progresso do dia, quatro indicadores, rotina de hoje e fila de revisão.
   - Problemas: tabela com filtros por fonte, assunto, dificuldade e estado ("Bem estudado" distinto de "Resolvido").
   - Registrar tentativa: formulário longo com resultado, tempo, nível de dica, erro dominante, notas com fórmulas e as próximas revisões.
   - Revisão: sessão de recuperação ativa com avaliação Errei, Difícil, Bom, Fácil.
   - Notas: disciplinas, avaliações com pesos, bônus, fórmula personalizável e projeção.
   - Planejador: grade semanal com blocos por área.
5. **Conteúdo e tom de voz.** Português do Brasil, direto, sem exclamações, sem jargão de produtividade. Exemplos de textos para estados vazios, erros e confirmações.
6. **Acessibilidade.** Contraste verificado, foco visível, navegação por teclado, rótulos reais em todos os campos, `aria-label` em ícones sem texto, respeito a `prefers-reduced-motion` e `prefers-color-scheme`.

## 5. Restrições técnicas

- Compatível com Tailwind e com CSS puro (os tokens são variáveis CSS).
- Fórmulas matemáticas com KaTeX e código em C++ precisam ter bom contraste e boa legibilidade nos dois temas.
- Sem dependência de biblioteca de componentes de terceiros para o visual; se sugerir uma base acessível (por exemplo, primitivos sem estilo), diga por quê.
- Cada decisão que você tomar sozinha deve vir marcada como "escolha minha", com o motivo.

## 6. Critérios de aceite

- Alguém que nunca viu o projeto consegue montar uma tela nova só lendo o design system.
- Claro e escuro têm a mesma qualidade, não um é derivado do outro.
- As telas de calibração não precisam de nenhum estilo fora do que está documentado.
- Nenhum texto fica abaixo de 4,5:1 de contraste.
- O resultado parece uma ferramenta profissional de trabalho, não um painel de demonstração.

## 7. Decisões que ficam em aberto (não resolver sozinha)

- Biblioteca de gráficos a usar na implementação.
- Onde os arquivos da Biblioteca ficam guardados.
- Regras oficiais de aprovação da faculdade (a nota mínima é configurável).

Comece apresentando os princípios e os tokens para aprovação antes de desenhar os componentes.
