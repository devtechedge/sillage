import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "https://sillage-one-mu.vercel.app";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector("h1");
console.log("landing", await page.title(), await page.getByRole("heading", { level: 1 }).innerText());
console.log("og:image", await page.locator('meta[property="og:image"]').getAttribute("content"));

await page.getByRole("button", { name: "Enter the atelier" }).click();
await page.waitForURL("**/desk");
await page.waitForSelector("h1");
console.log("desk", await page.getByRole("heading", { level: 1 }).innerText());
console.log("formula tabs", await page.locator(".formula-tab").count());

await page.locator(".formula-tab").first().click();
await page.waitForSelector(".paper");
console.log("formula", await page.getByRole("heading", { level: 1 }).innerText());
console.log("totals", await page.locator(".paper__totals").innerText());

const origins = await page.evaluate(() =>
  [...new Set(performance.getEntriesByType("resource").map((entry) => new URL(entry.name).origin))]
);
console.log("origins", origins);

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
const width = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  inner: window.innerWidth,
}));
console.log("mobile", width);
console.log("errors", errors);
await browser.close();
