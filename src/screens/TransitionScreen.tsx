import { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'

export default function TransitionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isDark, accent } = useTheme()

  // Text animation
  const textFade = useRef(new Animated.Value(0)).current
  const textSlide = useRef(new Animated.Value(30)).current

  // Dot animation
  const dotScale = useRef(new Animated.Value(0)).current
  const dotBounce = useRef(new Animated.Value(0)).current

  // Screen fade out
  const bgFade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      // 1. "Quikli" slides up and fades in
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // 2. Small pause
      Animated.delay(200),

      // 3. Pink dot bounces in
      Animated.spring(dotScale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),

      // 4. Hold
      Animated.delay(800),

      // 5. Fade out screen
      Animated.timing(bgFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.replace('Tabs')
    })
  }, [])

  return (
    <Animated.View
      style={{
        opacity: bgFade,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#111827' : '#ffffff',
      }}
    >
      {/* Quikli. logo */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>

        {/* "Quikli" text */}
        <Animated.Text
          style={{
            opacity: textFade,
            transform: [{ translateY: textSlide }],
            fontSize: 52,
            fontWeight: '800',
            letterSpacing: -1,
            color: isDark ? '#ffffff' : '#111827',
          }}
        >
          Quikli
        </Animated.Text>

        {/* Pink dot bounces in */}
        <Animated.Text
          style={{
            transform: [{ scale: dotScale }],
            fontSize: 52,
            fontWeight: '800',
            color: accent.primary,
            marginBottom: 2,
          }}
        >
          .
        </Animated.Text>

      </View>

      {/* Tagline fades with text */}
      <Animated.Text
        style={{
          opacity: textFade,
          marginTop: 8,
          fontSize: 14,
          color: isDark ? '#6b7280' : '#9ca3af',
          letterSpacing: 1,
        }}
      >
        your quick checklist
      </Animated.Text>
    </Animated.View>
  )
}