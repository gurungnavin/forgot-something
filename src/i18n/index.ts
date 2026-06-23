import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en";
import ja from "./ja";
import ne from "./ne";

export type SupportedLocale = "en" | "ja" | "ne";

export const SUPPORTED_LOCALES: { code: SupportedLocale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English",  nativeLabel: "English" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語"  },
  { code: "ne", label: "Nepali",   nativeLabel: "नेपाली" },
];

const LANGUAGE_KEY = "quikli_language";

const translations: Record<SupportedLocale, typeof en> = { en, ja, ne };

// Current locale — starts with device locale, can be overridden
let currentLocale: SupportedLocale = "en";

// ── Initialise (call once at app startup) ─────────────────────────────────────
export async function initI18n(): Promise<void> {
  try {
    // Check if user manually overrode language
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && stored in translations) {
      currentLocale = stored as SupportedLocale;
      return;
    }
    // Otherwise auto-detect from device
    const deviceLocale = getLocales()[0]?.languageCode ?? "en";
    if (deviceLocale in translations) {
      currentLocale = deviceLocale as SupportedLocale;
    } else {
      currentLocale = "en"; // fallback
    }
  } catch {
    currentLocale = "en";
  }
}

// ── Set language manually (from Settings) ─────────────────────────────────────
export async function setLocale(locale: SupportedLocale): Promise<void> {
  currentLocale = locale;
  await AsyncStorage.setItem(LANGUAGE_KEY, locale);
}

// ── Get current locale ────────────────────────────────────────────────────────
export function getLocale(): SupportedLocale {
  return currentLocale;
}

// ── Reset to device language ──────────────────────────────────────────────────
export async function resetLocale(): Promise<void> {
  await AsyncStorage.removeItem(LANGUAGE_KEY);
  const deviceLocale = getLocales()[0]?.languageCode ?? "en";
  currentLocale = (deviceLocale in translations ? deviceLocale : "en") as SupportedLocale;
}

// ── Translate function ────────────────────────────────────────────────────────
type Leaves<T> = T extends object
  ? { [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}` }[keyof T]
  : never;

type TranslationKey = Leaves<typeof en>;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: any = translations[currentLocale];

  for (const k of keys) {
    value = value?.[k];
  }

  // Fallback to English if key missing in current locale
  if (value === undefined) {
    let fallback: any = translations["en"];
    for (const k of keys) {
      fallback = fallback?.[k];
    }
    value = fallback;
  }

  if (typeof value !== "string") return key;

  // Replace {{param}} placeholders
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, p) =>
      params[p] !== undefined ? String(params[p]) : `{{${p}}}`
    );
  }

  return value;
}
