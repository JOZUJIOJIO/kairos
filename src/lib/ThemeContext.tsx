"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";

type Theme = "cosmic" | "cloud";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "cosmic",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    localStorage.setItem("kairos-theme", "cosmic");
    document.documentElement.dataset.kairosTheme = "cosmic";
    document.documentElement.style.colorScheme = "dark";
  }, []);

  const toggle = useCallback(() => {
    localStorage.setItem("kairos-theme", "cosmic");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "cosmic", toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
