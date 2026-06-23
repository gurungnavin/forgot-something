import { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  ScrollView,
} from "react-native";
import { Animated } from "react-native";
import Toast from "react-native-toast-message";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import uuid from "react-native-uuid";
import { List, CategoryKey, RootStackParamList } from "../types";
import { addList } from "../storage/storage";
import { useLists } from "../hooks/useLists";
import ListCard from "../components/ListCard";
import KeyboardModal from "../components/KeyboardModal";
import ReminderModal from "../components/ReminderModal";
import { useTheme } from "../context/ThemeContext";
import { CATEGORIES } from "../constants/categories";
import { MAX_LISTS } from "../constants/limits";
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../utils/notifications";
import { t } from "../i18n";

// ── Helpers ────────────────────────────────────────────────────────────────────
function getRemainingTime(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate);
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ── Ad Card ────────────────────────────────────────────────────────────────────
const AD_CARD_ID = "__ad__";

const NativeAdCard = ({ isDark }: { isDark: boolean }) => (
  <View style={{
    marginHorizontal: 20, marginBottom: 12,
    borderRadius: 16,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    borderWidth: 0.5,
    borderColor: isDark ? "#374151" : "#e5e7eb",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  }}>
    {/* Icon placeholder */}
    <View style={{
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: isDark ? "#374151" : "#f3f4f6",
      alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="bag-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 14, fontWeight: "600",
        color: isDark ? "#f9fafb" : "#111827",
      }}>
        Travel smarter, pack lighter
      </Text>
      <Text style={{
        fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 2,
      }}>
        Ad · Tap to remove ads with Pro
      </Text>
    </View>

    <View style={{ alignItems: "flex-end", gap: 4 }}>
      <Text style={{
        fontSize: 9, fontWeight: "700", letterSpacing: 0.5,
        color: isDark ? "#6b7280" : "#9ca3af", textTransform: "uppercase",
      }}>
        Sponsored
      </Text>
      <TouchableOpacity
        style={{
          paddingHorizontal: 10, paddingVertical: 5,
          borderRadius: 8, borderWidth: 1, borderColor: "#EE5D74",
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#EE5D74" }}>
          Remove
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Pro Banner Card ────────────────────────────────────────────────────────────
const PRO_CARD_ID = "__pro__";

const ProBannerCard = ({ accent, onUpgrade }: { accent: any; onUpgrade: () => void }) => (
  <View style={{
    marginHorizontal: 20, marginBottom: 12,
    borderRadius: 20,
    backgroundColor: accent.primary,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  }}>
    {/* Crown icon tile */}
    <View style={{
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="diamond-outline" size={22} color="#ffffff" />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#ffffff" }}>
        Go Quikli Pro
      </Text>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
        Unlimited lists, no ads, smart reminders
      </Text>
    </View>

    <TouchableOpacity
      onPress={onUpgrade}
      style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center", justifyContent: "center",
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={22} color="#ffffff" />
    </TouchableOpacity>
  </View>
);

// ── Category Picker ────────────────────────────────────────────────────────────
const CategoryPicker = ({
  selected,
  onSelect,
  scrollRef,
  itemPositions,
  isDark,
  accent,
}: {
  selected: CategoryKey | null;
  onSelect: (key: CategoryKey | null) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  itemPositions: React.MutableRefObject<{ [key: string]: number }>;
  isDark: boolean;
  accent: any;
}) => {
  const handleSelect = (key: CategoryKey) => {
    onSelect(selected === key ? null : key);
    const x = itemPositions.current[key] ?? 0;
    scrollRef.current?.scrollTo({ x, animated: true });
  };

  return (
    <View>
      <Text style={{
        fontSize: 11, fontWeight: "600", textTransform: "uppercase",
        letterSpacing: 1, marginBottom: 8, color: "#9ca3af",
      }}>
        Category
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onLayout={(e) => {
                itemPositions.current[cat.key] = e.nativeEvent.layout.x;
              }}
              onPress={() => handleSelect(cat.key)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected
                  ? cat.color
                  : isDark ? "#374151" : "#f3f4f6",
                borderWidth: isSelected ? 0 : 1,
                borderColor: isDark ? "#4b5563" : "#e5e7eb",
              }}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={isSelected ? "#ffffff" : isDark ? "#d1d5db" : "#4b5563"}
              />
              <Text style={{
                fontSize: 13, fontWeight: "500",
                color: isSelected ? "#ffffff" : isDark ? "#d1d5db" : "#4b5563",
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ── HomeScreen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, accent } = useTheme();
  const { lists, isLoading, refreshLists, editList, removeList } = useLists();

  // Filter
  const [activeFilter, setActiveFilter] = useState<CategoryKey | "all">("all");

  // Smart banner
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Create modal
  const [modalVisible, setModalVisible]       = useState(false);
  const [newListName, setNewListName]          = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName]                 = useState("");
  const [editCategory, setEditCategory]         = useState<CategoryKey | null>(null);

  // Menu
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuList, setMenuList]       = useState<List | null>(null);

  // Reminder
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderCountdown, setReminderCountdown]       = useState<string | null>(null);

  const createScrollRef    = useRef<ScrollView>(null);
  const createItemPositions = useRef<{ [key: string]: number }>({});
  const editScrollRef      = useRef<ScrollView>(null);
  const editItemPositions  = useRef<{ [key: string]: number }>({});

  useFocusEffect(
    useCallback(() => {
      refreshLists();
    }, []),
  );

  useEffect(() => {
    let interval: number | null = null;
    if (menuVisible && menuList?.reminder?.time) {
      const update = () => setReminderCountdown(getRemainingTime(menuList.reminder!.time!));
      update();
      interval = setInterval(update, 1000);
    } else {
      setReminderCountdown(null);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [menuVisible, menuList?.reminder?.time]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredLists = activeFilter === "all"
    ? lists
    : lists.filter((l) => l.category === activeFilter);

  const usedCategories = CATEGORIES.filter((cat) =>
    lists.some((l) => l.category === cat.key),
  );

  // Streak — count consecutive days with at least one completed list
  const streak = (() => {
    const completedDates = lists
      .filter((l) => l.items.length > 0 && l.items.every((i) => i.checked))
      .map((l) => new Date(l.createdAt).toDateString());
    const unique = [...new Set(completedDates)];
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (unique.includes(d.toDateString())) count++;
      else break;
    }
    return count;
  })();

  // Show smart banner if there are incomplete lists with reminders
  const hasUpcomingReminder = lists.some(
    (l) => l.reminder?.time && !l.items.every((i) => i.checked),
  );
  const showBanner = hasUpcomingReminder && !bannerDismissed;

  // Build list data — inject ad after index 1, append Pro card at end
  const listData = (() => {
    if (filteredLists.length === 0) return [];
    const items: any[] = [...filteredLists];
    // Inject ad card after 2nd real item (index 1)
    if (items.length >= 2) {
      items.splice(2, 0, { id: AD_CARD_ID });
    }
    // Append Pro banner at end
    items.push({ id: PRO_CARD_ID });
    return items;
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateList = () => {
    if (lists.length >= MAX_LISTS) {
      Toast.show({
        type: "error",
        text1: "List Limit Reached",
        text2: "Watch an ad to unlock 1 list for 2 weeks or upgrade to Pro",
        visibilityTime: 5000,
      });
      return;
    }
    setModalVisible(true);
  };

  const handleSaveList = async () => {
    const name = newListName.trim();
    if (!name) return;
    const newList: List = {
      id: uuid.v4() as string,
      name,
      createdAt: new Date().toISOString(),
      items: [],
      category: selectedCategory ?? undefined,
    };
    await addList(newList, lists);
    await refreshLists();
    setNewListName("");
    setSelectedCategory(null);
    setModalVisible(false);
  };

  const handleCloseCreateModal = () => {
    setModalVisible(false);
    setNewListName("");
    setSelectedCategory(null);
  };

  const handleOpenMenu = (list: List) => {
    setMenuList(list);
    setMenuVisible(true);
  };

  const handleEditPress = () => {
    if (!menuList) return;
    setEditName(menuList.name);
    setEditCategory(menuList.category ?? null);
    setMenuVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const name = editName.trim();
    if (!name || !menuList) return;
    await editList({ ...menuList, name, category: editCategory ?? undefined });
    setEditModalVisible(false);
    setMenuList(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setMenuList(null);
    setEditCategory(null);
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    if (!menuList) return;
    Alert.alert("Delete List", `Delete "${menuList.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeList(menuList.id);
          setMenuList(null);
        },
      },
    ]);
  };

  const handleSetReminder = async (date: Date) => {
    if (!menuList) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission Denied", "Enable notifications in Settings.");
      return;
    }
    await cancelReminder(menuList.id);
    await scheduleReminder(
      menuList.name,
      "Don't forget to check your list before you go!",
      date,
      menuList.id,
    );
    await editList({ ...menuList, reminder: { time: date.toISOString() } });
    setMenuList(null);
  };

  const handleCancelReminder = async () => {
    setMenuVisible(false);
    if (!menuList) return;
    await cancelReminder(menuList.id);
    await editList({ ...menuList, reminder: undefined });
    setMenuList(null);
  };

  const isComplete = (list: List) =>
    list.items.length > 0 && list.items.every((i) => i.checked);

  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.spring(dotScale, { toValue: 1.4, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(dotScale, { toValue: 1,   friction: 3, tension: 100, useNativeDriver: true }),
      ]).start(() => setTimeout(pulse, 3000));
    };
    pulse();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : accent.light }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 56 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20 }}>

            {/* Header */}
            <View style={{ marginBottom: 20, marginTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                {/* Wordmark */}
                <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                  <Text style={{
                    fontSize: 32, fontWeight: "800",
                    color: isDark ? "#ffffff" : "#111827",
                    letterSpacing: -0.5,
                  }}>
                    Quikli
                  </Text>
                  <Animated.Text style={{
                    fontSize: 32, fontWeight: "800",
                    color: accent.primary,
                    transform: [{ scale: dotScale }],
                    marginBottom: 2,
                  }}>
                    .
                  </Animated.Text>
                </View>

                {/* Streak counter */}
                {streak > 0 && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    paddingHorizontal: 10, paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 0.5,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                  }}>
                    <Text style={{ fontSize: 14 }}>⚡</Text>
                    <Text style={{
                      fontSize: 13, fontWeight: "700",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}>
                      {streak}-day streak
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{
                fontSize: 13, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 4,
              }}>
                {lists.length}/{MAX_LISTS} lists used
              </Text>
            </View>

            {/* Smart Banner */}
            {showBanner && (
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: accent.primary,
                borderRadius: 14, padding: 14, marginBottom: 16, gap: 10,
              }}>
                <Ionicons name="time-outline" size={18} color="#ffffff" />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#ffffff" }}>
                  Heading out soon? You have a reminder coming up.
                </Text>
                <TouchableOpacity
                  onPress={() => setBannerDismissed(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Category Filter Tabs */}
            {lists.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {/* All tab */}
                <TouchableOpacity
                  onPress={() => setActiveFilter("all")}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: activeFilter === "all"
                      ? accent.primary
                      : isDark ? "#1f2937" : "#ffffff",
                    borderWidth: activeFilter === "all" ? 0 : 0.5,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                  }}
                >
                  <Ionicons
                    name="apps-outline"
                    size={14}
                    color={activeFilter === "all" ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text style={{
                    fontSize: 13, fontWeight: "600",
                    color: activeFilter === "all" ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280",
                  }}>
                    All
                  </Text>
                </TouchableOpacity>

                {/* Category tabs — only categories with lists */}
                {usedCategories.map((cat) => {
                  const isActive = activeFilter === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setActiveFilter(cat.key)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                        backgroundColor: isActive
                          ? cat.color
                          : isDark ? "#1f2937" : "#ffffff",
                        borderWidth: isActive ? 0 : 0.5,
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                      }}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isActive ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                      />
                      <Text style={{
                        fontSize: 13, fontWeight: "600",
                        color: isActive ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280",
                      }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : lists.length === 0 ? (
            <View style={{
              flex: 1, alignItems: "center", justifyContent: "center",
              paddingTop: 60, paddingBottom: 80,
            }}>
              <LottieView
                source={require("../../assets/lottie/bunny.json")}
                autoPlay loop
                style={{ width: 280, height: 280 }}
              />
              <Text style={{
                fontSize: 20, fontWeight: "700",
                color: isDark ? "#fda4af" : accent.text,
                textAlign: "center", marginTop: 8,
              }}>
                Nothing here yet!
              </Text>
              <Text style={{
                fontSize: 14, color: isDark ? "#6b7280" : "#9ca3af",
                textAlign: "center", marginTop: 6,
              }}>
                Tap + to create your first checklist
              </Text>
            </View>
          ) : (
            <View style={{
              alignItems: "center", paddingTop: 40, paddingBottom: 40, paddingHorizontal: 20,
            }}>
              <Ionicons name="filter-outline" size={32} color={isDark ? "#374151" : "#e5e7eb"} />
              <Text style={{
                fontSize: 14, color: isDark ? "#6b7280" : "#9ca3af",
                marginTop: 8, textAlign: "center",
              }}>
                No lists in this category
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          // Injected ad card
          if (item.id === AD_CARD_ID) {
            return <NativeAdCard isDark={isDark} />;
          }
          // Pro banner card
          if (item.id === PRO_CARD_ID) {
            return (
              <ProBannerCard
                accent={accent}
                onUpgrade={() => navigation.navigate("Pro")}
              />
            );
          }
          // Normal list card
          return (
            <View style={{ paddingHorizontal: 20 }}>
              <ListCard
                list={item}
                onPress={() => navigation.navigate("ListDetail", { listId: item.id })}
                onMenuPress={() => handleOpenMenu(item)}
              />
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreateList}
        style={{
          position: "absolute", bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: accent.primary,
          alignItems: "center", justifyContent: "center",
          shadowColor: accent.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={{
            marginHorizontal: 16, marginBottom: 40,
            borderRadius: 24, overflow: "hidden",
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
          }}>
            <View style={{
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: isDark ? "#374151" : "#f3f4f6",
            }}>
              <Text style={{
                fontSize: 13, fontWeight: "600", textAlign: "center",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}>
                {menuList?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditPress}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                gap: 14,
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
              <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                Edit List
              </Text>
            </TouchableOpacity>

            {menuList && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={() => { setMenuVisible(false); setReminderModalVisible(true); }}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 20, paddingVertical: 16,
                  borderBottomWidth: 0.5,
                  borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                  gap: 14,
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                    Set Reminder
                  </Text>
                  {menuList?.reminder && (
                    <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 1 }}>
                      Already set — tap to change
                    </Text>
                  )}
                </View>
                {menuList?.reminder?.time && reminderCountdown && (
                  <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af" }}>
                    {reminderCountdown} left
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {menuList?.reminder && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={handleCancelReminder}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 20, paddingVertical: 16,
                  borderBottomWidth: 0.5,
                  borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                  gap: 14,
                }}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#f43f5e" />
                <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>
                  Cancel Reminder
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDeletePress}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 20, paddingVertical: 16, gap: 14,
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>
                Delete List
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setMenuVisible(false)}
            style={{
              marginHorizontal: 16, marginBottom: 24,
              paddingVertical: 16, borderRadius: 16, alignItems: "center",
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f9fafb" : "#111827" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reminder Modal */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onSelectTime={handleSetReminder}
      />

      {/* Create List Modal */}
      <KeyboardModal visible={modalVisible} onClose={handleCloseCreateModal}>
        <View style={{
          width: "100%", borderRadius: 24,
          paddingHorizontal: 24, paddingVertical: 24,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
        }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: isDark ? "#f9fafb" : "#111827" }}>
            New List
          </Text>
          <CategoryPicker
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            scrollRef={createScrollRef}
            itemPositions={createItemPositions}
            isDark={isDark}
            accent={accent}
          />
          <Text style={{
            fontSize: 11, fontWeight: "600", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 8, color: "#9ca3af",
          }}>
            List Name
          </Text>
          <TextInput
            style={{
              borderWidth: 0.5, borderColor: isDark ? "#374151" : "#e5e7eb",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, marginBottom: 16,
              backgroundColor: isDark ? "#111827" : "#f9fafb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
            placeholder={
              selectedCategory
                ? `e.g. My ${CATEGORIES.find((c) => c.key === selectedCategory)?.label} list...`
                : "e.g. Grocery, Travel, Work..."
            }
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={newListName}
            onChangeText={setNewListName}
            autoFocus
            onSubmitEditing={handleSaveList}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleCloseCreateModal}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                backgroundColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveList}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                backgroundColor: accent.primary,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* Edit List Modal */}
      <KeyboardModal visible={editModalVisible} onClose={handleCloseEditModal}>
        <View style={{
          width: "100%", borderRadius: 24,
          paddingHorizontal: 24, paddingVertical: 24,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
        }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: isDark ? "#f9fafb" : "#111827" }}>
            Edit List
          </Text>
          <CategoryPicker
            selected={editCategory}
            onSelect={setEditCategory}
            scrollRef={editScrollRef}
            itemPositions={editItemPositions}
            isDark={isDark}
            accent={accent}
          />
          <Text style={{
            fontSize: 11, fontWeight: "600", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 8, color: "#9ca3af",
          }}>
            List Name
          </Text>
          <TextInput
            style={{
              borderWidth: 0.5, borderColor: isDark ? "#374151" : "#e5e7eb",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, marginBottom: 16,
              backgroundColor: isDark ? "#111827" : "#f9fafb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
            placeholder="List name..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleCloseEditModal}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                backgroundColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                backgroundColor: accent.primary,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>
    </View>
  );
}
