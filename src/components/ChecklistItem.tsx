import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
// @ts-ignore
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { Item } from '../types'
import { useTheme } from '../context/ThemeContext'
import { useRef } from 'react'

type Props = {
  item: Item
  index: number
  onToggle: (id: string) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onMenuPress: (item: Item) => void
  swipeableRef?: (ref: any) => void
}

function formatTime(isoString: string) {
  const date = new Date(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  const isToday = date.toDateString() === new Date().toDateString()
  if (isToday) return `Today ${h}:${minutes} ${ampm}`
  return `${date.toLocaleDateString()} ${h}:${minutes} ${ampm}`
}

export default function ChecklistItem({
  item,
  index,
  onToggle,
  onEdit,
  onDelete,
  onMenuPress,
  swipeableRef,
}: Props) {
  const { isDark, accent } = useTheme()

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={() => (
        <TouchableOpacity
          onPress={() => onEdit(item)}
          className="bg-blue-400 justify-center items-center rounded-2xl mb-3 px-5"
        >
          <Text className="text-white text-xl">✏️</Text>
          <Text className="text-white text-xs font-medium mt-1">Edit</Text>
        </TouchableOpacity>
      )}
      renderRightActions={() => (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          className="bg-rose-400 justify-center items-center rounded-2xl mb-3 px-5"
        >
          <Text className="text-white text-xl">🗑️</Text>
          <Text className="text-white text-xs font-medium mt-1">Delete</Text>
        </TouchableOpacity>
      )}
      overshootLeft={false}
      overshootRight={false}
    >
      <TouchableOpacity
        onPress={() => onToggle(item.id)}
        activeOpacity={0.8}
        className={`flex-row items-center justify-between rounded-2xl px-4 py-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* Number Badge */}
        <View
          className="w-7 h-7 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: isDark ? '#1f2937' : accent.light }}
        >
          <Text className="text-xs font-bold" style={{ color: accent.primary }}>
            {index + 1}
          </Text>
        </View>

        {/* Checkbox */}
        <View
          className="w-6 h-6 rounded-full border-2 mr-3 items-center justify-center"
          style={{
            backgroundColor: item.checked ? accent.primary : 'transparent',
            borderColor: item.checked ? accent.primary : isDark ? '#6b7280' : '#d1d5db',
          }}
        >
          {item.checked && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>

        {/* Label + Timestamp */}
        <View className="flex-1">
          <Text
            className={`text-base ${item.checked ? 'line-through text-gray-400' : ''}`}
            style={{ color: item.checked ? '#9ca3af' : isDark ? '#f9fafb' : '#374151' }}
          >
            {item.label}
          </Text>
          {item.createdAt && (
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              🕐 {formatTime(item.createdAt)}
            </Text>
          )}
        </View>

        {/* Three dot menu */}
        <TouchableOpacity
          onPress={() => onMenuPress(item)}
          className="px-2 py-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  )
}