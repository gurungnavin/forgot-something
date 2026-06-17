import { useState } from 'react'
import {
  View, Text, Modal,
  TouchableOpacity, Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

type Props = {
  visible: boolean
  onClose: () => void
  onSelectTime: (date: Date) => void
}

const PRESET_OPTIONS = [
  {
    label: 'In 30 minutes',
    icon: 'time-outline',
    getDate: () => { const d = new Date(); d.setMinutes(d.getMinutes() + 30); return d },
  },
  {
    label: 'In 1 hour',
    icon: 'time-outline',
    getDate: () => { const d = new Date(); d.setMinutes(d.getMinutes() + 60); return d },
  },
  {
    label: 'In 2 hours',
    icon: 'time-outline',
    getDate: () => { const d = new Date(); d.setMinutes(d.getMinutes() + 120); return d },
  },
  {
    label: 'Tonight at 8 PM',
    icon: 'moon-outline',
    getDate: () => { const d = new Date(); d.setHours(20, 0, 0, 0); return d },
  },
  {
    label: 'Tomorrow at 9 AM',
    icon: 'sunny-outline',
    getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d },
  },
]

export default function ReminderModal({ visible, onClose, onSelectTime }: Props) {
  const { isDark, accent } = useTheme()
  const [customPickerVisible, setCustomPickerVisible] = useState(false)
  const [customDate, setCustomDate]                   = useState(new Date())
  const [androidStep, setAndroidStep]                 = useState<'date' | 'time' | null>(null)

  const handlePreset = (date: Date) => {
    onClose()
    onSelectTime(date)
  }

  const handleCustomPress = () => {
    onClose()
    setCustomDate(new Date())
    if (Platform.OS === 'android') setAndroidStep('date')
    else setCustomPickerVisible(true)
  }

  const handleIOSSave = () => {
    setCustomPickerVisible(false)
    onSelectTime(customDate)
  }

  return (
    <>
      {/* ── Preset options modal ─────────────────────────────────────────── */}
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={{
            marginHorizontal: 16, marginBottom: 40,
            borderRadius: 24, overflow: 'hidden',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}>
            {/* Header */}
            <View style={{
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              <Ionicons name="notifications-outline" size={18} color={isDark ? '#f9fafb' : '#111827'} />
              <Text style={{
                fontSize: 15, fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
              }}>
                Set Reminder
              </Text>
            </View>

            {/* Preset options */}
            {PRESET_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handlePreset(option.getDate())}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  paddingHorizontal: 20, paddingVertical: 15,
                  borderBottomWidth: 0.5,
                  borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                }}
              >
                <View style={{
                  width: 32, height: 32, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: accent.primary + '18',
                }}>
                  <Ionicons name={option.icon as any} size={16} color={accent.primary} />
                </View>
                <Text style={{
                  fontSize: 15, fontWeight: '500',
                  color: isDark ? '#f9fafb' : '#111827',
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom date & time */}
            <TouchableOpacity
              onPress={handleCustomPress}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 20, paddingVertical: 15,
              }}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 8,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: accent.primary + '18',
              }}>
                <Ionicons name="calendar-outline" size={16} color={accent.primary} />
              </View>
              <Text style={{
                fontSize: 15, fontWeight: '600',
                color: accent.primary,
              }}>
                Custom Date & Time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginHorizontal: 16, marginBottom: 24, paddingVertical: 16,
              borderRadius: 16, alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }}
          >
            <Text style={{
              fontSize: 15, fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── iOS custom date/time picker ──────────────────────────────────── */}
      {Platform.OS === 'ios' && (
        <Modal visible={customPickerVisible} transparent={false} animationType="slide">
          <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: isDark ? '#374151' : '#e5e7eb',
            }}>
              <TouchableOpacity onPress={() => setCustomPickerVisible(false)}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: accent.primary }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f9fafb' : '#111827' }}>
                Set Reminder
              </Text>
              <TouchableOpacity onPress={handleIOSSave}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: accent.primary }}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <DateTimePicker
                value={customDate}
                mode="datetime"
                display="spinner"
                minimumDate={new Date()}
                textColor={isDark ? '#ffffff' : '#111827'}
                onChange={(_, selected) => { if (selected) setCustomDate(selected) }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ── Android date step ────────────────────────────────────────────── */}
      {Platform.OS === 'android' && androidStep === 'date' && (
        <DateTimePicker
          value={customDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            if (selected) {
              const updated = new Date(customDate)
              updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
              setCustomDate(updated)
              setAndroidStep('time')
            } else {
              setAndroidStep(null)
            }
          }}
        />
      )}

      {/* ── Android time step ────────────────────────────────────────────── */}
      {Platform.OS === 'android' && androidStep === 'time' && (
        <DateTimePicker
          value={customDate}
          mode="time"
          display="default"
          onChange={(_, selected) => {
            setAndroidStep(null)
            if (selected) {
              const updated = new Date(customDate)
              updated.setHours(selected.getHours(), selected.getMinutes())
              setCustomDate(updated)
              onSelectTime(updated)
            }
          }}
        />
      )}
    </>
  )
}