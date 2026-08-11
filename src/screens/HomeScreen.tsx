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
  Platform,
} from "react-native";
import { Animated } from "react-native";
import Toast from "react-native-toast-message";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import uuid from "react-native-uuid";
import { List, CategoryKey, Category, RootStackParamList } from "../types";
import { addList } from "../storage/storage";
import { useLists } from "../hooks/useLists";
import { useCategories } from "../hooks/useCategories";
import ListCard from "../components/ListCard";
import KeyboardModal from "../components/KeyboardModal";
import ReminderModal from "../components/ReminderModal";
import { useTheme } from "../context/ThemeContext";
import { CATEGORIES, getCategoryLabel } from "../constants/categories";
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../utils/notifications";
import { t } from "../i18n";
import { AdEventType } from "react-native-google-mobile-ads";
import { interstitial } from "../utils/adManager";

// ── Constants ─────────────────────────────────────────────────────────────────
const FREE_LIST_LIMIT = 5;

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

// ── Custom Category Options ────────────────────────────────────────────────────
const CUSTOM_CATEGORY_ICONS = [
  { icon: "heart-outline",         color: "#f43f5e" },
  { icon: "star-outline",          color: "#f59e0b" },
  { icon: "car-outline",           color: "#3b82f6" },
  { icon: "bicycle-outline",       color: "#22c55e" },
  { icon: "camera-outline",        color: "#a855f7" },
  { icon: "musical-notes-outline", color: "#ec4899" },
  { icon: "paw-outline",           color: "#f97316" },
  { icon: "leaf-outline",          color: "#22c55e" },
  { icon: "globe-outline",         color: "#0ea5e9" },
  { icon: "flask-outline",         color: "#8b5cf6" },
  { icon: "brush-outline",         color: "#f43f5e" },
  { icon: "rocket-outline",        color: "#6366f1" },
  { icon: "fish-outline",          color: "#0ea5e9" },
  { icon: "flower-outline",        color: "#ec4899" },
  { icon: "diamond-outline",       color: "#a855f7" },
  { icon: "tennisball-outline",    color: "#22c55e" },
  { icon: "restaurant-outline",    color: "#f97316" },
  { icon: "bed-outline",           color: "#6b7280" },
  { icon: "library-outline",       color: "#3b82f6" },
  { icon: "construct-outline",     color: "#f59e0b" },
];

const CUSTOM_CATEGORY_COLORS = [
  "#f43f5e", "#f97316", "#f59e0b", "#22c55e", "#0ea5e9",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#8b5cf6",
  "#14b8a6", "#ef4444", "#84cc16", "#06b6d4", "#6b7280",
];

// ── Category Picker ────────────────────────────────────────────────────────────
const CategoryPicker = ({
  selected, onSelect, scrollRef, itemPositions, isDark, accent,
  allCategories, onAddCustom,
}: {
  selected: CategoryKey | null;
  onSelect: (key: CategoryKey | null) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  itemPositions: React.MutableRefObject<{ [key: string]: number }>;
  isDark: boolean;
  accent: any;
  allCategories: Category[];
  onAddCustom: () => void;
}) => {
  const handleSelect = (key: CategoryKey) => {
    onSelect(selected === key ? null : key);
    const x = itemPositions.current[key] ?? 0;
    scrollRef.current?.scrollTo({ x, animated: true });
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{
          fontSize: 11, fontWeight: "600", textTransform: "uppercase",
          letterSpacing: 1, color: "#9ca3af",
        }}>
          Category
        </Text>
        <TouchableOpacity
          onPress={onAddCustom}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Ionicons name="add-circle-outline" size={18} color={accent.primary} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: accent.primary }}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {allCategories.map((cat) => {
          const isSelected = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onLayout={(e) => { itemPositions.current[cat.key] = e.nativeEvent.layout.x; }}
              onPress={() => handleSelect(cat.key)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: isSelected ? cat.color : isDark ? "#374151" : "#f3f4f6",
                borderWidth: isSelected ? 0 : 1,
                borderColor: isDark ? "#4b5563" : "#e5e7eb",
              }}
            >
              <Ionicons
                name={cat.icon as any} size={14}
                color={isSelected ? "#ffffff" : isDark ? "#d1d5db" : "#4b5563"}
              />
              <Text style={{
                fontSize: 13, fontWeight: "500",
                color: isSelected ? "#ffffff" : isDark ? "#d1d5db" : "#4b5563",
              }}>
                {cat.isCustom ? cat.label : getCategoryLabel(cat.key)}
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
  const { allCategories, refreshCategories, createCategory } = useCategories();

  const [activeFilter, setActiveFilter] = useState<CategoryKey | "all">("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryKey | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuList, setMenuList] = useState<List | null>(null);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderCountdown, setReminderCountdown] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  // Use ref for pending state — avoids stale closure in ad event listeners
  const pendingCreateAfterAdRef = useRef(false);

  // ── Custom category creation state ────────────────────────────────────────
  const [customCatModalVisible, setCustomCatModalVisible] = useState(false);
  const [customCatName, setCustomCatName] = useState("");
  const [customCatIcon, setCustomCatIcon] = useState(CUSTOM_CATEGORY_ICONS[0].icon);
  const [customCatColor, setCustomCatColor] = useState(CUSTOM_CATEGORY_COLORS[0]);

  const createScrollRef = useRef<ScrollView>(null);
  const createItemPositions = useRef<{ [key: string]: number }>({});
  const editScrollRef = useRef<ScrollView>(null);
  const editItemPositions = useRef<{ [key: string]: number }>({});

  useFocusEffect(useCallback(() => {
    refreshLists();
    refreshCategories();
  }, []));

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

  // ── Ad setup — load once on mount, reload after close ────────────────────
  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoading(false);
      if (pendingCreateAfterAdRef.current) {
        interstitial.show();
      }
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      // Reload for next time
      interstitial.load();
      if (pendingCreateAfterAdRef.current) {
        pendingCreateAfterAdRef.current = false;
        setModalVisible(true);
      }
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      setAdLoading(false);
      interstitial.load();
      // Ad failed — still allow list creation
      if (pendingCreateAfterAdRef.current) {
        pendingCreateAfterAdRef.current = false;
        setModalVisible(true);
      }
    });

    // Load once on mount
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []); // ← empty array — runs once only

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredLists = activeFilter === "all"
    ? lists
    : lists.filter((l) => l.category === activeFilter);

  const usedCategories = allCategories.filter((cat) =>
    lists.some((l) => l.category === cat.key),
  );

  // Streak counter
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

  const hasUpcomingReminder = lists.some(
    (l) => l.reminder?.time && !l.items.every((i) => i.checked),
  );
  const showBanner = hasUpcomingReminder && !bannerDismissed;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateList = () => {
    if (lists.length < FREE_LIST_LIMIT) {
      // Under free limit — open modal directly
      setModalVisible(true);
    } else {
      // Over free limit — show interstitial ad first
      Alert.alert(
        "Watch an Ad",
        "Watch a short ad to add a new list.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Watch Ad",
            onPress: () => {
              pendingCreateAfterAdRef.current = true;
              setAdLoading(true);
              try {
                interstitial.show(); // try showing already loaded ad
              } catch {
                interstitial.load(); // if not loaded, load it
              }
            },
          },
        ]
      );
    }
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

  const handleOpenMenu = (list: List) => { setMenuList(list); setMenuVisible(true); };

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
        text: "Delete", style: "destructive",
        onPress: async () => { await removeList(menuList.id); setMenuList(null); },
      },
    ]);
  };

  const handleSetReminder = async (date: Date) => {
    if (!menuList) return;
    const granted = await requestNotificationPermission();
    if (!granted) { Alert.alert("Permission Denied", "Enable notifications in Settings."); return; }
    await cancelReminder(menuList.id);
    await scheduleReminder(menuList.name, "Don't forget to check your list before you go!", date, menuList.id);
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

  // ── Custom category handlers ───────────────────────────────────────────────
  const handleOpenCustomCatModal = () => {
    setModalVisible(false);
    setEditModalVisible(false);
    setCustomCatName("");
    setCustomCatIcon(CUSTOM_CATEGORY_ICONS[0].icon);
    setCustomCatColor(CUSTOM_CATEGORY_COLORS[0]);
    setTimeout(() => setCustomCatModalVisible(true), 400);
  };

  const handleSaveCustomCategory = async () => {
    const name = customCatName.trim();
    if (!name) return;
    const newCategory: Category = {
      key: `custom_${uuid.v4()}`,
      label: name,
      icon: customCatIcon,
      color: customCatColor,
      tint: customCatColor + "18",
      isCustom: true,
    };
    await createCategory(newCategory);
    setCustomCatModalVisible(false);
    setTimeout(() => setModalVisible(true), 400);
  };

  const dotScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.spring(dotScale, { toValue: 1.4, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(dotScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
      ]).start(() => setTimeout(pulse, 3000));
    };
    pulse();
  }, []);

  const headerBg = isDark ? accent.primary + "33" : accent.primary;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : accent.light }}>
      <StatusBar barStyle="light-content" />

      {/* ── Colored header — part of normal flow, not absolute ───────────── */}
      <View style={{
        backgroundColor: headerBg,
        paddingTop: Platform.OS === "ios" ? 56 : 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 }}>
              Quikli
            </Text>
            <Animated.Text style={{
              fontSize: 32, fontWeight: "800",
              color: "rgba(255,255,255,0.7)",
              transform: [{ scale: dotScale }],
              marginBottom: 2,
            }}>
              .
            </Animated.Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          {lists.length} {lists.length === 1 ? "list" : "lists"}
        </Text>
      </View>

      <FlatList
        data={filteredLists}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 16 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20 }}>

            {/* Smart Banner */}
            {showBanner && (
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: accent.primary,
                borderRadius: 14, padding: 14, marginBottom: 16, gap: 10,
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="notifications-outline" size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                    Heading out soon?
                  </Text>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 1 }}>
                    Run a quick check before you go.
                  </Text>
                </View>
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
                <TouchableOpacity
                  onPress={() => setActiveFilter("all")}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: activeFilter === "all" ? accent.primary : isDark ? "#1f2937" : "#ffffff",
                    borderWidth: activeFilter === "all" ? 0 : 0.5,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                  }}
                >
                  <Ionicons
                    name="apps-outline" size={14}
                    color={activeFilter === "all" ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text style={{
                    fontSize: 13, fontWeight: "600",
                    color: activeFilter === "all" ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280",
                  }}>
                    {t("home.filterAll")}
                  </Text>
                </TouchableOpacity>

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
                        backgroundColor: isActive ? cat.color : isDark ? "#1f2937" : "#ffffff",
                        borderWidth: isActive ? 0 : 0.5,
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                      }}
                    >
                      <Ionicons
                        name={cat.icon as any} size={14}
                        color={isActive ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                      />
                      <Text style={{
                        fontSize: 13, fontWeight: "600",
                        color: isActive ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280",
                      }}>
                        {cat.isCustom ? cat.label : getCategoryLabel(cat.key)}
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
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 80 }}>
              <LottieView
                source={require("../../assets/lottie/bunny.json")}
                autoPlay loop
                style={{ width: 280, height: 280 }}
              />
              <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#fda4af" : accent.text, textAlign: "center", marginTop: 8 }}>
                {t("home.emptyTitle")}
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? "#6b7280" : "#9ca3af", textAlign: "center", marginTop: 6 }}>
                {t("home.emptySubtitle")}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 40, paddingBottom: 40, paddingHorizontal: 20 }}>
              <Ionicons name="filter-outline" size={32} color={isDark ? "#374151" : "#e5e7eb"} />
              <Text style={{ fontSize: 14, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 8, textAlign: "center" }}>
                {t("home.emptyFilter")}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <ListCard
              list={item}
              onPress={() => navigation.navigate("ListDetail", { listId: item.id })}
              onMenuPress={() => handleOpenMenu(item)}
            />
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreateList}
        disabled={adLoading}
        style={{
          position: "absolute", bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: accent.primary,
          alignItems: "center", justifyContent: "center",
          shadowColor: accent.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
          opacity: adLoading ? 0.6 : 1,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name={adLoading ? "hourglass-outline" : "add"} size={28} color="#ffffff" />
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
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", textAlign: "center", color: isDark ? "#9ca3af" : "#6b7280" }}>
                {menuList?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditPress}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6", gap: 14 }}
            >
              <Ionicons name="pencil-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
              <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>{t("home.editList")}</Text>
            </TouchableOpacity>

            {menuList && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={() => { setMenuVisible(false); setReminderModalVisible(true); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6", gap: 14 }}
              >
                <Ionicons name="notifications-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>{t("home.menuSetReminder")}</Text>
                  {menuList?.reminder && (
                    <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 1 }}>
                      {t("home.menuReminderAlreadySet")}
                    </Text>
                  )}
                </View>
                {menuList?.reminder?.time && reminderCountdown && (
                  <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af" }}>{reminderCountdown} left</Text>
                )}
              </TouchableOpacity>
            )}

            {menuList?.reminder && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={handleCancelReminder}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6", gap: 14 }}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#f43f5e" />
                <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>{t("home.menuCancelReminder")}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDeletePress}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>{t("home.menuDelete")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setMenuVisible(false)}
            style={{ marginHorizontal: 16, marginBottom: 24, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: isDark ? "#1f2937" : "#ffffff" }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f9fafb" : "#111827" }}>{t("common.cancel")}</Text>
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
        <View style={{ width: "100%", borderRadius: 24, paddingHorizontal: 24, paddingVertical: 24, backgroundColor: isDark ? "#1f2937" : "#ffffff" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: isDark ? "#f9fafb" : "#111827" }}>
            {t("home.newList")}
          </Text>
          <CategoryPicker
            selected={selectedCategory} onSelect={setSelectedCategory}
            scrollRef={createScrollRef} itemPositions={createItemPositions}
            isDark={isDark} accent={accent}
            allCategories={allCategories}
            onAddCustom={handleOpenCustomCatModal}
          />
          <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#9ca3af" }}>
            {t("home.listNameLabel")}
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
                ? t("home.listNamePlaceholderCategory", { category: getCategoryLabel(selectedCategory) })
                : t("home.listNamePlaceholder")
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
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveList}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: accent.primary }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>{t("common.create")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* Edit List Modal */}
      <KeyboardModal visible={editModalVisible} onClose={handleCloseEditModal}>
        <View style={{ width: "100%", borderRadius: 24, paddingHorizontal: 24, paddingVertical: 24, backgroundColor: isDark ? "#1f2937" : "#ffffff" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: isDark ? "#f9fafb" : "#111827" }}>
            {t("home.editList")}
          </Text>
          <CategoryPicker
            selected={editCategory} onSelect={setEditCategory}
            scrollRef={editScrollRef} itemPositions={editItemPositions}
            isDark={isDark} accent={accent}
            allCategories={allCategories}
            onAddCustom={handleOpenCustomCatModal}
          />
          <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#9ca3af" }}>
            {t("home.listNameLabel")}
          </Text>
          <TextInput
            style={{
              borderWidth: 0.5, borderColor: isDark ? "#374151" : "#e5e7eb",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, marginBottom: 16,
              backgroundColor: isDark ? "#111827" : "#f9fafb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
            placeholder={t("home.listNamePlaceholder")}
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleCloseEditModal}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: accent.primary }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* ── Custom Category Modal ─────────────────────────────────────────── */}
      <Modal visible={customCatModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: isDark ? "#f9fafb" : "#111827" }}>New Category</Text>
              <TouchableOpacity onPress={() => setCustomCatModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={isDark ? "#6b7280" : "#9ca3af"} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#9ca3af" }}>Name</Text>
            <TextInput
              style={{
                borderWidth: 0.5, borderColor: isDark ? "#374151" : "#e5e7eb",
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, marginBottom: 16,
                backgroundColor: isDark ? "#111827" : "#f9fafb",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              placeholder="e.g. Hobbies, Pets, Travel..."
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              value={customCatName}
              onChangeText={setCustomCatName}
              autoFocus
            />

            <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#9ca3af" }}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {CUSTOM_CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setCustomCatColor(color)}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: color,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: customCatColor === color ? 3 : 0,
                    borderColor: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {customCatColor === color && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#9ca3af" }}>Icon</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {CUSTOM_CATEGORY_ICONS.map((item) => {
                const isSelected = customCatIcon === item.icon;
                return (
                  <TouchableOpacity
                    key={item.icon}
                    onPress={() => setCustomCatIcon(item.icon)}
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: isSelected ? customCatColor + "22" : isDark ? "#374151" : "#f3f4f6",
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: customCatColor,
                    }}
                  >
                    <Ionicons name={item.icon as any} size={20} color={isSelected ? customCatColor : isDark ? "#9ca3af" : "#6b7280"} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setCustomCatModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCustomCategory}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: customCatColor }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
