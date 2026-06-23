import { useState, useCallback } from "react";
import { setLocale, getLocale, resetLocale, SupportedLocale } from "../i18n";

// Simple event emitter for locale changes
const listeners = new Set<() => void>();

export function notifyLocaleChange() {
  listeners.forEach((fn) => fn());
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale());

  // Subscribe to locale changes from other components
  useState(() => {
    const listener = () => setLocaleState(getLocale());
    listeners.add(listener);
    return () => listeners.delete(listener);
  });

  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    await setLocale(newLocale);
    setLocaleState(newLocale);
    notifyLocaleChange();
  }, []);

  const resetToDevice = useCallback(async () => {
    await resetLocale();
    setLocaleState(getLocale());
    notifyLocaleChange();
  }, []);

  return { locale, changeLocale, resetToDevice };
}
