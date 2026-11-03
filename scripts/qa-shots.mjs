import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = "http://localhost:3000";
const out = "docs/screenshots";
await mkdir(out, { recursive: true });
await mkdir("public", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

async function ready() {
  await page.waitForSelector("h1", { state: "visible" });
  await page.waitForLoadState("networkidle");
}

async function shot(name, url, full = true) {
  await page.goto(base + url, { waitUntil: "networkidle" });
  await ready();
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  console.log("shot", name, page.url());
}

async function login(email) {
  await page.context().clearCookies();
  const response = await page.request.post(base + "/api/auth/demo", {
    form: { email },
    maxRedirects: 0,
  });
  if (response.status() !== 303) throw new Error(`login failed ${response.status()}`);
}

await shot("01-landing", "/", true);
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.screenshot({ path: "public/og.png", fullPage: false });
await page.setViewportSize({ width: 1280, height: 640 });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/social-preview.png`, fullPage: false });
await page.setViewportSize({ width: 1440, height: 1000 });

await login("maya@sillage.demo");
await page.goto(base + "/desk", { waitUntil: "networkidle" });
await ready();
await page.screenshot({ path: `${out}/02-desk.png`, fullPage: true });

await page.locator(".formula-tab").first().click();
await page.waitForSelector(".paper");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/03-formula-room.png`, fullPage: true });

await shot("04-trials", "/trials", true);
await shot("05-batches", "/batches", true);
await shot("06-materials", "/materials", true);

await page.goto(base + "/batches", { waitUntil: "networkidle" });
await page.locator(".lot-row").first().click();
await page.waitForSelector(".lot-title");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/07-batch.png`, fullPage: true });

await login("jules@sillage.demo");
await page.goto(base + "/desk", { waitUntil: "networkidle" });
await page.locator(".formula-tab").filter({ hasText: "Fig Leaf No. 2" }).click();
await page.waitForSelector(".review-panel");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/08-review.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + "/", { waitUntil: "networkidle" });
await ready();
await page.screenshot({ path: `${out}/09-landing-mobile.png`, fullPage: true });
const overflow = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  inner: window.innerWidth,
}));
console.log("mobile landing overflow", overflow);
console.log("errors", errors);
await browser.close();
