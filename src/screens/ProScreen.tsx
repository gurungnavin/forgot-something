import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

// ── Feature Row ───────────────────────────────────────────────────────────────
const FeatureRow = ({
  icon,
  title,
  subtitle,
  accent,
  isDark,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: any;
  isDark: boolean;
}) => (
  <View style={{
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  }}>
    <View style={{
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: isDark ? "#374151" : `${accent.primary}18`,
      alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name={icon as any} size={22} color={accent.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 15, fontWeight: "700",
        color: isDark ? "#f9fafb" : "#111827",
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 13, color: isDark ? "#9ca3af" : "#6b7280", marginTop: 2,
      }}>
        {subtitle}
      </Text>
    </View>
  </View>
);

// ── ProScreen ─────────────────────────────────────────────────────────────────
export default function ProScreen() {
  const navigation = useNavigation();
  const { isDark, accent } = useTheme();

  const features = [
    {
      icon: "grid-outline",
      title: "Unlimited lists & tables",
      subtitle: "No more 5-list cap",
    },
    {
      icon: "notifications-outline",
      title: "Smart leave reminders",
      subtitle: "Location & time-based nudges",
    },
    {
      icon: "close-outline",
      title: "Zero ads",
      subtitle: "No banners, no interstitials",
    },
    {
      icon: "color-palette-outline",
      title: "Custom themes",
      subtitle: "Pick any colour you like",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : accent.light }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Close button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 56 : 24,
          right: 20,
          zIndex: 10,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: isDark ? "#374151" : "#ffffff",
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={18} color={isDark ? "#f9fafb" : "#111827"} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === "ios" ? 80 : 48,
          paddingBottom: 160,
          paddingHorizontal: 24,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* App icon tile */}
        <View style={{
          width: 100, height: 100, borderRadius: 24,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderWidth: 3, borderColor: accent.primary,
          alignItems: "center", justifyContent: "center",
          marginBottom: 24,
          shadowColor: accent.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
        }}>
          <Text style={{ fontSize: 44 }}>🐣</Text>
        </View>

        {/* Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Text style={{
            fontSize: 28, fontWeight: "800",
            color: isDark ? "#f9fafb" : "#111827",
          }}>
            Quikli
          </Text>
          <Text style={{
            fontSize: 28, fontWeight: "800",
            color: accent.primary,
          }}>
            Pro
          </Text>
        </View>

        {/* Subtitle */}
        <Text style={{
          fontSize: 15, color: isDark ? "#9ca3af" : "#6b7280",
          textAlign: "center", marginBottom: 32,
          lineHeight: 22,
        }}>
          Never forget — and never get interrupted.
        </Text>

        {/* Features */}
        <View style={{ width: "100%" }}>
          {features.map((f) => (
            <FeatureRow
              key={f.title}
              icon={f.icon}
              title={f.title}
              subtitle={f.subtitle}
              accent={accent}
              isDark={isDark}
            />
          ))}
        </View>
      </ScrollView>

      {/* CTA — pinned to bottom */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
        paddingTop: 16,
        backgroundColor: isDark ? "#111827" : accent.light,
      }}>
        <TouchableOpacity
          onPress={() => {
            // TODO: wire up StoreKit / RevenueCat purchase
          }}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: accent.primary,
            borderRadius: 18,
            paddingVertical: 18,
            shadowColor: accent.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
          }}
        >
          <Ionicons name="ribbon-outline" size={20} color="#ffffff" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
            Start free trial — ¥480/mo
          </Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af",
          textAlign: "center", marginTop: 10,
        }}>
          7 days free, then ¥480/month. Cancel anytime.
        </Text>
      </View>
    </View>
  );
}
