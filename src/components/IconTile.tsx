import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CATEGORIES, CATEGORY_DARK_TINTS } from '../constants/categories'
import { CategoryKey } from '../types'
import { useTheme } from '../context/ThemeContext'

type Props = {
  categoryKey?: CategoryKey
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { tile: 32, radius: 9,  icon: 15 },
  md: { tile: 40, radius: 12, icon: 19 },
  lg: { tile: 48, radius: 14, icon: 23 },
}

export default function IconTile({ categoryKey, size = 'md' }: Props) {
  const { isDark } = useTheme()

  const category = CATEGORIES.find((c) => c.key === categoryKey)
  const icon  = (category?.icon  ?? 'list-outline') as any
  const color = category?.color  ?? '#6b7280'
  const tint  = isDark
    ? (CATEGORY_DARK_TINTS[categoryKey as string] ?? '#1f2937')
    : (category?.tint ?? '#f9fafb')

  const { tile, radius, icon: iconSize } = SIZES[size]

  return (
    <View
      style={{
        width: tile,
        height: tile,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tint,
      }}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </View>
  )
}
