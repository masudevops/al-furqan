import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Header from "../src/components/Header";
import { SettingsProvider } from "../src/context/SettingsContext";

vi.mock("../src/services/quranService", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../src/services/quranService")>();

  return {
    ...original,
    fetchEditions: vi.fn().mockResolvedValue([]),
    searchAyahs: vi.fn().mockResolvedValue([]),
  };
});

function renderHeader() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <Header />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("global navigation", () => {
  it("renders the primary navigation links", () => {
    renderHeader();

    for (const name of [
      "Quran",
      "Hadith",
      "Tafseer",
      "Prayer Times",
      "Hisnul Muslim",
      "Bookmarks",
      "Islamic Books",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("accepts search input without crashing", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /search/i }));

    const input = screen.getByPlaceholderText(/search quran/i);
    await user.type(input, "patience");

    expect(input).toHaveValue("patience");
  });
});
