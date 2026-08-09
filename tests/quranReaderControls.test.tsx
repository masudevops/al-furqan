import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuranReaderControls from "../src/components/quran/QuranReaderControls";

describe("Quran reader controls", () => {
  it("changes Arabic size, translation visibility, and density", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const preferences = {
      arabicFontSize: 38,
      showTranslation: true,
      density: "comfortable" as const,
    };

    render(
      <QuranReaderControls
        preferences={preferences}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /increase arabic font size/i }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...preferences,
      arabicFontSize: 40,
    });

    await user.click(screen.getByRole("button", { name: "Translation" }));
    expect(onChange).toHaveBeenCalledWith({
      ...preferences,
      showTranslation: false,
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: /reading spacing/i }),
      "compact",
    );
    expect(onChange).toHaveBeenCalledWith({
      ...preferences,
      density: "compact",
    });
  });
});
