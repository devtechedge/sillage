import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORD = "SillageDemo!2026";

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies();
  const response = await page.request.post("/api/auth/demo", {
    form: { email },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  await page.goto("/desk");
  await expect(page.locator("h1")).toContainText("Good");
}

async function passwordLogin(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/desk");
}

async function noSeriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test("the landing page explains the house and enters the demo", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every perfume");
  await expect(page.getByText("No. 07 Iris Cendre")).toBeVisible();
  await expect(page.getByText("Brief fit")).toBeVisible();
  await noSeriousAxe(page);
  await page.getByRole("button", { name: "Enter the atelier" }).click();
  await page.waitForURL("**/desk");
  await expect(page.locator("h1")).toContainText("Good");
  expect(errors).toEqual([]);
  await noSeriousAxe(page);
});

test("dark mode persists and stays free of serious violations", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await noSeriousAxe(page);

  await loginAs(page, "maya@sillage.demo");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await noSeriousAxe(page);
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
});

test("the login page names the four roles and accepts a password", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  for (const role of ["Owner", "Perfumer", "Evaluator", "Lab"]) {
    await expect(page.getByText(role, { exact: true }).first()).toBeVisible();
  }
  await noSeriousAxe(page);
  await page.fill('input[name="email"]', "maya@sillage.demo");
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/desk");
  await expect(page.locator("h1")).toContainText("Good");
});

test("the desk shows briefs, formulas, the tray and low stock", async ({ page }) => {
  await loginAs(page, "maya@sillage.demo");
  await expect(page.getByRole("heading", { name: "Briefs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Formula shelf" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "On the tray" })).toBeVisible();
  await expect(page.getByText("Orris Butter")).toBeVisible();
  await expect(page.locator(".formula-tab")).toHaveCount(3);
  await noSeriousAxe(page);
});

test("the formula room reads the approved version", async ({ page }) => {
  await loginAs(page, "maya@sillage.demo");
  await page.locator(".formula-tab").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("No. 07 Iris Cendre");
  await expect(page.locator(".paper__totals")).toContainText("1000 / 1000");
  await expect(page.getByText("This version is approved and locked.")).toBeVisible();
  await expect(page.getByText("No strip has been written")).toHaveCount(0);
  await noSeriousAxe(page);
});

test("two strips of the same formula compare", async ({ page }) => {
  await loginAs(page, "jules@sillage.demo");
  await page.goto("/trials");
  const selects = page.locator(".compare-picker select");
  await selects.nth(0).selectOption({ index: 3 });
  await selects.nth(1).selectOption({ index: 4 });
  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.getByRole("heading", { name: /Iris Cendre: v2 against v1/ })).toBeVisible();
  await expect(page.locator(".diff-table tbody tr")).toHaveCount(10);
  await noSeriousAxe(page);
});

test("a formula travels from draft to approved to a produced lot", async ({ page }) => {
  const formulaName = `Journey ${Date.now()}`;

  await loginAs(page, "maya@sillage.demo");
  await page.locator(".brief-card h3 a").first().click();
  await page.fill('input[name="name"]', formulaName);
  await page.getByRole("button", { name: "Open a blank sheet" }).click();
  await page.waitForURL("**/formulas/**");
  const formulaUrl = new URL(page.url()).pathname;

  const search = page.locator('input[type="search"]');
  const parts: Record<string, number> = {
    Hedione: 200,
    "Iso E Super": 250,
    "Cedar Virginia": 180,
    Muscenone: 90,
    Bergamot: 120,
    "Tonka Bean": 90,
    "Violet Leaf": 40,
    "Vetiver Haiti": 30,
  };
  for (const material of Object.keys(parts)) {
    await search.fill(material);
    await page.getByRole("button", { name: new RegExp(`Add to formula: ${material}`) }).click();
  }
  for (const [material, value] of Object.entries(parts)) {
    await page.getByLabel(`${material} parts per thousand`).fill(String(value));
  }
  await expect(page.locator(".paper__totals")).toContainText("1000 / 1000");

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("This version is with the evaluator")).toBeVisible();

  await loginAs(page, "jules@sillage.demo");
  await page.goto(formulaUrl);
  await page.getByLabel("Score").selectOption("4");
  await page.getByRole("checkbox", { name: "powdery" }).check();
  await page.getByRole("textbox", { name: "Note", exact: true }).first().fill("Close, a little sweet.");
  await page.getByRole("button", { name: "Record trial" }).click();
  await expect(page.getByText("Trial recorded.")).toBeVisible();
  await page.getByLabel("Decision").selectOption("CHANGES");
  await page.getByRole("textbox", { name: "Note", exact: true }).nth(1).fill("Pull the base back and send it again.");
  await page.getByRole("button", { name: "Record decision" }).click();
  await expect(page.getByText("Returned", { exact: true }).first()).toBeVisible();

  await loginAs(page, "maya@sillage.demo");
  await page.goto(formulaUrl);
  await page.getByRole("button", { name: "Revise formula" }).click();
  await page.waitForURL(/version=/);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("This version is with the evaluator")).toBeVisible();

  await loginAs(page, "jules@sillage.demo");
  await page.goto(formulaUrl);
  await page.getByLabel("Decision").selectOption("APPROVED");
  await page.getByRole("textbox", { name: "Note", exact: true }).nth(1).fill("Approved.");
  await page.getByRole("button", { name: "Record decision" }).click();
  await expect(page.getByText("This version is approved and locked.")).toBeVisible();

  await loginAs(page, "noa@sillage.demo");
  await page.goto("/batches");
  const approvedRow = page.locator(".approved-row").filter({ hasText: formulaName });
  await approvedRow.getByRole("link", { name: "Produce" }).click();
  await page.locator('input[name="bottleCount"]').fill("2");
  await page.locator('select[name="bottleMl"]').selectOption("30");
  await page.getByRole("button", { name: "Produce the lot" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/batches/") && !url.pathname.startsWith("/batches/new/"));
  await expect(page.locator(".lot-title")).toHaveText(/^SV-\d{4}-[A-Z0-9]{4}$/);
  await expect(page.locator(".ledger-table tbody tr")).toHaveCount(8);
  await expect(page.locator(".ledger-table tr", { hasText: "Bergamot" })).toContainText("1.4 g");
  await noSeriousAxe(page);
});

test("an outsider sees the house as missing", async ({ page }) => {
  await loginAs(page, "maya@sillage.demo");
  const href = await page.locator(".formula-tab").first().getAttribute("href");
  await passwordLogin(page, "rival@sillage.demo");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "This page is not in the house." })).toBeVisible();
});

test("roles see only the actions they can take", async ({ page }) => {
  await loginAs(page, "jules@sillage.demo");
  await page.locator(".formula-tab").first().click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);

  await loginAs(page, "noa@sillage.demo");
  await page.locator(".formula-tab").first().click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
});

test("a material can be added with the keyboard", async ({ page }) => {
  await loginAs(page, "maya@sillage.demo");
  const draft = page.locator(".formula-tab").filter({ hasText: "Amber Registry study" });
  await draft.click();
  await expect(page.getByText("This version is approved and locked.")).toHaveCount(0);
  await page.locator('input[type="search"]').fill("Hedione");
  const add = page.getByRole("button", { name: /Add to formula: Hedione/ });
  await expect(add).toBeEnabled();
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Hedione parts per thousand")).toBeVisible();
});

test("the house fits phone, tablet and desktop without a page scrollbar", async ({ page }) => {
  await loginAs(page, "owner@sillage.demo");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/desk", "/materials", "/archive", "/trials", "/batches"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      const width = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }));
      expect(width.scroll, `${path} at ${viewport.width}px`).toBeLessThanOrEqual(width.inner);
    }

    await page.goto("/desk");
    const formula = page.locator(".formula-tab").first();
    await formula.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(width.scroll, `formula at ${viewport.width}px`).toBeLessThanOrEqual(width.inner);
  }
});

test("the health endpoint reports the database and commit", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.database).toBe("reachable");
  expect(typeof body.commit).toBe("string");
});
