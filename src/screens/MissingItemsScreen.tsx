import { useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme } from '../context/ThemeContext' // ✅ use app theme

type RootStackParamList = {
  Home: undefined
  ListDetail: { listId: string }
  Success: { listId: string }
  MissingItems: { missing: string[]; listId: string }
}

export default function MissingItemsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'MissingItems'>>()
  const { missing, listId } = route.params
  const { isDark, accent } = useTheme() // ✅ replaced useColorScheme

  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View
      style={{ backgroundColor: isDark ? '#111827' : '#fff1f2' }}
      className="flex-1 px-5 pt-16"
    >
      {/* Icon */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="items-center mb-6">
        <Text className="text-7xl">⚠️</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text
          style={{ color: isDark ? '#ffffff' : '#374151' }}
          className="text-3xl font-bold text-center mb-2"
        >
          Not so fast! 🛑
        </Text>
        <Text
          style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
          className="text-base text-center mb-6"
        >
          You still have {missing.length} item{missing.length !== 1 ? 's' : ''} unchecked:
        </Text>
      </Animated.View>

      {/* Missing Items List */}
      <FlatList
        data={missing}
        keyExtractor={(item, index) => `${item}-${index}`}
        contentContainerStyle={{ paddingBottom: 160 }}
        renderItem={({ item }) => (
          <View
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
            className="flex-row items-center rounded-2xl px-5 py-4 mb-3"
          >
            <View className="w-2 h-2 rounded-full bg-rose-400 mr-4" />
            <Text
              style={{ color: isDark ? '#ffffff' : '#374151' }}
              className="text-base"
            >
              {item}
            </Text>
          </View>
        )}
      />

      {/* Go Back Button */}
      <View className="absolute bottom-8 left-5 right-5">
        <TouchableOpacity
          onPress={() => navigation.navigate('ListDetail', { listId })}
          style={{ backgroundColor: accent.primary }} // ✅ uses accent color
          className="rounded-2xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">← Go Back & Check Items</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}