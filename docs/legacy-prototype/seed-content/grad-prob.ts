import { bank, r } from './factory';

const q = bank('grad', 'course-5952014', 'pe2');
const P1 = 'P1 2025 — Prof. R. A. Rosales (13/10/2025)';
const P3 = 'Prova 3 (P2) 2024 — Prof. R. A. Rosales (03/12/2024)';

export const probQuestions = [
  q({
    n: 'p1-2025-1',
    title: 'Viés do estimador baseado em U[2, θ] (n = 1)',
    statement: r`Seja $U_1$ uma amostra de tamanho $n=1$ de uma distribuição uniforme no intervalo $[2,\theta]$.

(i) Mostre que $U_1$ é viesado para $\theta$ e calcule o viés.

(ii) Defina um estimador não viesado para $\theta$ a partir da sua resposta em (i).`,
    source: P1,
    difficulty: 2,
    tags: 'estimação pontual, viés, uniforme',
    hint1: r`Calcule $E[U_1]$: a média de uma uniforme em $[a,b]$ é o ponto médio.`,
    hint2: r`Viés $=E[\hat\theta]-\theta$. Se o viés depende de $\theta$ de modo afim, dá para "desfazê-lo" com uma transformação afim de $U_1$.`,
    officialSolution: r`**(i)** $E[U_1]=\dfrac{2+\theta}{2}=1+\dfrac{\theta}{2}$. Logo

$$\text{viés}(U_1)=E[U_1]-\theta=1-\frac{\theta}{2}=\frac{2-\theta}{2},$$

que só é zero se $\theta=2$ (caso degenerado). Portanto $U_1$ é viesado.

**(ii)** Queremos $a\,U_1+b$ com esperança $\theta$: $a\left(1+\tfrac\theta2\right)+b=\theta$ para todo $\theta$ ⇒ $a=2$, $b=-2$. Então

$$\hat\theta=2U_1-2$$

é não viesado: $E[\hat\theta]=2+\theta-2=\theta$.`,
  }),
  q({
    n: 'p1-2025-2',
    title: 'EQM de X₁ versus a constante 1/2 (Bernoulli)',
    statement: r`Seja $X$ uma população Bernoulli($\theta$) e $X_1$ uma amostra de tamanho $n=1$ de $X$. Sejam $\hat\theta_1=X_1$ e $\hat\theta_2=\tfrac12$ dois estimadores para $\theta$.

(i) Determine o erro quadrático médio, EQM, de cada estimador, $\hat\theta_1$ e $\hat\theta_2$.

(ii) É possível escolhermos um destes estimadores baseados no EQM, independentemente de serem viesados ou não? Justifique cuidadosamente a sua resposta.`,
    source: P1,
    difficulty: 3,
    tags: 'estimação pontual, EQM, viés-variância',
    hint1: r`$\text{EQM}(\hat\theta)=\text{Var}(\hat\theta)+\text{viés}(\hat\theta)^2$.`,
    hint2: r`Compare as duas funções de $\theta\in(0,1)$: estude o sinal de $\text{EQM}(\hat\theta_1)-\text{EQM}(\hat\theta_2)$.`,
    officialSolution: r`**(i)** $\hat\theta_1=X_1$ é não viesado, então $\text{EQM}(\hat\theta_1)=\text{Var}(X_1)=\theta(1-\theta)$.

$\hat\theta_2=\tfrac12$ é constante: variância $0$ e viés $\tfrac12-\theta$. Logo $\text{EQM}(\hat\theta_2)=\left(\tfrac12-\theta\right)^2$.

**(ii)** Diferença:

$$\text{EQM}(\hat\theta_1)-\text{EQM}(\hat\theta_2)=\theta-\theta^2-\left(\tfrac14-\theta+\theta^2\right)=-2\left(\theta^2-\theta+\tfrac18\right).$$

As raízes de $\theta^2-\theta+\tfrac18$ são $\theta=\dfrac{1}{2}\pm\dfrac{1}{2\sqrt2}\approx 0{,}146$ e $0{,}854$.

- Para $\theta\in(0{,}146;\,0{,}854)$ a diferença é positiva: $\hat\theta_2=\tfrac12$ tem **menor** EQM.
- Fora desse intervalo, $\hat\theta_1=X_1$ tem menor EQM.

Nenhum estimador domina o outro para todo $\theta$; a escolha por EQM depende do valor (desconhecido) de $\theta$. Logo **não** é possível escolher, só pelo EQM, um deles uniformemente — e o estimador "tolo" $1/2$ ganha justamente por ter variância nula, apesar de ser viesado.`,
  }),
  q({
    n: 'p1-2025-3',
    title: 'Viés e consistência de X̄ₙ e (1/(n−1))ΣXᵢ',
    statement: r`Seja $X_1,\dots,X_n$ uma amostra de $X$ tal que $E[X]=\mu$ e $\text{Var}(X)=\sigma^2$. Sejam $\bar X_n$ e $\dfrac{1}{n-1}\sum_{i=1}^{n}X_i$ dois estimadores para $\mu$.

(i) Determine o viés destes estimadores.

(ii) Diga se os estimadores são consistentes para $\mu$, justifique a sua resposta.

(iii) Com base em (i) e (ii), é possível estabelecer alguma relação entre viés e consistência de um estimador? Justifique.`,
    source: P1,
    difficulty: 3,
    tags: 'estimação pontual, consistência, viés',
    hint1: r`Escreva o segundo estimador como $\dfrac{n}{n-1}\bar X_n$.`,
    hint2: r`Consistência: use $\text{EQM}\to0$ (que implica convergência em probabilidade) ou a lei fraca dos grandes números.`,
    officialSolution: r`**(i)** $E[\bar X_n]=\mu$, viés $0$. Para $\tilde\mu=\dfrac{1}{n-1}\sum X_i=\dfrac{n}{n-1}\bar X_n$:

$$E[\tilde\mu]=\frac{n}{n-1}\mu\quad\Rightarrow\quad\text{viés}(\tilde\mu)=\frac{\mu}{n-1}.$$

**(ii)** $\bar X_n\to\mu$ em probabilidade pela lei fraca (ou: $\text{EQM}=\sigma^2/n\to0$). Para $\tilde\mu$:

$$\text{Var}(\tilde\mu)=\frac{n^2}{(n-1)^2}\cdot\frac{\sigma^2}{n}=\frac{n\sigma^2}{(n-1)^2}\to0,\qquad \text{viés}^2=\frac{\mu^2}{(n-1)^2}\to0,$$

então $\text{EQM}(\tilde\mu)\to0$ e $\tilde\mu$ também é consistente.

**(iii)** Os dois são consistentes, mas só o primeiro é não viesado: **viés não impede consistência** (basta que o viés tenda a $0$ — estimador assintoticamente não viesado — e a variância também). Reciprocamente, ser não viesado não garante consistência: $X_1$ é não viesado para $\mu$ e **não** é consistente (sua distribuição não se concentra quando $n$ cresce). Logo não há relação de implicação em nenhum sentido entre viés e consistência.`,
  }),
  q({
    n: 'p1-2025-4',
    title: 'EMV de np(p+1) pela invariância (Binomial)',
    statement: r`Suponha que $X\sim\text{Binomial}(n,p)$, isto é, $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$, $k=0,\dots,n$, e suponha $n$ conhecido. Utilize o princípio de invariância da verossimilhança, enunciado abaixo, para determinar o estimador de máxima verossimilhança de $\text{Var}(X)=np(p+1)$.

*Princípio de invariância da verossimilhança:* sejam $\tau:\mathbb R\to\mathbb R$ injetora e $\hat\theta_{MV}$ o estimador de máxima verossimilhança de $\theta$. O estimador de máxima verossimilhança de $\tau(\theta)$ é $\tau(\theta)_{MV}=\tau(\hat\theta_{MV})$.

**Nota:** o enunciado foi transcrito como está no PDF (a expressão $np(p+1)$ é a do original; a injetividade de $\tau(p)=np(p+1)$ em $p>0$ é o que permite aplicar o princípio).`,
    source: P1,
    difficulty: 2,
    tags: 'máxima verossimilhança, invariância, binomial',
    hint1: r`Primeiro ache o EMV de $p$: derive $\log L(p)=\text{const}+x\log p+(n-x)\log(1-p)$.`,
    hint2: r`$\tau(p)=np(p+1)$ é crescente para $p>0$, logo injetora no domínio relevante.`,
    officialSolution: r`**EMV de $p$.** $\ell(p)=\log\binom nx+x\log p+(n-x)\log(1-p)$, $\ell'(p)=\dfrac xp-\dfrac{n-x}{1-p}=0\iff p=\dfrac xn$. A segunda derivada é negativa, então $\hat p_{MV}=X/n$.

**Invariância.** $\tau(p)=np(p+1)$ é estritamente crescente em $p>0$, portanto injetora. Logo

$$\widehat{\tau(p)}_{MV}=n\,\hat p\,(\hat p+1)=n\cdot\frac Xn\left(\frac Xn+1\right)=\frac{X(X+n)}{n}.$$`,
  }),
  q({
    n: 'p1-2025-5',
    title: 'min{X₁,…,Xₙ} é consistente para θ (Uniforme[θ, 0])',
    statement: r`(*Opcional: vale um ponto na P2.*) Seja $X\sim\text{Uniforme}[\theta,0]$, com $\theta<0$. Seja $X_1,\dots,X_n$ uma amostra de $X$. Mostre que $\min\{X_1,\dots,X_n\}$ é consistente para $\theta$.`,
    source: P1,
    difficulty: 3,
    tags: 'consistência, estatística de ordem, uniforme',
    hint1: r`Para $\varepsilon>0$ pequeno, $\{|\min-\theta|>\varepsilon\}=\{\min>\theta+\varepsilon\}$, pois $\min\ge\theta$ sempre.`,
    hint2: r`$\min>\theta+\varepsilon$ significa que **todos** os $X_i$ ficam acima de $\theta+\varepsilon$; use independência.`,
    officialSolution: r`Seja $M_n=\min\{X_1,\dots,X_n\}$. Como $X_i\ge\theta$, temos $M_n\ge\theta$. Fixe $0<\varepsilon<|\theta|$. Então

$$P(|M_n-\theta|>\varepsilon)=P(M_n>\theta+\varepsilon)=\prod_{i=1}^nP(X_i>\theta+\varepsilon)=\left(\frac{0-(\theta+\varepsilon)}{0-\theta}\right)^n=\left(1-\frac{\varepsilon}{|\theta|}\right)^n.$$

Como $0<1-\varepsilon/|\theta|<1$, isso tende a $0$ quando $n\to\infty$. Para $\varepsilon\ge|\theta|$ a probabilidade é $0$. Logo $M_n\xrightarrow{P}\theta$, ou seja, $M_n$ é consistente.`,
  }),
  q({
    n: 'p2-2024-1',
    title: 'Teste mais poderoso: θx^{θ−1}, H₀: θ=4 vs Hₐ: θ=3',
    statement: r`Suponha que você tem uma amostra de uma população com densidade $f(x;\theta)=\theta x^{\theta-1}$, $0<x<1$. São consideradas as hipóteses $H_0:\theta=4$ e $H_a:\theta=3$.

(i) Determine a região crítica do teste mais poderoso ao nível $\alpha=0{,}05$.

(ii) Determine o poder do teste em (i).

**Nota:** o símbolo do parâmetro não saiu na extração do PDF; assumi $\theta x^{\theta-1}$, coerente com as hipóteses sobre $\theta$. Confira com o original.`,
    source: P3,
    difficulty: 4,
    tags: 'Neyman-Pearson, teste mais poderoso, poder, qui-quadrado',
    hint1: r`Lema de Neyman–Pearson: rejeite $H_0$ quando $L(\theta_0)/L(\theta_a)\le k$.`,
    hint2: r`A razão fica monótona em $\prod X_i$, logo a região é do tipo $T=-\sum\ln X_i\ge c$. Se $X\sim f(\cdot;\theta)$, então $-\ln X\sim\text{Exp}(\theta)$.`,
    hint3: r`$T\sim\text{Gama}(n,\theta)$ e $2\theta T\sim\chi^2_{2n}$: use isso para obter $c$ e o poder em termos de quantis qui-quadrado.`,
    officialSolution: r`**(i)** $L(\theta)=\theta^n\prod x_i^{\theta-1}$. A razão

$$\frac{L(4)}{L(3)}=\left(\frac43\right)^n\prod_{i=1}^nx_i$$

é crescente em $\prod x_i$. Pelo lema de Neyman–Pearson, o teste mais poderoso rejeita $H_0$ para valores **pequenos** da razão, i.e., para $\prod x_i$ pequeno, ou equivalentemente

$$T=-\sum_{i=1}^n\ln X_i\ \ge\ c.$$

Se $X$ tem densidade $\theta x^{\theta-1}$, então $-\ln X\sim\text{Exp}(\theta)$ e $T\sim\text{Gama}(n,\theta)$, com $2\theta T\sim\chi^2_{2n}$. Sob $H_0$ ($\theta=4$): $8T\sim\chi^2_{2n}$, e $P_{4}(T\ge c)=0{,}05$ dá

$$c=\frac{\chi^2_{2n;\,0{,}05}}{8},$$

onde $\chi^2_{\nu;\alpha}$ é o quantil superior. Região crítica: $\left\{-\sum\ln x_i\ge \chi^2_{2n;0{,}05}/8\right\}$.

**(ii)** Sob $H_a$ ($\theta=3$): $6T\sim\chi^2_{2n}$, então

$$\text{poder}=P_3(T\ge c)=P\!\left(\chi^2_{2n}\ge 6c\right)=P\!\left(\chi^2_{2n}\ge\tfrac34\,\chi^2_{2n;0{,}05}\right).$$

**Exemplo ($n=1$).** $T\sim\text{Exp}(\theta)$: $e^{-4c}=0{,}05\Rightarrow c=\tfrac{\ln20}{4}\approx0{,}749$ (ou $\chi^2_{2;0,05}/8=5{,}991/8$). Poder $=e^{-3c}=20^{-3/4}\approx0{,}106$.`,
  }),
  q({
    n: 'p2-2024-2',
    title: 'Duas proporções: latas abaixo do peso (máquinas A e B)',
    statement: r`Duas máquinas diferentes em uma linha de produção são projetadas para encher latas com 280 gramas de polpa de suco de laranja. Uma amostra aleatória das latas de cada máquina foi obtida. Das 134 latas da máquina A, 10 possuem peso inferior ao especificado e 7 de 114 latas da máquina B possuem peso inferior. Existe evidência para pensarmos que uma das máquinas funciona melhor do que a outra? Considere o teste ao nível $0{,}01\%$.`,
    source: P3,
    difficulty: 2,
    tags: 'teste de hipóteses, duas proporções, z',
    hint1: r`$H_0:p_A=p_B$ contra $H_a:p_A\ne p_B$ (bilateral). Sob $H_0$ use a proporção combinada $\hat p$.`,
    hint2: r`$Z=\dfrac{\hat p_A-\hat p_B}{\sqrt{\hat p(1-\hat p)(1/n_A+1/n_B)}}\approx N(0,1)$ sob $H_0$.`,
    officialSolution: r`$\hat p_A=\dfrac{10}{134}\approx0{,}0746$, $\hat p_B=\dfrac7{114}\approx0{,}0614$, proporção combinada $\hat p=\dfrac{17}{248}\approx0{,}0685$.

$$\text{EP}=\sqrt{0{,}0685\cdot0{,}9315\left(\tfrac1{134}+\tfrac1{114}\right)}\approx0{,}0322,\qquad Z=\frac{0{,}0746-0{,}0614}{0{,}0322}\approx0{,}41.$$

O valor crítico bilateral é $z_{0{,}005}=2{,}576$ já para $\alpha=1\%$ e é ainda maior para $\alpha=0{,}01\%$. Como $|Z|\approx0{,}41<2{,}576$, **não rejeitamos $H_0$**: não há evidência de que uma máquina funcione melhor que a outra. (O resultado é o mesmo se o nível for lido como $0{,}01$ em vez de $0{,}01\%$.)`,
  }),
  q({
    n: 'p2-2024-3',
    title: 'Duas dietas: teste F de variâncias e teste t de médias',
    statement: r`Um teste de alimentação é realizado em um rebanho de 25 vacas leiteiras para comparar duas dietas, A e B. Uma amostra de 13 vacas aleatoriamente selecionadas do rebanho são alimentadas com a dieta A e as vacas restantes são alimentadas com a dieta B. Os resultados da produção média diária de leite (em L) registrada para cada vaca são apresentados na seguinte tabela:

- Dieta A: 44, 44, 56, 46, 47, 38, 58, 53, 49, 35, 36, 30, 41
- Dieta B: 35, 47, 55, 29, 40, 39, 32, 41, 42, 57, 51, 39

Ao nível $5\%$, os dados fornecem evidência para pensarmos que as dietas apresentam efeito no rendimento? Caso seja necessário, realize um teste para verificar igualdade de variâncias.`,
    source: P3,
    difficulty: 3,
    tags: 'teste F, teste t, duas amostras independentes, variâncias',
    hint1: r`Primeiro $H_0:\sigma_A^2=\sigma_B^2$ (teste $F$ com $12$ e $11$ graus de liberdade); só depois escolha o teste $t$ adequado para $\mu_A$ vs $\mu_B$.`,
    hint2: r`Se as variâncias podem ser consideradas iguais, use a variância combinada $s_p^2$ e $n_A+n_B-2=23$ graus de liberdade.`,
    officialSolution: r`**Resumos.** $n_A=13$: $\bar x_A=44{,}385$, $s_A^2=70{,}256$. $n_B=12$: $\bar x_B=42{,}25$, $s_B^2=76{,}386$.

**1) Variâncias.** $H_0:\sigma_A^2=\sigma_B^2$. $F=s_A^2/s_B^2=0{,}920\sim F_{12,11}$. Para $\alpha=5\%$ bilateral, a região crítica é $F<0{,}301$ ou $F>3{,}43$. Como $0{,}920$ está entre os dois, **não rejeitamos** a igualdade de variâncias.

**2) Médias.** $H_0:\mu_A=\mu_B$ vs $H_a:\mu_A\ne\mu_B$, variâncias iguais:

$$s_p^2=\frac{12\cdot70{,}256+11\cdot76{,}386}{23}=73{,}188,\qquad t=\frac{44{,}385-42{,}25}{\sqrt{73{,}188\left(\tfrac1{13}+\tfrac1{12}\right)}}\approx0{,}623.$$

Com $23$ graus de liberdade, $t_{0{,}975}=2{,}069$. Como $|t|<2{,}069$ (valor-p $\approx0{,}54$), **não rejeitamos $H_0$**: os dados não fornecem evidência de efeito das dietas no rendimento ao nível de $5\%$.`,
  }),
  q({
    n: 'ex-emv-exponencial',
    title: 'EMV da taxa exponencial e correção do viés',
    statement: r`Seja $X_1,\dots,X_n$ uma amostra de $X\sim\text{Exp}(\lambda)$ (taxa $\lambda$, $E[X]=1/\lambda$), com $n\ge2$.

(a) Determine o estimador de máxima verossimilhança $\hat\lambda$.

(b) Calcule $E[\hat\lambda]$ e mostre que $\hat\lambda$ é viesado.

(c) Construa um estimador não viesado a partir de $\hat\lambda$.`,
    source: 'Exercício autoral (estimação pontual)',
    difficulty: 3,
    tags: 'máxima verossimilhança, viés, gama, exponencial',
    hint1: r`$L(\lambda)=\lambda^ne^{-\lambda\sum x_i}$; maximize $\log L$.`,
    hint2: r`$S=\sum X_i\sim\text{Gama}(n,\lambda)$. Calcule $E[1/S]=\displaystyle\int_0^\infty\frac1s\frac{\lambda^ns^{n-1}e^{-\lambda s}}{\Gamma(n)}ds$.`,
    officialSolution: r`**(a)** $\ell(\lambda)=n\ln\lambda-\lambda\sum x_i$, $\ell'=\dfrac n\lambda-\sum x_i=0\Rightarrow\hat\lambda=\dfrac n{\sum X_i}=\dfrac1{\bar X}$.

**(b)** $S=\sum X_i\sim\text{Gama}(n,\lambda)$. Então

$$E\!\left[\frac1S\right]=\frac{\lambda^n}{\Gamma(n)}\int_0^\infty s^{n-2}e^{-\lambda s}ds=\frac{\lambda^n}{\Gamma(n)}\cdot\frac{\Gamma(n-1)}{\lambda^{n-1}}=\frac{\lambda}{n-1}.$$

Logo $E[\hat\lambda]=nE[1/S]=\dfrac{n}{n-1}\lambda\ne\lambda$: viés $=\dfrac{\lambda}{n-1}>0$.

**(c)** $\tilde\lambda=\dfrac{n-1}{n}\hat\lambda=\dfrac{n-1}{\sum X_i}$ satisfaz $E[\tilde\lambda]=\lambda$.`,
  }),
  q({
    n: 'ex-ic-media-z',
    title: 'Intervalo de confiança para μ com σ conhecido',
    statement: r`Uma amostra aleatória de $n=36$ observações de uma população normal com desvio padrão conhecido $\sigma=9$ tem média amostral $\bar x=52$. Construa um intervalo de confiança de $95\%$ para $\mu$ e interprete.`,
    source: 'Exercício autoral (intervalos de confiança)',
    difficulty: 1,
    tags: 'intervalo de confiança, normal',
    hint1: r`$\bar x\pm z_{\alpha/2}\,\sigma/\sqrt n$, com $z_{0{,}025}=1{,}96$.`,
    officialSolution: r`Erro padrão: $\sigma/\sqrt n=9/6=1{,}5$. Margem: $1{,}96\cdot1{,}5=2{,}94$.

$$IC_{95\%}(\mu)=52\pm2{,}94=(49{,}06;\ 54{,}94).$$

**Interpretação:** o procedimento usado produz intervalos que contêm $\mu$ em $95\%$ das amostras; não é "$\mu$ está neste intervalo com $95\%$ de probabilidade" (o intervalo observado é fixo e $\mu$ também).`,
  }),
  q({
    n: 'ex-ic-media-t',
    title: 'Intervalo de confiança t para μ (σ desconhecido)',
    statement: r`De uma população normal, uma amostra de $n=16$ tem $\bar x=10$ e $s=4$. Construa o intervalo de confiança de $95\%$ para $\mu$. Use $t_{15;\,0{,}975}=2{,}131$.`,
    source: 'Exercício autoral (intervalos de confiança)',
    difficulty: 1,
    tags: 'intervalo de confiança, t de Student',
    hint1: r`Com $\sigma$ desconhecido, $\dfrac{\bar X-\mu}{S/\sqrt n}\sim t_{n-1}$.`,
    officialSolution: r`$\text{EP}=s/\sqrt n=4/4=1$. Margem: $2{,}131\cdot1=2{,}131$.

$$IC_{95\%}(\mu)=10\pm2{,}131=(7{,}869;\ 12{,}131).$$`,
  }),
  q({
    n: 'ex-tcl-uniformes',
    title: 'TCL: soma de 100 uniformes',
    statement: r`Sejam $U_1,\dots,U_{100}$ i.i.d. $\text{Uniforme}(0,1)$ e $S=\sum_{i=1}^{100}U_i$. Use o teorema central do limite para aproximar $P(S>55)$. Dica numérica: $\Phi(1{,}73)\approx0{,}9582$.`,
    source: 'Exercício autoral (TCL)',
    difficulty: 2,
    tags: 'teorema central do limite, aproximação normal',
    hint1: r`Para $U\sim U(0,1)$: $E[U]=1/2$ e $\text{Var}(U)=1/12$.`,
    officialSolution: r`$E[S]=100\cdot\tfrac12=50$, $\text{Var}(S)=\tfrac{100}{12}\approx8{,}333$, $\sigma_S\approx2{,}887$.

$$P(S>55)\approx P\!\left(Z>\frac{55-50}{2{,}887}\right)=P(Z>1{,}73)=1-0{,}9582\approx0{,}042.$$`,
  }),
  q({
    n: 'ex-np-normal',
    title: 'Teste mais poderoso para a média normal e seu poder',
    statement: r`Seja $X_1,\dots,X_{25}$ uma amostra de $N(\mu,1)$. Para $H_0:\mu=0$ contra $H_a:\mu=1$, determine a região crítica do teste mais poderoso de nível $\alpha=0{,}05$ e calcule o seu poder. ($z_{0{,}05}=1{,}645$.)`,
    source: 'Exercício autoral (Neyman–Pearson)',
    difficulty: 3,
    tags: 'Neyman-Pearson, poder, normal',
    hint1: r`A razão de verossimilhanças é monótona em $\bar X$: o teste rejeita para $\bar X$ grande.`,
    hint2: r`Sob $H_0$, $\bar X\sim N(0,1/25)$; sob $H_a$, $\bar X\sim N(1,1/25)$.`,
    officialSolution: r`Região: $\bar X>k$, com $P_0(\bar X>k)=0{,}05$. Como $\bar X\sim N(0,0{,}2^2)$ sob $H_0$: $k=1{,}645\cdot0{,}2=0{,}329$.

**Poder:** sob $H_a$, $\bar X\sim N(1,0{,}2^2)$:

$$P_1(\bar X>0{,}329)=P\!\left(Z>\frac{0{,}329-1}{0{,}2}\right)=P(Z>-3{,}355)\approx0{,}9996.$$`,
  }),
];
