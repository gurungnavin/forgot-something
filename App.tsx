import "./global.css";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import HomeScreen from "./src/screens/HomeScreen";
import ListDetailScreen from "./src/screens/ListDetailScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
import MissingItemsScreen from "./src/screens/MissingItemsScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "./src/screens/OnboardingScreen";
import TransitionScreen from "./src/screens/TransitionScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { setupNotifications } from './src/utils/notifications';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ── Bottom Tabs ────────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isDark, accent } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#1f2937' : '#f3f4f6',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          }
          if (route.name === 'Settings') {
            return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

// ── Root Stack ─────────────────────────────────────────────────────────────────
function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null)

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY)
      setInitialRoute(seen ? 'Tabs' : 'Onboarding')
    }
    checkOnboarding()
  }, [])

  if (!initialRoute) return null

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ animation: 'fade' }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Transition"
          component={TransitionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ListDetail"
          component={ListDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Success"
          component={SuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MissingItems"
          component={MissingItemsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    setupNotifications()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}