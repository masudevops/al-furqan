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

test("global search safely handles literal metacharacters and provider text", async ({ page }) => {
  await page.route(/api\.alquran\.cloud\/v1\/search\//, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          count: 1,
          matches: [
            {
              number: 1,
              numberInSurah: 1,
              text: '<img src=x onerror="alert(1)"> literal (.*) result',
              edition: {
                identifier: "en.sahih",
                name: "Saheeh International",
              },
              surah: {
                number: 1,
                name: "الفاتحة",
                englishName: "Al-Fatihah",
              },
            },
          ],
        },
      }),
    });
  });
  await page.route(/api\.alquran\.cloud\/v1\/juz\/1\//, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          edition: {
            identifier: "en.sahih",
            name: "Saheeh International",
          },
          ayahs: [
            {
              number: 1,
              numberInSurah: 1,
              juz: 1,
              text: '<img src=x onerror="alert(1)"> literal (.*) result',
              surah: {
                number: 1,
                name: "الفاتحة",
                englishName: "Al-Fatihah",
              },
            },
          ],
        },
      }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /search/i }).click();

  const search = page.getByRole("searchbox", { name: "Search Quran" });
  await search.fill("(.*");

  await expect(
    page.getByRole("button", { name: /al-fatihah/i }),
  ).toBeVisible();
  await expect(page.locator("mark")).toHaveText("(.*");
  await expect(page.locator("img[src='x']")).toHaveCount(0);
  await expect(page.getByText(/<img src=x onerror=/i)).toBeVisible();

  await page.getByLabel("Surah").selectOption("1");
  await page.getByLabel("Juz").selectOption("1");
  await expect(page).toHaveURL(/q=%28\.\*/);
  await expect(page).toHaveURL(/surah=1/);
  await expect(page).toHaveURL(/juz=1/);
  await expect(
    page.getByRole("button", { name: /al-fatihah/i }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("searchbox", { name: "Search Quran" }),
  ).toHaveValue("(.*");
});

test("opens a Surah and reads Arabic with translation", async ({ page }) => {
  await mockSurahOne(page);
  await page.goto("/quran/1");

  await expect(
    page.getByRole("heading", { name: /al-faatiha/i }),
  ).toBeVisible();
  await expect(page.locator("#ayah-1")).toContainText("بِسْمِ");
  await expect(page.locator("#ayah-1")).toContainText("In the name of Allah");

  await page.getByRole("button", { name: /play ayah 1/i }).click();
  await expect(
    page.getByRole("region", { name: /quran audio player/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: /audio progress/i }),
  ).toBeVisible();

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
  await page
    .getByRole("button", { name: /save ayah 1 as last read/i })
    .click();
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

  await page.goto("/al-quran");
  await expect(
    page.getByRole("link", { name: /resume surah 1, ayah 1/i }),
  ).toBeVisible();
});

test("migrates bookmarks and resumes the explicit last-read ayah", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "quranBookmarks",
      JSON.stringify([
        { surah: 1, ayah: 1 },
        { surah: 999, ayah: 1 },
      ]),
    );
  });
  await mockSurahOne(page);
  await page.goto("/quran/1");

  await expect(
    page.getByRole("button", { name: /remove bookmark from ayah 1/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /save ayah 2 as last read/i })
    .click();

  const storedState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("alFurqan.quran.continuity") || "{}"),
  );
  expect(storedState.bookmarks).toHaveLength(1);
  expect(storedState.lastRead.ref).toEqual({
    surahNumber: 1,
    ayahNumber: 2,
  });
  expect(storedState.recentSurahs[0].surahNumber).toBe(1);

  await page.goto("/al-quran");
  await expect(
    page.getByRole("link", { name: /resume surah 1, ayah 2/i }),
  ).toHaveAttribute("href", "/quran/1#ayah-2");

  await page.goto("/bookmarks");
  await expect(
    page.getByRole("heading", { name: /al-faatiha/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /remove bookmark for surah 1, ayah 1/i })
    .click();
  await expect(page.getByText(/no bookmarks yet/i)).toBeVisible();
});
