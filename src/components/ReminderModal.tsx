import { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../context/ThemeContext'

type Props = {
  visible: boolean
  onClose: () => void
  onSelectTime: (date: Date) => void
}

const PRESET_OPTIONS = [
  {
    label: 'In 30 minutes',
    getDate: () => {
      const d = new Date()
      d.setMinutes(d.getMinutes() + 30)
      return d
    },
  },
  {
    label: 'In 1 hour',
    getDate: () => {
      const d = new Date()
      d.setMinutes(d.getMinutes() + 60)
      return d
    },
  },
  {
    label: 'In 2 hours',
    getDate: () => {
      const d = new Date()
      d.setMinutes(d.getMinutes() + 120)
      return d
    },
  },
  {
    label: 'Tonight at 8 PM',
    getDate: () => {
      const d = new Date()
      d.setHours(20, 0, 0, 0)
      return d
    },
  },
  {
    label: 'Tomorrow at 9 AM',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      return d
    },
  },
]

export default function ReminderModal({ visible, onClose, onSelectTime }: Props) {
  const { isDark, accent } = useTheme()
  const [customPickerVisible, setCustomPickerVisible] = useState(false)
  const [customDate, setCustomDate] = useState(new Date())
  const [androidStep, setAndroidStep] = useState<'date' | 'time' | null>(null)

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
      {/* Main Preset Modal */}
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <Text className={`text-base font-bold text-center ${isDark ? 'text-white' : 'text-gray-700'}`}>
                🔔 Set Reminder
              </Text>
            </View>

            {PRESET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handlePreset(option.getDate())}
                className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
              >
                <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={handleCustomPress} className="px-5 py-4">
              <Text className="text-base font-semibold" style={{ color: accent.primary }}>
                📅 Custom Date & Time...
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className={`mx-4 mb-6 py-4 rounded-2xl items-center ${isDark ? 'bg-gray-700' : 'bg-white'}`}
          >
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* iOS Custom Picker */}
      {Platform.OS === 'ios' && (
        <Modal visible={customPickerVisible} transparent={false} animationType="slide">
          <View className="flex-1" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <View
              className="flex-row items-center justify-between px-5 pt-14 pb-4"
              style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}
            >
              <TouchableOpacity onPress={() => setCustomPickerVisible(false)}>
                <Text className="text-base font-medium" style={{ color: accent.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Set Reminder
              </Text>
              <TouchableOpacity onPress={handleIOSSave}>
                <Text className="text-base font-semibold" style={{ color: accent.primary }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 justify-center items-center">
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

      {/* Android Date Step */}
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

      {/* Android Time Step */}
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