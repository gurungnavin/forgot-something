import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext"; // ✅ use app theme

type RootStackParamList = {
  Home: undefined;
  ListDetail: { listId: string };
  Success: { listId: string };
  MissingItems: { missing: string[]; listId: string };
};

export default function SuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, accent } = useTheme(); // ✅ replaced useColorScheme

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    ]).start();
  }, []);

  return (
    <View
      style={{ backgroundColor: isDark ? "#111827" : accent.light }} // ✅ matches app bg
      className="flex-1 items-center justify-center px-8"
    >
      {/* Animated Checkmark */}
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="mb-8"
      >
        <View
          style={{ backgroundColor: accent.primary }} // ✅ uses accent color
          className="w-32 h-32 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-6xl font-bold">✓</Text>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text
          style={{ color: isDark ? "#ffffff" : "#374151" }}
          className="text-3xl font-bold text-center mb-2"
        >
          You're all set! 🎉
        </Text>
        <Text
          style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
          className="text-base text-center mb-10"
        >
          All items packed. Have a great trip!
        </Text>
      </Animated.View>

      {/* Go Home Button */}
      <Animated.View style={{ opacity: fadeAnim }} className="w-full">
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={{ backgroundColor: accent.primary }} // ✅ uses accent color
          className="rounded-2xl py-4 items-center w-full"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            ← Back to Home
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}