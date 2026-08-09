import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import Home from "../src/pages/Home";
import { SettingsProvider } from "../src/context/SettingsContext";

describe("landing page", () => {
  it("renders the primary landing content", () => {
    render(
      <MemoryRouter>
        <SettingsProvider><Home /></SettingsProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /al furqan/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /holy quran/i })).toHaveAttribute(
      "href",
      "/al-quran",
    );
  });

  it("has no critical automatically detectable accessibility violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <SettingsProvider><Home /></SettingsProvider>
      </MemoryRouter>,
    );

    const results = await axe(container);
    const criticalViolations = results.violations.filter(
      ({ impact }) => impact === "critical",
    );

    expect({ ...results, violations: criticalViolations }).toHaveNoViolations();
  });
});
