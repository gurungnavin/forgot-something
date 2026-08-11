import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types";
import {
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

// TODO: swap to real ID before production
const AD_UNIT_ID = "ca-app-pub-3940256099942544/4411468910";
// const AD_UNIT_ID = "ca-app-pub-1244917734079996/9946842000";
const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

const SKIP_DELAY = 5;

export default function InterstitialAdScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canSkip, setCanSkip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // AdMob listeners
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show();
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      navigation.popToTop();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      // Ad failed — fallback UI stays, user can skip after countdown
    });

    interstitial.load();

    // Countdown ticker (fallback if ad fails)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      clearInterval(interval);
    };
  }, []);

  const handleSkip = () => {
    if (!canSkip) return;
    navigation.popToTop();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* Top bar */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 56,
          paddingBottom: 16,
        }}>
          <Text style={{
            fontSize: 11, fontWeight: "600", letterSpacing: 1.2,
            textTransform: "uppercase", color: "#6b7280",
          }}>
            Advertisement
          </Text>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={canSkip ? 0.7 : 1}
            style={{
              paddingHorizontal: 16, paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: "#1f2937",
              opacity: canSkip ? 1 : 0.6,
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: "700",
              color: canSkip ? "#f9fafb" : "#9ca3af",
            }}>
              {canSkip ? "Skip" : `Skip in ${countdown}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fallback content while ad loads */}
        <View style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}>
          <View style={{
            width: 100, height: 100, borderRadius: 24,
            backgroundColor: "#1f2937",
            alignItems: "center", justifyContent: "center",
            marginBottom: 28,
          }}>
            <Ionicons name="bag-outline" size={44} color="#9ca3af" />
          </View>

          <Text style={{
            fontSize: 22, fontWeight: "800", color: "#f9fafb",
            textAlign: "center", marginBottom: 10,
            letterSpacing: -0.3,
          }}>
            Your ad could be here
          </Text>

          <Text style={{
            fontSize: 14, color: "#6b7280",
            textAlign: "center", marginBottom: 36,
            lineHeight: 20,
          }}>
            Full-screen interstitial slot
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#EE5D74",
              paddingHorizontal: 36, paddingVertical: 16,
              borderRadius: 50,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#ffffff" }}>
              Learn more
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}