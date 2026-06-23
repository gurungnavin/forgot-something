import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

type Props = {
  progress: number
  showLabel?: boolean
}

export default function ProgressBar({ progress, showLabel = false }: Props) {
  const { isDark, accent } = useTheme()

  const percentage  = Math.round(progress * 100)
  const isComplete  = percentage === 100
  const activeColor = isComplete ? '#22c55e' : accent.primary
  const trackColor  = isDark ? '#1f2937' : '#f3f4f6'

  return (
    <View style={{ marginBottom: 8 }}>

      {/* Top label */}
      {showLabel && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
            Progress
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isComplete && (
              <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
            )}
            <Text style={{
              fontSize: 12, fontWeight: '700',
              color: isComplete ? '#22c55e' : accent.primary,
            }}>
              {isComplete ? 'All done!' : `${percentage}%`}
            </Text>
          </View>
        </View>
      )}

      {/* Track */}
      <View style={{
        height: 8, borderRadius: 4,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}>
        {/* Fill */}
        <View style={{
          height: 8, borderRadius: 4,
          width: `${percentage}%`,
          backgroundColor: activeColor,
        }} />
      </View>

    </View>
  )
}
