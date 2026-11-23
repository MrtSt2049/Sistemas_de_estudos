import { bank, r } from './factory';

// Trilha OBMU. Problemas "OBMU 2024/2025" foram transcritos de data/OBM/Provas (símbolos reconstruídos
// a partir do PDF — confira com o original). Os demais são clássicos de olimpíadas universitárias,
// cada um com prova completa. Questões sem solução oficial ficam como desafio.

const ob = bank('obmu', null, 'obmu');
const O25 = '47ª OBMU (2025) — Fase Única';
const O24 = '46ª OBMU (2024) — Nível U';
const CLA = 'Clássico de olimpíadas';

export const obmuQuestions = [
  ob({
    n: '2025-p1',
    title: 'Não existe f contínua com f(x) − π(x) → 0',
    statement: r`Seja $\pi(x)$ a quantidade de primos positivos menores ou iguais a $x$, $x\in\mathbb R$. Mostre que não existe uma função contínua $f:[0,+\infty)\to\mathbb R$ satisfazendo $\displaystyle\lim_{x\to\infty}\big(f(x)-\pi(x)\big)=0$.`,
    source: `${O25}, Problema 1`,
    difficulty: 3,
    tags: 'análise, continuidade, primos, salto',
    hint1: r`$\pi$ dá um salto de $1$ em cada primo. O que a continuidade de $f$ diz sobre $f(p)-f(p-\varepsilon)$ para $\varepsilon$ pequeno?`,
    hint2: r`Existem infinitos primos: o salto de $\pi$ ocorre arbitrariamente longe, onde $f-\pi$ já deveria estar pequena.`,
    officialSolution: r`Suponha que exista $f$ nessas condições. Existe $x_0$ tal que $|f(x)-\pi(x)|<\tfrac13$ para todo $x\ge x_0$.

Tome um primo $p>x_0+1$. Como $f$ é contínua em $p$, existe $\varepsilon\in(0,1)$ com $p-\varepsilon>x_0$ e $|f(p)-f(p-\varepsilon)|<\tfrac13$; reduzindo $\varepsilon$ garantimos também que não há primo em $[p-\varepsilon,p)$, logo $\pi(p)-\pi(p-\varepsilon)=1$. Então

$$1=\pi(p)-\pi(p-\varepsilon)=\big[\pi(p)-f(p)\big]+\big[f(p)-f(p-\varepsilon)\big]+\big[f(p-\varepsilon)-\pi(p-\varepsilon)\big]<\tfrac13+\tfrac13+\tfrac13=1,$$

contradição. (Basta um primo $p>x_0+1$, que existe pela infinitude dos primos.)`,
  }),
  ob({
    n: '2025-p3a',
    title: 'Base de reticulado por vetores de módulo mínimo (ℝ²)',
    statement: r`Dado um conjunto não vazio $X\subset\mathbb R^k$, $k\in\{2,3\}$, dizemos que $q$ é de módulo mínimo em $X$ se $q\in X$ e $|q|\le|p|$ para todo $p\in X$.

(a) Seja $A:\mathbb R^2\to\mathbb R^2$ uma transformação linear invertível e $\Lambda=A(\mathbb Z^2)=\{A(x,y)\mid x,y\in\mathbb Z\}$. Sejam $u$ de módulo mínimo em $\Lambda\setminus\{(0,0)\}$ e $v$ de módulo mínimo em $\Lambda\setminus\{tu\mid t\in\mathbb R\}$. Prove que $\Lambda=\{ku+mv\mid k,m\in\mathbb Z\}$.`,
    source: `${O25}, Problema 3(a)`,
    difficulty: 4,
    tags: 'reticulados, álgebra linear, geometria dos números',
    prerequisites: r`$\Lambda$ é discreto: toda bola limitada contém finitos pontos de $\Lambda$ (pois $A$ é invertível); isso garante a existência de $u$ e $v$.`,
    hint1: r`Dado $w\in\Lambda$, escreva $w=\alpha u+\beta v$ ($u,v$ são linearmente independentes) e subtraia a parte inteira (mais próxima) dos coeficientes.`,
    hint2: r`Agora $|\alpha|,|\beta|\le\tfrac12$ e $w'\in\Lambda$. Compare $|w'|$ com $|u|$ (se $\beta=0$) ou com $|v|$ (se $\beta\ne0$), usando $|u|\le|v|$.`,
    officialSolution: r`Como $A$ é invertível, $\Lambda$ é discreto, então $u$ e $v$ existem. Note que $|u|\le|v|$ (pois $v\in\Lambda\setminus\{0\}$) e $u,v$ são linearmente independentes ($v\notin\mathbb Ru$).

Seja $w\in\Lambda$ e escreva $w=\alpha u+\beta v$ com $\alpha,\beta\in\mathbb R$. Sejam $k,m$ os inteiros mais próximos de $\alpha,\beta$ e $w'=w-ku-mv\in\Lambda$. Então $w'=\alpha'u+\beta'v$ com $|\alpha'|,|\beta'|\le\tfrac12$. Basta provar $w'=0$. Suponha $w'\ne0$.

**Caso $\beta'=0$.** Então $w'=\alpha'u\ne0$ e $|w'|\le\tfrac12|u|<|u|$, contradizendo a minimalidade de $u$ em $\Lambda\setminus\{0\}$.

**Caso $\beta'\ne0$.** Então $w'\notin\mathbb Ru$ e, pela minimalidade de $v$, $|w'|\ge|v|$. Por outro lado: se $\alpha'=0$, $|w'|=|\beta'||v|\le\tfrac12|v|<|v|$. Se $\alpha'\ne0$, os vetores $\alpha'u$ e $\beta'v$ são não nulos e linearmente independentes, logo a desigualdade triangular é estrita:

$$|w'|<|\alpha'||u|+|\beta'||v|\le\tfrac12|u|+\tfrac12|v|\le|v|.$$

Nos dois subcasos $|w'|<|v|$, uma contradição.

Logo $w'=0$ e $w=ku+mv$.`,
  }),
  ob({
    n: '2025-p3b',
    title: 'Base de reticulado por vetores de módulo mínimo (ℝ³) — desafio',
    statement: r`Seja $B:\mathbb R^3\to\mathbb R^3$ linear invertível e $\Lambda=B(\mathbb Z^3)$. Suponha que $u$ seja de módulo mínimo em $\Lambda\setminus\{0\}$, $v$ de módulo mínimo em $\Lambda\setminus\{tu\mid t\in\mathbb R\}$ e $w$ de módulo mínimo em $\Lambda\setminus\{tu+sv\mid t,s\in\mathbb R\}$. Prove que $\Lambda=\{ku+mv+nw\mid k,m,n\in\mathbb Z\}$.`,
    source: `${O25}, Problema 3(b)`,
    difficulty: 5,
    tags: 'reticulados, geometria dos números, desafio',
    hint1: r`Pela parte (a) aplicada ao reticulado plano $\Lambda\cap\text{span}(u,v)$, tem-se $\Lambda\cap\text{span}(u,v)=\mathbb Zu+\mathbb Zv$.`,
    hint2: r`Falta mostrar que $w$ gera o "quociente" $\Lambda/(\mathbb Zu+\mathbb Zv)\cong\mathbb Z$. O argumento de (a) não basta diretamente em dimensão $3$: use também que $|w|\ge|v|\ge|u|$ e controle a projeção de $w'$ sobre o plano.`,
    officialSolution: null,
  }),
  ob({
    n: '2025-p4',
    title: 'AB = P(A) com P(0) ≠ 0 ⇒ A invertível e AB = BA',
    statement: r`Sejam $A,B\in M(n,\mathbb C)$ e $P\in\mathbb C[X]$ um polinômio não constante tal que $P(0)\ne0$ e $AB=P(A)$. Prove que $A$ é invertível e que $A$ e $B$ comutam, isto é, $AB=BA$.`,
    source: `${O25}, Problema 4`,
    difficulty: 3,
    tags: 'álgebra linear, matrizes, polinômios de matriz',
    hint1: r`Escreva $P(X)=P(0)+X\,Q(X)$ e substitua $A$.`,
    hint2: r`Se uma matriz quadrada tem inversa à direita, é invertível. Depois exprima $B$ usando $A^{-1}$.`,
    officialSolution: r`Escreva $P(X)=P(0)+XQ(X)$ com $Q\in\mathbb C[X]$. Então $AB=P(0)I+AQ(A)$, ou seja

$$A\big(B-Q(A)\big)=P(0)\,I\ \Rightarrow\ A\cdot\frac{B-Q(A)}{P(0)}=I.$$

Como $P(0)\ne0$, $A$ tem inversa à direita e, sendo quadrada, é invertível, com $A^{-1}=\dfrac{B-Q(A)}{P(0)}$.

De $AB=P(A)$ obtemos $B=A^{-1}P(A)$. Como $A^{-1}$ comuta com $A$, comuta com todo polinômio em $A$; portanto $BA=A^{-1}P(A)A=A^{-1}AP(A)=P(A)=AB$. $\blacksquare$`,
  }),
  ob({
    n: '2024-p1',
    title: 'Números perfeitos: Σ1/(p+1) < ln 2 < Σ1/(p−1)',
    statement: r`Um inteiro positivo $n$ é dito perfeito se a soma dos seus divisores positivos $\sigma(n)$ é o dobro de $n$, ou seja, $\sigma(n)=2n$. Por exemplo, $6$ é perfeito, pois $1+2+3+6=12$. Demonstre que se $n$ é um inteiro positivo perfeito, então

$$\sum_{\substack{p\mid n\\ p\text{ primo}}}\frac1{p+1}<\ln2<\sum_{\substack{p\mid n\\ p\text{ primo}}}\frac1{p-1}.$$`,
    source: `${O24}, Problema 1`,
    difficulty: 3,
    tags: 'teoria dos números, σ(n), desigualdades, logaritmo',
    hint1: r`$\dfrac{\sigma(n)}n=\prod_{p^a\parallel n}\left(1+\frac1p+\dots+\frac1{p^a}\right)=2$.`,
    hint2: r`Cada fator é $\ge1+\frac1p$ e $<\frac p{p-1}$. Depois use $\frac{x}{1+x}<\ln(1+x)<x$.`,
    officialSolution: r`Para $p^a\parallel n$ (note $n\ge6$, então há pelo menos um primo),

$$1+\frac1p\le\frac{\sigma(p^a)}{p^a}=1+\frac1p+\dots+\frac1{p^a}<\frac1{1-1/p}=\frac p{p-1}.$$

Multiplicando sobre os primos $p\mid n$ e usando $\sigma(n)/n=2$ (multiplicatividade):

$$\prod_{p\mid n}\left(1+\frac1p\right)\le2<\prod_{p\mid n}\frac p{p-1}=\prod_{p\mid n}\left(1+\frac1{p-1}\right).$$

Tomando logaritmos e usando $\ln(1+x)>\dfrac x{1+x}$ e $\ln(1+x)<x$ para $x>0$:

$$\sum\frac1{p+1}=\sum\frac{1/p}{1+1/p}<\sum\ln\!\left(1+\frac1p\right)\le\ln2<\sum\ln\!\left(1+\frac1{p-1}\right)<\sum\frac1{p-1}.\ \blacksquare$$`,
  }),

  // ---------------- clássicos ----------------
  ob({
    n: 'c-gavetas-coprimos',
    title: 'n+1 inteiros em {1,…,2n}: dois são primos entre si',
    statement: r`Mostre que, entre quaisquer $n+1$ inteiros escolhidos em $\{1,2,\dots,2n\}$, existem dois que são primos entre si.`,
    source: CLA,
    difficulty: 1,
    tags: 'princípio das gavetas, teoria dos números',
    hint1: r`Divida $\{1,\dots,2n\}$ em $n$ pares de consecutivos.`,
    officialSolution: r`Considere as $n$ "gavetas" $\{1,2\},\{3,4\},\dots,\{2n-1,2n\}$. Entre $n+1$ números escolhidos, dois caem na mesma gaveta, logo são consecutivos $k,k+1$, e $\gcd(k,k+1)=1$.`,
  }),
  ob({
    n: 'c-domino-tabuleiro',
    title: 'Tabuleiro 2n×2n sem dois cantos opostos não é ladrilhável',
    statement: r`Remova duas casas de cantos opostos de um tabuleiro $2n\times2n$. Prove que o que sobra não pode ser coberto por dominós $1\times2$ sem sobreposição.`,
    source: CLA,
    difficulty: 2,
    tags: 'invariante, coloração, combinatória',
    hint1: r`Pinte o tabuleiro como xadrez. Quantas casas de cada cor sobram?`,
    officialSolution: r`Cantos opostos têm a mesma cor (a soma das coordenadas tem a mesma paridade). Remover duas casas da mesma cor deixa $2n^2-2$ casas de uma cor e $2n^2$ da outra. Cada dominó cobre exatamente uma casa de cada cor, logo qualquer ladrilhamento cobriria quantidades iguais de cada cor — contradição.`,
  }),
  ob({
    n: 'c-fibonacci-sem-consecutivos',
    title: 'Subconjuntos de {1..n} sem consecutivos: Fₙ₊₂',
    statement: r`Seja $a_n$ o número de subconjuntos de $\{1,\dots,n\}$ que não contêm dois inteiros consecutivos (o vazio conta). Mostre que $a_n=F_{n+2}$, com $F_1=F_2=1$.`,
    source: CLA,
    difficulty: 2,
    tags: 'recorrência, Fibonacci, combinatória',
    hint1: r`Separe em subconjuntos que contêm $n$ e que não contêm $n$.`,
    officialSolution: r`Se $n\notin S$, $S$ é um subconjunto válido de $\{1,\dots,n-1\}$: $a_{n-1}$ possibilidades. Se $n\in S$, então $n-1\notin S$ e $S\setminus\{n\}$ é um subconjunto válido de $\{1,\dots,n-2\}$: $a_{n-2}$ possibilidades. Logo $a_n=a_{n-1}+a_{n-2}$.

Condições iniciais: $a_0=1$ (só o vazio), $a_1=2$. Como $F_2=1$, $F_3=2$, vale $a_n=F_{n+2}$ por indução.`,
  }),
  ob({
    n: 'c-seis-pessoas',
    title: 'Seis pessoas: trio de amigos ou de desconhecidos',
    statement: r`Em um grupo de $6$ pessoas, cada par é de conhecidos ou de desconhecidos. Prove que existem três pessoas que se conhecem mutuamente ou três que não se conhecem mutuamente.`,
    source: CLA,
    difficulty: 2,
    tags: 'grafos, Ramsey, gavetas',
    hint1: r`Fixe uma pessoa $P$. Entre as outras $5$, pelo menos $3$ têm a mesma relação com $P$.`,
    officialSolution: r`Fixe $P$. Entre as $5$ outras pessoas, pelo princípio das gavetas, pelo menos $3$ são conhecidas de $P$ ou pelo menos $3$ são desconhecidas de $P$. Suponha o primeiro caso (o segundo é simétrico): sejam $A,B,C$ conhecidas de $P$.

Se algum par entre $A,B,C$ se conhece, esse par junto com $P$ forma um trio de conhecidos. Caso contrário, $A,B,C$ são três desconhecidos entre si. $\blacksquare$

(Isso mostra $R(3,3)\le6$; o pentágono com lados "conhece" e diagonais "não conhece" mostra que $5$ pessoas não bastam.)`,
  }),
  ob({
    n: 'c-germain',
    title: 'n⁴ + 4ⁿ é composto para n > 1',
    statement: r`Prove que $n^4+4^n$ não é primo para nenhum inteiro $n>1$.`,
    source: CLA,
    difficulty: 3,
    tags: 'fatoração, Sophie Germain, teoria dos números',
    hint1: r`$n$ par é fácil. Para $n$ ímpar, escreva $4^n=4\cdot(2^k)^4$.`,
    hint2: r`Identidade de Sophie Germain: $x^4+4y^4=(x^2+2xy+2y^2)(x^2-2xy+2y^2)$.`,
    officialSolution: r`Se $n$ é par, $n^4+4^n$ é par e maior que $2$, logo composto.

Se $n=2k+1$ é ímpar, $4^n=4\cdot4^{2k}=4\,(2^k)^4$. Com $a=2^k$:

$$n^4+4a^4=(n^2+2na+2a^2)(n^2-2na+2a^2).$$

O segundo fator é $(n-a)^2+a^2\ge a^2\ge1$, com igualdade só se $n=a$ e $a=1$, i.e. $n=1$. Para $n>1$ ele é $>1$, e o primeiro é maior que o segundo, então ambos os fatores são $>1$: composto.`,
  }),
  ob({
    n: 'c-soma-dois-quadrados-3mod4',
    title: 'p ≡ 3 (mod 4), p | a²+b² ⇒ p | a e p | b',
    statement: r`Seja $p$ um primo com $p\equiv3\pmod4$. Mostre que, se $p\mid a^2+b^2$, então $p\mid a$ e $p\mid b$.`,
    source: CLA,
    difficulty: 3,
    tags: 'teoria dos números, resíduos quadráticos, Fermat',
    hint1: r`Se $p\nmid b$, divida por $b^2$ módulo $p$ e obtenha $x^2\equiv-1$.`,
    hint2: r`Eleve $x^2\equiv-1$ à potência $\frac{p-1}2$ (ímpar!) e use o pequeno teorema de Fermat.`,
    officialSolution: r`Suponha $p\nmid b$ (se $p\mid b$, então $p\mid a^2$ e $p\mid a$). Seja $x\equiv ab^{-1}$; então $x^2\equiv-1\pmod p$. Como $p\equiv3\pmod 4$, $\frac{p-1}2$ é ímpar, e

$$x^{p-1}=(x^2)^{\frac{p-1}2}\equiv(-1)^{\frac{p-1}2}=-1\pmod p.$$

Mas, por Fermat, $x^{p-1}\equiv1$ (pois $p\nmid x$), então $1\equiv-1$, ou seja $p=2$, absurdo. Logo $p\mid b$ e, então, $p\mid a$.`,
  }),
  ob({
    n: 'c-nesbitt',
    title: 'Desigualdade de Nesbitt',
    statement: r`Para $a,b,c>0$, prove que $\dfrac a{b+c}+\dfrac b{c+a}+\dfrac c{a+b}\ge\dfrac32$.`,
    source: CLA,
    difficulty: 2,
    tags: 'desigualdades, Cauchy-Schwarz, AM-GM',
    hint1: r`Some $1$ a cada fração: $\dfrac a{b+c}+1=\dfrac{a+b+c}{b+c}$.`,
    officialSolution: r`Seja $S=a+b+c$. Então

$$\sum\frac a{b+c}+3=S\sum\frac1{b+c}.$$

Pela desigualdade entre as médias aritmética e harmônica (ou Cauchy–Schwarz) para os três números $x=b+c$, $y=c+a$, $z=a+b$ (cuja soma é $2S$): $\left(\frac1x+\frac1y+\frac1z\right)(x+y+z)\ge9$, ou seja $\sum\frac1{b+c}\ge\dfrac9{2S}$. Logo

$$\sum\frac a{b+c}+3\ge S\cdot\frac9{2S}=\frac92\ \Rightarrow\ \sum\frac a{b+c}\ge\frac32.$$

Igualdade se e somente se $a=b=c$.`,
  }),
  ob({
    n: 'c-equacao-funcional',
    title: 'f(f(x)+y) = 2x + f(f(y)−x)',
    statement: r`Determine todas as funções $f:\mathbb R\to\mathbb R$ tais que $f(f(x)+y)=2x+f(f(y)-x)$ para todos $x,y\in\mathbb R$.`,
    source: 'Clássico de equações funcionais',
    difficulty: 4,
    tags: 'equações funcionais, sobrejetividade',
    hint1: r`Substitua $y=-f(x)$ para provar que $f$ é sobrejetora.`,
    hint2: r`Seja $a$ com $f(a)=0$ e faça $x=a$.`,
    officialSolution: r`**Sobrejetividade.** Com $y=-f(x)$: $f(0)=2x+f\big(f(-f(x))-x\big)$, i.e. $f\big(f(-f(x))-x\big)=f(0)-2x$. O lado direito percorre $\mathbb R$ quando $x$ varia, então $f$ é sobrejetora.

Seja $a$ com $f(a)=0$. Com $x=a$:

$$f(y)=2a+f\big(f(y)-a\big)\quad\forall y.$$

Dado qualquer $u\in\mathbb R$, tome $y$ com $f(y)=u$: $u=2a+f(u-a)$, ou seja $f(u-a)=u-2a$. Com $w=u-a$ arbitrário, $f(w)=w-a$. Portanto $f(x)=x+c$ para uma constante $c=-a$.

**Verificação.** $f(f(x)+y)=x+y+2c$ e $2x+f(f(y)-x)=2x+(y+c-x)+c=x+y+2c$ ✓. Resposta: $f(x)=x+c$, $c\in\mathbb R$.`,
  }),
  ob({
    n: 'c-cesaro',
    title: 'Se aₙ₊₁ − aₙ → L então aₙ/n → L',
    statement: r`Seja $(a_n)$ uma sequência real tal que $a_{n+1}-a_n\to L$. Prove que $a_n/n\to L$.`,
    source: 'Clássico de análise (Cesàro / Stolz)',
    difficulty: 3,
    tags: 'análise, sequências, Cesàro',
    hint1: r`$a_n=a_0+\sum_{k=0}^{n-1}(a_{k+1}-a_k)$: $a_n/n$ é uma média de termos que convergem a $L$.`,
    officialSolution: r`Seja $d_k=a_{k+1}-a_k\to L$ e $\varepsilon>0$. Escolha $N$ com $|d_k-L|<\varepsilon/2$ para $k\ge N$. Para $n>N$:

$$\left|\frac{a_n}n-L\right|=\left|\frac{a_0}n+\frac1n\sum_{k=0}^{n-1}(d_k-L)\right|\le\frac{|a_0|}{n}+\frac1n\sum_{k<N}|d_k-L|+\frac{n-N}{n}\cdot\frac\varepsilon2.$$

Os dois primeiros termos tendem a $0$ ($N$ fixo), então para $n$ grande a soma é menor que $\varepsilon$. Logo $a_n/n\to L$.`,
  }),
  ob({
    n: 'c-weierstrass-momentos',
    title: '∫ f(x)xⁿ dx = 0 para todo n ⇒ f ≡ 0',
    statement: r`Seja $f:[0,1]\to\mathbb R$ contínua com $\int_0^1f(x)\,x^n\,dx=0$ para todo $n\ge0$. Prove que $f\equiv0$.`,
    source: 'Clássico de análise (Weierstrass)',
    difficulty: 3,
    tags: 'análise, Weierstrass, aproximação polinomial',
    hint1: r`Por linearidade, $\int fp=0$ para todo polinômio $p$.`,
    hint2: r`Pelo teorema de Weierstrass existem polinômios $p_k\to f$ uniformemente.`,
    officialSolution: r`Por linearidade, $\int_0^1f\,p=0$ para todo polinômio $p$. Pelo teorema de aproximação de Weierstrass, existem polinômios $p_k\to f$ uniformemente em $[0,1]$. Então

$$\int_0^1f^2=\lim_k\int_0^1f\,p_k=0,$$

pois $\left|\int f(f-p_k)\right|\le\|f\|_\infty\|f-p_k\|_\infty\to0$. Sendo $f^2\ge0$ contínua com integral $0$, $f^2\equiv0$, logo $f\equiv0$.`,
  }),
  ob({
    n: 'c-integral-ln-seno',
    title: '∫₀^{π/2} ln(sen x) dx = −(π/2) ln 2',
    statement: r`Calcule $I=\displaystyle\int_0^{\pi/2}\ln(\sin x)\,dx$.`,
    source: CLA,
    difficulty: 3,
    tags: 'integrais, simetria, truque clássico',
    hint1: r`A substituição $x\mapsto\frac\pi2-x$ mostra que $I=\int_0^{\pi/2}\ln\cos x\,dx$.`,
    hint2: r`Some: $2I=\int\ln(\sin x\cos x)=\int\ln\frac{\sin2x}{2}$.`,
    officialSolution: r`A integral converge (singularidade logarítmica em $0$). Por $x\mapsto\frac\pi2-x$, $I=\int_0^{\pi/2}\ln\cos x\,dx$. Somando:

$$2I=\int_0^{\pi/2}\ln\frac{\sin2x}2\,dx=\int_0^{\pi/2}\ln\sin2x\,dx-\frac\pi2\ln2.$$

Com $u=2x$: $\int_0^{\pi/2}\ln\sin2x\,dx=\tfrac12\int_0^\pi\ln\sin u\,du=\tfrac12\cdot2I=I$ (simetria de $\sin$ em torno de $\pi/2$). Logo $2I=I-\frac\pi2\ln2$ e

$$I=-\frac\pi2\ln2.$$`,
  }),
  ob({
    n: 'c-comutador-nilpotente',
    title: 'AB − BA = A ⇒ A é nilpotente',
    statement: r`Sejam $A,B\in M_n(\mathbb C)$ tais que $AB-BA=A$. Prove que $A$ é nilpotente.`,
    source: 'Clássico (estilo Putnam)',
    difficulty: 4,
    tags: 'álgebra linear, traço, nilpotente, Vandermonde',
    hint1: r`Calcule $\operatorname{tr}(A^k)$ escrevendo $A^k=A^{k-1}(AB-BA)$.`,
    hint2: r`Se todas as potências de $A$ têm traço $0$, o que dizem os autovalores (somas de potências)?`,
    officialSolution: r`Para $k\ge1$: $\operatorname{tr}(A^k)=\operatorname{tr}\big(A^{k-1}(AB-BA)\big)=\operatorname{tr}(A^kB)-\operatorname{tr}(A^{k-1}BA)=0$, pois $\operatorname{tr}(A^{k-1}BA)=\operatorname{tr}(A^kB)$ (ciclicidade).

Sejam $\lambda_1,\dots,\lambda_r$ os autovalores **distintos** não nulos de $A$, com multiplicidades $m_i\ge1$. Então $\sum_{i}m_i\lambda_i^k=\operatorname{tr}(A^k)=0$ para $k=1,\dots,r$. O sistema em $(m_1,\dots,m_r)$ tem matriz $(\lambda_i^k)$, com determinante $\prod\lambda_i\cdot\prod_{i<j}(\lambda_j-\lambda_i)\ne0$ (Vandermonde), forçando $m_i=0$ — absurdo (em característica $0$, $m_i\ne0$ em $\mathbb C$). Logo $A$ não tem autovalor não nulo: todos os autovalores são $0$ e $A$ é nilpotente.`,
  }),
  ob({
    n: 'c-matriz-quadrado-menos-i',
    title: 'A² = −I (real): n par e det A = 1',
    statement: r`Seja $A\in M_n(\mathbb R)$ com $A^2=-I$. Prove que $n$ é par e $\det A=1$.`,
    source: CLA,
    difficulty: 3,
    tags: 'álgebra linear, determinante, autovalores',
    hint1: r`$(\det A)^2=\det(-I)=(-1)^n$.`,
    hint2: r`Os autovalores de $A$ (complexos) são $\pm i$ e, como $A$ é real, aparecem em pares conjugados.`,
    officialSolution: r`$(\det A)^2=\det(A^2)=\det(-I)=(-1)^n$. Como $(\det A)^2\ge0$, $(-1)^n=1$, e $n$ é par.

Autovalores: se $Av=\lambda v$, então $-v=A^2v=\lambda^2v$, então $\lambda=\pm i$. Como $A$ é real, o polinômio característico é real, e os autovalores não reais vêm em pares conjugados com a mesma multiplicidade: $i$ e $-i$ têm multiplicidade $n/2$ cada. Assim $\det A=i^{n/2}(-i)^{n/2}=(i\cdot(-i))^{n/2}=1^{n/2}=1$.`,
  }),
  ob({
    n: 'c-polinomio-nao-negativo',
    title: 'P ≥ 0 em ℝ ⇒ P = A² + B²',
    statement: r`Seja $P\in\mathbb R[x]$ com $P(x)\ge0$ para todo $x\in\mathbb R$. Prove que existem $A,B\in\mathbb R[x]$ tais que $P=A^2+B^2$.`,
    source: CLA,
    difficulty: 4,
    tags: 'polinômios, soma de quadrados, números complexos',
    hint1: r`Fatore $P$ sobre $\mathbb C$. Raízes reais têm multiplicidade par; as complexas vêm em pares conjugados.`,
    hint2: r`Identidade de Brahmagupta–Fibonacci: $(a^2+b^2)(c^2+d^2)=(ac-bd)^2+(ad+bc)^2$, que vale também para polinômios.`,
    officialSolution: r`Se $P\equiv0$, tome $A=B=0$. Senão, $P=c\prod(x-a_i)^{m_i}\prod\big((x-z_j)(x-\bar z_j)\big)^{n_j}$ com $a_i$ reais e $z_j$ não reais.

- Como $P\ge0$ perto de cada raiz real, $m_i$ é par (senão $P$ trocaria de sinal), então $(x-a_i)^{m_i}=\big((x-a_i)^{m_i/2}\big)^2+0^2$.
- $c>0$ (comportamento no infinito), e $c=(\sqrt c)^2+0^2$.
- $(x-z)(x-\bar z)=(x-\operatorname{Re}z)^2+(\operatorname{Im}z)^2$, uma soma de dois quadrados.

Cada fator é soma de dois quadrados de polinômios reais, e o produto de somas de dois quadrados é soma de dois quadrados (identidade de Brahmagupta–Fibonacci). Por indução no número de fatores, $P=A^2+B^2$.`,
  }),
  ob({
    n: 'c-pontos-quadrado-gavetas',
    title: '5 pontos no quadrado unitário: dois a distância ≤ √2/2',
    statement: r`Cinco pontos são escolhidos em um quadrado de lado $1$ (interior ou bordo). Mostre que dois deles estão a uma distância de no máximo $\dfrac{\sqrt2}{2}$.`,
    source: CLA,
    difficulty: 1,
    tags: 'gavetas, geometria',
    hint1: r`Divida o quadrado em $4$ quadrados de lado $\frac12$. Qual é a maior distância dentro de cada um?`,
    officialSolution: r`Divida em quatro quadrados de lado $\tfrac12$. Pelo princípio das gavetas, dois dos cinco pontos estão no mesmo quadradinho (fechado). A maior distância entre dois pontos de um quadrado de lado $\tfrac12$ é a diagonal $\tfrac12\sqrt2=\tfrac{\sqrt2}2$.`,
  }),
  ob({
    n: 'c-esperanca-pontos-fixos',
    title: 'Permutação aleatória: E[pontos fixos] = 1 e Var = 1',
    statement: r`Seja $\sigma$ uma permutação uniformemente aleatória de $\{1,\dots,n\}$ ($n\ge2$) e $X$ o número de pontos fixos. Calcule $E[X]$ e $\operatorname{Var}(X)$.`,
    source: CLA,
    difficulty: 3,
    tags: 'probabilidade, linearidade da esperança, indicadores',
    hint1: r`$X=\sum_i\mathbf 1_{\{\sigma(i)=i\}}$. Calcule $E[\mathbf 1_i]$ e $E[\mathbf 1_i\mathbf 1_j]$.`,
    officialSolution: r`$E[\mathbf 1_i]=P(\sigma(i)=i)=\frac1n$, logo $E[X]=n\cdot\frac1n=1$.

Para $i\ne j$: $E[\mathbf 1_i\mathbf 1_j]=P(\sigma(i)=i,\sigma(j)=j)=\dfrac{(n-2)!}{n!}=\dfrac1{n(n-1)}$. Então

$$E[X^2]=\sum_iE[\mathbf 1_i]+\sum_{i\ne j}E[\mathbf 1_i\mathbf 1_j]=1+n(n-1)\cdot\frac1{n(n-1)}=2,$$

$$\operatorname{Var}(X)=E[X^2]-E[X]^2=2-1=1.$$`,
  }),
  ob({
    n: 'c-produto-senos',
    title: '∏ sen(kπ/n) = n / 2ⁿ⁻¹',
    statement: r`Prove que, para $n\ge2$, $\displaystyle\prod_{k=1}^{n-1}\sin\frac{k\pi}n=\frac n{2^{n-1}}$.`,
    source: CLA,
    difficulty: 4,
    tags: 'números complexos, raízes da unidade, trigonometria',
    hint1: r`$\prod_{k=1}^{n-1}(x-\omega^k)=1+x+\dots+x^{n-1}$ com $\omega=e^{2\pi i/n}$. Faça $x=1$.`,
    hint2: r`$|1-\omega^k|=2\sin\frac{k\pi}n$.`,
    officialSolution: r`Como $x^n-1=\prod_{k=0}^{n-1}(x-\omega^k)$, dividindo por $x-1$ temos $1+x+\dots+x^{n-1}=\prod_{k=1}^{n-1}(x-\omega^k)$. Em $x=1$:

$$n=\prod_{k=1}^{n-1}(1-\omega^k).$$

Tomando módulos e usando $|1-e^{2i\theta}|=2|\sin\theta|$ com $\theta=\frac{k\pi}n\in(0,\pi)$:

$$n=\prod_{k=1}^{n-1}2\sin\frac{k\pi}n=2^{n-1}\prod_{k=1}^{n-1}\sin\frac{k\pi}n.$$`,
  }),
  ob({
    n: 'c-ponto-fixo-continua',
    title: 'f: [0,1] → [0,1] contínua tem ponto fixo',
    statement: r`Seja $f:[0,1]\to[0,1]$ contínua. Prove que existe $x\in[0,1]$ com $f(x)=x$.`,
    source: CLA,
    difficulty: 1,
    tags: 'análise, valor intermediário',
    hint1: r`Considere $g(x)=f(x)-x$ e avalie em $0$ e em $1$.`,
    officialSolution: r`Seja $g(x)=f(x)-x$, contínua. $g(0)=f(0)\ge0$ e $g(1)=f(1)-1\le0$. Se algum for zero, achamos o ponto fixo; senão $g(0)>0>g(1)$ e o teorema do valor intermediário dá $x\in(0,1)$ com $g(x)=0$.`,
  }),
  ob({
    n: 'c-grupo-expoente-2',
    title: 'x² = e para todo x ⇒ grupo abeliano',
    statement: r`Seja $G$ um grupo tal que $x^2=e$ para todo $x\in G$. Prove que $G$ é abeliano.`,
    source: CLA,
    difficulty: 1,
    tags: 'álgebra, grupos',
    hint1: r`Calcule $(xy)^2$ de duas formas.`,
    officialSolution: r`De $x^2=e$ temos $x^{-1}=x$ para todo $x$. Então $xy=(xy)^{-1}=y^{-1}x^{-1}=yx$.`,
  }),
];
