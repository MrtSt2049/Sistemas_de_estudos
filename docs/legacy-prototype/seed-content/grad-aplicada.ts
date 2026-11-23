import { bank, r } from './factory';

// Pesquisa Operacional, Introdução à Computação II, Contabilidade Empresarial, Teoria Microeconômica I.
// Respostas numéricas conferidas com scipy/sympy ou por conta direta.

const po = bank('grad', 'course-rad1508', 'po');
const ic = bank('grad', 'course-5952011', 'ic2');
const cont = bank('grad', 'course-rcc1911', 'cont');
const micro = bank('grad', 'course-rec2101', 'micro');

const AUT = 'Exercício autoral/clássico';

export const aplicadaQuestions = [
  // ---------------- Pesquisa Operacional ----------------
  po({
    n: 1,
    title: 'PL gráfica (tipo Wyndor): max 3x + 5y',
    statement: r`Resolva graficamente:

$$\max\ Z=3x+5y\quad\text{s.a.}\quad x\le4,\ \ 2y\le12,\ \ 3x+2y\le18,\ \ x,y\ge0.$$

Indique os vértices da região viável e a solução ótima.`,
    source: `${AUT} — modelo clássico de Hillier & Lieberman (cap. 3)`,
    difficulty: 1,
    tags: 'programação linear, método gráfico',
    hint1: r`Vértices: interseções das retas de restrição que satisfazem todas as desigualdades.`,
    officialSolution: r`Vértices viáveis: $(0,0)$, $(4,0)$, $(4,3)$, $(2,6)$, $(0,6)$.

- $(0,0)$: $Z=0$
- $(4,0)$: $Z=12$
- $(4,3)$: $Z=27$
- $(2,6)$: $Z=\mathbf{36}$
- $(0,6)$: $Z=30$

Ótimo: $(x,y)=(2,6)$, $Z^*=36$ (restrições ativas: $2y\le12$ e $3x+2y\le18$; a folga de $x\le4$ vale $2$).`,
  }),
  po({
    n: 2,
    title: 'Dual do problema anterior e folgas complementares',
    statement: r`Escreva o dual do problema $\max 3x+5y$ s.a. $x\le4$, $2y\le12$, $3x+2y\le18$, $x,y\ge0$. Obtenha a solução dual ótima usando folgas complementares a partir de $(x^*,y^*)=(2,6)$ e interprete.`,
    source: `${AUT} — dualidade`,
    difficulty: 3,
    tags: 'dualidade, folgas complementares, preços-sombra',
    hint1: r`Dual: $\min 4w_1+12w_2+18w_3$ s.a. $w_1+3w_3\ge3$, $2w_2+2w_3\ge5$, $w\ge0$.`,
    hint2: r`Em $(2,6)$ a restrição $x\le4$ tem folga ($2>0$), então $w_1=0$. Como $x^*,y^*>0$, as duas restrições duais valem com igualdade.`,
    officialSolution: r`Folgas complementares: $x\le4$ tem folga $2$ ⇒ $w_1=0$. $x^*>0$ e $y^*>0$ ⇒ restrições duais ativas:

$$3w_3=3\Rightarrow w_3=1,\qquad 2w_2+2w_3=5\Rightarrow w_2=\tfrac32.$$

Dual ótimo: $w^*=(0,\tfrac32,1)$ com valor $4\cdot0+12\cdot\tfrac32+18\cdot1=36=Z^*$ ✓ (dualidade forte).

**Interpretação:** $w_2=1{,}5$ e $w_3=1$ são preços-sombra: uma unidade extra do recurso 2 (lado direito $12$) aumenta $Z$ em $1{,}5$; do recurso 3 (lado direito $18$), em $1$. O recurso 1 não é escasso ($w_1=0$).`,
  }),
  po({
    n: 3,
    title: 'Dualidade fraca',
    statement: r`Considere o par primal-dual simétrico: (P) $\max c^Tx$ s.a. $Ax\le b$, $x\ge0$; (D) $\min b^Ty$ s.a. $A^Ty\ge c$, $y\ge0$. Prove que se $x$ é viável em (P) e $y$ é viável em (D), então $c^Tx\le b^Ty$.`,
    source: `${AUT} — dualidade fraca`,
    difficulty: 2,
    tags: 'dualidade fraca, demonstração',
    hint1: r`Use $x\ge0$ com $A^Ty\ge c$, depois $y\ge0$ com $Ax\le b$.`,
    officialSolution: r`Como $x\ge0$ e $A^Ty\ge c$: $c^Tx\le(A^Ty)^Tx=y^TAx$. Como $y\ge0$ e $Ax\le b$: $y^TAx\le y^Tb$. Logo $c^Tx\le b^Ty$.

*Consequências:* se $c^Tx=b^Ty$ para viáveis $x,y$, ambos são ótimos; se (P) é ilimitado, (D) é inviável (e vice-versa).`,
  }),
  po({
    n: 4,
    title: 'Transporte 2×3: custo mínimo',
    statement: r`Duas fábricas (ofertas $20$ e $30$) abastecem três centros (demandas $10$, $25$, $15$). Custos unitários:

- F1: C1 = 8, C2 = 6, C3 = 10
- F2: C1 = 9, C2 = 12, C3 = 13

Determine o plano de transporte de custo mínimo.`,
    source: `${AUT} — problema de transporte`,
    difficulty: 3,
    tags: 'transporte, otimalidade, custo mínimo',
    hint1: r`Oferta total $=$ demanda total $=50$ (problema balanceado). F1 tem a vantagem relativa em C2.`,
    hint2: r`Teste a otimalidade por variáveis duais $u_i+v_j=c_{ij}$ nas células básicas e verifique $c_{ij}-u_i-v_j\ge0$ nas não básicas.`,
    officialSolution: r`Plano ótimo: $x_{12}=20$, $x_{21}=10$, $x_{22}=5$, $x_{23}=15$ (demais $0$).

Custo: $6\cdot20+9\cdot10+12\cdot5+13\cdot15=120+90+60+195=\mathbf{465}$.

**Verificação de otimalidade.** Células básicas: (1,2), (2,1), (2,2), (2,3). Com $u_1=0$: $v_2=6$; $u_2=12-6=6$; $v_1=9-6=3$; $v_3=13-6=7$. Custos reduzidos nas não básicas: (1,1): $8-0-3=5\ge0$; (1,3): $10-0-7=3\ge0$. Todos $\ge0$ ⇒ ótimo.`,
  }),
  po({
    n: 5,
    title: 'Mochila 0-1 por branch-and-bound',
    statement: r`Resolva o problema inteiro binário

$$\max\ 8a+11b+6c+4d\quad\text{s.a.}\quad 5a+7b+4c+3d\le14,\quad a,b,c,d\in\{0,1\}$$

por branch-and-bound com a relaxação linear.`,
    source: `${AUT} — programação inteira`,
    difficulty: 3,
    tags: 'programação inteira, branch-and-bound, mochila',
    hint1: r`Ordene por razão valor/peso: $a=1{,}6$, $b\approx1{,}57$, $c=1{,}5$, $d\approx1{,}33$. A relaxação enche nessa ordem.`,
    officialSolution: r`Como os coeficientes são inteiros, qualquer nó cuja cota LP seja $<22$ tem, no máximo, valor inteiro $21$.

**Nó 0 (raiz).** Por razão valor/peso: $a=1$, $b=1$ (peso $12$), sobra $2$ ⇒ $c=\tfrac12$. $Z_{LP}=8+11+3=22$. Ramifica em $c$.

**Nó 1 ($c=1$).** Capacidade restante $10$: $a=1$ (resta $5$), $b=\tfrac57$ ⇒ $Z_{LP}=6+8+\tfrac{55}7\approx21{,}86$. Ramifica em $b$.

**Nó 1a ($c=1,b=1$).** Resta $3$: $a=\tfrac35$ ⇒ $Z_{LP}=6+11+4{,}8=21{,}8$. Ramifica em $a$: com $a=1$ o peso é $16>14$ (inviável); com $a=0$ entra $d=1$ e obtém-se $(0,1,1,1)$, peso $14$, $Z=21$ — **incumbente $21$** (solução inteira).

**Nó 1b ($c=1,b=0$).** $a=1,d=1$ (peso $12$): $Z=18$ (inteiro, pior que $21$).

**Nó 2 ($c=0$).** $a=b=1$ (peso $12$), resta $2$ ⇒ $d=\tfrac23$, $Z_{LP}=19+\tfrac83\approx21{,}67$. Cota inteira $\le21$, não supera o incumbente ⇒ **podado**.

**Ótimo:** $(a,b,c,d)=(0,1,1,1)$, $Z^*=21$ (conferido por enumeração das $16$ combinações).`,
  }),

  // ---------------- Introdução à Computação II ----------------
  ic({
    n: 1,
    title: 'Teorema mestre: três recorrências',
    statement: r`Resolva (em notação $\Theta$) usando o teorema mestre:

(a) $T(n)=2T(n/2)+n$  (b) $T(n)=T(n/2)+1$  (c) $T(n)=3T(n/2)+n$`,
    source: `${AUT} — análise de algoritmos`,
    difficulty: 2,
    tags: 'recorrências, teorema mestre, análise assintótica',
    hint1: r`Compare $f(n)$ com $n^{\log_ba}$.`,
    officialSolution: r`- (a) $a=2,b=2$: $n^{\log_22}=n=f(n)$ ⇒ caso 2: $T(n)=\Theta(n\log n)$ (merge sort).
- (b) $a=1,b=2$: $n^{0}=1=f(n)$ ⇒ caso 2: $T(n)=\Theta(\log n)$ (busca binária).
- (c) $a=3,b=2$: $n^{\log_23}\approx n^{1{,}585}$ domina $f(n)=n$ ⇒ caso 1: $T(n)=\Theta(n^{\log_23})$ (Karatsuba).`,
  }),
  ic({
    n: 2,
    title: 'Busca binária: invariante e custo',
    statement: r`Dado um vetor ordenado $A[0..n-1]$ e um valor $x$, escreva a busca binária, enuncie o invariante do laço e prove que o número de comparações é $O(\log n)$.`,
    source: `${AUT} — busca`,
    difficulty: 2,
    tags: 'busca binária, invariante de laço',
    hint1: r`Invariante: se $x$ está em $A$, então está em $A[lo..hi]$.`,
    officialSolution: r`~~~
lo = 0; hi = n - 1
enquanto lo <= hi:
    mid = lo + (hi - lo) // 2
    se A[mid] == x: devolva mid
    se A[mid] < x:  lo = mid + 1
    senão:          hi = mid - 1
devolva -1
~~~

**Invariante:** se $x\in A$, então $x\in A[lo..hi]$. Vale no início ($lo=0,hi=n-1$) e é mantido: se $A[mid]<x$, como $A$ é ordenado, todos os elementos de $A[lo..mid]$ são menores que $x$.

**Custo:** o tamanho $hi-lo+1$ do intervalo é no máximo metade a cada iteração (≤ $\lfloor k/2\rfloor$). Após $t$ passos é $\le n/2^t$; o laço para quando é $0$, i.e. $t\le\lfloor\log_2n\rfloor+1$. Logo $O(\log n)$. (Use lo + (hi-lo)//2 e não (lo+hi)/2 para evitar estouro em linguagens com inteiros de tamanho fixo.)`,
  }),
  ic({
    n: 3,
    title: 'build-heap é O(n)',
    statement: r`Mostre que construir um heap de máximo a partir de um vetor arbitrário com $n$ elementos (aplicando a operação descer de $\lfloor n/2\rfloor$ até $1$) custa $O(n)$ e não $O(n\log n)$.`,
    source: `${AUT} — heap`,
    difficulty: 3,
    tags: 'heap, build-heap, análise de custo, somatórios',
    hint1: r`Um nó de altura $h$ custa $O(h)$ para descer; no máximo $\lceil n/2^{h+1}\rceil$ nós têm altura $h$.`,
    officialSolution: r`$$T(n)\le\sum_{h=0}^{\lfloor\log n\rfloor}\left\lceil\frac n{2^{h+1}}\right\rceil O(h)=O\!\left(n\sum_{h\ge0}\frac h{2^h}\right).$$

Como $\sum_{h\ge0}h\,x^h=\dfrac{x}{(1-x)^2}$, com $x=\tfrac12$ a soma vale $2$. Portanto $T(n)=O(n)$. A maioria dos nós está perto das folhas (altura baixa) e quase não desce.`,
  }),
  ic({
    n: 4,
    title: 'BFS: menor caminho em grafo não ponderado',
    statement: r`Explique como o BFS calcula as menores distâncias (em número de arestas) de uma fonte $s$ em um grafo não ponderado, escreva o algoritmo e dê o custo para listas de adjacência. Por que o DFS não serve para isso?`,
    source: `${AUT} — grafos`,
    difficulty: 2,
    tags: 'BFS, grafos, menor caminho',
    officialSolution: r`~~~
dist[v] = INF para todo v; dist[s] = 0
fila = [s]
enquanto fila não vazia:
    u = remove(fila)
    para v em adj[u]:
        se dist[v] == INF:
            dist[v] = dist[u] + 1
            insere(fila, v)
~~~

**Custo:** cada vértice entra uma vez na fila e cada aresta é examinada uma vez (duas, se não direcionado): $\Theta(V+E)$.

**Correção (ideia):** a fila mantém os vértices em ordem não decrescente de distância; por indução, quando $v$ é descoberto pela primeira vez, vem de um vértice de distância mínima, então $dist[v]$ é mínima. O DFS explora um ramo até o fim e pode descobrir $v$ por um caminho longo, logo suas distâncias não são mínimas.`,
  }),
  ic({
    n: 5,
    title: 'Maior subsequência crescente em O(n log n)',
    statement: r`Dado um vetor de inteiros, calcule o comprimento da maior subsequência estritamente crescente em $O(n\log n)$. Compare com a DP $O(n^2)$.`,
    source: `${AUT} — programação dinâmica`,
    difficulty: 3,
    tags: 'programação dinâmica, LIS, busca binária',
    hint1: r`Mantenha $tails[k]$ = menor último elemento de uma subsequência crescente de comprimento $k+1$.`,
    officialSolution: r`~~~
tails = []
para cada x no vetor:
    i = primeiro índice com tails[i] >= x   (busca binária)
    se i == len(tails): tails.append(x)
    senão: tails[i] = x
devolva len(tails)
~~~

**Por quê:** $tails$ é sempre estritamente crescente; substituir $tails[i]$ por $x\le tails[i]$ nunca piora (último elemento menor facilita estender). O tamanho de $tails$ é o comprimento da LIS (os elementos de $tails$ **não** são a subsequência).

**Custo:** $n$ buscas binárias ⇒ $O(n\log n)$, contra $O(n^2)$ da DP $d[i]=1+\max_{j<i,\,a_j<a_i}d[j]$.

Exemplo: $[3,1,4,1,5,9,2,6]$ ⇒ LIS $=4$ (ex.: $1,4,5,9$ ou $1,4,5,6$).`,
  }),

  // ---------------- Contabilidade Empresarial ----------------
  cont({
    n: 1,
    title: 'Índices de liquidez e endividamento',
    statement: r`Balanço (R$ mil): Ativo circulante $500$; Realizável a longo prazo $100$; Imobilizado $600$ (Ativo total $1.200$). Passivo circulante $300$; Passivo não circulante $400$; Patrimônio líquido $500$.

Calcule a liquidez corrente, a liquidez geral e o grau de endividamento (Passivo exigível / Ativo total).`,
    source: `${AUT} — análise por indicadores (Assaf Neto)`,
    difficulty: 1,
    tags: 'liquidez, endividamento, análise de balanços',
    hint1: r`Liquidez geral $=\dfrac{AC+RLP}{PC+PNC}$.`,
    officialSolution: r`- Liquidez corrente $=\dfrac{500}{300}=1{,}67$: cada R$ 1 de dívida de curto prazo tem R$ 1,67 de ativos de curto prazo.
- Liquidez geral $=\dfrac{500+100}{300+400}=\dfrac{600}{700}=0{,}86$ (<1: no longo prazo, os realizáveis não cobrem todo o exigível).
- Endividamento $=\dfrac{300+400}{1.200}=58{,}3\%$ (e PL/Ativo $=41{,}7\%$).`,
  }),
  cont({
    n: 2,
    title: 'CCL, NCG e saldo de tesouraria (Fleuriet)',
    statement: r`Dados (R$ mil): Disponível $40$; Duplicatas a receber $200$; Estoques $150$; Fornecedores $120$; Salários e impostos a pagar $80$; Empréstimos de curto prazo $90$.

Calcule o capital circulante líquido (CCL), a necessidade de capital de giro (NCG) e o saldo de tesouraria (ST). Interprete a situação financeira.`,
    source: `${AUT} — capital de giro (modelo Fleuriet)`,
    difficulty: 3,
    tags: 'capital de giro, CCL, NCG, tesouraria',
    hint1: r`Operacionais: duplicatas, estoques, fornecedores, salários/impostos. Erráticos (financeiros): disponível e empréstimos.`,
    officialSolution: r`$AC=40+200+150=390$; $PC=120+80+90=290$ ⇒ **CCL** $=390-290=100$.

**NCG** $=(200+150)-(120+80)=350-200=150$.

**ST** $=CCL-NCG=100-150=-50$ (conferência: $40-90=-50$ ✓).

**Interpretação:** o CCL positivo é insuficiente para financiar a NCG: a empresa financia parte da operação com dívida de curto prazo (ST negativo) — situação de risco, típica de "efeito tesoura" se o ST continuar caindo. Soluções: alongar dívida, reduzir prazo de recebimento/estoques ou alongar fornecedores.`,
  }),
  cont({
    n: 3,
    title: 'Ciclo operacional e financeiro',
    statement: r`Uma empresa tem prazo médio de estocagem de $60$ dias, prazo médio de recebimento de $45$ dias e prazo médio de pagamento a fornecedores de $30$ dias. Calcule os ciclos operacional e financeiro e o efeito de alongar o pagamento para $45$ dias.`,
    source: `${AUT} — ciclos`,
    difficulty: 1,
    tags: 'ciclo operacional, ciclo financeiro, prazos médios',
    officialSolution: r`Ciclo operacional $=PME+PMR=60+45=105$ dias. Ciclo financeiro $=105-PMP=105-30=75$ dias.

Com $PMP=45$: ciclo financeiro $=60$ dias, ou seja, $15$ dias a menos de financiamento do giro — reduz a NCG proporcionalmente (em $15$ dias de compras).`,
  }),
  cont({
    n: 4,
    title: 'Da receita bruta ao lucro líquido (DRE)',
    statement: r`Receita bruta de vendas $1.000$; deduções (impostos sobre vendas) $150$; CMV $400$; despesas operacionais $200$; alíquota de IR/CSLL $34\%$. Monte a DRE e calcule as margens bruta e líquida (sobre a receita líquida).`,
    source: `${AUT} — demonstração do resultado`,
    difficulty: 1,
    tags: 'DRE, margem bruta, margem líquida',
    officialSolution: r`- Receita bruta: 1.000
- (−) Deduções: (150)
- **Receita líquida: 850**
- (−) CMV: (400)
- **Lucro bruto: 450**
- (−) Despesas operacionais: (200)
- Lucro antes do IR: 250
- (−) IR/CSLL (34%): (85)
- **Lucro líquido: 165**

Margem bruta $=450/850=52{,}9\%$; margem líquida $=165/850=19{,}4\%$.`,
  }),
  cont({
    n: 5,
    title: 'ROE decomposto (DuPont)',
    statement: r`Com lucro líquido $165$, receita líquida $850$, ativo total $1.200$ e patrimônio líquido $500$, calcule o ROE e decomponha-o em margem líquida × giro do ativo × alavancagem.`,
    source: `${AUT} — rentabilidade`,
    difficulty: 2,
    tags: 'ROE, DuPont, alavancagem',
    officialSolution: r`$ROE=\dfrac{165}{500}=33\%$.

DuPont: $\underbrace{\dfrac{165}{850}}_{19{,}4\%}\times\underbrace{\dfrac{850}{1.200}}_{0{,}708}\times\underbrace{\dfrac{1.200}{500}}_{2{,}4}=0{,}33$ ✓.

Leitura: a rentabilidade vem de margem decente e de alavancagem moderada ($2{,}4\times$); o giro baixo ($0{,}71$) é o ponto fraco.`,
  }),
  cont({
    n: 6,
    title: 'Depreciação linear e valor contábil',
    statement: r`Um equipamento custou R$ 120.000, tem vida útil de $10$ anos e valor residual de R$ 20.000. Calcule a depreciação anual (método linear), a depreciação acumulada e o valor contábil ao fim do 3º ano.`,
    source: `${AUT} — imobilizado`,
    difficulty: 1,
    tags: 'depreciação, imobilizado',
    officialSolution: r`Base depreciável $=120.000-20.000=100.000$; depreciação anual $=100.000/10=10.000$ (10% a.a. sobre a base).

Após $3$ anos: depreciação acumulada $=30.000$; valor contábil $=120.000-30.000=\mathbf{90.000}$.`,
  }),

  // ---------------- Teoria Microeconômica I ----------------
  micro({
    n: 1,
    title: 'Demanda Cobb–Douglas por Lagrange',
    statement: r`Um consumidor com $u(x,y)=\sqrt{xy}$ enfrenta preços $p_x=2$, $p_y=4$ e renda $m=80$. Encontre a cesta ótima e a utilidade, e verifique a condição $TMS=p_x/p_y$.`,
    source: `${AUT} — escolha ótima`,
    difficulty: 2,
    tags: 'Cobb-Douglas, Lagrange, TMS',
    hint1: r`$\mathcal L=\sqrt{xy}+\lambda(80-2x-4y)$.`,
    officialSolution: r`Condições de 1ª ordem: $\tfrac12\sqrt{y/x}=2\lambda$, $\tfrac12\sqrt{x/y}=4\lambda$. Dividindo: $y/x=\tfrac12$ ⇒ $x=2y$. Orçamento: $2(2y)+4y=80\Rightarrow y=10$, $x=20$.

$u^*=\sqrt{200}\approx14{,}14$. $TMS=\dfrac{u_x}{u_y}=\dfrac yx=\dfrac12=\dfrac{p_x}{p_y}$ ✓.

Regra geral para $u=x^\alpha y^{1-\alpha}$: $x^*=\alpha m/p_x$, $y^*=(1-\alpha)m/p_y$ (aqui $\alpha=\tfrac12$: gasta metade da renda em cada bem).`,
  }),
  micro({
    n: 2,
    title: 'Complementares perfeitos: sem efeito substituição',
    statement: r`Para $u(x,y)=\min\{x,y\}$ com $p_x=p_y=1$ e $m=10$, o preço de $x$ sobe para $2$. Decomponha a variação da demanda de $x$ em efeitos substituição e renda.`,
    source: `${AUT} — equação de Slutsky`,
    difficulty: 3,
    tags: 'Slutsky, efeito renda, efeito substituição, complementares',
    hint1: r`Com complementares perfeitos o consumo é sempre $x=y=m/(p_x+p_y)$.`,
    officialSolution: r`Antes: $x=y=10/2=5$. Depois: $x=y=10/3\approx3{,}33$. Variação total: $-\tfrac53$.

**Substituição (Hicks):** mantenha a utilidade original ($u=5$). Como as curvas de indiferença têm forma de L, a cesta ótima continua sendo $(5,5)$ qualquer que seja a razão de preços ⇒ efeito substituição $=0$.

**Renda:** todo o efeito é efeito renda, $-\tfrac53$ (o poder de compra caiu e, sem possibilidade de substituir, a demanda por $x$ — e por $y$ — cai).`,
  }),
  micro({
    n: 3,
    title: 'Minimização de custo e função custo',
    statement: r`Uma firma produz $q=\sqrt{KL}$ com $w=4$ (trabalho) e $r=1$ (capital). Encontre as demandas condicionadas de fatores e o custo mínimo para $q=10$. Obtenha $C(q)$ geral.`,
    source: `${AUT} — teoria da firma`,
    difficulty: 3,
    tags: 'minimização de custo, taxa técnica de substituição, função custo',
    hint1: r`Condição de tangência: $\dfrac{PMgL}{PMgK}=\dfrac wr$.`,
    officialSolution: r`$PMgL=\tfrac12\sqrt{K/L}$, $PMgK=\tfrac12\sqrt{L/K}$ ⇒ razão $=K/L=w/r=4$ ⇒ $K=4L$.

$q=\sqrt{4L\cdot L}=2L=10\Rightarrow L=5$, $K=20$. Custo $=4\cdot5+1\cdot20=\mathbf{40}$.

Geral: $L=\dfrac q2$, $K=2q$ ⇒ $C(q)=4\cdot\dfrac q2+2q=4q$, que é linear (retornos constantes). Confere com $C(10)=40$ e com a fórmula $C=2q\sqrt{wr}=2q\cdot2=4q$.`,
  }),
  micro({
    n: 4,
    title: 'Oferta de uma firma competitiva',
    statement: r`Uma firma competitiva tem $C(q)=q^2+10q+100$ e vende a $p=50$. Ache a quantidade que maximiza o lucro, o lucro, e o preço abaixo do qual a firma produz zero no curto prazo (custo fixo $100$).`,
    source: `${AUT} — concorrência perfeita`,
    difficulty: 2,
    tags: 'concorrência perfeita, maximização de lucro, custo marginal',
    hint1: r`$p=CMg(q)$ com $CMg$ crescente.`,
    officialSolution: r`$CMg=2q+10=50\Rightarrow q^*=20$. Receita $=1.000$; custo $C(20)=400+200+100=700$; lucro $=300$.

No curto prazo a firma produz se $p\ge\min CVMe$. $CVMe=q+10$, mínimo $10$ em $q=0$; logo oferta $q=(p-10)/2$ para $p\ge10$ e $0$ abaixo disso (preço de fechamento $=10$).`,
  }),
  micro({
    n: 5,
    title: 'Monopólio e perda de peso morto',
    statement: r`Demanda inversa $P=100-Q$, custo marginal constante $CMg=20$. Calcule o equilíbrio do monopólio, o lucro e a perda de bem-estar relativa à concorrência perfeita.`,
    source: `${AUT} — monopólio`,
    difficulty: 2,
    tags: 'monopólio, receita marginal, peso morto',
    hint1: r`$RMg=100-2Q$.`,
    officialSolution: r`$RMg=CMg\Rightarrow100-2Q=20\Rightarrow Q_m=40$, $P_m=60$. Lucro $=(60-20)\cdot40=1.600$.

Concorrência: $P=CMg=20\Rightarrow Q_c=80$. Perda de peso morto $=\tfrac12(P_m-CMg)(Q_c-Q_m)=\tfrac12\cdot40\cdot40=\mathbf{800}$.`,
  }),
  micro({
    n: 6,
    title: 'Aversão ao risco: equivalente certo',
    statement: r`Um agente com $u(w)=\sqrt w$ recebe uma loteria: $R\$\,0$ com probabilidade $\tfrac12$ e $R\$\,100$ com probabilidade $\tfrac12$. Calcule a utilidade esperada, o equivalente certo e o prêmio de risco.`,
    source: `${AUT} — incerteza`,
    difficulty: 2,
    tags: 'utilidade esperada, aversão ao risco, equivalente certo',
    officialSolution: r`$E[u]=\tfrac12\sqrt0+\tfrac12\sqrt{100}=5$. Equivalente certo: $\sqrt{CE}=5\Rightarrow CE=25$. Valor esperado $=50$ ⇒ prêmio de risco $=50-25=\mathbf{25}$.

Como $u$ é côncava, $E[u(w)]<u(E[w])$ (Jensen): $5<\sqrt{50}\approx7{,}07$ ⇒ o agente é averso ao risco.`,
  }),
];
