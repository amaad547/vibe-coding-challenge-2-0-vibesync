"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = "sportsync-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Temporarily add a transition helper class after initial load
  root.classList.add("theme-transition");

  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage or fallback to system
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        const resolved = stored === "system" ? getSystemTheme() : stored;
        setResolvedTheme(resolved);
        applyTheme(resolved);
      } else {
        const sys = getSystemTheme();
        setResolvedTheme(sys);
        applyTheme(sys);
      }
    } catch {
      const sys = getSystemTheme();
      setResolvedTheme(sys);
      applyTheme(sys);
    }
    setMounted(true);
  }, []);

  // Listen to OS prefers-color-scheme changes when in system mode
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const sys = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(sys);
        applyTheme(sys);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Storage unavailable or disabled
    }

    const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    setResolvedTheme(nextResolved);
    applyTheme(nextResolved);
  }, []);

  // Provide stable context value
  const contextValue = React.useMemo(
    () => ({
      theme,
      resolvedTheme: mounted ? resolvedTheme : "light",
      setTheme,
    }),
    [theme, resolvedTheme, mounted, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Inlined script to inject into <head> before page render.
 * Executes synchronously to prevent flash of wrong theme (FOUC).
 */
export function ThemeScript() {
  const code = `(function() {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var stored = localStorage.getItem(key);
    var isDark = false;
    if (stored === 'dark') {
      isDark = true;
    } else if (stored === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

