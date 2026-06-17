import { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

export const ONBOARDING_KEY = "has_seen_onboarding";

const SLIDES = [
  {
    id: "1",
    title: "Forget again?!",
    subtitle: "We've all been there — let's make sure it never happens again.",
    lottieFile: require("../../assets/lottie/forgotSomething.json"),
  },
  {
    id: "2",
    title: "Build Your Checklist",
    subtitle: "Add everything you always forget. Travel, groceries, work — Quikli keeps it all in one place.",
    lottieFile: require("../../assets/lottie/checkList.json"),
  },
  {
    id: "3",
    title: "Checkout When Ready",
    subtitle: "See exactly what's missing before you walk out the door. No more \"Did I forget anything?\" moments.",
    lottieFile: require("../../assets/lottie/checkOut.json"),
  },
]

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isDark, accent } = useTheme()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const isLast = currentIndex === SLIDES.length - 1

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true")
      navigation.replace("Transition")
    }
  }

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true")
    navigation.replace("Transition")
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : accent.light }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Skip button ──────────────────────────────────────────────────── */}
      {!isLast && (
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            position: 'absolute', top: 56, right: 24, zIndex: 10,
            paddingHorizontal: 16, paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}
        >
          <Text style={{
            fontSize: 14, fontWeight: '600',
            color: isDark ? '#9ca3af' : '#6b7280',
          }}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Slides ───────────────────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
        renderItem={({ item }) => (
          <View style={{
            width,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}>
            {/* Lottie in card */}
            <View style={{
              width: 260, height: 260, borderRadius: 40,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 48,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 24, elevation: 6,
            }}>
              <LottieView
                source={item.lottieFile}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 28, fontWeight: '800',
              textAlign: 'center', marginBottom: 16,
              letterSpacing: -0.5,
              color: isDark ? '#f9fafb' : '#111827',
            }}>
              {item.title}
            </Text>

            {/* Subtitle */}
            <Text style={{
              fontSize: 15, textAlign: 'center',
              lineHeight: 24, color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* ── Bottom — dots + button ───────────────────────────────────────── */}
      <View style={{
        paddingHorizontal: 24, paddingBottom: 48, paddingTop: 24,
        alignItems: 'center',
      }}>
        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8, borderRadius: 4,
                backgroundColor: index === currentIndex
                  ? accent.primary
                  : isDark ? '#374151' : '#e5e7eb',
              }}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          onPress={handleNext}
          style={{
            width: '100%', paddingVertical: 16,
            borderRadius: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            backgroundColor: isLast ? '#22c55e' : accent.primary,
            shadowColor: isLast ? '#22c55e' : accent.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
          }}
          activeOpacity={0.85}
        >
          {isLast
            ? <Ionicons name="rocket-outline" size={18} color="#ffffff" />
            : null
          }
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          {!isLast && (
            <Ionicons name="arrow-forward-outline" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}