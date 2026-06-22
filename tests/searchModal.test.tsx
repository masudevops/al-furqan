import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchModal from "../src/components/SearchModal";
import { searchAyahs } from "../src/services/quranService";

vi.mock("../src/services/quranService", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../src/services/quranService")>();

  return {
    ...original,
    searchAyahs: vi.fn(),
  };
});

const mockedSearchAyahs = vi.mocked(searchAyahs);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
}

function renderSearch(onClose = vi.fn(), initialEntry = "/") {
  return {
    onClose,
    ...render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <SearchModal isOpen onClose={onClose} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    ),
  };
}

describe("Quran search modal", () => {
  beforeEach(() => {
    mockedSearchAyahs.mockReset();
    localStorage.clear();
  });

  it("renders provider text safely and supports keyboard result navigation", async () => {
    const user = userEvent.setup();
    mockedSearchAyahs.mockResolvedValue([
      {
        number: 1,
        numberInSurah: 1,
        text: '<img src=x onerror="alert(1)"> literal (.*) result',
        edition: { identifier: "en.sahih", name: "Saheeh International" },
        surah: { number: 1, name: "الفاتحة", englishName: "Al-Fatihah" },
      },
    ]);
    const { container, onClose } = renderSearch();

    await user.type(screen.getByRole("searchbox", { name: "Search Quran" }), "(.*");

    expect(
      await screen.findByRole("button", { name: /al-fatihah/i }, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText('<img src=x onerror="alert(1)"> literal')).toBeInTheDocument();
    expect(screen.getByText("(.*", { selector: "mark" })).toBeInTheDocument();

    const result = screen.getByRole("button", { name: /al-fatihah/i });
    result.focus();
    await user.keyboard("{Enter}");

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/quran/1#ayah-1",
    );
  });

  it("shows a recoverable message when the provider fails", async () => {
    const user = userEvent.setup();
    mockedSearchAyahs.mockRejectedValue(new Error("Provider unavailable"));
    renderSearch();

    await user.type(screen.getByRole("searchbox", { name: "Search Quran" }), "mercy");

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Search is temporarily unavailable. Please try again.",
        );
      },
      { timeout: 2000 },
    );
  });

  it("hydrates shareable filters and sends a scoped request", async () => {
    mockedSearchAyahs.mockResolvedValue([]);
    renderSearch(
      vi.fn(),
      "/?q=mercy&edition=bn.bengali&surah=2&juz=1",
    );

    expect(screen.getByRole("searchbox", { name: "Search Quran" })).toHaveValue(
      "mercy",
    );
    expect(screen.getByLabelText("Language")).toHaveValue("bn.bengali");
    await waitFor(() => {
      expect(screen.getByLabelText("Surah")).toHaveValue("2");
    });
    expect(screen.getByLabelText("Juz")).toHaveValue("1");

    await waitFor(
      () => {
        expect(mockedSearchAyahs).toHaveBeenCalledWith(
          {
            query: "mercy",
            edition: "bn.bengali",
            surahNumber: 2,
            juzNumber: 1,
          },
          expect.any(AbortSignal),
        );
      },
      { timeout: 1500 },
    );
  });

  it("shows and clears bounded local history", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "alFurqan.quran.searchHistory",
      JSON.stringify(["mercy", "patience"]),
    );
    renderSearch();

    expect(screen.getByText("Recent searches")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Recent searches")).not.toBeInTheDocument();
  });
});
