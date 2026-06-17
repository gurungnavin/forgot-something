import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StatusBar,
  ScrollView, Modal, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme, AccentColor, ColorSchemeOption } from '../context/ThemeContext'

const COLOR_OPTIONS: { key: AccentColor; hex: string; label: string; icon: string }[] = [
  { key: 'rose',   hex: '#fb7185', label: 'Rose',   icon: 'heart'        },
  { key: 'purple', hex: '#c084fc', label: 'Purple', icon: 'sparkles'     },
  { key: 'blue',   hex: '#60a5fa', label: 'Blue',   icon: 'water'        },
  { key: 'green',  hex: '#4ade80', label: 'Green',  icon: 'leaf'         },
]

const SCHEME_OPTIONS: { key: ColorSchemeOption; label: string; icon: string }[] = [
  { key: 'light',  label: 'Light',  icon: 'sunny-outline'          },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline'           },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
]

const PALETTE = [
  '#ef4444','#f87171','#fb7185','#f43f5e','#e11d48',
  '#ec4899','#f472b6','#d946ef','#c026d3','#a855f7',
  '#c084fc','#818cf8','#6366f1','#4f46e5','#7c3aed',
  '#3b82f6','#60a5fa','#38bdf8','#0ea5e9','#06b6d4',
  '#2dd4bf','#14b8a6','#22c55e','#4ade80','#86efac',
  '#a3e635','#bef264','#facc15','#fbbf24','#f59e0b',
  '#fb923c','#f97316','#ea580c','#dc2626','#b91c1c',
  '#94a3b8','#64748b','#6b7280','#4b5563','#374151',
]

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <Text style={{
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: isDark ? '#6b7280' : '#9ca3af',
      marginBottom: 8,
      marginTop: 24,
      paddingHorizontal: 4,
    }}>
      {title}
    </Text>
  )
}

// ── Settings Row ───────────────────────────────────────────────────────────────
function SettingsRow({
  icon,
  iconBg,
  label,
  subtitle,
  right,
  onPress,
  isDark,
  isFirst,
  isLast,
}: {
  icon: string
  iconBg: string
  label: string
  subtitle?: string
  right?: React.ReactNode
  onPress?: () => void
  isDark: boolean
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderTopLeftRadius: isFirst ? 16 : 0,
        borderTopRightRadius: isFirst ? 16 : 0,
        borderBottomLeftRadius: isLast ? 16 : 0,
        borderBottomRightRadius: isLast ? 16 : 0,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
        gap: 14,
      }}
    >
      {/* Icon */}
      <View style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={icon as any} size={17} color="#ffffff" />
      </View>

      {/* Label */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '500',
          color: isDark ? '#f9fafb' : '#111827',
        }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 12,
            color: isDark ? '#6b7280' : '#9ca3af',
            marginTop: 1,
          }}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right */}
      {right}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const {
    isDark, colorScheme, accentColor, customHex,
    accent, setColorScheme, setAccentColor, setCustomHex
  } = useTheme()

  const [pickerVisible, setPickerVisible] = useState(false)
  const [tempColor, setTempColor] = useState(customHex)
  const [hexInput, setHexInput] = useState(customHex)
  const [hexError, setHexError] = useState(false)

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex)

  const handleHexInput = (val: string) => {
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

  const currentColorLabel = accentColor === 'custom'
    ? customHex.toUpperCase()
    : accentColor.charAt(0).toUpperCase() + accentColor.slice(1)

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? '#111827' : accent.light,
    }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 64,
          paddingBottom: 140,
        }}
      >
        {/* Header */}
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: isDark ? '#f9fafb' : '#111827',
          marginBottom: 4,
          letterSpacing: -0.5,
        }}>
          Settings
        </Text>
        <Text style={{
          fontSize: 13,
          color: isDark ? '#6b7280' : '#9ca3af',
          marginBottom: 8,
        }}>
          Customise your experience
        </Text>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <SectionHeader title="Appearance" isDark={isDark} />
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
          {SCHEME_OPTIONS.map((option, index) => (
            <SettingsRow
              key={option.key}
              icon={option.icon}
              iconBg={colorScheme === option.key ? accent.primary : isDark ? '#374151' : '#9ca3af'}
              label={option.label}
              isDark={isDark}
              isFirst={index === 0}
              isLast={index === SCHEME_OPTIONS.length - 1}
              onPress={() => setColorScheme(option.key)}
              right={
                colorScheme === option.key
                  ? <Ionicons name="checkmark-circle" size={22} color={accent.primary} />
                  : <View style={{ width: 22 }} />
              }
            />
          ))}
        </View>

        {/* ── App Colour ──────────────────────────────────────────────────── */}
        <SectionHeader title="App Colour" isDark={isDark} />
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
          {COLOR_OPTIONS.map((color, index) => (
            <SettingsRow
              key={color.key}
              icon="ellipse"
              iconBg={color.hex}
              label={color.label}
              isDark={isDark}
              isFirst={index === 0}
              isLast={false}
              onPress={() => setAccentColor(color.key)}
              right={
                accentColor === color.key
                  ? <Ionicons name="checkmark-circle" size={22} color={color.hex} />
                  : <View style={{ width: 22 }} />
              }
            />
          ))}

          {/* Custom color row */}
          <SettingsRow
            icon="color-palette-outline"
            iconBg={accentColor === 'custom' ? customHex : isDark ? '#374151' : '#9ca3af'}
            label="Custom"
            subtitle={accentColor === 'custom' ? customHex.toUpperCase() : 'Pick any colour'}
            isDark={isDark}
            isFirst={false}
            isLast={true}
            onPress={() => {
              setTempColor(customHex)
              setHexInput(customHex)
              setHexError(false)
              setPickerVisible(true)
            }}
            right={
              accentColor === 'custom'
                ? <Ionicons name="checkmark-circle" size={22} color={customHex} />
                : <Ionicons name="chevron-forward" size={18} color={isDark ? '#4b5563' : '#d1d5db'} />
            }
          />
        </View>

        {/* ── About ──────────────────────────────────────────────────────── */}
        <SectionHeader title="About" isDark={isDark} />
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <SettingsRow
            icon="information-circle-outline"
            iconBg="#3b82f6"
            label="Quikli"
            subtitle="Made with love for forgetful people"
            isDark={isDark}
            isFirst={true}
            isLast={false}
            right={
              <Text style={{ fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af' }}>
                v1.0.0
              </Text>
            }
          />
          <SettingsRow
            icon="star-outline"
            iconBg="#f59e0b"
            label="Rate Quikli"
            subtitle="Enjoying the app? Leave a review!"
            isDark={isDark}
            isFirst={false}
            isLast={true}
            onPress={() => {}}
            right={
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#4b5563' : '#d1d5db'} />
            }
          />
        </View>

      </ScrollView>

      {/* ── Custom Colour Picker Modal ──────────────────────────────────── */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 40,
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
              }}>
                Pick a Colour
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close-circle" size={28} color={isDark ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            </View>

            {/* Preview + Hex Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
                )}
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
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                Apply Colour
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}