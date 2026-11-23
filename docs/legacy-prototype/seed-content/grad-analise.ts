import { bank, r } from './factory';

// Espaços Métricos, EDO, Cálculo II, Álgebra Linear, Cálculo Numérico.
// Exercícios autorais/clássicos; respostas numéricas conferidas com sympy/scipy.

const em = bank('grad', 'course-5952020', 'em');
const edo = bank('grad', 'course-5952021', 'edo');
const calc = bank('grad', 'course-5952002', 'calc2');
const al = bank('grad', 'course-5952036', 'al');
const num = bank('grad', 'course-5952006', 'num');

const AUT = 'Exercício autoral/clássico';

export const analiseQuestions = [
  // ---------------- Espaços Métricos ----------------
  em({
    n: 1,
    title: 'd(x,y)=|x−y|/(1+|x−y|) é métrica em ℝ',
    statement: r`Mostre que $d(x,y)=\dfrac{|x-y|}{1+|x-y|}$ é uma métrica em $\mathbb R$.`,
    source: `${AUT} — Tópico 1 (métrica)`,
    difficulty: 2,
    tags: 'métrica, desigualdade triangular',
    hint1: r`Positividade, simetria e $d=0\iff x=y$ são imediatas. O trabalho está na desigualdade triangular.`,
    hint2: r`Seja $\varphi(t)=\dfrac{t}{1+t}$ em $[0,\infty)$. Mostre que $\varphi$ é crescente e que $\varphi(a+b)\le\varphi(a)+\varphi(b)$.`,
    officialSolution: r`Com $\varphi(t)=\frac t{1+t}$, temos $d(x,y)=\varphi(|x-y|)$. Os axiomas (i)–(iii) são imediatos.

**Desigualdade triangular.** $\varphi'(t)=\frac1{(1+t)^2}>0$, então $\varphi$ é crescente. Para $a,b\ge0$:

$$\varphi(a+b)=\frac{a}{1+a+b}+\frac{b}{1+a+b}\le\frac a{1+a}+\frac b{1+b}=\varphi(a)+\varphi(b).$$

Logo, como $|x-z|\le|x-y|+|y-z|$,

$$d(x,z)=\varphi(|x-z|)\le\varphi(|x-y|+|y-z|)\le\varphi(|x-y|)+\varphi(|y-z|)=d(x,y)+d(y,z).$$

Observação: $d<1$ sempre, então $\mathbb R$ com $d$ é limitado, mas continua com os mesmos abertos da métrica usual (métricas equivalentes).`,
  }),
  em({
    n: 2,
    title: 'Métrica discreta: abertos, fechados e convergência',
    statement: r`Seja $(M,d)$ com a métrica discreta ($d(x,y)=1$ se $x\ne y$ e $0$ se $x=y$).

(a) Descreva as bolas $B_r(a)$ para $r\le1$ e para $r>1$.

(b) Mostre que todo subconjunto de $M$ é aberto e fechado.

(c) Mostre que $x_n\to a$ se e somente se $x_n=a$ para todo $n$ suficientemente grande.`,
    source: `${AUT} — Tópicos 3 e 5`,
    difficulty: 2,
    tags: 'métrica discreta, abertos, fechados, convergência',
    hint1: r`$d(x,a)<r$ com $r\le1$ força $d(x,a)=0$.`,
    hint2: r`Um conjunto é aberto se contém uma bola em torno de cada um dos seus pontos; fechado = complementar de aberto.`,
    officialSolution: r`**(a)** Se $r\le1$: $B_r(a)=\{a\}$. Se $r>1$: $B_r(a)=M$.

**(b)** Seja $A\subset M$ e $a\in A$. Então $B_{1}(a)=\{a\}\subset A$, logo todo ponto de $A$ é interior: $A$ é aberto. Como $M\setminus A$ também é um subconjunto, também é aberto; portanto $A$ é fechado.

**(c)** ($\Rightarrow$) Tomando $\varepsilon=\tfrac12$, existe $N$ com $d(x_n,a)<\tfrac12$ para $n\ge N$, isto é, $x_n=a$. ($\Leftarrow$) Se $x_n=a$ para $n\ge N$, então $d(x_n,a)=0<\varepsilon$ para todo $\varepsilon>0$.`,
  }),
  em({
    n: 3,
    title: 'Métrica uniforme vs. integral em C([0,1]): não equivalentes',
    statement: r`Em $C([0,1],\mathbb R)$ considere $d_\infty(f,g)=\max_{[0,1]}|f-g|$ e $d_1(f,g)=\int_0^1|f-g|\,dx$.

(a) Mostre que $d_1(f,g)\le d_\infty(f,g)$.

(b) Mostre que a identidade $(C,d_\infty)\to(C,d_1)$ é contínua mas a sua inversa não é. Conclua que as métricas não são equivalentes.`,
    source: `${AUT} — Tópicos 2 e 4`,
    difficulty: 3,
    tags: 'métricas equivalentes, espaços de funções, continuidade',
    hint1: r`Para (a), limite o integrando por $\max|f-g|$.`,
    hint2: r`Para (b), procure uma sequência $f_n$ com $d_1(f_n,0)\to0$ mas $d_\infty(f_n,0)\not\to0$. Pense em $f_n(x)=x^n$.`,
    officialSolution: r`**(a)** $\int_0^1|f-g|\le\int_0^1\max|f-g|\,dx=d_\infty(f,g)$.

**(b)** Por (a), $\text{id}:(C,d_\infty)\to(C,d_1)$ é $1$-lipschitziana, logo contínua.

Seja $f_n(x)=x^n$. Então $d_1(f_n,0)=\int_0^1x^n\,dx=\frac1{n+1}\to0$, mas $d_\infty(f_n,0)=1$ para todo $n$. Assim $f_n\to0$ em $d_1$ e **não** em $d_\infty$: a inversa $(C,d_1)\to(C,d_\infty)$ não é contínua em $0$ (não preserva a convergência). Duas métricas equivalentes teriam as mesmas sequências convergentes, portanto $d_1$ e $d_\infty$ não são equivalentes.`,
  }),
  em({
    n: 4,
    title: 'Continuidade via imagem inversa de fechados',
    statement: r`Sejam $M,N$ espaços métricos e $f:M\to N$. Mostre que $f$ é contínua se e somente se $f^{-1}(F)$ é fechado em $M$ para todo $F\subset N$ fechado. (Você pode usar a caracterização por abertos.)`,
    source: `${AUT} — Tópico 5 (Proposição 3)`,
    difficulty: 2,
    tags: 'continuidade, abertos, fechados',
    prerequisites: r`$f$ contínua $\iff f^{-1}(B)$ aberto para todo aberto $B\subset N$.`,
    hint1: r`Use $f^{-1}(N\setminus F)=M\setminus f^{-1}(F)$.`,
    officialSolution: r`Vale $f^{-1}(N\setminus F)=M\setminus f^{-1}(F)$ para todo $F\subset N$.

($\Rightarrow$) Se $F$ é fechado, $N\setminus F$ é aberto; por continuidade $f^{-1}(N\setminus F)=M\setminus f^{-1}(F)$ é aberto, então $f^{-1}(F)$ é fechado.

($\Leftarrow$) Seja $B\subset N$ aberto. Então $N\setminus B$ é fechado, logo $f^{-1}(N\setminus B)=M\setminus f^{-1}(B)$ é fechado, e $f^{-1}(B)$ é aberto. Pela caracterização por abertos, $f$ é contínua.`,
  }),
  em({
    n: 5,
    title: 'Teorema do valor intermediário via conexidade',
    statement: r`Admita que um intervalo $I\subset\mathbb R$ é conexo e que a imagem de um conexo por função contínua é conexa. Prove o teorema do valor intermediário: se $f:[a,b]\to\mathbb R$ é contínua e $f(a)<0<f(b)$, existe $c\in(a,b)$ com $f(c)=0$.`,
    source: `${AUT} — Tópico 6 (Proposição 2)`,
    difficulty: 3,
    tags: 'conexidade, valor intermediário',
    hint1: r`Os conexos de $\mathbb R$ são exatamente os intervalos.`,
    hint2: r`Suponha que $0\notin f([a,b])$ e construa uma cisão não trivial da imagem.`,
    officialSolution: r`$f([a,b])$ é conexo (imagem contínua de conexo), logo é um intervalo de $\mathbb R$. Ele contém $f(a)<0$ e $f(b)>0$; sendo intervalo, contém todo ponto entre eles, em particular $0$. Assim existe $c\in[a,b]$ com $f(c)=0$, e $c\ne a,b$ porque $f(a),f(b)\neq0$.

*Por que os conexos de $\mathbb R$ são intervalos:* se $X\subset\mathbb R$ não é um intervalo, existem $x<z<y$ com $x,y\in X$, $z\notin X$; então $X=(X\cap(-\infty,z))\cup(X\cap(z,\infty))$ é uma cisão não trivial.`,
  }),
  em({
    n: 6,
    title: 'Cauchy com subsequência convergente converge',
    statement: r`Seja $(x_n)$ uma sequência de Cauchy em um espaço métrico $M$ que possui uma subsequência $(x_{n_k})$ convergindo para $a\in M$. Prove que $x_n\to a$.`,
    source: `${AUT} — Tópico 7 (Proposição 3)`,
    difficulty: 2,
    tags: 'sequências de Cauchy, completude',
    hint1: r`Dado $\varepsilon>0$, use $\varepsilon/2$ para a propriedade de Cauchy e outros $\varepsilon/2$ para a subsequência.`,
    officialSolution: r`Seja $\varepsilon>0$. Existe $N$ tal que $d(x_m,x_n)<\varepsilon/2$ para $m,n\ge N$. Como $x_{n_k}\to a$, existe $k$ com $n_k\ge N$ e $d(x_{n_k},a)<\varepsilon/2$. Para todo $n\ge N$:

$$d(x_n,a)\le d(x_n,x_{n_k})+d(x_{n_k},a)<\frac\varepsilon2+\frac\varepsilon2=\varepsilon.$$

Logo $x_n\to a$.`,
  }),
  em({
    n: 7,
    title: 'Ponto fixo de cos x em [0,1] (Banach)',
    statement: r`Mostre que a equação $\cos x=x$ tem uma única solução em $[0,1]$ e que a iteração $x_{n+1}=\cos x_n$ converge para ela a partir de qualquer $x_0\in[0,1]$. (Teorema do ponto fixo de Banach: toda contração de um espaço métrico completo nele mesmo tem um único ponto fixo, limite das iteradas.)`,
    source: `${AUT} — Tópico 7 (contrações)`,
    difficulty: 3,
    tags: 'ponto fixo, contração, Banach, completude',
    hint1: r`Mostre que $f=\cos$ leva $[0,1]$ em $[0,1]$ e que $[0,1]$ é completo (fechado em $\mathbb R$).`,
    hint2: r`Pelo teorema do valor médio, $|\cos x-\cos y|\le\max|\sin|\,|x-y|$ e $\max_{[0,1]}\sin=\sin1<1$.`,
    officialSolution: r`$[0,1]$ é fechado em $\mathbb R$ (completo), logo é um espaço métrico completo.

*Invariância.* Para $x\in[0,1]$: $\cos x\in[\cos1,1]\subset[0,1]$ (cosseno decrescente e $\cos1\approx0{,}54>0$).

*Contração.* Pelo TVM, $|\cos x-\cos y|=|\sin\xi|\,|x-y|\le\sin1\cdot|x-y|$ com $\sin1\approx0{,}841<1$. Logo $\cos$ é contração de constante $\lambda=\sin1$.

Pelo teorema de Banach, existe um único $x^*\in[0,1]$ com $\cos x^*=x^*$, e $x_n\to x^*$ para qualquer $x_0\in[0,1]$, com $d(x_n,x^*)\le\lambda^n d(x_0,x^*)$. Numericamente $x^*\approx0{,}739085$.`,
  }),

  // ---------------- EDO ----------------
  edo({
    n: 1,
    title: 'Linear de 1ª ordem: y′ + (2/x)y = x',
    statement: r`Resolva $y'+\dfrac2x\,y=x$ para $x>0$.`,
    source: `${AUT} — Cap. 2 (fator integrante)`,
    difficulty: 1,
    tags: 'linear 1ª ordem, fator integrante',
    hint1: r`Fator integrante $\mu(x)=e^{\int 2/x\,dx}$.`,
    officialSolution: r`$\mu(x)=e^{2\ln x}=x^2$. Multiplicando: $(x^2y)'=x^3$. Integrando, $x^2y=\dfrac{x^4}{4}+C$, logo

$$y(x)=\frac{x^2}{4}+\frac{C}{x^2}.$$`,
  }),
  edo({
    n: 2,
    title: 'Separável com PVI: y′ = x/y, y(0)=2',
    statement: r`Resolva o problema de valor inicial $y'=\dfrac xy$, $y(0)=2$, e indique o intervalo máximo de definição da solução.`,
    source: `${AUT} — Cap. 2 (separáveis)`,
    difficulty: 1,
    tags: 'separável, PVI',
    hint1: r`$y\,dy=x\,dx$.`,
    officialSolution: r`$\int y\,dy=\int x\,dx\Rightarrow \dfrac{y^2}{2}=\dfrac{x^2}{2}+C$. De $y(0)=2$: $C=2$, então $y^2=x^2+4$. Como $y(0)>0$, tomamos o ramo positivo:

$$y(x)=\sqrt{x^2+4},\qquad x\in\mathbb R.$$

A solução está definida em toda a reta porque $x^2+4>0$ (o denominador $y$ nunca se anula).`,
  }),
  edo({
    n: 3,
    title: 'Equação exata: (2xy+3)dx + (x²−1)dy = 0',
    statement: r`Verifique que $(2xy+3)\,dx+(x^2-1)\,dy=0$ é exata e encontre a solução geral na forma implícita.`,
    source: `${AUT} — Cap. 2 (exatas)`,
    difficulty: 2,
    tags: 'exata, potencial',
    hint1: r`Compare $M_y$ e $N_x$.`,
    officialSolution: r`$M=2xy+3$, $N=x^2-1$: $M_y=2x=N_x$, logo é exata. Procuramos $\psi$ com $\psi_x=M$ e $\psi_y=N$:

$$\psi=\int(2xy+3)\,dx=x^2y+3x+h(y),\qquad \psi_y=x^2+h'(y)=x^2-1\Rightarrow h(y)=-y.$$

Solução geral: $x^2y+3x-y=C$, i.e., $y=\dfrac{C-3x}{x^2-1}$.`,
  }),
  edo({
    n: 4,
    title: 'Linear de 2ª ordem: y″ − 3y′ + 2y = e³ˣ',
    statement: r`Encontre a solução geral de $y''-3y'+2y=e^{3x}$.`,
    source: `${AUT} — Cap. 3 (coeficientes indeterminados)`,
    difficulty: 2,
    tags: 'segunda ordem, coeficientes indeterminados',
    hint1: r`Equação característica $r^2-3r+2=0$.`,
    hint2: r`Teste $y_p=Ae^{3x}$ (3 não é raiz característica).`,
    officialSolution: r`Raízes: $r=1,2$. Homogênea: $y_h=C_1e^x+C_2e^{2x}$.

$y_p=Ae^{3x}$: $(9-9+2)Ae^{3x}=2Ae^{3x}=e^{3x}\Rightarrow A=\tfrac12$.

$$y=C_1e^x+C_2e^{2x}+\tfrac12e^{3x}.$$`,
  }),
  edo({
    n: 5,
    title: 'Variação de parâmetros: y″ + y = tan x',
    statement: r`Resolva $y''+y=\tan x$ em $(-\pi/2,\pi/2)$ por variação de parâmetros.`,
    source: `${AUT} — Cap. 3 (variação de parâmetros)`,
    difficulty: 3,
    tags: 'segunda ordem, variação de parâmetros, Wronskiano',
    hint1: r`$y_1=\cos x$, $y_2=\sin x$, $W=1$.`,
    hint2: r`$u_1'=-y_2g/W=-\sin x\tan x$, $u_2'=y_1g/W=\sin x$.`,
    officialSolution: r`Com $y_1=\cos x$, $y_2=\sin x$, $W(y_1,y_2)=1$ e $g=\tan x$:

$$u_1'=-\sin x\tan x=-\frac{\sin^2x}{\cos x}=\cos x-\sec x,\qquad u_2'=\cos x\tan x=\sin x.$$

Logo $u_1=\sin x-\ln|\sec x+\tan x|$, $u_2=-\cos x$, e

$$y_p=u_1\cos x+u_2\sin x=-\cos x\,\ln|\sec x+\tan x|.$$

$$y=C_1\cos x+C_2\sin x-\cos x\,\ln|\sec x+\tan x|.$$`,
  }),
  edo({
    n: 6,
    title: 'Sistema linear 2×2: autovalores 3 e −1 (sela)',
    statement: r`Resolva $\mathbf x'=\begin{pmatrix}1&2\\2&1\end{pmatrix}\mathbf x$ e classifique a origem no retrato de fases.`,
    source: `${AUT} — Cap. 7 (sistemas)`,
    difficulty: 2,
    tags: 'sistemas, autovalores, retrato de fases',
    hint1: r`$\det(A-\lambda I)=(1-\lambda)^2-4$.`,
    officialSolution: r`$(1-\lambda)^2=4\Rightarrow\lambda=3$ ou $\lambda=-1$. Autovetores: $\lambda=3$: $(1,1)$; $\lambda=-1$: $(1,-1)$.

$$\mathbf x(t)=C_1e^{3t}\begin{pmatrix}1\\1\end{pmatrix}+C_2e^{-t}\begin{pmatrix}1\\-1\end{pmatrix}.$$

Autovalores reais de sinais opostos: a origem é um **ponto de sela** (instável); as trajetórias se aproximam da origem ao longo de $(1,-1)$ e se afastam ao longo de $(1,1)$.`,
  }),
  edo({
    n: 7,
    title: 'PVI com raízes complexas: y″ + 2y′ + 5y = 0',
    statement: r`Resolva $y''+2y'+5y=0$, $y(0)=1$, $y'(0)=0$.`,
    source: `${AUT} — Cap. 3 (raízes complexas)`,
    difficulty: 2,
    tags: 'segunda ordem, raízes complexas, PVI',
    hint1: r`$r=-1\pm2i$.`,
    officialSolution: r`$y=e^{-t}(A\cos2t+B\sin2t)$. $y(0)=A=1$. $y'=e^{-t}\big((-A+2B)\cos2t+(-B-2A)\sin2t\big)$, então $y'(0)=-A+2B=0\Rightarrow B=\tfrac12$.

$$y(t)=e^{-t}\left(\cos2t+\tfrac12\sin2t\right).$$

Oscilação subamortecida com decaimento $e^{-t}$.`,
  }),
  edo({
    n: 8,
    title: 'Falha de unicidade: y′ = y^{1/3}, y(0)=0',
    statement: r`Mostre que o PVI $y'=y^{1/3}$, $y(0)=0$ possui mais de uma solução para $t\ge0$ e explique por que isso não contradiz o teorema de existência e unicidade.`,
    source: `${AUT} — Cap. 2 (existência e unicidade)`,
    difficulty: 3,
    tags: 'existência e unicidade, Lipschitz',
    hint1: r`Uma solução é $y\equiv0$. Procure outra por separação de variáveis, sem dividir por zero.`,
    officialSolution: r`$y\equiv0$ é solução. Separando em $y\ne0$: $y^{-1/3}dy=dt\Rightarrow\tfrac32y^{2/3}=t+C$; com $C=0$, $y(t)=\left(\tfrac{2t}{3}\right)^{3/2}$ para $t\ge0$. Verificação: $y'=\left(\tfrac{2t}3\right)^{1/2}=y^{1/3}$ e $y(0)=0$ ✓.

Há, portanto, pelo menos duas soluções (e infinitas: $y=0$ até $t_0$, depois $\left(\tfrac{2(t-t_0)}3\right)^{3/2}$).

**Teorema de Picard.** Exige $f(t,y)=y^{1/3}$ contínua *e* Lipschitz em $y$ perto de $(0,0)$. Aqui $\partial f/\partial y=\tfrac13y^{-2/3}$ é ilimitada perto de $y=0$, então $f$ não é Lipschitz em $y$ e a hipótese de unicidade falha (a existência, que só pede continuidade, vale — Peano).`,
  }),

  // ---------------- Cálculo II ----------------
  calc({
    n: 1,
    title: 'Raio de convergência de Σ n! xⁿ/nⁿ',
    statement: r`Determine o raio de convergência da série de potências $\displaystyle\sum_{n=1}^\infty\frac{n!}{n^n}x^n$.`,
    source: `${AUT} — séries de potências`,
    difficulty: 2,
    tags: 'séries de potências, raio de convergência, critério da razão',
    hint1: r`Critério da razão em $a_n=n!/n^n$; lembre $\left(1+\tfrac1n\right)^n\to e$.`,
    officialSolution: r`$$\frac{a_{n+1}}{a_n}=\frac{(n+1)!}{(n+1)^{n+1}}\cdot\frac{n^n}{n!}=\frac{n^n}{(n+1)^n}=\left(1+\frac1n\right)^{-n}\to\frac1e.$$

Logo $R=\lim a_n/a_{n+1}=e$. A série converge absolutamente para $|x|<e$ e diverge para $|x|>e$.`,
  }),
  calc({
    n: 2,
    title: 'Convergência de Σ 1/(n ln²n) pelo teste da integral',
    statement: r`Estude a convergência de $\displaystyle\sum_{n=2}^\infty\frac1{n(\ln n)^2}$.`,
    source: `${AUT} — séries numéricas`,
    difficulty: 2,
    tags: 'séries numéricas, teste da integral',
    hint1: r`$f(x)=\dfrac1{x(\ln x)^2}$ é positiva e decrescente em $[2,\infty)$.`,
    officialSolution: r`Pelo teste da integral:

$$\int_2^\infty\frac{dx}{x(\ln x)^2}=\left[-\frac1{\ln x}\right]_2^\infty=\frac1{\ln2}<\infty.$$

A integral converge, logo a série **converge**. (Compare: $\sum\frac1{n\ln n}$ diverge — a potência do logaritmo decide.)`,
  }),
  calc({
    n: 3,
    title: '∫₀¹ e^{−x²} dx por série de Maclaurin',
    statement: r`Use a série de Maclaurin de $e^{-x^2}$ para calcular $\displaystyle\int_0^1e^{-x^2}dx$ com erro menor que $10^{-3}$.`,
    source: `${AUT} — séries de Taylor`,
    difficulty: 3,
    tags: 'Taylor, Maclaurin, integração termo a termo, série alternada',
    hint1: r`$e^{-x^2}=\sum_{n\ge0}\frac{(-1)^nx^{2n}}{n!}$ e integre termo a termo.`,
    officialSolution: r`$$\int_0^1e^{-x^2}dx=\sum_{n=0}^\infty\frac{(-1)^n}{n!\,(2n+1)}=1-\frac13+\frac1{10}-\frac1{42}+\frac1{216}-\frac1{1320}+\cdots$$

É uma série alternada com termos decrescentes: o erro é menor que o primeiro termo omitido. Parando após $n=4$, o próximo termo é $\tfrac1{1320}\approx7{,}6\times10^{-4}<10^{-3}$. Soma até $n=4$: $1-0{,}33333+0{,}1-0{,}02381+0{,}00463\approx0{,}7475$.

Valor: $\approx0{,}747$ (o valor exato é $0{,}74682\ldots$).`,
  }),
  calc({
    n: 4,
    title: 'Pontos críticos de x³ − 3xy + y³',
    statement: r`Encontre e classifique os pontos críticos de $f(x,y)=x^3-3xy+y^3$.`,
    source: `${AUT} — extremos`,
    difficulty: 2,
    tags: 'máximos e mínimos, Hessiano, ponto de sela',
    hint1: r`$f_x=3x^2-3y$, $f_y=3y^2-3x$. De $f_x=0$: $y=x^2$.`,
    officialSolution: r`$f_x=0\Rightarrow y=x^2$; $f_y=0\Rightarrow x=y^2=x^4\Rightarrow x=0$ ou $x=1$. Pontos reais: $(0,0)$ e $(1,1)$.

Hessiano: $f_{xx}=6x$, $f_{yy}=6y$, $f_{xy}=-3$, $D=36xy-9$.

- $(0,0)$: $D=-9<0$ ⇒ **ponto de sela**.
- $(1,1)$: $D=27>0$ e $f_{xx}=6>0$ ⇒ **mínimo local**, $f(1,1)=-1$.`,
  }),
  calc({
    n: 5,
    title: 'Lagrange: extremos de xy sobre x² + y² = 2',
    statement: r`Use multiplicadores de Lagrange para achar o máximo e o mínimo de $f(x,y)=xy$ sobre a circunferência $x^2+y^2=2$.`,
    source: `${AUT} — Lagrange`,
    difficulty: 2,
    tags: 'multiplicadores de Lagrange, extremos condicionados',
    hint1: r`$\nabla f=\lambda\nabla g$ com $g=x^2+y^2$: $y=2\lambda x$, $x=2\lambda y$.`,
    officialSolution: r`De $y=2\lambda x$ e $x=2\lambda y$: $xy=2\lambda x^2=2\lambda y^2$, então $x^2=y^2$ (se $\lambda\ne0$; $\lambda=0$ daria $x=y=0$, fora da curva). Com $x^2+y^2=2$: $x=\pm1$, $y=\pm1$.

- $(1,1)$ e $(-1,-1)$: $f=1$ (**máximo**).
- $(1,-1)$ e $(-1,1)$: $f=-1$ (**mínimo**).

A curva é compacta, então o máximo e o mínimo existem e estão entre os pontos críticos.`,
  }),
  calc({
    n: 6,
    title: 'Integral dupla em coordenadas polares: e^{−(x²+y²)}',
    statement: r`Calcule $\displaystyle\iint_{x^2+y^2\le1}e^{-(x^2+y^2)}\,dA$.`,
    source: `${AUT} — integrais múltiplas`,
    difficulty: 2,
    tags: 'integrais duplas, coordenadas polares',
    hint1: r`$x=\rho\cos\theta$, $y=\rho\sin\theta$, $dA=\rho\,d\rho\,d\theta$.`,
    officialSolution: r`$$\int_0^{2\pi}\!\!\int_0^1e^{-\rho^2}\rho\,d\rho\,d\theta=2\pi\cdot\left[-\tfrac12e^{-\rho^2}\right]_0^1=\pi\left(1-e^{-1}\right)\approx1{,}986.$$`,
  }),
  calc({
    n: 7,
    title: '∭ z dV na meia-bola unitária',
    statement: r`Calcule $\displaystyle\iiint_Ez\,dV$, onde $E=\{x^2+y^2+z^2\le1,\ z\ge0\}$.`,
    source: `${AUT} — coordenadas esféricas`,
    difficulty: 3,
    tags: 'integrais triplas, coordenadas esféricas',
    hint1: r`$z=\rho\cos\varphi$, $dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$, $0\le\varphi\le\pi/2$.`,
    officialSolution: r`$$\int_0^{2\pi}\!d\theta\int_0^{\pi/2}\!\cos\varphi\sin\varphi\,d\varphi\int_0^1\rho^3\,d\rho=2\pi\cdot\tfrac12\cdot\tfrac14=\frac\pi4.$$`,
  }),
  calc({
    n: 8,
    title: 'Teorema de Green: área da elipse',
    statement: r`Use o teorema de Green com o campo $\mathbf F=(-y,\,x)$ para calcular a área da região limitada pela elipse $\dfrac{x^2}{a^2}+\dfrac{y^2}{b^2}=1$.`,
    source: `${AUT} — cálculo vetorial`,
    difficulty: 3,
    tags: 'Green, integral de linha, área',
    hint1: r`$\oint_C(-y\,dx+x\,dy)=\iint_D\left(\partial_x x-\partial_y(-y)\right)dA=2\,\text{Área}(D)$.`,
    officialSolution: r`Parametrize $x=a\cos t$, $y=b\sin t$, $t\in[0,2\pi]$ (sentido anti-horário). Então $-y\,dx+x\,dy=(ab\sin^2t+ab\cos^2t)\,dt=ab\,dt$ e

$$\oint_C(-y\,dx+x\,dy)=2\pi ab=2\,\text{Área}\ \Rightarrow\ \text{Área}=\pi ab.$$`,
  }),

  // ---------------- Álgebra Linear ----------------
  al({
    n: 1,
    title: 'Inversa por Cayley–Hamilton',
    statement: r`Seja $A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$. Calcule o polinômio característico, verifique o teorema de Cayley–Hamilton e use-o para obter $A^{-1}$.`,
    source: `${AUT} — Cayley–Hamilton`,
    difficulty: 2,
    tags: 'Cayley-Hamilton, polinômio característico, inversa',
    hint1: r`Para $2\times2$: $p(\lambda)=\lambda^2-\text{tr}(A)\lambda+\det A$.`,
    officialSolution: r`$\text{tr}A=5$, $\det A=-2$: $p(\lambda)=\lambda^2-5\lambda-2$.

Cayley–Hamilton: $A^2-5A-2I=0$. Verificação: $A^2=\begin{pmatrix}7&10\\15&22\end{pmatrix}$ e $5A+2I=\begin{pmatrix}7&10\\15&22\end{pmatrix}$ ✓.

Daí $A(A-5I)=2I\Rightarrow A^{-1}=\tfrac12(A-5I)=\begin{pmatrix}-2&1\\ \tfrac32&-\tfrac12\end{pmatrix}$.`,
  }),
  al({
    n: 2,
    title: 'Teorema do núcleo e da imagem em T(x,y,z)=(x+y, y+z)',
    statement: r`Seja $T:\mathbb R^3\to\mathbb R^2$, $T(x,y,z)=(x+y,\ y+z)$. Determine uma base do núcleo e da imagem e verifique o teorema do núcleo e da imagem.`,
    source: `${AUT} — transformações lineares`,
    difficulty: 1,
    tags: 'núcleo, imagem, dimensão',
    hint1: r`$\ker T$: resolva $x+y=0$, $y+z=0$.`,
    officialSolution: r`$\ker T$: $y=-x$, $z=-y=x$, logo $\ker T=\{x(1,-1,1)\}$, base $\{(1,-1,1)\}$, $\dim=1$.

$\text{Im}\,T$: $T(1,0,0)=(1,0)$ e $T(0,0,1)=(0,1)$ geram $\mathbb R^2$; base $\{(1,0),(0,1)\}$, $\dim=2$.

$\dim\ker T+\dim\text{Im}\,T=1+2=3=\dim\mathbb R^3$ ✓.`,
  }),
  al({
    n: 3,
    title: 'Potências de [[2,1],[1,2]] por diagonalização',
    statement: r`Diagonalize $A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$ e obtenha uma fórmula fechada para $A^n$.`,
    source: `${AUT} — diagonalização`,
    difficulty: 2,
    tags: 'autovalores, diagonalização, potências de matriz',
    hint1: r`Autovalores: $\lambda=3$ e $\lambda=1$.`,
    officialSolution: r`$\det(A-\lambda I)=(2-\lambda)^2-1\Rightarrow\lambda=3,1$, com autovetores $(1,1)$ e $(1,-1)$. Então $A=PDP^{-1}$ com $P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}$, $D=\text{diag}(3,1)$, $P^{-1}=\tfrac12\begin{pmatrix}1&1\\1&-1\end{pmatrix}$, e

$$A^n=PD^nP^{-1}=\frac12\begin{pmatrix}3^n+1&3^n-1\\3^n-1&3^n+1\end{pmatrix}.$$

Teste: $n=2$ dá $\begin{pmatrix}5&4\\4&5\end{pmatrix}=A^2$ ✓.`,
  }),
  al({
    n: 4,
    title: 'Gram–Schmidt em ℝ³',
    statement: r`Aplique Gram–Schmidt a $v_1=(1,1,0)$ e $v_2=(1,0,1)$ (produto interno usual) e obtenha uma base ortonormal de $\text{span}\{v_1,v_2\}$.`,
    source: `${AUT} — ortogonalização`,
    difficulty: 2,
    tags: 'Gram-Schmidt, produto interno',
    officialSolution: r`$e_1=\dfrac{v_1}{\|v_1\|}=\dfrac1{\sqrt2}(1,1,0)$.

$u_2=v_2-\langle v_2,e_1\rangle e_1=(1,0,1)-\dfrac1{\sqrt2}\cdot\dfrac1{\sqrt2}(1,1,0)=\left(\tfrac12,-\tfrac12,1\right)$, $\|u_2\|=\sqrt{\tfrac32}$.

$$e_2=\frac{1}{\sqrt6}(1,-1,2).$$

Conferência: $\langle e_1,e_2\rangle=\frac1{\sqrt{12}}(1-1+0)=0$ ✓.`,
  }),
  al({
    n: 5,
    title: 'Mínimos quadrados: reta ajustada a quatro pontos',
    statement: r`Ajuste uma reta $y=a+bx$ por mínimos quadrados aos pontos $(0,1),(1,2),(2,2),(3,4)$.`,
    source: `${AUT} — projeção ortogonal e mínimos quadrados`,
    difficulty: 2,
    tags: 'mínimos quadrados, equações normais',
    hint1: r`Equações normais $A^TA\,\beta=A^Ty$ com $A=\begin{pmatrix}1&0\\1&1\\1&2\\1&3\end{pmatrix}$.`,
    officialSolution: r`$A^TA=\begin{pmatrix}4&6\\6&14\end{pmatrix}$, $A^Ty=\begin{pmatrix}9\\18\end{pmatrix}$. Sistema: $4a+6b=9$, $6a+14b=18$. Subtraindo $\tfrac32\times$ a primeira da segunda: $5b=4{,}5\Rightarrow b=0{,}9$ e $a=0{,}9$.

$$y=0{,}9+0{,}9x.$$

Resíduos: $0{,}1;\ 0{,}2;\ -0{,}7;\ 0{,}4$ (soma $0$, como esperado pois a coluna de 1's está no modelo).`,
  }),
  al({
    n: 6,
    title: 'Autovalores de matriz simétrica real são reais',
    statement: r`Prove que todos os autovalores de uma matriz real simétrica $A\in M_n(\mathbb R)$ são reais.`,
    source: `${AUT} — teorema espectral`,
    difficulty: 3,
    tags: 'simétricas, autovalores, demonstração',
    hint1: r`Se $Av=\lambda v$ com $v\in\mathbb C^n\setminus\{0\}$, calcule $\bar v^TAv$ de duas maneiras.`,
    officialSolution: r`Seja $Av=\lambda v$, $v\in\mathbb C^n$, $v\ne0$. Então $\bar v^TAv=\lambda\,\bar v^Tv=\lambda\|v\|^2$.

Por outro lado, como $A$ é real e simétrica, $\overline{\bar v^TAv}=v^TA\bar v=(v^TA\bar v)^T=\bar v^TA^Tv=\bar v^TAv$, logo $\bar v^TAv$ é real. Como $\|v\|^2>0$ é real, $\lambda=\bar v^TAv/\|v\|^2\in\mathbb R$.`,
  }),
  al({
    n: 7,
    title: 'Nilpotente: I − A é invertível',
    statement: r`Seja $A\in M_n(\mathbb R)$ nilpotente, $A^k=0$ para algum $k\ge1$. Prove que $I-A$ é invertível e exiba a inversa.`,
    source: `${AUT} — matrizes`,
    difficulty: 2,
    tags: 'nilpotente, inversa, série geométrica',
    hint1: r`Lembre $1-t^k=(1-t)(1+t+\dots+t^{k-1})$.`,
    officialSolution: r`$(I-A)(I+A+A^2+\dots+A^{k-1})=I-A^k=I$, e as matrizes comutam, logo

$$(I-A)^{-1}=I+A+A^2+\dots+A^{k-1}.$$`,
  }),

  // ---------------- Cálculo Numérico ----------------
  num({
    n: 1,
    title: 'Bissecção em x³ − x − 2 = 0',
    statement: r`Aplique 3 iterações do método da bissecção a $f(x)=x^3-x-2$ em $[1,2]$ e estime quantas iterações garantem erro menor que $10^{-3}$.`,
    source: `${AUT} — zeros de funções`,
    difficulty: 1,
    tags: 'bissecção, zeros de funções, erro',
    hint1: r`O erro após $n$ passos é no máximo $(b-a)/2^n$.`,
    officialSolution: r`$f(1)=-2<0$, $f(2)=4>0$.

1. $c=1{,}5$: $f=-0{,}125<0$ ⇒ intervalo $[1{,}5;\,2]$.
2. $c=1{,}75$: $f\approx1{,}609>0$ ⇒ $[1{,}5;\,1{,}75]$.
3. $c=1{,}625$: $f\approx0{,}666>0$ ⇒ $[1{,}5;\,1{,}625]$.

A raiz é $\approx1{,}5214$. Para erro $<10^{-3}$: $\dfrac1{2^n}<10^{-3}\iff n\ge10$ (pois $2^{10}=1024$).`,
  }),
  num({
    n: 2,
    title: 'Newton para √2 e convergência quadrática',
    statement: r`Use o método de Newton em $f(x)=x^2-2$ com $x_0=1$ e calcule $x_1,x_2,x_3$. Explique por que o número de dígitos corretos aproximadamente dobra a cada passo.`,
    source: `${AUT} — Newton–Raphson`,
    difficulty: 2,
    tags: 'Newton-Raphson, convergência quadrática',
    hint1: r`$x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}=\frac12\left(x_n+\frac2{x_n}\right)$.`,
    officialSolution: r`$x_1=1{,}5$, $x_2=1{,}41667$, $x_3=1{,}414216$ (e $\sqrt2=1{,}414214$).

Seja $e_n=x_n-\sqrt2$. Então $e_{n+1}=\dfrac{e_n^2}{2x_n}$: o erro é elevado ao quadrado (vezes uma constante $\approx\frac1{2\sqrt2}$), logo o número de dígitos corretos dobra por iteração perto da raiz simples. Erros: $e_1\approx0{,}086$, $e_2\approx2{,}5\times10^{-3}$, $e_3\approx2{,}1\times10^{-6}$.`,
  }),
  num({
    n: 3,
    title: 'Fatoração LU de um sistema 3×3',
    statement: r`Resolva por eliminação de Gauss/fatoração LU o sistema $\begin{pmatrix}1&1&1\\2&3&1\\1&2&3\end{pmatrix}\mathbf x=\begin{pmatrix}6\\11\\14\end{pmatrix}$ e exiba $L$ e $U$.`,
    source: `${AUT} — sistemas lineares`,
    difficulty: 2,
    tags: 'eliminação de Gauss, LU',
    officialSolution: r`Multiplicadores: $m_{21}=2$, $m_{31}=1$; depois $m_{32}=1$.

$$L=\begin{pmatrix}1&0&0\\2&1&0\\1&1&1\end{pmatrix},\qquad U=\begin{pmatrix}1&1&1\\0&1&-1\\0&0&3\end{pmatrix}.$$

$L\mathbf y=\mathbf b$: $\mathbf y=(6,\,-1,\,9)$. $U\mathbf x=\mathbf y$: $z=3$, $y-z=-1\Rightarrow y=2$, $x=6-2-3=1$.

$$\mathbf x=(1,2,3),\qquad\det A=1\cdot1\cdot3=3.$$`,
  }),
  num({
    n: 4,
    title: 'Jacobi: convergência e três iterações',
    statement: r`Para $\begin{pmatrix}4&1\\2&5\end{pmatrix}\mathbf x=\begin{pmatrix}5\\7\end{pmatrix}$ faça 3 iterações de Jacobi a partir de $\mathbf x^{(0)}=(0,0)$ e justifique a convergência.`,
    source: `${AUT} — métodos iterativos`,
    difficulty: 2,
    tags: 'Jacobi, convergência, diagonal dominante',
    officialSolution: r`$x^{(k+1)}=(5-y^{(k)})/4$, $y^{(k+1)}=(7-2x^{(k)})/5$.

- $k=1$: $(1{,}25;\ 1{,}4)$
- $k=2$: $(0{,}9;\ 0{,}9)$
- $k=3$: $(1{,}025;\ 1{,}04)$ → solução exata $(1,1)$.

**Convergência.** A matriz é estritamente diagonal dominante por linhas ($4>1$, $5>2$), o que garante convergência de Jacobi. Diretamente: a matriz de iteração $\begin{pmatrix}0&-\tfrac14\\-\tfrac25&0\end{pmatrix}$ tem autovalores $\pm\sqrt{1/10}\approx\pm0{,}316$, raio espectral $<1$.`,
  }),
  num({
    n: 5,
    title: 'Simpson e seu erro para ∫₀¹ x⁴ dx',
    statement: r`Aproxime $\int_0^1x^4\,dx$ pela regra de Simpson com $n=2$ subintervalos e compare com o valor exato e com o limitante de erro teórico.`,
    source: `${AUT} — integração numérica`,
    difficulty: 2,
    tags: 'Simpson, integração numérica, erro',
    hint1: r`Erro de Simpson composta: $-\dfrac{(b-a)h^4}{180}f^{(4)}(\xi)$.`,
    officialSolution: r`$h=0{,}5$: $S=\dfrac h3\left[f(0)+4f(0{,}5)+f(1)\right]=\dfrac16\left[0+4\cdot0{,}0625+1\right]=0{,}208\overline3$.

Exato: $0{,}2$. Erro real: $0{,}00833$.

Teórico: $f^{(4)}=24$ (constante), logo $\dfrac{(1)(0{,}5)^4}{180}\cdot24=\dfrac{0{,}0625\cdot24}{180}=0{,}00833$ — coincide exatamente.`,
  }),
  num({
    n: 6,
    title: 'Interpolação de Newton por 3 pontos',
    statement: r`Encontre o polinômio de grau $\le2$ que passa por $(0,1)$, $(1,3)$ e $(2,2)$ usando diferenças divididas.`,
    source: `${AUT} — interpolação`,
    difficulty: 2,
    tags: 'interpolação, diferenças divididas, Newton',
    officialSolution: r`$f[0,1]=2$, $f[1,2]=-1$, $f[0,1,2]=\dfrac{-1-2}{2-0}=-\tfrac32$.

$$P(x)=1+2x-\tfrac32\,x(x-1)=1+\tfrac72x-\tfrac32x^2.$$

Verificação: $P(1)=1+3{,}5-1{,}5=3$ ✓, $P(2)=1+7-6=2$ ✓.`,
  }),
];
