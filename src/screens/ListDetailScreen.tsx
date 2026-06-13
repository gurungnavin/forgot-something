import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import uuid from "react-native-uuid";
import { loadLists, saveLists } from "../storage/storage";
import { useLists } from "../hooks/useLists";
import ProgressBar from "../components/ProgressBar";
import KeyboardModal from "../components/KeyboardModal";
import ChecklistItem from "../components/ChecklistItem";
import ReminderModal from "../components/ReminderModal";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES } from "../constants/categories";
import { List, Item, RootStackParamList } from "../types";
import { useTheme } from "../context/ThemeContext";
import { MAX_ITEMS } from "../constants/limits";
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../utils/notifications";

export default function ListDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ListDetail">>();
  const { listId } = route.params;
  const { isDark, accent } = useTheme();
  const { lists, refreshLists, editList } = useLists();

  const [list, setList] = useState<List | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const swipeableRefs = useRef<Map<string, any>>(new Map());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 50);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const closeAllSwipeables = () => {
    swipeableRefs.current.forEach((ref) => ref?.close());
  };

  // ── Load ───────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadLists().then((lists) => {
        const found = lists.find((l) => l.id === listId);
        if (found) setList(found);
      });
    }, [listId])
  );

  const updateList = async (updatedList: List) => {
    const allLists = await loadLists();
    const updated = allLists.map((l) =>
      l.id === updatedList.id ? updatedList : l
    );
    await saveLists(updated);
    setList(updatedList);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) return `Today ${h}:${minutes} ${ampm}`;
    return `${date.toLocaleDateString()} ${h}:${minutes} ${ampm}`;
  };

  // ── Add Item ───────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!list) return;
    if (list.items.length >= MAX_ITEMS) {
      Alert.alert("Limit Reached", "Watch an ad to add more items.");
      return;
    }
    setAddModalVisible(true);
  };

  const handleSaveItem = async () => {
    const label = newItemLabel.trim();
    if (!label || !list) return;
    const newItem: Item = {
      id: uuid.v4() as string,
      label,
      checked: false,
      createdAt: new Date().toISOString(),
    };
    await updateList({ ...list, items: [...list.items, newItem] });
    setNewItemLabel("");
    setAddModalVisible(false);
    showToast("✅ Item added!");
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggleItem = async (itemId: string) => {
    if (!list) return;
    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const allDone = updatedItems.length > 0 && updatedItems.every((i) => i.checked);
    if (allDone && list.reminder) {
      await cancelReminder(list.id);
      await updateList({ ...list, items: updatedItems, reminder: undefined });
      showToast("✅ List complete! Reminder cancelled.");
      return;
    }
    await updateList({ ...list, items: updatedItems });
  };

  // ── Edit Item ──────────────────────────────────────────────────────────────
  const openEdit = (item: Item) => {
    closeAllSwipeables();
    setEditingItem(item);
    setEditLabel(item.label);
    setEditModalVisible(true);
  };

  const handleEditPress = () => {
    if (!menuItem) return;
    setMenuVisible(false);
    openEdit(menuItem);
  };

  const handleSaveEdit = async () => {
    const label = editLabel.trim();
    if (!label || !list || !editingItem) return;
    const updatedItems = list.items.map((i) =>
      i.id === editingItem.id ? { ...i, label } : i
    );
    await updateList({ ...list, items: updatedItems });
    closeAllSwipeables();
    setEditModalVisible(false);
    setEditingItem(null);
    showToast("✏️ Item updated!");
  };

  // ── Delete Item ────────────────────────────────────────────────────────────
  const handleDeleteItem = async (itemId: string) => {
    if (!list) return;
    const updatedItems = list.items.filter((i) => i.id !== itemId);
    await updateList({ ...list, items: updatedItems });
    showToast("🗑️ Item deleted!");
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    if (!menuItem || !list) return;
    Alert.alert("Delete Item", `Delete "${menuItem.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteItem(menuItem.id),
      },
    ]);
  };

  // ── Reset All ──────────────────────────────────────────────────────────────
  const handleResetAll = () => {
    setHeaderMenuVisible(false);
    if (!list || list.items.length === 0) {
      showToast("No items to reset!");
      return;
    }
    Alert.alert("Reset All", "Uncheck all items? Progress will go back to 0%.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          if (!list) return;
          const resetItems = list.items.map((i) => ({ ...i, checked: false }));
          await updateList({ ...list, items: resetItems });
          showToast("🔄 All items reset!");
        },
      },
    ]);
  };

  // ── Delete All ─────────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    setHeaderMenuVisible(false);
    if (!list || list.items.length === 0) {
      showToast("No items to delete!");
      return;
    }
    Alert.alert("Delete All", "Delete all items? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: async () => {
          if (!list) return;
          await updateList({ ...list, items: [] });
          showToast("🗑️ All items deleted!");
        },
      },
    ]);
  };

  // ── Reminder ───────────────────────────────────────────────────────────────
  const handleSetReminder = async (date: Date) => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission Denied", "Enable notifications in Settings.");
      return;
    }
    await cancelReminder(list!.id);
    await scheduleReminder(
      `📋 ${list!.name}`,
      "Don't forget to check your list before you go!",
      date,
      list!.id,
    );
    await updateList({ ...list!, reminder: { time: date.toISOString() } });
    showToast("🔔 Reminder set!");
  };

  const handleCancelReminder = async () => {
    setHeaderMenuVisible(false);
    if (!list) return;
    await cancelReminder(list.id);
    await updateList({ ...list, reminder: undefined });
    showToast("🔕 Reminder cancelled!");
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!list) return;
    if (list.items.length === 0) {
      Alert.alert("No Items", "Add some items to your list first!");
      return;
    }
    const missing = list.items.filter((i) => !i.checked).map((i) => i.label);
    if (missing.length > 0) {
      navigation.navigate("MissingItems", { missing, listId });
    } else {
      navigation.navigate("Success", { listId });
    }
  };

  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = list?.items.length ?? 0;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;
  const allChecked = totalCount > 0 && checkedCount === totalCount;

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <View
      className="flex-1 px-5 pt-14"
      style={{ backgroundColor: isDark ? "#111827" : accent.light }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Row */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          className={`flex-row items-center px-4 py-2 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"}`}
          activeOpacity={0.7}
        >
          <Text className="text-base font-semibold" style={{ color: accent.primary }}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setHeaderMenuVisible(true)}
          className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? "bg-gray-800" : "bg-white"}`}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="flex-row items-center mb-1 gap-3">
        {list?.category && (
          <View
            className="w-10 h-10 rounded-2xl items-center justify-center"
            style={{ backgroundColor: isDark ? "#1f2937" : accent.primary + "22" }}
          >
            <Ionicons
              name={(CATEGORIES.find((c) => c.key === list.category)?.icon as any) ?? "list-outline"}
              size={20}
              color={isDark ? "#ffffffaa" : accent.primary}
            />
          </View>
        )}
        <Text
          className="text-3xl font-bold flex-1"
          style={{ color: isDark ? "#fda4af" : accent.text }}
        >
          {list?.name ?? "..."}
        </Text>
      </View>

      <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-400"}`}>
        {checkedCount}/{totalCount} items checked
      </Text>

      {/* Reminder Badge */}
      {list?.reminder && !allChecked && (
        <View className="flex-row items-center mt-1 mb-1 gap-1">
          <Text className="text-xs">🔔</Text>
          <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-400"}`}>
            Reminder: {formatTime(list.reminder.time)}
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View className="mt-3 mb-2">
        <ProgressBar progress={progress} showLabel={!allChecked} />
      </View>

      {/* Limit Warning */}
      {list && list.items.length >= MAX_ITEMS && (
        <View className="bg-yellow-100 border border-yellow-300 rounded-2xl px-4 py-3 mb-4">
          <Text className="text-yellow-700 text-sm font-medium">
            ⚠️ You've reached the {MAX_ITEMS} item limit!
          </Text>
        </View>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">📝</Text>
          <Text className={`text-lg font-semibold ${isDark ? "text-gray-300" : "text-gray-500"}`}>
            No items yet!
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Tap + to add your first item
          </Text>
        </View>
      )}

      {/* Items List */}
      <FlatList
        data={list?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        renderItem={({ item, index }) => (
          <ChecklistItem
            item={item}
            index={index}
            onToggle={handleToggleItem}
            onEdit={openEdit}
            onDelete={handleDeleteItem}
            onMenuPress={(item) => {
              setMenuItem(item);
              setMenuVisible(true);
            }}
            swipeableRef={(ref) => swipeableRefs.current.set(item.id, ref)}
          />
        )}
      />

      {/* Bottom Buttons */}
      <View className="absolute bottom-8 left-5 right-5 flex-row gap-3">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={totalCount === 0}
          className={`flex-1 py-4 rounded-2xl items-center ${totalCount === 0 ? "bg-gray-200" : ""}`}
          style={totalCount > 0 ? { backgroundColor: allChecked ? "#4ade80" : accent.primary } : {}}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            {allChecked ? "✅ All Done! Checkout" : "🚪 Checkout"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddItem}
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: accent.primary }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-2xl font-light">+</Text>
        </TouchableOpacity>
      </View>

      {/* Header Menu */}
      <Modal visible={headerMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <View className={`px-5 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <Text className={`text-md font-medium text-center ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                {list?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleResetAll}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Ionicons name="refresh-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
              <View>
                <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                  Reset All
                </Text>
                <Text className="text-xs mt-0.5 text-gray-400">
                  Uncheck all items → back to 0%
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAll}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Ionicons name="trash-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
              <View>
                <Text className="text-base font-medium text-rose-500">Delete All</Text>
                <Text className="text-xs mt-0.5 text-gray-400">
                  Remove all items from this list
                </Text>
              </View>
            </TouchableOpacity>

            {!allChecked && (
              <>
                <TouchableOpacity
                  onPress={() => { setHeaderMenuVisible(false); setReminderModalVisible(true); }}
                  className={`px-5 py-4 flex-row items-center ${list?.reminder ? `border-b ${isDark ? "border-gray-700" : "border-gray-100"}` : ""}`}
                >
                  <Ionicons name="notifications-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
                  <View>
                    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                      Set Reminder
                    </Text>
                    <Text className="text-xs mt-0.5 text-gray-400">
                      {list?.reminder ? `Set: ${formatTime(list.reminder.time)}` : "Remind me about this list"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {list?.reminder && (
                  <TouchableOpacity
                    onPress={handleCancelReminder}
                    className="px-5 py-4 flex-row items-center"
                  >
                    <Ionicons name="notifications-off-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
                    <Text className={`text-base ${isDark ? "text-white" : "text-gray-700"}`}>
                      Cancel Reminder
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setHeaderMenuVisible(false)}
            className={`mx-4 mb-6 py-4 rounded-2xl items-center ${isDark ? "bg-gray-700" : "bg-white"}`}
          >
            <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-700"}`}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Item Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <View className={`px-5 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <Text className={`text-sm font-medium text-center ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                {menuItem?.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditPress}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Ionicons name="pencil-outline" size={22} color={isDark ? "#ffffff" : "#111827"} style={{ marginRight: 16 }} />
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                Edit Item
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeletePress}
              className="px-5 py-4 flex-row items-center"
            >
              <Ionicons name="trash-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
              <Text className="text-base font-medium text-rose-500">Delete Item</Text>
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

      {/* Add Item Modal */}
      <KeyboardModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); setNewItemLabel(""); }}
      >
        <View className={`w-full rounded-3xl px-6 py-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
            Add Item 📝
          </Text>
          <TextInput
            className={`border rounded-xl px-4 text-base mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
            style={{ paddingVertical: 16, fontSize: 16 }}
            placeholder="e.g. Passport, Charger, Keys..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={newItemLabel}
            onChangeText={setNewItemLabel}
            autoFocus
            onSubmitEditing={handleSaveItem}
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => { setAddModalVisible(false); setNewItemLabel(""); }}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveItem}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: accent.primary }}
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* Edit Item Modal */}
      <KeyboardModal
        visible={editModalVisible}
        onClose={() => { closeAllSwipeables(); setEditModalVisible(false); setEditingItem(null); }}
      >
        <View className={`w-full rounded-3xl px-6 py-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
            Edit Item ✏️
          </Text>
          <TextInput
            className={`border rounded-xl px-4 text-base mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
            style={{ paddingVertical: 16, fontSize: 16 }}
            placeholder="Item name..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={editLabel}
            onChangeText={setEditLabel}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => { closeAllSwipeables(); setEditModalVisible(false); setEditingItem(null); }}
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

      {/* Toast */}
      {toastVisible && (
        <View className="absolute bottom-32 left-0 right-0 items-center z-50" pointerEvents="none">
          <View className="bg-gray-800 px-6 py-3 rounded-2xl shadow-lg">
            <Text className="text-white text-sm font-medium">{toastMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}