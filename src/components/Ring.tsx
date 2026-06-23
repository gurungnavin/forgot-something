import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '../context/ThemeContext'

type Props = {
  progress: number  // 0 to 1
  size?: number     // diameter in px, default 44
  stroke?: number   // stroke width, default 4
  color?: string    // override color
  showLabel?: boolean
}

export default function Ring({
  progress,
  size = 44,
  stroke = 4,
  color,
  showLabel = true,
}: Props) {
  const { isDark, accent } = useTheme()

  const clamp      = Math.min(1, Math.max(0, progress))
  const isComplete = clamp === 1
  const activeColor = color ?? (isComplete ? '#22c55e' : accent.primary)
  const trackColor  = isDark ? '#374151' : '#e5e7eb'

  const radius      = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDash  = circumference * clamp
  const percentage  = Math.round(clamp * 100)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {showLabel && (
        <Text
          style={{
            fontSize: size < 40 ? 9 : 11,
            fontWeight: '700',
            color: isComplete ? '#22c55e' : activeColor,
          }}
        >
          {percentage}%
        </Text>
      )}
    </View>
  )
}
