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

const ACCENT_COLORS = [
  "#fb7185",
  "#f97316",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#c084fc",
];

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

  const totalItems = list.items.length;
  const checkedItems = list.items.filter((i) => i.checked).length;
  const percentage = Math.round(
    (totalItems > 0 ? checkedItems / totalItems : 0) * 100,
  );
  const isComplete = totalItems > 0 && checkedItems === totalItems;
  const cardAccent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const category = CATEGORIES.find((c) => c.key === list.category);
  const categoryIcon = (category?.icon ?? "list-outline") as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: 8,
        elevation: 2,
        marginTop: list.reminder && !isComplete ? 10 : 0,
      }}
    >
      {/* Left accent bar */}
      <View
        style={{
          width: 4,
          backgroundColor: isComplete ? "#4ade80" : cardAccent,
        }}
      />

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
        {/* Top row — title + percentage + chevron */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          {/* Category icon */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: cardAccent + "22",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Ionicons name={categoryIcon} size={15} color={cardAccent} />
          </View>

          {/* Title */}
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: "700",
              color: isDark ? "#f9fafb" : "#1f2937",
            }}
          >
            {list.name}
          </Text>

          {/* Percentage */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: isComplete ? "#4ade80" : cardAccent,
              marginRight: 6,
            }}
          >
            {percentage}%
          </Text>

          {/* Menu */}
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={isDark ? "#4b5563" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>

        {/* Subtitle row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
            marginLeft: 42,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            #{index + 1} ·{" "}
            {totalItems === 0
              ? "No items yet"
              : isComplete
                ? "All done!"
                : `${checkedItems} of ${totalItems} checked`}
          </Text>
          {isComplete && (
            <Ionicons
              name="checkmark-circle"
              size={13}
              color="#4ade80"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>

        {/* Progress bar */}
        <View style={{ marginLeft: 42 }}>
          <View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: isDark ? "#374151" : "#f3f4f6",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 2,
                width: `${percentage}%`,
                backgroundColor: isComplete ? "#4ade80" : cardAccent,
              }}
            />
          </View>
        </View>
      </View>

      {/* Reminder Bell Badge */}
      {list.reminder && !isComplete && (
        <View
          style={{
            position: "absolute",
            top: -7,
            right: 10,
            backgroundColor: cardAccent,
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 3,
          }}
        >
          <AnimatedBell color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
