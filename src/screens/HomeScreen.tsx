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
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import uuid from "react-native-uuid";
import { List, CategoryKey, RootStackParamList } from "../types";
import { addList, updateList, deleteList } from "../storage/storage";
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
      <Text className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400">
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
                  ? accent.primary
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
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: isSelected ? "#ffffff" : isDark ? "#d1d5db" : "#4b5563",
                }}
              >
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
  const { lists, refreshLists, editList, removeList } = useLists();

  // Create modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryKey | null>(null);

  // Menu
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuList, setMenuList] = useState<List | null>(null);

  // Reminder
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderCountdown, setReminderCountdown] = useState<string | null>(null);

  const createScrollRef = useRef<ScrollView>(null);
  const createItemPositions = useRef<{ [key: string]: number }>({});
  const editScrollRef = useRef<ScrollView>(null);
  const editItemPositions = useRef<{ [key: string]: number }>({});

  // ── Load on focus ──────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refreshLists();
    }, []),
  );

  // ── Reminder countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    let interval: number | null = null;
    if (menuVisible && menuList?.reminder?.time) {
      const update = () =>
        setReminderCountdown(getRemainingTime(menuList.reminder!.time!));
      update();
      interval = setInterval(update, 1000);
    } else {
      setReminderCountdown(null);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [menuVisible, menuList?.reminder?.time]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreateList = () => {
    if (lists.length >= MAX_LISTS) {
      Toast.show({
        type: "error",
        text1: "List Limit Reached",
        text2: "Watch an ad to unlock 1 list for 2 weeks or upgrade to Pro 🚀",
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

  // ── Menu ───────────────────────────────────────────────────────────────────
  const handleOpenMenu = (list: List) => {
    setMenuList(list);
    setMenuVisible(true);
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
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

  // ── Delete ─────────────────────────────────────────────────────────────────
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

  // ── Reminder ───────────────────────────────────────────────────────────────
  const handleSetReminder = async (date: Date) => {
    if (!menuList) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission Denied", "Enable notifications in Settings.");
      return;
    }
    await cancelReminder(menuList.id);
    await scheduleReminder(
      `📋 ${menuList.name}`,
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

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <View
      className="flex-1 px-5 pt-14"
      style={{ backgroundColor: isDark ? "#111827" : accent.light }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="items-center mb-6">
        <Text
          className="text-3xl font-bold text-center mt-6 md:mt-2"
          style={{ color: isDark ? "#fda4af" : accent.text }}
        >
          Forgot Something?
        </Text>
        <Text className="text-sm mt-1 text-center text-gray-400">
          {lists.length}/{MAX_LISTS} lists used
        </Text>
      </View>

      {/* Empty State */}
      {lists.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className={`text-lg font-semibold ${isDark ? "text-gray-300" : "text-gray-500"}`}>
            No lists yet!
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Tap + to create your first list
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={{ marginTop: item.reminder && !isComplete(item) ? 12 : 0 }}>
            <ListCard
              list={item}
              index={index}
              onPress={() => navigation.navigate("ListDetail", { listId: item.id })}
              onMenuPress={() => handleOpenMenu(item)}
            />
          </View>
        )}
      />

      {/* FAB ← back */}
      <TouchableOpacity
        onPress={handleCreateList}
        className="absolute bottom-32 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: accent.primary }}
        activeOpacity={0.8}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>

      {/* List Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <View className={`px-5 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <Text className={`text-sm font-medium text-center ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                {menuList?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditPress}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Text className="text-xl mr-4">✏️</Text>
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                Edit List
              </Text>
            </TouchableOpacity>

            {menuList && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={() => { setMenuVisible(false); setReminderModalVisible(true); }}
                className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
              >
                <Text className="text-xl mr-4">🔔</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                      Set Reminder
                    </Text>
                    {menuList?.reminder?.time && (
                      <Text className="text-md text-gray-400">
                        {reminderCountdown ? `${reminderCountdown} left` : ""}
                      </Text>
                    )}
                  </View>
                  {menuList?.reminder && (
                    <Text className="text-xs mt-1 text-gray-400">
                      Already set — tap to change
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {menuList?.reminder && !isComplete(menuList) && (
              <TouchableOpacity
                onPress={handleCancelReminder}
                className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
              >
                <Text className="text-xl mr-4">🔕</Text>
                <Text className="text-base font-medium text-rose-500">Cancel Reminder</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDeletePress}
              className="px-5 py-4 flex-row items-center"
            >
              <Text className="text-xl mr-4">🗑️</Text>
              <Text className="text-base font-medium text-rose-500">Delete List</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setMenuVisible(false)}
            className={`mx-4 mb-6 py-4 rounded-2xl items-center ${isDark ? "bg-gray-700" : "bg-white"}`}
          >
            <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-700"}`}>
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
        <View className={`w-full rounded-3xl px-6 py-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
            New List 📝
          </Text>
          <CategoryPicker
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            scrollRef={createScrollRef}
            itemPositions={createItemPositions}
            isDark={isDark}
            accent={accent}
          />
          <Text className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400">
            List Name
          </Text>
          <TextInput
            className={`border rounded-xl px-4 text-base mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
            style={{ paddingVertical: 16, fontSize: 16 }}
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
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCloseCreateModal}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveList}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: accent.primary }}
            >
              <Text className="text-white font-semibold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* Edit List Modal */}
      <KeyboardModal visible={editModalVisible} onClose={handleCloseEditModal}>
        <View className={`w-full rounded-3xl px-6 py-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
            Edit List ✏️
          </Text>
          <CategoryPicker
            selected={editCategory}
            onSelect={setEditCategory}
            scrollRef={editScrollRef}
            itemPositions={editItemPositions}
            isDark={isDark}
            accent={accent}
          />
          <Text className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400">
            List Name
          </Text>
          <TextInput
            className={`border rounded-xl px-4 text-base mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
            style={{ paddingVertical: 16, fontSize: 16 }}
            placeholder="List name..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCloseEditModal}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveEdit}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: accent.primary }}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>
    </View>
  );
}