import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mockSurahOne(page: import("@playwright/test").Page) {
  await page.route("https://api.alquran.cloud/v1/surah/1/*", async (route) => {
    const edition = new URL(route.request().url()).pathname.split("/").pop();
    const isAudio = edition?.startsWith("ar.") && edition !== "ar";
    const texts = isAudio
      ? ["", ""]
      : ["In the name of Allah", "All praise belongs to Allah"];

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          number: 1,
          name: "سُورَةُ ٱلْفَاتِحَةِ",
          englishName: "Al-Fatihah",
          englishNameTranslation: "The Opening",
          revelationType: "Meccan",
          ayahs: texts.map((text, index) => ({
            number: index + 1,
            numberInSurah: index + 1,
            text,
            page: 1,
            audio: isAudio
              ? `https://audio.example/${index + 1}.mp3`
              : undefined,
          })),
        },
      }),
    });
  });
}

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

test("opens a Surah and reads Arabic with translation", async ({ page }) => {
  await mockSurahOne(page);
  await page.goto("/quran/1");

  await expect(
    page.getByRole("heading", { name: /al-faatiha/i }),
  ).toBeVisible();
  await expect(page.locator("#ayah-1")).toContainText("بِسْمِ");
  await expect(page.locator("#ayah-1")).toContainText("In the name of Allah");

  await page.getByRole("button", { name: "Translation" }).click();
  await expect(page.locator("#ayah-1")).not.toContainText(
    "In the name of Allah",
  );
});

test("Surah reader remains usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSurahOne(page);
  await page.goto("/quran/1");

  await expect(page.locator("#ayah-1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /increase arabic font size/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /next surah/i })).toBeVisible();

  const bodyWidth = await page.locator("body").evaluate((element) => {
    return {
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    };
  });
  expect(bodyWidth.scrollWidth).toBeLessThanOrEqual(bodyWidth.clientWidth);
});
