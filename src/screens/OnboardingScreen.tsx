import { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

type RootStackParamList = {
  Onboarding: undefined;
  Transition: undefined;
  Home: undefined;
  ListDetail: { listId: string };
  Success: { listId: string };
  MissingItems: { missing: string[]; listId: string };
};

const { width } = Dimensions.get("window");

export const ONBOARDING_KEY = "has_seen_onboarding";

const SLIDES = [
  {
    id: "1",
    title: "Forget again?!",
    subtitle:
      "We’ve all been there — let’s make sure it doesn’t happen anymore.",
    lottieFile: require("../../assets/lottie/forgotSomething.json"),
  },
  {
    id: "2",
    title: "Build Your\nChecklist",
    subtitle:
      "Add items you always forget. \n \n Travel: passport, charger, keys and more. \n Groceries: milk, eggs, bread, etc. \n Work: laptop, notebook, badge, etc. \n\n\n We can used for multiple purposes.",
    lottieFile: require("../../assets/lottie/checkList.json"),
  },
  {
    id: "3",
    title: "Checkout\nWhen Ready",
    subtitle: "See exactly what's missing before you walk out the door. \n \n \"No more “Did I forget anything?” moments\".",
    lottieFile: require("../../assets/lottie/checkOut.json"),
  },
];

export default function OnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      navigation.replace("Transition");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    navigation.replace("Transition");
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-rose-50"}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Skip Button */}
      {!isLast && (
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-14 right-6 z-10"
        >
          <Text
            className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-500"}`}
          >
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 justify-center px-10 items-center"
          >
            {/* Lottie animation inside circular background */}
            <View
              style={{
                width: 250, // 52 * 4  (because w-52 from Tailwind)
                height: 250,
                borderRadius: 125,
                backgroundColor: isDark ? "#1f2937" : "#fff",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: 4,
              }}
            >
              {item.lottieFile && (
                <LottieView
                  source={item.lottieFile}
                  autoPlay
                  loop
                  style={{
                    width: 190, // fits nicely in circle, tweak if desired
                    height: 190,
                  }}
                />
              )}
            </View>

            {/* Title */}
            <Text
              className={`text-3xl font-bold text-center mb-4 ${isDark ? "text-white" : "text-gray-700"}`}
            >
              {item.title}
            </Text>

            {/* Subtitle */}
            <Text
              className={`text-lg text-center leading-7 mx-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Bottom — Dots + Button */}
      <View
        className={"pb-12 pt-6 px-6 items-center transparent"}
      >
        {/* Dot Indicators */}
        <View className="flex-row gap-2 mb-8">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index === currentIndex
                    ? "#fb7185"
                    : isDark
                      ? "#374151"
                      : "#e5e7eb",
              }}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <TouchableOpacity
          onPress={handleNext}
          className={`w-full py-4 rounded-2xl items-center ${
            isLast ? "bg-green-400" : "bg-rose-400"
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            {isLast ? "🚀 Get Started" : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
