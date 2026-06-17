import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../types";

const { width, height } = Dimensions.get("window");

export default function SuccessScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, accent } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Success icon bounces in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      // 2. Text + button slide up and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#111827" : accent.light,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      {/* Left fireworks */}
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop={false}
        style={{
          position: "absolute",
          left: -60,
          top: 0,
          width: width * 0.7,
          height: height * 0.5,
        }}
      />

      {/* Right fireworks */}
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop={false}
        style={{
          position: "absolute",
          right: -60,
          top: 0,
          width: width * 0.7,
          height: height * 0.5,
        }}
      />

      {/* ── Bottom left fireworks ────────────────────────────────────────── */}
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop={false}
        style={{
          position: "absolute",
          left: -40,
          bottom: height * 0.15,
          width: 200,
          height: 200,
        }}
      />

      {/* ── Bottom right fireworks ───────────────────────────────────────── */}
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop={false}
        style={{
          position: "absolute",
          right: -40,
          bottom: height * 0.15,
          width: 300,
          height: 300,
        }}
      />

      {/* ── Center success animation ─────────────────────────────────────── */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          marginBottom: 32,
          alignItems: "center",
        }}
      >
        <LottieView
          source={require("../../assets/lottie/success.json")}
          autoPlay
          loop={false}
          style={{ width: 240, height: 240 }}
        />
      </Animated.View>

      {/* ── Text ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: "center",
          marginBottom: 48,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: -0.5,
            color: isDark ? "#f9fafb" : "#111827",
          }}
        >
          All done!
        </Text>
        <Text
          style={{
            fontSize: 15,
            textAlign: "center",
            color: isDark ? "#9ca3af" : "#6b7280",
            lineHeight: 22,
          }}
        >
          Everything is packed and ready to go.
        </Text>
      </Animated.View>

      {/* ── Button ───────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          width: "100%",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={{
            backgroundColor: accent.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
