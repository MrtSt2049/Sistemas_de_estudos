import type { ContentTopic } from './types';

// Programa por disciplina. Fontes: notas de aula e listas em data/Disciplinas, sumários dos livros-texto
// (Boyce–DiPrima, Hillier–Lieberman, Lima) e protocolo mestre. Processos Estocásticos e Variável Complexa
// vêm de sites.generated.json (um tópico por módulo).

type Unit = [unit: string, titles: string[]];

function build(courseId: string, slug: string, units: Unit[]): ContentTopic[] {
  const out: ContentTopic[] = [];
  let order = 0;
  for (const [unit, titles] of units) {
    for (const title of titles) {
      order += 1;
      out.push({ id: `topic-${slug}-${String(order).padStart(2, '0')}`, courseId, unit, title, order });
    }
  }
  return out;
}

export const authoredTopics: ContentTopic[] = [
  ...build('course-5952014', 'pe2', [
    ['1 · Análise exploratória', ['Tabelas de frequência, barras, setores e histogramas', 'Boxplot, quantis e medidas-resumo', 'Análise exploratória em R (table, barplot, hist, boxplot)']],
    ['2 · Estimação pontual', ['Estimadores, viés e erro quadrático médio (EQM)', 'Consistência de estimadores', 'Função de distribuição empírica', 'Máxima verossimilhança e princípio da invariância', 'Distribuições amostrais (média e variância)']],
    ['3 · Intervalos e testes de hipótese', ['Intervalos de confiança para μ e p', 'Testes para μ e p (uma e duas populações)', 't de Student: μ com σ² desconhecida', 'χ²: teste e intervalo para a variância', 'Teste F: razão de variâncias']],
    ['4 · Modelos lineares', ['Análise de variância (ANOVA)', 'Regressão linear simples']],
    ['5 · Teoria de Neyman–Pearson', ['Lema de Neyman–Pearson e teste mais poderoso', 'Quocientes de verossimilhança']],
    ['6 · Dados categóricos', ['Teste χ² de aderência e de independência']],
    ['7 · Convergência e distribuições amostrais', ['Convergência de variáveis aleatórias', 'Lei fraca e lei forte dos grandes números', 'Teorema central do limite', 'Distribuições gama, χ², t e F', 'Convolução de variáveis aleatórias']],
  ]),

  ...build('course-5952020', 'em', [
    ['Tópico 1 · Métrica', ['Definição de métrica e espaço métrico', 'Exemplos: discreta, euclidiana, da soma, do máximo', 'Espaços de funções: métrica uniforme em B(X) e C([a,b])']],
    ['Tópico 2 · Subespaço, produto e métricas equivalentes', ['Subespaço e métrica induzida', 'Espaço produto', 'Métricas equivalentes e isometrias']],
    ['Tópico 3 · Limite e convergência de sequências', ['Bolas abertas e fechadas', 'Limite de sequência e unicidade', 'Subsequências e sequências limitadas', 'Convergência no produto e no espaço de funções']],
    ['Tópico 4 · Funções contínuas', ['Continuidade em um ponto (ε–δ e sequências)', 'Continuidade uniforme e funções lipschitzianas', 'Homeomorfismos e isometrias']],
    ['Tópico 5 · Linguagem básica da topologia', ['Interior, fronteira e conjuntos abertos', 'Abertos e continuidade (imagem inversa)', 'Conjuntos fechados, ponto aderente e fecho', 'Pontos de acumulação e conjuntos densos']],
    ['Tópico 6 · Conexidade', ['Cisões e conjuntos conexos', 'Imagem contínua e fecho de conexos', 'Conexos em R e teorema do valor intermediário', 'Componentes conexas']],
    ['Tópico 7 · Completude', ['Sequências de Cauchy', 'Espaços métricos completos', 'Completude de R^n e de C([a,b])', 'Teorema do ponto fixo de Banach (contrações)']],
  ]),

  ...build('course-5952021', 'edo', [
    ['Cap. 1 · Introdução', ['Modelos, campos de direções e classificação de EDOs', 'Soluções e problemas de valor inicial']],
    ['Cap. 2 · Equações de primeira ordem', ['Equações lineares e fator integrante', 'Equações separáveis', 'Equações exatas e fatores integrantes', 'Modelagem: crescimento, decaimento, misturas', 'Existência e unicidade (Picard)', 'Equações autônomas e estabilidade', 'Métodos numéricos: Euler']],
    ['Cap. 3 · Segunda ordem linear', ['Equações homogêneas com coeficientes constantes', 'Wronskiano e soluções fundamentais', 'Raízes complexas e raízes repetidas; redução de ordem', 'Coeficientes indeterminados', 'Variação de parâmetros', 'Vibrações mecânicas e circuitos RLC']],
    ['Cap. 4 · Ordem superior', ['Equações lineares de ordem n', 'Operadores diferenciais e coeficientes indeterminados']],
    ['Cap. 5 · Séries de potências', ['Soluções em série perto de um ponto ordinário', 'Pontos singulares regulares e método de Frobenius']],
    ['Cap. 6 · Transformada de Laplace', ['Definição e propriedades; problemas de valor inicial', 'Funções degrau e impulso; convolução']],
    ['Cap. 7 · Sistemas lineares', ['Sistemas e matrizes: autovalores e autovetores', 'Sistemas homogêneos com coeficientes constantes', 'Autovalores complexos e repetidos; matriz exponencial', 'Retrato de fases e estabilidade']],
  ]),

  ...build('course-rad1508', 'po', [
    ['1 · Modelagem', ['Introdução à PO e formulação de modelos de programação linear', 'Hipóteses da PL e solução gráfica']],
    ['2 · Método simplex', ['Forma tabular e iteração do simplex', 'Empates, degeneração e solução ótima múltipla', 'Método das duas fases e Big-M', 'Variáveis livres e restrições de igualdade']],
    ['3 · Dualidade e sensibilidade', ['Problema dual e relações primal-dual', 'Folgas complementares', 'Interpretação econômica (preços-sombra)', 'Análise de sensibilidade e simplex dual']],
    ['4 · Problemas de rede', ['Problema de transporte', 'Problema de designação', 'Caminho mínimo, árvore geradora mínima e fluxo máximo']],
    ['5 · Programação inteira', ['Modelagem com variáveis binárias', 'Branch-and-bound', 'Planos de corte e relaxação linear']],
  ]),

  ...build('course-rcc1911', 'cont', [
    ['1 · Estrutura conceitual', ['CPC 00 (R2): ativo, passivo e patrimônio líquido', 'Princípios e regime de competência', 'Plano de contas e partidas dobradas']],
    ['2 · Demonstrações financeiras', ['Balanço patrimonial', 'Demonstração do resultado (DRE)', 'Demonstração dos fluxos de caixa', 'Demonstração das mutações do PL']],
    ['3 · Análise das demonstrações', ['Análise vertical e horizontal', 'Indicadores de liquidez', 'Indicadores de endividamento e estrutura de capital', 'Indicadores de rentabilidade (ROA, ROE, margens)']],
    ['4 · Capital de giro', ['CCL, NCG e saldo de tesouraria (modelo Fleuriet)', 'Ciclos operacional e financeiro']],
    ['5 · Tópicos societários', ['Estoques e custo das mercadorias vendidas', 'Imobilizado e depreciação', 'Provisões e passivos contingentes']],
  ]),

  ...build('course-5952002', 'calc2', [
    ['1 · Sequências e séries', ['Sequências numéricas e limites', 'Séries numéricas: critérios de convergência', 'Séries de potências e raio de convergência', 'Séries de Taylor e Maclaurin']],
    ['2 · Funções de várias variáveis', ['Curvas de nível, limites e continuidade', 'Derivadas parciais e diferenciabilidade', 'Regra da cadeia e derivadas direcionais', 'Plano tangente e aproximação linear', 'Máximos e mínimos; multiplicadores de Lagrange']],
    ['3 · Integrais múltiplas', ['Integrais duplas e Fubini', 'Mudança de variáveis: polares e Jacobiano', 'Integrais triplas: cilíndricas e esféricas', 'Aplicações: massa, centro de massa, volume']],
    ['4 · Cálculo vetorial', ['Campos vetoriais e integrais de linha', 'Teorema de Green', 'Integrais de superfície; Stokes e divergência']],
  ]),

  ...build('course-5952006', 'num', [
    ['1 · Erros e aritmética de máquina', ['Representação em ponto flutuante', 'Erro absoluto e relativo; propagação de erros']],
    ['2 · Zeros de funções', ['Bissecção e falsa posição', 'Newton–Raphson e secante', 'Iteração de ponto fixo: convergência']],
    ['3 · Sistemas lineares', ['Eliminação de Gauss e pivoteamento', 'Fatoração LU e Cholesky', 'Métodos iterativos: Jacobi e Gauss–Seidel', 'Condicionamento e normas matriciais']],
    ['4 · Interpolação e ajuste', ['Interpolação polinomial: Lagrange e Newton', 'Splines', 'Mínimos quadrados']],
    ['5 · Integração e EDOs', ['Regras dos trapézios e de Simpson', 'Quadratura gaussiana', 'EDOs: Euler, Heun e Runge–Kutta']],
  ]),

  ...build('course-5952011', 'ic2', [
    ['1 · Análise de algoritmos', ['Notação assintótica O, Ω, Θ', 'Análise de recorrências']],
    ['2 · Estruturas de dados', ['Listas, pilhas e filas', 'Árvores binárias e de busca', 'Heap e fila de prioridade', 'Tabelas hash']],
    ['3 · Ordenação e busca', ['Ordenação quadrática e merge/quick sort', 'Busca binária', 'Limite inferior de ordenação por comparação']],
    ['4 · Grafos e paradigmas', ['Representação de grafos; BFS e DFS', 'Programação dinâmica', 'Algoritmos gulosos']],
  ]),

  ...build('course-5952036', 'al', [
    ['1 · Sistemas e matrizes', ['Sistemas lineares e escalonamento', 'Operações com matrizes e inversas', 'Determinantes']],
    ['2 · Espaços vetoriais', ['Subespaços, combinações lineares e independência linear', 'Base e dimensão', 'Soma direta e quociente']],
    ['3 · Transformações lineares', ['Núcleo, imagem e teorema do núcleo e da imagem', 'Matriz de uma transformação e mudança de base']],
    ['4 · Autovalores', ['Autovalores, autovetores e polinômio característico', 'Diagonalização', 'Teorema de Cayley–Hamilton']],
    ['5 · Espaços com produto interno', ['Produto interno, ortogonalidade e Gram–Schmidt', 'Projeção ortogonal e mínimos quadrados', 'Teorema espectral e formas quadráticas']],
  ]),

  ...build('course-rec2101', 'micro', [
    ['1 · Teoria do consumidor', ['Preferências, utilidade e curvas de indiferença', 'Restrição orçamentária e escolha ótima', 'Demanda marshalliana e hicksiana', 'Equação de Slutsky: efeitos renda e substituição', 'Excedente do consumidor']],
    ['2 · Teoria da firma', ['Tecnologia e função de produção', 'Minimização de custos', 'Maximização de lucro e oferta']],
    ['3 · Mercados', ['Concorrência perfeita', 'Monopólio e discriminação de preços']],
    ['4 · Escolha sob incerteza', ['Utilidade esperada e aversão ao risco']],
    ['5 · Ferramentas matemáticas', ['Otimização condicionada: Lagrange e Kuhn–Tucker', 'Convexidade e quase-concavidade']],
  ]),
];
