import { bank, r } from './factory';

// Trilha Maratona. Enunciados resumidos/parafraseados em português (consulte o link para o texto oficial
// e os limites exatos). Soluções de referência em Python, executadas contra os exemplos antes de entrar aqui
// (scripts/check-cp.ts); troque pela sua versão em C++/Java ao treinar para a prova.

const cp = bank('cp', null, 'cp');
const CSES = (sec: string) => `CSES Problem Set — ${sec}`;
const link = (id: number) => `https://cses.fi/problemset/task/${id}`;

export const cpQuestions = [
  // ---------------- Introductory Problems ----------------
  cp({
    n: 'cses-1068',
    title: 'Weird Algorithm',
    statement: r`Dado $n$, repita: se $n$ é par, divida por $2$; se é ímpar, substitua por $3n+1$. Pare ao chegar em $1$. Imprima todos os valores da sequência, incluindo $n$ e $1$. ($1\le n\le10^6$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 1,
    tags: 'simulação, implementação',
    hint1: r`Simule, sem recursão. Use inteiros de 64 bits: $3n+1$ pode passar de $2^{31}$.`,
    officialSolution: r`Simulação direta (a conjectura de Collatz garante terminação para os limites do problema).

~~~python
n = int(input())
out = [n]
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    out.append(n)
print(*out)
~~~`,
    complexity: 'O(L), L = tamanho da sequência',
    url: link(1068),
  }),
  cp({
    n: 'cses-1083',
    title: 'Missing Number',
    statement: r`São dados $n-1$ números distintos de $\{1,\dots,n\}$. Descubra qual está faltando. ($2\le n\le2\cdot10^5$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 1,
    tags: 'matemática, soma',
    hint1: r`$1+2+\dots+n=\dfrac{n(n+1)}2$.`,
    officialSolution: r`O faltante é $\frac{n(n+1)}2-\sum a_i$. (Alternativa: XOR de $1..n$ com XOR dos dados.)

~~~python
n = int(input())
print(n * (n + 1) // 2 - sum(map(int, input().split())))
~~~`,
    complexity: 'O(n)',
    url: link(1083),
  }),
  cp({
    n: 'cses-1069',
    title: 'Repetitions',
    statement: r`Dada uma string de $A,C,G,T$, ache o comprimento do maior bloco de letras iguais consecutivas. ($|s|\le10^6$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 1,
    tags: 'strings, varredura',
    hint1: r`Mantenha o tamanho do bloco atual e o melhor visto.`,
    officialSolution: r`~~~python
s = input().strip()
best = cur = 1
for i in range(1, len(s)):
    cur = cur + 1 if s[i] == s[i - 1] else 1
    best = max(best, cur)
print(best)
~~~`,
    complexity: 'O(|s|)',
    url: link(1069),
  }),
  cp({
    n: 'cses-1094',
    title: 'Increasing Array',
    statement: r`Dado um vetor de $n$ inteiros, em cada operação você pode aumentar um elemento em $1$. Qual o mínimo de operações para deixar o vetor não decrescente? ($n\le2\cdot10^5$, $a_i\le10^9$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 1,
    tags: 'guloso',
    hint1: r`Percorra da esquerda para a direita: se $a_i<a_{i-1}$, é obrigatório subir $a_i$ até $a_{i-1}$ (e nunca mais que isso).`,
    officialSolution: r`Guloso: elevar $a_i$ ao menor valor permitido, $a_{i-1}$, minimiza o custo agora e não prejudica os próximos. A resposta pode chegar a $\sim2\cdot10^{14}$ (64 bits).

~~~python
n = int(input())
a = list(map(int, input().split()))
ans = 0
for i in range(1, n):
    if a[i] < a[i - 1]:
        ans += a[i - 1] - a[i]
        a[i] = a[i - 1]
print(ans)
~~~`,
    complexity: 'O(n)',
    url: link(1094),
  }),
  cp({
    n: 'cses-1071',
    title: 'Number Spiral',
    statement: r`Uma grade infinita é preenchida em espiral com $1,2,3,\dots$ como na figura (linha $1$: $1,2,9,10,25,\dots$; linha $2$: $4,3,8,11,24,\dots$; linha $3$: $5,6,7,12,23,\dots$). Para $t$ consultas $(y,x)$ (linha, coluna), imprima o número na posição. ($t\le10^5$, $y,x\le10^9$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 2,
    tags: 'matemática, padrão',
    hint1: r`Os números da "camada" $m=\max(y,x)$ vão de $(m-1)^2+1$ até $m^2$. A direção do percurso depende da paridade de $m$.`,
    officialSolution: r`Seja $m=\max(y,x)$.
- $m$ par: se $x=m$, valor $=(m-1)^2+y$; senão ($y=m$), valor $=m^2-x+1$.
- $m$ ímpar: se $y=m$, valor $=(m-1)^2+x$; senão ($x=m$), valor $=m^2-y+1$.

~~~python
t = int(input())
for _ in range(t):
    y, x = map(int, input().split())
    m = max(y, x)
    if m % 2 == 0:
        print((m - 1) ** 2 + y if x == m else m * m - x + 1)
    else:
        print((m - 1) ** 2 + x if y == m else m * m - y + 1)
~~~`,
    complexity: 'O(1) por consulta',
    url: link(1071),
  }),
  cp({
    n: 'cses-1072',
    title: 'Two Knights',
    statement: r`Para cada $k=1,\dots,n$, conte de quantas formas dois cavalos (um preto e um branco) podem ser colocados em um tabuleiro $k\times k$ sem se atacarem. ($n\le10^4$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 2,
    tags: 'matemática, contagem',
    hint1: r`Total de pares de casas $-$ pares que se atacam.`,
    hint2: r`Cada par de cavalos que se atacam ocupa um retângulo $2\times3$ ou $3\times2$ (cada um dá $2$ pares). Há $2(k-1)(k-2)$ retângulos de cada tipo.`,
    officialSolution: r`Total de pares não ordenados de casas: $\binom{k^2}{2}=\frac{k^2(k^2-1)}2$. Pares atacantes: $4(k-1)(k-2)$. Resposta: $\frac{k^2(k^2-1)}2-4(k-1)(k-2)$ (para $k=1,2,3,\dots$: $0,6,28,96,252,\dots$).

~~~python
n = int(input())
for k in range(1, n + 1):
    print(k * k * (k * k - 1) // 2 - 4 * (k - 1) * (k - 2))
~~~`,
    complexity: 'O(n)',
    url: link(1072),
  }),
  cp({
    n: 'cses-1618',
    title: 'Trailing Zeros',
    statement: r`Quantos zeros há no final de $n!$? ($n\le10^9$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 1,
    tags: 'matemática, fatorial, Legendre',
    hint1: r`Cada zero final vem de um fator $10=2\cdot5$; fatores $2$ sobram.`,
    officialSolution: r`Conta-se o expoente de $5$ em $n!$ (fórmula de Legendre): $\lfloor n/5\rfloor+\lfloor n/25\rfloor+\lfloor n/125\rfloor+\cdots$

~~~python
n = int(input())
z = 0
while n:
    n //= 5
    z += n
print(z)
~~~`,
    complexity: 'O(log n)',
    url: link(1618),
  }),
  cp({
    n: 'cses-1754',
    title: 'Coin Piles',
    statement: r`Há duas pilhas com $a$ e $b$ moedas. Em cada jogada você tira $1$ moeda de uma pilha e $2$ da outra (a escolha de qual é livre). É possível esvaziar as duas pilhas? Responda YES/NO para $t$ casos. ($t\le10^5$, $a,b\le10^9$.)`,
    source: CSES('Introductory Problems'),
    difficulty: 2,
    tags: 'matemática, invariante',
    hint1: r`Cada jogada retira $3$ moedas no total: $a+b$ deve ser múltiplo de $3$.`,
    hint2: r`Nenhuma pilha pode ter mais que o dobro da outra — cada jogada tira no máximo o dobro de uma pilha em relação à outra.`,
    officialSolution: r`Seja $a\le b$. As condições $3\mid a+b$ (cada jogada retira $3$ moedas) e $b\le2a$ são **necessárias** e também **suficientes**: com $k=(a+b)/3$ jogadas, faça $x=a-k$ delas retirando $2$ da pilha menor e $1$ da maior, e as outras $k-x$ retirando $1$ da menor e $2$ da maior. A pilha menor perde $2x+(k-x)=a$ e a maior perde $x+2(k-x)=3k-a=b$. Precisamos de $0\le x\le k$: $x\ge0\iff a\ge k\iff b\le2a$, e $x\le k\iff a\le2k\iff a\le2b$, que vale sempre.

~~~python
t = int(input())
for _ in range(t):
    a, b = map(int, input().split())
    print("YES" if (a + b) % 3 == 0 and 2 * min(a, b) >= max(a, b) else "NO")
~~~`,
    complexity: 'O(1) por caso',
    url: link(1754),
  }),

  // ---------------- Sorting and Searching ----------------
  cp({
    n: 'cses-1621',
    title: 'Distinct Numbers',
    statement: r`Quantos valores distintos há em um vetor de $n$ inteiros? ($n\le2\cdot10^5$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 1,
    tags: 'conjuntos, ordenação',
    officialSolution: r`~~~python
n = int(input())
print(len(set(input().split())))
~~~`,
    complexity: 'O(n) esperado (hash) ou O(n log n) (sort)',
    url: link(1621),
  }),
  cp({
    n: 'cses-1084',
    title: 'Apartments',
    statement: r`Há $n$ candidatos com tamanho desejado $a_i$ e $m$ apartamentos de tamanho $b_j$. O candidato $i$ aceita o apartamento $j$ se $|a_i-b_j|\le k$. Cada apartamento vai para no máximo um candidato. Qual o máximo de candidatos atendidos? ($n,m\le2\cdot10^5$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'guloso, dois ponteiros, ordenação',
    hint1: r`Ordene os dois vetores e percorra com dois ponteiros.`,
    officialSolution: r`Com ambos ordenados: se $|a_i-b_j|\le k$, case-os; se $a_i<b_j-k$, o candidato $i$ é pequeno demais para qualquer apartamento restante (todos $\ge b_j$): descarte-o; caso contrário o apartamento $j$ é pequeno demais para todos os candidatos restantes: descarte-o.

~~~python
n, m, k = map(int, input().split())
a = sorted(map(int, input().split()))
b = sorted(map(int, input().split()))
i = j = ans = 0
while i < n and j < m:
    if abs(a[i] - b[j]) <= k:
        ans += 1; i += 1; j += 1
    elif a[i] < b[j]:
        i += 1
    else:
        j += 1
print(ans)
~~~`,
    complexity: 'O((n+m) log(n+m))',
    url: link(1084),
  }),
  cp({
    n: 'cses-1090',
    title: 'Ferris Wheel',
    statement: r`$n$ crianças com pesos $p_i$ querem andar numa roda-gigante cujas gôndolas suportam até $x$ de peso e levam no máximo $2$ crianças. Qual o mínimo de gôndolas? ($n\le2\cdot10^5$; todo $p_i\le x$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'guloso, dois ponteiros',
    hint1: r`A criança mais pesada precisa de uma gôndola; a melhor companhia possível é a mais leve que ainda cabe.`,
    officialSolution: r`Ordene. Com ponteiros nas pontas: a mais pesada sempre sai; se a mais leve cabe junto, vai com ela.

~~~python
n, x = map(int, input().split())
p = sorted(map(int, input().split()))
i, j, g = 0, n - 1, 0
while i <= j:
    if i < j and p[i] + p[j] <= x:
        i += 1
    j -= 1
    g += 1
print(g)
~~~`,
    complexity: 'O(n log n)',
    url: link(1090),
  }),
  cp({
    n: 'cses-1619',
    title: 'Restaurant Customers',
    statement: r`Cada cliente $i$ chega no instante $a_i$ e sai no instante $b_i$. Qual o maior número de clientes simultâneos no restaurante? ($n\le2\cdot10^5$, tempos até $10^9$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'varredura de eventos, ordenação',
    hint1: r`Transforme cada cliente em dois eventos: $+1$ na chegada e $-1$ na saída; ordene e acumule.`,
    officialSolution: r`Ordene os $2n$ eventos por tempo; o máximo da soma acumulada é a resposta. (Com tempos coincidentes, o evento $(t,-1)$ vem antes de $(t,+1)$ na ordenação: quem sai libera a vaga antes de quem chega.)

~~~python
n = int(input())
ev = []
for _ in range(n):
    a, b = map(int, input().split())
    ev.append((a, 1))
    ev.append((b, -1))
ev.sort()
cur = best = 0
for _, d in ev:
    cur += d
    best = max(best, cur)
print(best)
~~~`,
    complexity: 'O(n log n)',
    url: link(1619),
  }),
  cp({
    n: 'cses-1629',
    title: 'Movie Festival',
    statement: r`Há $n$ filmes com horários de início e fim. Você só pode ver filmes completos e não sobrepostos. Qual o máximo de filmes? ($n\le2\cdot10^5$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'guloso, escalonamento de intervalos',
    hint1: r`Escolha sempre o filme que **termina** primeiro entre os que cabem.`,
    officialSolution: r`Seleção de atividades: ordene por término e pegue todo filme cujo início seja $\ge$ ao fim do último escolhido. A prova é por troca (o que termina primeiro deixa o máximo de espaço).

~~~python
n = int(input())
mv = sorted((tuple(map(int, input().split())) for _ in range(n)), key=lambda m: m[1])
end = ans = 0
for s, e in mv:
    if s >= end:
        ans += 1
        end = e
print(ans)
~~~`,
    complexity: 'O(n log n)',
    url: link(1629),
  }),
  cp({
    n: 'cses-1640',
    title: 'Sum of Two Values',
    statement: r`Dado um vetor de $n$ inteiros e um alvo $x$, ache dois índices distintos cujos valores somam $x$ (ou imprima IMPOSSIBLE). ($n\le2\cdot10^5$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'hash, dois ponteiros',
    hint1: r`Ao ver $a_i$, procure $x-a_i$ entre os valores já vistos.`,
    officialSolution: r`~~~python
n, x = map(int, input().split())
a = list(map(int, input().split()))
seen = {}
for i, v in enumerate(a, 1):
    if x - v in seen:
        print(seen[x - v], i)
        break
    seen[v] = i
else:
    print("IMPOSSIBLE")
~~~`,
    complexity: 'O(n) esperado',
    url: link(1640),
  }),
  cp({
    n: 'cses-1643',
    title: 'Maximum Subarray Sum',
    statement: r`Dado um vetor de $n$ inteiros (podem ser negativos), qual a maior soma de um subvetor contíguo **não vazio**? ($n\le2\cdot10^5$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'Kadane, programação dinâmica',
    hint1: r`$best_i=\max(a_i,\ best_{i-1}+a_i)$: estender ou recomeçar.`,
    officialSolution: r`Algoritmo de Kadane. Inicialize com o primeiro elemento (não com $0$, senão vetores todos negativos dão resposta errada).

~~~python
n = int(input())
a = list(map(int, input().split()))
best = cur = a[0]
for v in a[1:]:
    cur = max(v, cur + v)
    best = max(best, cur)
print(best)
~~~`,
    complexity: 'O(n)',
    url: link(1643),
  }),
  cp({
    n: 'cses-1620',
    title: 'Factory Machines',
    statement: r`Uma fábrica tem $n$ máquinas; a máquina $k$ produz um item a cada $t_k$ unidades de tempo. Qual o menor tempo para produzir $T$ itens? ($n\le2\cdot10^5$, $T,t_k\le10^9$.)`,
    source: CSES('Sorting and Searching'),
    difficulty: 2,
    tags: 'busca binária na resposta',
    hint1: r`Se $T$ itens saem no tempo $x$, também saem em qualquer $x'\ge x$ (monotonia).`,
    officialSolution: r`Busca binária no tempo $x$: em $x$, as máquinas fazem $\sum_k\lfloor x/t_k\rfloor$ itens. Menor $x$ com soma $\ge T$. Cota superior: $\min t_k\cdot T$.

~~~python
n, t = map(int, input().split())
k = list(map(int, input().split()))
lo, hi = 1, min(k) * t
while lo < hi:
    mid = (lo + hi) // 2
    if sum(mid // x for x in k) >= t:
        hi = mid
    else:
        lo = mid + 1
print(lo)
~~~`,
    complexity: 'O(n log(min(t)·T))',
    url: link(1620),
  }),

  // ---------------- Dynamic Programming ----------------
  cp({
    n: 'cses-1633',
    title: 'Dice Combinations',
    statement: r`De quantas maneiras a soma de lançamentos de um dado (valores $1$ a $6$) pode ser exatamente $n$, contando sequências diferentes como diferentes? Responda módulo $10^9+7$. ($n\le10^6$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 2,
    tags: 'programação dinâmica, contagem',
    hint1: r`$d[s]=\sum_{f=1}^{6}d[s-f]$, com $d[0]=1$.`,
    officialSolution: r`~~~python
MOD = 10**9 + 7
n = int(input())
d = [0] * (n + 1)
d[0] = 1
for s in range(1, n + 1):
    d[s] = sum(d[s - f] for f in range(1, 7) if s - f >= 0) % MOD
print(d[n])
~~~`,
    complexity: 'O(6n)',
    url: link(1633),
  }),
  cp({
    n: 'cses-1634',
    title: 'Minimizing Coins',
    statement: r`Há $n$ moedas de valores $c_i$ (quantidade ilimitada de cada). Qual o menor número de moedas para formar exatamente $x$? Imprima $-1$ se for impossível. ($n\le100$, $x\le10^6$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 2,
    tags: 'programação dinâmica, troco',
    hint1: r`$d[s]=1+\min_c d[s-c]$, $d[0]=0$.`,
    officialSolution: r`~~~python
n, x = map(int, input().split())
c = list(map(int, input().split()))
INF = float("inf")
d = [0] + [INF] * x
for s in range(1, x + 1):
    for v in c:
        if v <= s and d[s - v] + 1 < d[s]:
            d[s] = d[s - v] + 1
print(d[x] if d[x] < INF else -1)
~~~`,
    complexity: 'O(n·x)',
    url: link(1634),
  }),
  cp({
    n: 'cses-1635',
    title: 'Coin Combinations I',
    statement: r`Com $n$ tipos de moeda (quantidade ilimitada), de quantas formas distintas, **contando a ordem**, é possível formar a soma $x$? Módulo $10^9+7$. ($n\le100$, $x\le10^6$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 2,
    tags: 'programação dinâmica, ordem importa',
    hint1: r`Para a ordem importar, a soma é o laço **externo**; as moedas, o interno.`,
    officialSolution: r`$d[s]=\sum_cd[s-c]$ com $d[0]=1$, laço externo na soma $s$.

~~~python
MOD = 10**9 + 7
n, x = map(int, input().split())
c = list(map(int, input().split()))
d = [1] + [0] * x
for s in range(1, x + 1):
    d[s] = sum(d[s - v] for v in c if v <= s) % MOD
print(d[x])
~~~`,
    complexity: 'O(n·x)',
    url: link(1635),
  }),
  cp({
    n: 'cses-1636',
    title: 'Coin Combinations II',
    statement: r`Como no problema anterior, mas agora duas formas são iguais se usam as mesmas moedas em quantidades iguais (a **ordem não importa**). Quantas formas de somar $x$? Módulo $10^9+7$.`,
    source: CSES('Dynamic Programming'),
    difficulty: 3,
    tags: 'programação dinâmica, combinações, ordem não importa',
    hint1: r`Inverta os laços: o laço externo passa por moedas; o interno, pela soma.`,
    officialSolution: r`Com a moeda no laço externo, cada multiconjunto é contado uma única vez (numa ordem canônica: por tipo de moeda).

~~~python
MOD = 10**9 + 7
n, x = map(int, input().split())
c = list(map(int, input().split()))
d = [1] + [0] * x
for v in c:
    for s in range(v, x + 1):
        d[s] = (d[s] + d[s - v]) % MOD
print(d[x])
~~~`,
    complexity: 'O(n·x)',
    url: link(1636),
  }),
  cp({
    n: 'cses-1638',
    title: 'Grid Paths',
    statement: r`Em uma grade $n\times n$ com casas livres (símbolo ".") e armadilhas (símbolo "*"), conte os caminhos do canto superior esquerdo ao inferior direito movendo-se apenas para direita ou para baixo, sem pisar em armadilhas. Módulo $10^9+7$. ($n\le1000$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 2,
    tags: 'programação dinâmica, grade',
    hint1: r`$d[i][j]=d[i-1][j]+d[i][j-1]$ se a casa é livre, $0$ caso contrário.`,
    officialSolution: r`~~~python
MOD = 10**9 + 7
n = int(input())
g = [input().strip() for _ in range(n)]
d = [[0] * n for _ in range(n)]
if g[0][0] == ".":
    d[0][0] = 1
for i in range(n):
    for j in range(n):
        if g[i][j] == "*" or (i == 0 and j == 0):
            continue
        d[i][j] = ((d[i - 1][j] if i else 0) + (d[i][j - 1] if j else 0)) % MOD
print(d[n - 1][n - 1])
~~~`,
    complexity: 'O(n²)',
    url: link(1638),
  }),
  cp({
    n: 'cses-1639',
    title: 'Edit Distance',
    statement: r`Dadas duas strings, qual o mínimo de operações (inserir, remover ou substituir um caractere) para transformar a primeira na segunda? (Tamanhos até $5000$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 3,
    tags: 'programação dinâmica, strings, distância de Levenshtein',
    hint1: r`$d[i][j]$ = custo para transformar o prefixo $i$ de $s$ no prefixo $j$ de $t$.`,
    officialSolution: r`$d[i][j]=\min\big(d[i-1][j]+1,\ d[i][j-1]+1,\ d[i-1][j-1]+[s_i\ne t_j]\big)$, $d[i][0]=i$, $d[0][j]=j$. Use apenas duas linhas para memória $O(|t|)$.

~~~python
s = input().strip()
t = input().strip()
prev = list(range(len(t) + 1))
for i in range(1, len(s) + 1):
    cur = [i] + [0] * len(t)
    for j in range(1, len(t) + 1):
        cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] != t[j - 1]))
    prev = cur
print(prev[len(t)])
~~~`,
    complexity: 'O(|s|·|t|) tempo, O(|t|) memória',
    url: link(1639),
  }),
  cp({
    n: 'cses-1158',
    title: 'Book Shop',
    statement: r`Há $n$ livros com preço $h_i$ e número de páginas $s_i$. Com orçamento $x$, qual o máximo de páginas que dá para comprar (cada livro no máximo uma vez)? ($n\le1000$, $x\le10^5$.)`,
    source: CSES('Dynamic Programming'),
    difficulty: 2,
    tags: 'programação dinâmica, mochila 0-1',
    hint1: r`Mochila 0-1 com vetor unidimensional: percorra o orçamento do maior para o menor.`,
    officialSolution: r`~~~python
n, x = map(int, input().split())
h = list(map(int, input().split()))
s = list(map(int, input().split()))
d = [0] * (x + 1)
for price, pages in zip(h, s):
    for b in range(x, price - 1, -1):
        d[b] = max(d[b], d[b - price] + pages)
print(d[x])
~~~

O laço decrescente impede reutilizar o mesmo livro (com laço crescente seria a mochila **ilimitada**).`,
    complexity: 'O(n·x)',
    url: link(1158),
  }),

  // ---------------- Graph Algorithms ----------------
  cp({
    n: 'cses-1192',
    title: 'Counting Rooms',
    statement: r`Um mapa $n\times m$ tem paredes (símbolo "#") e chão (símbolo "."). Quantas salas (componentes conexas de chão, com adjacência nas 4 direções)? ($n,m\le1000$.)`,
    source: CSES('Graph Algorithms'),
    difficulty: 2,
    tags: 'grafos, componentes conexas, BFS/DFS em grade',
    hint1: r`Para cada chão não visitado, conte uma sala e marque toda a componente. Use pilha explícita (DFS recursiva estoura em $10^6$ células).`,
    officialSolution: r`~~~python
n, m = map(int, input().split())
g = [list(input().strip()) for _ in range(n)]
rooms = 0
for i in range(n):
    for j in range(m):
        if g[i][j] != ".":
            continue
        rooms += 1
        g[i][j] = "#"
        stack = [(i, j)]
        while stack:
            x, y = stack.pop()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < n and 0 <= ny < m and g[nx][ny] == ".":
                    g[nx][ny] = "#"
                    stack.append((nx, ny))
print(rooms)
~~~`,
    complexity: 'O(n·m)',
    url: link(1192),
  }),
  cp({
    n: 'cses-1667',
    title: 'Message Route',
    statement: r`Uma rede tem $n$ computadores e $m$ cabos bidirecionais. Ache o menor caminho (em número de computadores) do computador $1$ ao $n$ e imprima-o, ou IMPOSSIBLE. ($n,m\le10^5$.)`,
    source: CSES('Graph Algorithms'),
    difficulty: 2,
    tags: 'grafos, BFS, caminho mínimo não ponderado',
    hint1: r`BFS a partir de $1$ guardando o pai de cada vértice; reconstrua de trás para frente.`,
    officialSolution: r`~~~python
from collections import deque
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    a, b = map(int, input().split())
    adj[a].append(b)
    adj[b].append(a)
par = [0] * (n + 1)
par[1] = -1
q = deque([1])
while q:
    u = q.popleft()
    for v in adj[u]:
        if par[v] == 0:
            par[v] = u
            q.append(v)
if par[n] == 0:
    print("IMPOSSIBLE")
else:
    path, v = [], n
    while v != -1:
        path.append(v)
        v = par[v]
    print(len(path))
    print(*reversed(path))
~~~`,
    complexity: 'O(n+m)',
    url: link(1667),
  }),
  cp({
    n: 'cses-1671',
    title: 'Shortest Routes I',
    statement: r`Um grafo direcionado com $n$ cidades e $m$ voos com custo positivo. Calcule o menor custo de ir da cidade $1$ a cada cidade. ($n,m\le2\cdot10^5$, custos até $10^9$.)`,
    source: CSES('Graph Algorithms'),
    difficulty: 3,
    tags: 'grafos, Dijkstra, fila de prioridade',
    hint1: r`Pesos não negativos ⇒ Dijkstra com heap; ignore entradas obsoletas do heap.`,
    officialSolution: r`~~~python
import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    a, b, c = map(int, input().split())
    adj[a].append((b, c))
INF = float("inf")
dist = [INF] * (n + 1)
dist[1] = 0
pq = [(0, 1)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:
        continue
    for v, c in adj[u]:
        if d + c < dist[v]:
            dist[v] = d + c
            heapq.heappush(pq, (dist[v], v))
print(*dist[1:])
~~~`,
    complexity: 'O((n+m) log m)',
    url: link(1671),
  }),
  cp({
    n: 'cses-1195',
    title: 'Flight Discount',
    statement: r`Como no problema anterior, mas você pode usar **um** cupom de desconto em um voo, reduzindo seu preço pela metade (arredondado para baixo). Qual o menor custo de $1$ até $n$? ($n,m\le10^5$.)`,
    source: CSES('Graph Algorithms'),
    difficulty: 4,
    tags: 'grafos, Dijkstra, estados (vértice, cupom)',
    hint1: r`O estado precisa lembrar se o cupom já foi usado: vértices $(v,0)$ e $(v,1)$.`,
    officialSolution: r`Dijkstra no grafo de estados $(v,u)$, $u\in\{0,1\}$: de $(v,0)$ pode-se ir a $(w,0)$ pagando $c$, ou a $(w,1)$ pagando $\lfloor c/2\rfloor$; de $(v,1)$ só a $(w,1)$ pagando $c$. Resposta: $dist(n,1)$.

~~~python
import heapq
n, m = map(int, input().split())
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    a, b, c = map(int, input().split())
    adj[a].append((b, c))
INF = float("inf")
dist = [[INF, INF] for _ in range(n + 1)]
dist[1][0] = 0
pq = [(0, 1, 0)]
while pq:
    d, u, used = heapq.heappop(pq)
    if d > dist[u][used]:
        continue
    for v, c in adj[u]:
        if d + c < dist[v][used]:
            dist[v][used] = d + c
            heapq.heappush(pq, (d + c, v, used))
        if not used and d + c // 2 < dist[v][1]:
            dist[v][1] = d + c // 2
            heapq.heappush(pq, (d + c // 2, v, 1))
print(dist[n][1])
~~~`,
    complexity: 'O((n+m) log m)',
    url: link(1195),
  }),

  // ---------------- Range Queries ----------------
  cp({
    n: 'cses-1646',
    title: 'Static Range Sum Queries',
    statement: r`Dado um vetor de $n$ inteiros e $q$ consultas $(a,b)$, imprima a soma de $x_a,\dots,x_b$ em cada uma. ($n,q\le2\cdot10^5$.)`,
    source: CSES('Range Queries'),
    difficulty: 1,
    tags: 'somas de prefixos',
    hint1: r`$P_i=x_1+\dots+x_i$; a resposta é $P_b-P_{a-1}$.`,
    officialSolution: r`~~~python
import sys
data = sys.stdin.read().split()
n, q = int(data[0]), int(data[1])
pre = [0] * (n + 1)
for i in range(n):
    pre[i + 1] = pre[i] + int(data[2 + i])
out = []
for k in range(q):
    a, b = int(data[2 + n + 2 * k]), int(data[3 + n + 2 * k])
    out.append(pre[b] - pre[a - 1])
print("\n".join(map(str, out)))
~~~`,
    complexity: 'O(n + q)',
    url: link(1646),
  }),
  cp({
    n: 'cses-1648',
    title: 'Dynamic Range Sum Queries',
    statement: r`Um vetor de $n$ inteiros recebe $q$ operações: tipo $1$ (linha "1 k u"): atribuir $x_k=u$; tipo $2$ (linha "2 a b"): imprimir a soma de $x_a..x_b$. ($n,q\le2\cdot10^5$.)`,
    source: CSES('Range Queries'),
    difficulty: 3,
    tags: 'árvore de Fenwick (BIT), estruturas de dados',
    hint1: r`Prefixos não bastam quando há atualizações. Use uma BIT: atualização e consulta de prefixo em $O(\log n)$.`,
    officialSolution: r`BIT sobre as diferenças de atribuição: ao fazer $x_k=u$, adicione $u-x_k$ na posição $k$.

~~~python
import sys
data = sys.stdin.read().split()
n, q = int(data[0]), int(data[1])
x = [0] + [int(v) for v in data[2:2 + n]]
bit = [0] * (n + 1)

def add(i, v):
    while i <= n:
        bit[i] += v
        i += i & -i

def pref(i):
    s = 0
    while i > 0:
        s += bit[i]
        i -= i & -i
    return s

for i in range(1, n + 1):
    add(i, x[i])
out, p = [], 2 + n
for _ in range(q):
    t, a, b = int(data[p]), int(data[p + 1]), int(data[p + 2])
    p += 3
    if t == 1:
        add(a, b - x[a])
        x[a] = b
    else:
        out.append(pref(b) - pref(a - 1))
print("\n".join(map(str, out)))
~~~`,
    complexity: 'O((n + q) log n)',
    url: link(1648),
  }),

  // ---------------- Codeforces ----------------
  cp({
    n: 'cf-4a',
    title: 'Watermelon (Codeforces 4A)',
    statement: r`Dividir uma melancia de peso inteiro $w$ ($1\le w\le100$) em duas partes, ambas de peso **par** e positivo. É possível?`,
    source: 'Codeforces Beta Round #4 — Problema A',
    difficulty: 1,
    tags: 'matemática, paridade, implementação',
    hint1: r`Duas partes pares somam um número par; e o menor par positivo é $2$.`,
    officialSolution: r`É possível se e somente se $w$ é par e $w>2$ (por exemplo, $2+(w-2)$ com $w-2\ge2$).

~~~python
w = int(input())
print("YES" if w % 2 == 0 and w > 2 else "NO")
~~~`,
    complexity: 'O(1)',
    url: 'https://codeforces.com/problemset/problem/4/A',
  }),
  cp({
    n: 'cf-1a',
    title: 'Theatre Square (Codeforces 1A)',
    statement: r`Uma praça $n\times m$ deve ser pavimentada com lajes quadradas $a\times a$ (não podem ser cortadas, podem passar do limite da praça). Qual o mínimo de lajes? ($n,m,a\le10^9$.)`,
    source: 'Codeforces Beta Round #1 — Problema A',
    difficulty: 1,
    tags: 'matemática, teto de divisão',
    hint1: r`Cada dimensão é coberta independentemente: $\lceil n/a\rceil\cdot\lceil m/a\rceil$.`,
    officialSolution: r`Teto de divisão inteira: $\lceil n/a\rceil=(n+a-1)\,//\,a$. O resultado pode chegar a $10^{18}$ (64 bits em C++; Python já é arbitrário).

~~~python
n, m, a = map(int, input().split())
print(((n + a - 1) // a) * ((m + a - 1) // a))
~~~`,
    complexity: 'O(1)',
    url: 'https://codeforces.com/problemset/problem/1/A',
  }),
];
