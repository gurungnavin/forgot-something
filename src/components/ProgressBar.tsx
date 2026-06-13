import { View, Text } from 'react-native'
import { useTheme } from '../context/ThemeContext'

type Props = {
  progress: number // 0 to 1
  showLabel?: boolean
}

export default function ProgressBar({ progress, showLabel = false }: Props) {
  const { isDark, accent } = useTheme()

  const percentage = Math.round(progress * 100)
  const isComplete = percentage === 100

  const activeColor = isComplete ? '#4ade80' : accent.primary
  const trackColor = isDark ? '#374151' : accent.primary + '22'

  return (
    <View className="mb-6">

      {/* Top Label */}
      {showLabel && (
        <View className="flex-row justify-between mb-2">
          <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
            Progress
          </Text>
          <Text
            className="text-xs font-bold"
            style={{ color: isComplete ? '#4ade80' : accent.primary }}
          >
            {isComplete ? '🎉 All done!' : `${percentage}%`}
          </Text>
        </View>
      )}

      {/* Bar + Bubble */}
      <View className="relative">

        {/* Percentage Bubble */}
        {percentage > 0 && (
          <View
            style={{ left: `${Math.min(percentage, 88)}%` }}
            className="absolute -top-6 items-center"
          >
            <View
              style={{ backgroundColor: activeColor }}
              className="px-1.5 py-0.5 rounded-md"
            >
              <Text className="text-white text-xs font-bold">{percentage}%</Text>
            </View>
            {/* Triangle pointer */}
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: 4,
              borderRightWidth: 4,
              borderTopWidth: 4,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: activeColor,
            }} />
          </View>
        )}

        {/* Track */}
        <View
          className="w-full h-3 rounded-full"
          style={{ backgroundColor: trackColor }}
        >
          {/* Fill */}
          <View
            className="h-3 rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: activeColor,
            }}
          />
        </View>

      </View>
    </View>
  )
}