import { useEffect, useRef } from 'react'
import { View, Text, Animated, Image } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

type RootStackParamList = {
  Onboarding: undefined
  Transition: undefined
  Tabs: undefined
  ListDetail: { listId: string }
  Success: { listId: string }
  MissingItems: { missing: string[]; listId: string }
}

export default function TransitionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isDark } = useTheme()

  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const textFadeAnim = useRef(new Animated.Value(0)).current
  const bgFadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      // 1. Emoji bounces in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      // 2. Subtitle fades in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 3. Text fades in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 4. Hold for a moment
      Animated.delay(700),
      // 5. Whole screen fades out
      Animated.timing(bgFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
        navigation.replace('Tabs') // Navigate to main app after animation
    })
  }, [])

  return (
   <Animated.View
  style={{
    opacity: bgFadeAnim,
    backgroundColor: isDark ? "#111827" : "#fff", // dark: gray-900, light: white
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }}
>
      {/* Emoji */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View className={`w-52 h-52 rounded-full items-center justify-center mb-6 shadow-lg ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Image 
            source={require("../../assets/forgotSomethingLogo.png")}
            style={{ width: 180, height: 180 }}
          />
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.Text
        style={{ opacity: fadeAnim }}
        className={`text-3xl font-bold text-center mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}
      >
        Forgot Something?
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={{ opacity: textFadeAnim }}
        className={`text-base text-center ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
      >
        You're all set! Let's go 🚀
      </Animated.Text>
    </Animated.View>
  )
}