// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  darkMode: boolean;
  mode: "light" | "dark" | "sepia";
  setMode: (mode: "light" | "dark" | "sepia") => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  mode: "light",
  setMode: () => {},
  toggleDarkMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark" | "sepia">(() => {
    // Check for saved preference or system preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "sepia" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });
  const darkMode = mode === "dark";

  useEffect(() => {
    // Apply class to document
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.classList.toggle("sepia", mode === "sepia");
    localStorage.setItem("theme", mode);
  }, [mode]);

  const toggleDarkMode = () => setMode((current) => current === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ darkMode, mode, setMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
