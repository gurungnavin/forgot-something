import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { List } from "../types";
import { useTheme } from "../context/ThemeContext";
import { CATEGORIES } from "../constants/categories";

type Props = {
  list: List;
  index: number;
  onPress: () => void;
  onMenuPress: () => void;
};

const CARD_COLORS = [
  { bg: "#fff1f2", icon: "#fb7185", dark_bg: "#2d1417", dark_icon: "#fb7185" },
  { bg: "#fff7ed", icon: "#f97316", dark_bg: "#2d1b0e", dark_icon: "#f97316" },
  { bg: "#fefce8", icon: "#eab308", dark_bg: "#2d2608", dark_icon: "#eab308" },
  { bg: "#f0fdf4", icon: "#22c55e", dark_bg: "#0d2818", dark_icon: "#22c55e" },
  { bg: "#eff6ff", icon: "#3b82f6", dark_bg: "#0d1f3c", dark_icon: "#60a5fa" },
  { bg: "#faf5ff", icon: "#a855f7", dark_bg: "#1e0d33", dark_icon: "#c084fc" },
]

function AnimatedBell({ color }: { color: string }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ring = () => {
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1,  duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1,  duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0,  duration: 80, useNativeDriver: true }),
      ]).start();
    };
    ring();
    const interval = setInterval(ring, 4000);
    return () => clearInterval(interval);
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-20deg", "20deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Ionicons name="notifications" size={12} color={color} />
    </Animated.View>
  );
}

export default function ListCard({ list, index, onPress, onMenuPress }: Props) {
  const { isDark, accent } = useTheme();

  const totalItems   = list.items.length;
  const checkedItems = list.items.filter((i) => i.checked).length;
  const percentage   = Math.round((totalItems > 0 ? checkedItems / totalItems : 0) * 100);
  const isComplete   = totalItems > 0 && checkedItems === totalItems;
  const color        = CARD_COLORS[index % CARD_COLORS.length];
  const category     = CATEGORIES.find((c) => c.key === list.category);
  const categoryIcon = (category?.icon ?? "list-outline") as any;
  const accentColor  = isComplete ? "#22c55e" : isDark ? color.dark_icon : color.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: isDark ? color.dark_bg : "#ffffff",
        borderRadius: 16,
        marginBottom: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 6,
        elevation: 2,
        marginTop: list.reminder && !isComplete ? 10 : 0,
        borderWidth: isDark ? 0 : 0.5,
        borderColor: '#f3f4f6',
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>

        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>

          {/* Category icon */}
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            marginRight: 10,
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : color.icon + '18',
          }}>
            <Ionicons name={categoryIcon} size={17} color={accentColor} />
          </View>

          {/* Title */}
          <Text numberOfLines={1} style={{
            flex: 1, fontSize: 15, fontWeight: "700",
            color: isDark ? "#f9fafb" : "#111827",
          }}>
            {list.name}
          </Text>

          {/* Percentage */}
          <Text style={{
            fontSize: 13, fontWeight: "700",
            color: accentColor, marginRight: 8,
          }}>
            {percentage}%
          </Text>

          {/* Menu */}
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={17}
              color={isDark ? "#4b5563" : "#d1d5db"}
            />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginLeft: 46 }}>
          <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af" }}>
            {totalItems === 0
              ? "No items yet"
              : isComplete
                ? "All done!"
                : `${checkedItems} of ${totalItems} checked`}
          </Text>
          {isComplete && (
            <Ionicons name="checkmark-circle" size={13} color="#22c55e" style={{ marginLeft: 4 }} />
          )}
        </View>

        {/* Progress bar */}
        <View style={{ marginLeft: 46 }}>
          <View style={{
            height: 3, borderRadius: 2,
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            overflow: "hidden",
          }}>
            <View style={{
              height: 3, borderRadius: 2,
              width: `${percentage}%`,
              backgroundColor: accentColor,
            }} />
          </View>
        </View>
      </View>

      {/* Reminder Bell Badge */}
      {list.reminder && !isComplete && (
        <View style={{
          position: "absolute", top: -7, right: 10,
          backgroundColor: isDark ? color.dark_icon : color.icon,
          borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
        }}>
          <AnimatedBell color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}