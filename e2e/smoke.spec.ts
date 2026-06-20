import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing page and navigation load", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /al furqan/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Quran", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Tafseer", exact: true }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const criticalViolations = results.violations.filter(
    ({ impact }) => impact === "critical",
  );

  expect(criticalViolations).toEqual([]);
});

test("Quran route loads", async ({ page }) => {
  await page.goto("/al-quran");

  await expect(page.getByRole("button", { name: /surah list/i })).toBeVisible();
  await expect(page.getByText(/showing 114 of 114 surahs/i)).toBeVisible();
});

test("Tafsir route loads", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ text: "Test tafsir content" }),
    });
  });
  await page.goto("/tafseer");

  await expect(
    page.getByRole("heading", { name: /quranic tafseer/i }),
  ).toBeVisible();
});

test("global search accepts input without crashing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /search/i }).click();

  const search = page.getByPlaceholder(/search quran/i);
  await search.fill("pa");

  await expect(search).toHaveValue("pa");
  await expect(page.getByText(/type at least 3 characters/i)).toBeVisible();
});
