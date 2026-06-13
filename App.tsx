import "./global.css";
import { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { NavigationContainerRef } from "@react-navigation/native";
import { View, TouchableOpacity } from "react-native";
import TableScreen from "./src/screens/TableScreen";
import Toast from "react-native-toast-message";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import HomeScreen from "./src/screens/HomeScreen";
import ListDetailScreen from "./src/screens/ListDetailScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
import MissingItemsScreen from "./src/screens/MissingItemsScreen";
import TableDetailScreen from "./src/screens/TableDetailScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "./src/screens/OnboardingScreen";
import TransitionScreen from "./src/screens/TransitionScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { setupNotifications } from "./src/utils/notifications";
import { RootStackParamList } from "./src/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Bottom Tabs ────────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState("Home");

  const renderScreen = () => {
    switch (activeTab) {
      case "Home": return <HomeScreen />
      case "Table": return <TableScreen />
      case "Settings": return <SettingsScreen />
      default: return <HomeScreen />
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}

      {/* Custom Pill Tab Bar — 3 tabs */}
      <View
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 40,
          backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Home */}
        <TouchableOpacity
          onPress={() => setActiveTab("Home")}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons
            name={activeTab === "Home" ? "home" : "home-outline"}
            size={24}
            color={activeTab === "Home" ? accent.primary : isDark ? "#6b7280" : "#9ca3af"}
          />
        </TouchableOpacity>

        {/* Table */}
        <TouchableOpacity
          onPress={() => setActiveTab("Table")}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons
            name={activeTab === "Table" ? "grid" : "grid-outline"}
            size={24}
            color={activeTab === "Table" ? accent.primary : isDark ? "#6b7280" : "#9ca3af"}
          />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => setActiveTab("Settings")}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons
            name={activeTab === "Settings" ? "settings" : "settings-outline"}
            size={24}
            color={activeTab === "Settings" ? accent.primary : isDark ? "#6b7280" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Root Stack ─────────────────────────────────────────────────────────────────
function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      setInitialRoute(seen ? "Tabs" : "Onboarding");
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const listId = response.notification.request.content.data?.listId as string | undefined;
        if (listId && navigationRef.current) {
          navigationRef.current.navigate("Tabs" as any);
          setTimeout(() => {
            navigationRef.current?.navigate("ListDetail", { listId });
          }, 100);
        }
      },
    );
    return () => subscription.remove();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ animation: "fade" }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Transition" component={TransitionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ListDetail" component={ListDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TableDetail" component={TableDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MissingItems" component={MissingItemsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}