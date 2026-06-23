import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { List } from "../types";
import { useTheme } from "../context/ThemeContext";
import { CATEGORIES } from "../constants/categories";
import IconTile from "./IconTile";
import Ring from "./Ring";

type Props = {
  list: List;
  onPress: () => void;
  onMenuPress: () => void;
};

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

export default function ListCard({ list, onPress, onMenuPress }: Props) {
  const { isDark } = useTheme();

  const totalItems   = list.items.length;
  const checkedItems = list.items.filter((i) => i.checked).length;
  const progress     = totalItems > 0 ? checkedItems / totalItems : 0;
  const isComplete   = totalItems > 0 && checkedItems === totalItems;

  const category    = CATEGORIES.find((c) => c.key === list.category);
  const accentColor = isComplete ? "#22c55e" : (category?.color ?? "#6b7280");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
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
        borderColor: "#f3f4f6",
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>

        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

          {/* Category icon tile */}
          <IconTile categoryKey={list.category} size="md" />

          {/* Title + subtitle */}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{
              fontSize: 15, fontWeight: "700",
              color: isDark ? "#f9fafb" : "#111827",
              marginBottom: 2,
            }}>
              {list.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
          </View>

          {/* Ring progress */}
          <Ring progress={progress} size={44} stroke={4} color={accentColor} />

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
      </View>

      {/* Reminder Bell Badge */}
      {list.reminder && !isComplete && (
        <View style={{
          position: "absolute", top: -7, right: 10,
          backgroundColor: accentColor,
          borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
        }}>
          <AnimatedBell color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
