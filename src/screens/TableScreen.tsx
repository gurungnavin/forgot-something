import { View, Text } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export default function TableScreen() {
  const { isDark, accent } = useTheme()

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? '#111827' : accent.light }}
    >
      <Text className="text-5xl mb-4">📋</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? '#fda4af' : accent.text }}
      >
        Custom Table
      </Text>
      <Text className="text-sm text-center text-gray-400">
        Coming soon — track members, attendance, payments and more.
      </Text>
    </View>
  )
}