import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { List } from "../types";
import { useTheme } from "../context/ThemeContext";
import { CATEGORIES } from "../constants/categories";

type Props = {
  list: List;
  index: number;
  onPress: () => void;
  onMenuPress: () => void;
};

const PASTEL_LIGHT = ["#fff1f2", "#fdf4ff", "#eff6ff", "#f0fdf4", "#fff7ed"];

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({
  percentage,
  color,
  isDark,
}: {
  percentage: number;
  color: string;
  isDark: boolean;
}) {
  const size = 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (percentage / 100) * circumference;
  const empty = circumference - filled;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "#374151" : "#ffffff80"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {percentage > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filled} ${empty}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color, fontSize: 10, fontWeight: "bold" }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

// ─── Animated Bell ─────────────────────────────────────────────────────────────
function AnimatedBell({ color }: { color: string }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ring = () => {
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    };

    ring(); // ring on mount
    const interval = setInterval(ring, 4000); // ring every 4s
    return () => clearInterval(interval);
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-20deg", "20deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Ionicons name="notifications" size={14} color={color} />
    </Animated.View>
  );
}

// ─── ListCard ──────────────────────────────────────────────────────────────────
export default function ListCard({ list, index, onPress, onMenuPress }: Props) {
  const { isDark, accent } = useTheme();

  const cardBg = isDark ? undefined : PASTEL_LIGHT[index % PASTEL_LIGHT.length];
  const darkCardClass = isDark ? "bg-gray-800" : "";
  const ringColor = accent.primary;

  const totalItems = list.items.length;
  const checkedItems = list.items.filter((i) => i.checked).length;
  const percentage = Math.round(
    (totalItems > 0 ? checkedItems / totalItems : 0) * 100,
  );
  const isComplete = totalItems > 0 && checkedItems === totalItems;

  const category = CATEGORIES.find((c) => c.key === list.category);
  const categoryIcon = (category?.icon ?? "list-outline") as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-3xl px-5 py-4 mb-4 flex-row items-center ${darkCardClass}`}
      style={[
        !isDark
          ? {
              backgroundColor: cardBg,
              borderWidth: 1.5,
              borderColor: accent.primary,
            }
          : { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
        { marginTop: list.reminder && !isComplete ? 7 : 0 }, // ← add this
      ]}
    >
      {/* Left — Icon + Name + Subtitle */}
      <View className="flex-1 mr-4">
        <View className="flex-row items-center mb-1">
          <View
            className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${
              isDark ? "bg-black/20" : "bg-white/80"
            }`}
          >
            <Ionicons
              name={categoryIcon}
              size={20}
              color={isDark ? "#ffffffaa" : accent.primary}
            />
          </View>

          <Text
            numberOfLines={1}
            className={`text-xl font-bold flex-1 ${isDark ? "text-white" : ""}`}
            style={!isDark ? { color: accent.text } : {}}
          >
            {list.name}
          </Text>
        </View>

        <View className="flex-row items-center ml-13 gap-2">
          <Text
            className={`text-md font-semibold ${isDark ? "text-white/30" : "text-gray-300"}`}
          >
            #{index + 1}
          </Text>
          <Text
            className={`text-md ${isDark ? "text-white/20" : "text-gray-200"}`}
          >
            ·
          </Text>
          <Text
            className={`text-md ${isDark ? "text-white/20" : "text-gray-200"}`}
          >
            ·
          </Text>
          <Text
            className={`text-md ${isDark ? "text-white/50" : "text-gray-400"}`}
          >
            {totalItems === 0
              ? "No items yet"
              : isComplete
                ? "🎉 All done!"
                : `${checkedItems} of ${totalItems} checked`}
          </Text>
        </View>
      </View>

      {/* Right — Donut + ⋮ */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <DonutChart percentage={percentage} color={ringColor} isDark={isDark} />
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>

      {/* 🔔 Animated Bell Badge — top right corner */}
      {list.reminder && !isComplete && (
        <View
          style={{
            position: "absolute",
            top: -8,
            right: 12,
            backgroundColor: accent.primary,
            borderRadius: 10,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}
        >
          <AnimatedBell color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
