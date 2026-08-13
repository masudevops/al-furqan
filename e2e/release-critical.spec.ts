import { expect, test } from "@playwright/test";

test("primary navigation and themes remain usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A quiet place to meet the Quran." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  const theme = page.getByRole("button", { name: "Toggle reading theme" });
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("link", { name: "Quran", exact: true }).first().click();
  await expect(page).toHaveURL(/\/quran$/);
});

test("settings is a keyboard modal and restores focus", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  const trigger = page.getByRole("button", { name: "Open reading settings" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Reader settings" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close settings" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("saved library reads and removes local bookmarks", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("af-bookmarks-v1", JSON.stringify([{ id: "quran:1:1", label: "Al-Fatihah 1:1", reference: "1:1", type: "quran", url: "/quran/1/1", savedAt: new Date().toISOString() }])));
  await page.goto("/library");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  await expect(page.getByRole("heading", { name: "Saved Library" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Al-Fatihah 1:1" })).toBeVisible();
  await page.getByRole("button", { name: /Remove Al-Fatihah/ }).click();
  await expect(page.getByText("Nothing saved here yet")).toBeVisible();
});

test("Quran search displays match context", async ({ page }) => {
  await page.route("**/api/search?query=mercy", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ error: null, query: "mercy", navigationItems: [], verseItems: [{ verseKey: "1:1", readerUrl: "/quran/1/1", text: "In the Name of Allah—the Most Compassionate, Most Merciful." }] }) }));
  await page.goto("/search");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  await page.getByRole("searchbox", { name: "Search the Quran" }).fill("mercy");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/Most Compassionate/)).toBeVisible();
});

test("invalid structural routes return a real 404", async ({ page }) => {
  const response = await page.goto("/quran/mushaf/605");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page is not available." })).toBeVisible();
});

test("Mushaf view never exposes QCF glyph codes when its page font fails", async ({ page }) => {
  await page.route("**/api/quran/mushaf/1?layout=qcf-v4", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      error: null,
      chapterNames: ["Al-Fatihah"],
      hizbNumbers: [1],
      juzNumbers: [1],
      pageNumber: 1,
      lines: [],
      tajweedLines: [{ lineNumber: 1, words: [{ arabicText: "بِسْمِ", charType: "word", lineNumber: 1, position: 1, qcfCode: "ENCODED_QCF_GLYPH", verseKey: "1:1" }] }],
      tajweedVerses: [{ arabicText: "بِسْمِ اللَّهِ", tajweedHtml: "بِسْمِ اللَّهِ", verseKey: "1:1" }],
      verseKeys: ["1:1"],
    }),
  }));
  await page.route("https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p1.woff2", route => route.abort("failed"));

  await page.goto("/quran/mushaf/1");
  await expect(page.getByText("بِسْمِ اللَّهِ")).toBeVisible();
  await expect(page.getByText("ENCODED_QCF_GLYPH")).toHaveCount(0);
  await expect(page.getByText(/Mushaf page font could not load/)).toBeVisible();
});
