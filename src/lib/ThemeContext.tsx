"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";

type Theme = "cosmic" | "cloud";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "cloud",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    localStorage.setItem("kairos-theme", "cloud");
    document.documentElement.dataset.kairosTheme = "cloud";
    document.documentElement.style.colorScheme = "light";
  }, []);

  const toggle = useCallback(() => {
    localStorage.setItem("kairos-theme", "cloud");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "cloud", toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
