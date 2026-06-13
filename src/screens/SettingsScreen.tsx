import { useState } from 'react'
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Modal, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme, AccentColor, ColorSchemeOption } from '../context/ThemeContext'

const COLOR_OPTIONS: { key: AccentColor; hex: string; label: string }[] = [
  { key: 'rose',   hex: '#fb7185', label: 'Rose'   },
  { key: 'purple', hex: '#c084fc', label: 'Purple' },
  { key: 'blue',   hex: '#60a5fa', label: 'Blue'   },
  { key: 'green',  hex: '#4ade80', label: 'Green'  },
]

const SCHEME_OPTIONS: { key: ColorSchemeOption; label: string; icon: string }[] = [
  { key: 'light',  label: 'Light',  icon: 'sunny-outline'          },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline'           },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
]

// ── Big palette of colours to pick from ───────────────────────────────────────
const PALETTE = [
  // Reds / Pinks
  '#ef4444','#f87171','#fb7185','#f43f5e','#e11d48',
  // Pinks / Purples
  '#ec4899','#f472b6','#d946ef','#c026d3','#a855f7',
  // Purples / Indigos
  '#c084fc','#818cf8','#6366f1','#4f46e5','#7c3aed',
  // Blues
  '#3b82f6','#60a5fa','#38bdf8','#0ea5e9','#06b6d4',
  // Teals / Greens
  '#2dd4bf','#14b8a6','#22c55e','#4ade80','#86efac',
  // Limes / Yellows
  '#a3e635','#bef264','#facc15','#fbbf24','#f59e0b',
  // Oranges / Reds
  '#fb923c','#f97316','#ea580c','#dc2626','#b91c1c',
  // Neutrals
  '#94a3b8','#64748b','#6b7280','#4b5563','#374151',
]

export default function SettingsScreen() {
  const { isDark, colorScheme, accentColor, customHex, accent, setColorScheme, setAccentColor, setCustomHex } = useTheme()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [tempColor, setTempColor] = useState(customHex)
  const [hexInput, setHexInput] = useState(customHex)
  const [hexError, setHexError] = useState(false)

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex)

  const handleHexInput = (val: string) => {
    // auto add # if missing
    const formatted = val.startsWith('#') ? val : `#${val}`
    setHexInput(formatted)
    if (isValidHex(formatted)) {
      setTempColor(formatted)
      setHexError(false)
    } else {
      setHexError(true)
    }
  }

  const handleSwatchPress = (hex: string) => {
    setTempColor(hex)
    setHexInput(hex)
    setHexError(false)
  }

  const handleConfirm = async () => {
    if (!isValidHex(tempColor)) return
    await setCustomHex(tempColor)
    await setAccentColor('custom')
    setPickerVisible(false)
  }

  return (
    <View
      className="flex-1 px-5 pt-14"
      style={{ backgroundColor: isDark ? '#111827' : accent.light }}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="mb-8">
        <Text className="text-4xl font-bold" style={{ color: isDark ? '#fda4af' : accent.text }}>
          Settings ⚙️
        </Text>
        <Text className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          Customise your experience
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Appearance ────────────────────────────────────────────────────── */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
          Appearance
        </Text>

        <View className={`rounded-3xl overflow-hidden mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {SCHEME_OPTIONS.map((option, index) => {
            const isSelected = colorScheme === option.key
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setColorScheme(option.key)}
                activeOpacity={0.7}
                className={`flex-row items-center px-5 py-4 ${
                  index < SCHEME_OPTIONS.length - 1
                    ? isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'
                    : ''
                }`}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: isSelected ? accent.primary : isDark ? '#1f2937' : '#f3f4f6' }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={isSelected ? '#ffffff' : isDark ? '#9ca3af' : '#6b7280'}
                  />
                </View>
                <Text className="flex-1 text-base font-medium" style={{ color: isDark ? '#f9fafb' : '#374151' }}>
                  {option.label}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={accent.primary} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── App Colour ────────────────────────────────────────────────────── */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
          App Colour
        </Text>

        <View className={`rounded-3xl px-5 py-5 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

          {/* Selected preview */}
          <View className="flex-row items-center mb-5">
            <View className="w-10 h-10 rounded-2xl mr-3" style={{ backgroundColor: accent.primary }} />
            <View>
              <Text className="text-base font-semibold" style={{ color: accent.primary }}>
                {accentColor === 'custom'
                  ? customHex.toUpperCase()
                  : accentColor.charAt(0).toUpperCase() + accentColor.slice(1)}
              </Text>
              <Text className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Applied across the whole app
              </Text>
            </View>
            <View className="flex-1" />
            <Ionicons name="checkmark-circle" size={22} color={accent.primary} />
          </View>

          {/* 4 Presets + 🎨 Custom */}
          <View className="flex-row justify-between items-center">
            {COLOR_OPTIONS.map((color) => {
              const isSelected = accentColor === color.key
              return (
                <TouchableOpacity
                  key={color.key}
                  onPress={() => setAccentColor(color.key)}
                  activeOpacity={0.8}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: color.hex,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: isSelected ? color.hex : 'transparent',
                    transform: [{ scale: isSelected ? 1.15 : 1 }],
                  }}
                >
                  {isSelected && <Ionicons name="checkmark" size={20} color="#ffffff" />}
                </TouchableOpacity>
              )
            })}

            {/* 🎨 Custom Picker Button */}
            <TouchableOpacity
              onPress={() => {
                setTempColor(customHex)
                setHexInput(customHex)
                setHexError(false)
                setPickerVisible(true)
              }}
              activeOpacity={0.8}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: accentColor === 'custom' ? customHex : isDark ? '#374151' : '#f3f4f6',
                borderWidth: accentColor === 'custom' ? 3 : 2,
                borderColor: accentColor === 'custom' ? customHex : isDark ? '#4b5563' : '#d1d5db',
                transform: [{ scale: accentColor === 'custom' ? 1.15 : 1 }],
              }}
            >
              {accentColor === 'custom'
                ? <Ionicons name="checkmark" size={20} color="#ffffff" />
                : <Text style={{ fontSize: 22 }}>🎨</Text>
              }
            </TouchableOpacity>
          </View>

          <Text className="text-xs mt-3 text-center" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            Tap 🎨 to pick any custom colour
          </Text>
        </View>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
          About
        </Text>

        <View className={`rounded-3xl px-5 py-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between">
            <Text style={{ color: isDark ? '#f9fafb' : '#374151' }} className="text-base font-medium">
              Forgot Something?
            </Text>
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-sm">v1.0.0</Text>
          </View>
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-xs mt-1">Made with ❤️ for forgetful people</Text>
        </View>

      </ScrollView>

      {/* ── Custom Colour Picker Modal ─────────────────────────────────────── */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 40,
          }}>

            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>
                Pick a Colour 🎨
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close-circle" size={28} color={isDark ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            </View>

            {/* Preview + Hex Input */}
            <View className="flex-row items-center gap-3 mb-5">
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: isValidHex(tempColor) ? tempColor : '#cccccc',
              }} />
              <View style={{ flex: 1 }}>
                <TextInput
                  value={hexInput}
                  onChangeText={handleHexInput}
                  placeholder="#000000"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                  maxLength={7}
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                    color: isDark ? '#f9fafb' : '#111827',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    borderWidth: hexError ? 1.5 : 0,
                    borderColor: '#ef4444',
                  }}
                />
                {hexError && (
                  <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                    Enter a valid hex e.g. #ff5733
                  </Text>
                )}0
              </View>
            </View>

            {/* Colour Palette Grid */}
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {PALETTE.map((hex) => {
                  const isSelected = tempColor === hex
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => handleSwatchPress(hex)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: hex,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isDark ? '#ffffff' : '#374151',
                        transform: [{ scale: isSelected ? 1.15 : 1 }],
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={hexError}
              style={{
                marginTop: 20,
                paddingVertical: 16,
                borderRadius: 20,
                alignItems: 'center',
                backgroundColor: isValidHex(tempColor) ? tempColor : '#9ca3af',
                opacity: hexError ? 0.5 : 1,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                Apply Colour
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  )
}