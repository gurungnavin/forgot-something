import { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type AccentColor = 'rose' | 'coral' | 'purple' | 'blue' | 'green' | 'custom'

export const ACCENT_COLORS: Record<Exclude<AccentColor, 'custom'>, { primary: string; light: string; text: string }> = {
  rose:   { primary: '#EE5D74', light: '#fff1f2', text: '#EE5D74' },
  coral:  { primary: '#FB7150', light: '#fff4f0', text: '#FB7150' },
  purple: { primary: '#8B6BE8', light: '#f5f3ff', text: '#8B6BE8' },
  blue:   { primary: '#3E8BF5', light: '#eff6ff', text: '#3E8BF5' },
  green:  { primary: '#27B073', light: '#f0fdf4', text: '#27B073' },
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
  const safe = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#EE5D74'
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
  const [customHex, setCustomHexState] = useState<string>('#EE5D74')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      const savedScheme = await AsyncStorage.getItem(STORAGE_KEY_SCHEME)
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEY_ACCENT)
      const savedCustom  = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM)
      if (savedScheme) setColorSchemeState(savedScheme as ColorSchemeOption)
      if (savedAccent) setAccentColorState(savedAccent as AccentColor)
      if (savedCustom) setCustomHexState(savedCustom)
      setLoaded(true)
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

  const accent =
    accentColor === 'custom'
      ? deriveAccent(customHex || '#EE5D74')
      : ACCENT_COLORS[accentColor] ?? ACCENT_COLORS['rose']

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
