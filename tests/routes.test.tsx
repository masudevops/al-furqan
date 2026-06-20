import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AlQuranPage from "../src/pages/AlQuranPage";
import TafseerPage from "../src/pages/TafseerPage";

vi.mock("../src/services/quranTafseerService", () => ({
  fetchTafseerForAyah: vi.fn().mockResolvedValue(null),
  formatTafseerText: (text: string) => text,
  getDefaultTafseerSource: () => "en-tafisr-ibn-kathir",
  getTafseerSources: () => [
    {
      identifier: "en-tafisr-ibn-kathir",
      name: "Ibn Kathir (English)",
      language: "en",
      author: "Hafiz Ibn Kathir",
      englishName: "Tafsir Ibn Kathir",
    },
  ],
}));

describe("core routes", () => {
  it("loads the Quran route", async () => {
    render(
      <MemoryRouter>
        <AlQuranPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /surah list/i })).toBeInTheDocument();
    expect(await screen.findByText(/showing 114 of 114 surahs/i)).toBeInTheDocument();
  });

  it("loads the Tafsir route", () => {
    render(
      <MemoryRouter>
        <TafseerPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /quranic tafseer/i }),
    ).toBeInTheDocument();
  });
});
