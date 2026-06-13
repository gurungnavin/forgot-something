import { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type AccentColor = 'rose' | 'purple' | 'blue' | 'green' | 'custom'

export const ACCENT_COLORS: Record<Exclude<AccentColor, 'custom'>, { primary: string; light: string; text: string }> = {
  rose:   { primary: '#fb7185', light: '#fff1f2', text: '#f43f5e' },
  purple: { primary: '#c084fc', light: '#faf5ff', text: '#a855f7' },
  blue:   { primary: '#60a5fa', light: '#eff6ff', text: '#3b82f6' },
  green:  { primary: '#4ade80', light: '#f0fdf4', text: '#22c55e' },
}

export type ColorSchemeOption = 'light' | 'dark' | 'system'

type ThemeContextType = {
  colorScheme: ColorSchemeOption
  isDark: boolean
  accentColor: AccentColor
  customHex: string
  accent: { primary: string; light: string; text: string }
  setColorScheme: (s: ColorSchemeOption) => void
  setAccentColor: (c: AccentColor) => void
  setCustomHex: (hex: string) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY_SCHEME = '@theme_scheme'
const STORAGE_KEY_ACCENT = '@theme_accent'
const STORAGE_KEY_CUSTOM = '@theme_custom_hex'

// ── Derive accent from any hex ─────────────────────────────────────────────────
function deriveAccent(hex: string) {
  const safe = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#fb7185' // ✅ guard
  return {
    primary: safe,
    light: safe + '22',
    text: safe,
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [colorScheme, setColorSchemeState] = useState<ColorSchemeOption>('system')
  const [accentColor, setAccentColorState] = useState<AccentColor>('rose')
  const [customHex, setCustomHexState] = useState<string>('#fb7185')
  const [loaded, setLoaded] = useState(false) // ✅ prevent render before prefs load

  useEffect(() => {
    const load = async () => {
      const savedScheme = await AsyncStorage.getItem(STORAGE_KEY_SCHEME)
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEY_ACCENT)
      const savedCustom  = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM)
      if (savedScheme) setColorSchemeState(savedScheme as ColorSchemeOption)
      if (savedAccent) setAccentColorState(savedAccent as AccentColor)
      if (savedCustom) setCustomHexState(savedCustom)
      setLoaded(true) // ✅ done loading
    }
    load()
  }, [])

  const isDark =
    colorScheme === 'dark'  ? true  :
    colorScheme === 'light' ? false :
    systemScheme === 'dark'

  const setColorScheme = async (s: ColorSchemeOption) => {
    setColorSchemeState(s)
    await AsyncStorage.setItem(STORAGE_KEY_SCHEME, s)
  }

  const setAccentColor = async (c: AccentColor) => {
    setAccentColorState(c)
    await AsyncStorage.setItem(STORAGE_KEY_ACCENT, c)
  }

  const setCustomHex = async (hex: string) => {
    setCustomHexState(hex)
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM, hex)
  }

  // ✅ always safe — never undefined
  const accent =
    accentColor === 'custom'
      ? deriveAccent(customHex || '#fb7185')
      : ACCENT_COLORS[accentColor] ?? ACCENT_COLORS['rose']

  // ✅ don't render children until prefs are loaded
  if (!loaded) return null

  return (
    <ThemeContext.Provider value={{
      colorScheme, isDark, accentColor, customHex,
      accent, setColorScheme, setAccentColor, setCustomHex,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}