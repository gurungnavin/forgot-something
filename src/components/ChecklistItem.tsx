import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
// @ts-ignore
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { Item } from '../types'
import { useTheme } from '../context/ThemeContext'

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
      overshootLeft={false}
      overshootRight={false}

      // ── Swipe right → Edit ──────────────────────────────────────────────
      renderLeftActions={() => (
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={{
            backgroundColor: '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
            marginBottom: 10,
            paddingHorizontal: 20,
            gap: 4,
          }}
        >
          <Ionicons name="pencil-outline" size={20} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
      )}

      // ── Swipe left → Delete ─────────────────────────────────────────────
      renderRightActions={() => (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={{
            backgroundColor: '#f43f5e',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
            marginBottom: 10,
            paddingHorizontal: 20,
            gap: 4,
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity
        onPress={() => onToggle(item.id)}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 13,
          marginBottom: 10,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: isDark ? 0 : 0.5,
          borderColor: '#f3f4f6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.15 : 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(item.id)}
          style={{
            width: 24, height: 24, borderRadius: 12,
            borderWidth: 2, marginRight: 12,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: item.checked ? accent.primary : 'transparent',
            borderColor: item.checked ? accent.primary : isDark ? '#4b5563' : '#d1d5db',
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={14} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Label + timestamp */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontWeight: '500',
            textDecorationLine: item.checked ? 'line-through' : 'none',
            color: item.checked
              ? isDark ? '#4b5563' : '#9ca3af'
              : isDark ? '#f9fafb' : '#111827',
          }}>
            {item.label}
          </Text>
          {item.createdAt && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Ionicons name="time-outline" size={11} color={isDark ? '#4b5563' : '#d1d5db'} />
              <Text style={{ fontSize: 11, color: isDark ? '#4b5563' : '#d1d5db' }}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Three dot menu */}
        <TouchableOpacity
          onPress={() => onMenuPress(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingLeft: 8 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  )
}