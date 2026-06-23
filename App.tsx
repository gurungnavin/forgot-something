import "./global.css";
import { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { NavigationContainerRef } from "@react-navigation/native";
import { View, TouchableOpacity, Animated } from "react-native";
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
import ProScreen from "./src/screens/ProScreen";
import InterstitialAdScreen from "./src/screens/InterstitialAdScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { setupNotifications } from "./src/utils/notifications";
import { RootStackParamList } from "./src/types";
import { initI18n } from "./src/i18n";


const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Bottom Tabs ────────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState("Home");
  const translateX = useRef(new Animated.Value(0)).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const PILL_WIDTH = 90;

  const tabs = ["Home", "Table", "Settings"];
  const tabWidth = tabBarWidth / tabs.length;

  const handleTabPress = (tab: string, index: number) => {
    setActiveTab(tab);
    Animated.spring(translateX, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    }).start();
  };

  const TAB_ICONS: Record<string, { active: any; inactive: any }> = {
    Home:     { active: "home",     inactive: "home-outline"     },
    Table:    { active: "grid",     inactive: "grid-outline"     },
    Settings: { active: "settings", inactive: "settings-outline" },
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "Home":     return <HomeScreen />;
      case "Table":    return <TableScreen />;
      case "Settings": return <SettingsScreen />;
      default:         return <HomeScreen />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}

      {/* Tab Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 24, left: 24, right: 24,
          height: 64, borderRadius: 40,
          backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
          flexDirection: "row", alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
        }}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          setTabBarWidth(width);
          translateX.setValue(tabs.indexOf(activeTab) * (width / tabs.length));
        }}
      >
        {/* Sliding pill */}
        {tabBarWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              width: PILL_WIDTH, height: 44, borderRadius: 22,
              backgroundColor: isDark ? "#3a3a3c" : "#f3f4f6",
              transform: [{ translateX }],
              left: (tabWidth - PILL_WIDTH) / 2,
            }}
          />
        )}

        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(tab, index)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 64 }}
            activeOpacity={1}
          >
            <Ionicons
              name={activeTab === tab ? TAB_ICONS[tab].active : TAB_ICONS[tab].inactive}
              size={22}
              color={activeTab === tab ? accent.primary : isDark ? "#6b7280" : "#9ca3af"}
            />
          </TouchableOpacity>
        ))}
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
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const listId = response.notification.request.content.data?.listId as string | undefined;
      if (listId && navigationRef.current) {
        navigationRef.current.navigate("Tabs" as any);
        setTimeout(() => {
          navigationRef.current?.navigate("ListDetail", { listId });
        }, 100);
      }
    });
    return () => subscription.remove();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ animation: "fade" }}>
        <Stack.Screen name="Onboarding"    component={OnboardingScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Transition"    component={TransitionScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Tabs"          component={TabNavigator}        options={{ headerShown: false }} />
        <Stack.Screen name="ListDetail"    component={ListDetailScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="TableDetail"   component={TableDetailScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="Success"       component={SuccessScreen}       options={{ headerShown: false }} />
        <Stack.Screen name="MissingItems"  component={MissingItemsScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="Pro" component={ProScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Interstitial" component={InterstitialAdScreen} options={{ headerShown: false, animation: "fade" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    initI18n();
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
