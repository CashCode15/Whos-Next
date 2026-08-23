import { useCallback, useEffect, useState } from "react";
import type { Preferences } from "./types";

const KEY = "whosnext.prefs";

export const defaultPreferences: Preferences = {
  theme: "dark",
  autoNext: false,
  autoNextSeconds: 60,
  sound: true,
  blurUntilConnected: true,
  showRegion: true,
  language: "English",
  interests: [],
};

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw
      ? { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) }
      : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function applyTheme(theme: Preferences["theme"]) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

/** Client-only preferences hook; reads storage after hydration to avoid mismatches. */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    const stored = readPreferences();
    setPrefs(stored);
    applyTheme(stored.theme);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
      if (patch.theme) applyTheme(next.theme);
      return next;
    });
  }, []);

  return { prefs, update };
}
