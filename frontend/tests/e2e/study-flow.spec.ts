/**
 * Fluxos críticos contra a pilha completa, com banco descartável.
 * Preparação: scripts/e2e.sh (cria o banco, o usuário e sobe a API).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "e2e@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "E2e!Password-123456";
const RUN = Date.now().toString(36);
const DISCIPLINE = `Combinatória ${RUN}`;
const EXERCISE = `Casa dos pombos ${RUN}`;

const PAGES = [
  "/dashboard",
  "/sessions",
  "/review",
  "/disciplines",
  "/exercises",
  "/errors",
  "/competitive",
  "/goals",
  "/weekly-review",
  "/calendar",
  "/settings",
];

test.describe.configure({ mode: "serial" });

let page: Page;
const problems: string[] = [];

test.beforeAll(async ({ browser }) => {
  // O axe exige uma página criada a partir de um contexto.
  const context = await browser.newContext();
  page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`erro: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy|hydrat/i.test(message.text())) {
      problems.push(message.text());
    }
  });
});

test.afterAll(async () => {
  await page.close();
});

async function dialog() {
  const element = page.getByRole("dialog");
  await expect(element).toBeVisible();
  return element;
}

test("login", async () => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
});

test("disciplina e tópico", async () => {
  await page.goto("/disciplines");
  await page.getByRole("button", { name: "Nova disciplina" }).click();
  const form = await dialog();
  await form.getByLabel("Nome").fill(DISCIPLINE);
  await form.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("link", { name: DISCIPLINE }).click();

  await page.getByLabel("Novo tópico principal").fill("Invariantes");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();

  await expect(page.getByRole("button", { name: "Editar Invariantes" })).toBeVisible();
});

test("exercício, tentativa e caderno de erros", async () => {
  await page.goto("/exercises");
  await page.getByRole("button", { name: "Novo exercício" }).click();
  const form = await dialog();
  await form.getByText("Cadastrar nova fonte").click();
  await form.getByLabel("Nome da fonte").fill(`OBMU ${RUN}`);
  await form.getByRole("button", { name: "Criar" }).click();
  await expect(form.getByLabel("Fonte", { exact: true })).not.toHaveValue("");
  await form.getByLabel("Título").fill(EXERCISE);
  await form.getByLabel("Disciplina").selectOption({ label: DISCIPLINE });
  await form.getByLabel("Enunciado (Markdown e LaTeX)").fill("Mostre que $a<b$ implica $b>a$.");
  await form.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("heading", { level: 1, name: EXERCISE })).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();

  await page.getByLabel("Não resolvi").check();
  // Os tipos de erro padrão são criados no primeiro acesso.
  await page.getByLabel("Erro dominante").selectOption({ label: "Conceitual" });
  await page.getByLabel("Tempo (min)").fill("25");
  await page.getByRole("button", { name: "Registrar tentativa" }).click();
  await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();

  await page.goto("/errors");
  await expect(page.getByRole("link", { name: EXERCISE })).toBeVisible();
});

test("cronômetro sobrevive à recarga", async () => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Iniciar sessão" }).click();
  await (await dialog()).getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("timer")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("timer")).toBeVisible();

  await page.getByRole("button", { name: "Encerrar", exact: true }).click();
  await (await dialog()).getByRole("button", { name: "Encerrar sessão" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sessão" })).toBeVisible();
});

test("revisão com o teclado", async () => {
  // scripts/e2e.sh deixa um item vencido na fila.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Iniciar revisão" }).click();
  await expect(page.getByRole("group", { name: "Avaliação" })).toBeVisible();

  await page.keyboard.press("3");

  await expect(page.getByRole("heading", { name: "Resumo da sessão" })).toBeVisible();
});

test("meta e evento", async () => {
  await page.goto("/goals");
  await page.getByRole("button", { name: "Nova meta" }).click();
  const goal = await dialog();
  await goal.getByLabel("Título").fill(`Meta ${RUN}`);
  await goal.getByLabel("Alvo").fill("1");
  await goal.getByLabel("Métrica").selectOption("sessions_count");
  const today = await page.evaluate(() => new Date().toLocaleDateString("sv-SE"));
  await goal.getByLabel("Fim").fill(today);
  await goal.getByRole("button", { name: "Criar meta" }).click();
  await expect(page.getByRole("progressbar", { name: `Meta ${RUN}` })).toBeVisible();

  await page.goto("/calendar");
  await page.getByRole("button", { name: "Novo evento" }).click();
  const event = await dialog();
  await event.getByLabel("Título").fill(`Aula ${RUN}`);
  await event.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("button", { name: new RegExp(`Aula ${RUN}`) })).toBeVisible();
});

test("exportação", async () => {
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar Todos os dados (JSON)" }).click();

  expect((await download).suggestedFilename()).toMatch(/dados\.json$/);
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [1440, 390]) {
    test(`acessibilidade e layout · ${theme} · ${width}px`, async () => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((mode) => window.localStorage.setItem("sp-theme", mode), theme);
      const violations: string[] = [];

      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByRole("status", { name: "Carregando" })).toHaveCount(0);

        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const violation of result.violations) {
          if (violation.impact === "serious" || violation.impact === "critical") {
            const where = violation.nodes.slice(0, 3).map((node) => node.target.join(" "));
            violations.push(`${path} ${violation.id}: ${where.join(" | ")}`);
          }
        }

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (overflow > 1) violations.push(`${path} rolagem horizontal de ${overflow}px`);
      }

      expect(violations).toEqual([]);
    });
  }
}

test("navegação e saída no celular", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await (await dialog()).getByRole("link", { name: "Exercícios" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Exercícios" })).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu" }).click();
  await (await dialog()).getByRole("button", { name: "Sair" }).click();

  await expect(page.getByRole("heading", { name: "Acessar conta" })).toBeVisible();
});

test("sem erros de página, CSP ou hidratação", () => {
  expect(problems).toEqual([]);
});
