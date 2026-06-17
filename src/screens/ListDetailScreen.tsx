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

  const [list, setList]                       = useState<List | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItemLabel, setNewItemLabel]       = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem]         = useState<Item | null>(null);
  const [editLabel, setEditLabel]             = useState("");
  const [menuItem, setMenuItem]               = useState<Item | null>(null);
  const [menuVisible, setMenuVisible]         = useState(false);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [toastMessage, setToastMessage]       = useState("");
  const [toastVisible, setToastVisible]       = useState(false);

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

  // ── Load list on focus ────────────────────────────────────────────────────
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
    const updated = allLists.map((l) => l.id === updatedList.id ? updatedList : l);
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

  // ── Add item ──────────────────────────────────────────────────────────────
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
    showToast("Item added!");
  };

  // ── Toggle item ───────────────────────────────────────────────────────────
  const handleToggleItem = async (itemId: string) => {
    if (!list) return;
    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const allDone = updatedItems.length > 0 && updatedItems.every((i) => i.checked);
    if (allDone && list.reminder) {
      await cancelReminder(list.id);
      await updateList({ ...list, items: updatedItems, reminder: undefined });
      showToast("List complete! Reminder cancelled.");
      return;
    }
    await updateList({ ...list, items: updatedItems });
  };

  // ── Edit item ─────────────────────────────────────────────────────────────
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
    showToast("Item updated!");
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDeleteItem = async (itemId: string) => {
    if (!list) return;
    const updatedItems = list.items.filter((i) => i.id !== itemId);
    await updateList({ ...list, items: updatedItems });
    showToast("Item deleted!");
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    if (!menuItem || !list) return;
    Alert.alert("Delete Item", `Delete "${menuItem.label}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteItem(menuItem.id) },
    ]);
  };

  // ── Reset all ─────────────────────────────────────────────────────────────
  const handleResetAll = () => {
    setHeaderMenuVisible(false);
    if (!list || list.items.length === 0) { showToast("No items to reset!"); return; }
    Alert.alert("Reset All", "Uncheck all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: async () => {
          if (!list) return;
          await updateList({ ...list, items: list.items.map((i) => ({ ...i, checked: false })) });
          showToast("All items reset!");
        },
      },
    ]);
  };

  // ── Delete all ────────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    setHeaderMenuVisible(false);
    if (!list || list.items.length === 0) { showToast("No items to delete!"); return; }
    Alert.alert("Delete All", "Delete all items? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All", style: "destructive",
        onPress: async () => {
          if (!list) return;
          await updateList({ ...list, items: [] });
          showToast("All items deleted!");
        },
      },
    ]);
  };

  // ── Reminder ──────────────────────────────────────────────────────────────
  const handleSetReminder = async (date: Date) => {
    const granted = await requestNotificationPermission();
    if (!granted) { Alert.alert("Permission Denied", "Enable notifications in Settings."); return; }
    await cancelReminder(list!.id);
    await scheduleReminder(`${list!.name}`, "Don't forget to check your list!", date, list!.id);
    await updateList({ ...list!, reminder: { time: date.toISOString() } });
    showToast("Reminder set!");
  };

  const handleCancelReminder = async () => {
    setHeaderMenuVisible(false);
    if (!list) return;
    await cancelReminder(list.id);
    await updateList({ ...list, reminder: undefined });
    showToast("Reminder cancelled!");
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!list || list.items.length === 0) return;
    const missing = list.items.filter((i) => !i.checked).map((i) => i.label);
    if (missing.length > 0) {
      navigation.navigate("MissingItems", { missing, listId });
    } else {
      navigation.navigate("Success", { listId });
    }
  };

  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0;
  const totalCount   = list?.items.length ?? 0;
  const progress     = totalCount > 0 ? checkedCount / totalCount : 0;
  const allChecked   = totalCount > 0 && checkedCount === totalCount;
  const category     = CATEGORIES.find((c) => c.key === list?.category);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : accent.light }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Top navigation row ───────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={accent.primary} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: accent.primary }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setHeaderMenuVisible(true)}
          style={{
            width: 40, height: 40, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {/* ── List header ──────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          {category && (
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? '#1f2937' : accent.primary + '18',
            }}>
              <Ionicons
                name={category.icon as any}
                size={20}
                color={isDark ? '#fda4af' : accent.primary}
              />
            </View>
          )}
          <Text style={{
            fontSize: 26, fontWeight: '800', flex: 1, letterSpacing: -0.5,
            color: isDark ? '#f9fafb' : '#111827',
          }} numberOfLines={1}>
            {list?.name ?? "..."}
          </Text>
        </View>

        {/* Item count + reminder */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af' }}>
            {checkedCount}/{totalCount} items checked
          </Text>
          {list?.reminder && !allChecked && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="notifications-outline" size={12} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
                {formatTime(list.reminder.time)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 10 }}>
          <ProgressBar progress={progress} showLabel={!allChecked} />
        </View>

        {/* Limit warning */}
        {list && list.items.length >= MAX_ITEMS && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: isDark ? '#292524' : '#fef3c7',
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
            marginTop: 10,
          }}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={{ fontSize: 13, color: '#f59e0b', fontWeight: '500' }}>
              You've reached the {MAX_ITEMS} item limit
            </Text>
          </View>
        )}
      </View>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {totalCount === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Ionicons name="list-outline" size={32} color={isDark ? '#4b5563' : '#d1d5db'} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#6b7280' : '#9ca3af' }}>
            No items yet
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? '#4b5563' : '#d1d5db', marginTop: 4 }}>
            Tap + to add your first item
          </Text>
        </View>
      )}

      {/* ── Items list ───────────────────────────────────────────────────── */}
      <FlatList
        data={list?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ChecklistItem
            item={item}
            index={index}
            onToggle={handleToggleItem}
            onEdit={openEdit}
            onDelete={handleDeleteItem}
            onMenuPress={(item) => { setMenuItem(item); setMenuVisible(true); }}
            swipeableRef={(ref) => swipeableRefs.current.set(item.id, ref)}
          />
        )}
      />

      {/* ── Bottom buttons ───────────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: 32, left: 20, right: 20,
        flexDirection: 'row', gap: 12,
      }}>
        {/* Checkout — only show when items exist */}
        {totalCount > 0 && (
          <TouchableOpacity
            onPress={handleCheckout}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              backgroundColor: allChecked ? '#22c55e' : accent.primary,
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={allChecked ? "checkmark-circle-outline" : "exit-outline"}
              size={18}
              color="#ffffff"
            />
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
              {allChecked ? "All done! Checkout" : "Checkout"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Add item FAB */}
        <TouchableOpacity
          onPress={handleAddItem}
          style={{
            width: 56, height: 56, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: accent.primary,
            shadowColor: accent.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── Header menu ──────────────────────────────────────────────────── */}
      <Modal visible={headerMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View style={{
            marginHorizontal: 16, marginBottom: 40,
            borderRadius: 24, overflow: 'hidden',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}>
            <View style={{
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280' }}>
                {list?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleResetAll}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              }}
            >
              <Ionicons name="refresh-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              <View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#f9fafb' : '#111827' }}>
                  Reset All
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 1 }}>
                  Uncheck all items
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAll}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#f43f5e' }}>Delete All</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 1 }}>
                  Remove all items
                </Text>
              </View>
            </TouchableOpacity>

            {!allChecked && (
              <TouchableOpacity
                onPress={() => { setHeaderMenuVisible(false); setReminderModalVisible(true); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  paddingHorizontal: 20, paddingVertical: 16,
                  borderBottomWidth: list?.reminder ? 0.5 : 0,
                  borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#f9fafb' : '#111827' }}>
                    Set Reminder
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 1 }}>
                    {list?.reminder ? `Set: ${formatTime(list.reminder.time)}` : 'Remind me about this list'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {list?.reminder && !allChecked && (
              <TouchableOpacity
                onPress={handleCancelReminder}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#f43f5e" />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#f43f5e' }}>Cancel Reminder</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setHeaderMenuVisible(false)}
            style={{
              marginHorizontal: 16, marginBottom: 24, paddingVertical: 16,
              borderRadius: 16, alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#f9fafb' : '#111827' }}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Item context menu ────────────────────────────────────────────── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={{
            marginHorizontal: 16, marginBottom: 40,
            borderRadius: 24, overflow: 'hidden',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
          }}>
            <View style={{
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280' }}>
                {menuItem?.label}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditPress}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#f9fafb' : '#111827' }}>
                Edit Item
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeletePress}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#f43f5e' }}>Delete Item</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setMenuVisible(false)}
            style={{
              marginHorizontal: 16, marginBottom: 24, paddingVertical: 16,
              borderRadius: 16, alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#f9fafb' : '#111827' }}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Reminder modal ───────────────────────────────────────────────── */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onSelectTime={handleSetReminder}
      />

      {/* ── Add item modal ───────────────────────────────────────────────── */}
      <KeyboardModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); setNewItemLabel(""); }}
      >
        <View style={{
          width: '100%', borderRadius: 24,
          paddingHorizontal: 24, paddingVertical: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: isDark ? '#f9fafb' : '#111827' }}>
            New Item
          </Text>
          <TextInput
            style={{
              borderWidth: 0.5, borderColor: isDark ? '#374151' : '#e5e7eb',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, marginBottom: 16,
              backgroundColor: isDark ? '#111827' : '#f9fafb',
              color: isDark ? '#f9fafb' : '#111827',
            }}
            placeholder="e.g. Passport, Charger, Keys..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={newItemLabel}
            onChangeText={setNewItemLabel}
            autoFocus
            onSubmitEditing={handleSaveItem}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => { setAddModalVisible(false); setNewItemLabel(""); }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
            >
              <Text style={{ fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveItem}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: accent.primary }}
            >
              <Text style={{ fontWeight: '600', color: '#ffffff' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* ── Edit item modal ──────────────────────────────────────────────── */}
      <KeyboardModal
        visible={editModalVisible}
        onClose={() => { closeAllSwipeables(); setEditModalVisible(false); setEditingItem(null); }}
      >
        <View style={{
          width: '100%', borderRadius: 24,
          paddingHorizontal: 24, paddingVertical: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: isDark ? '#f9fafb' : '#111827' }}>
            Edit Item
          </Text>
          <TextInput
            style={{
              borderWidth: 0.5, borderColor: isDark ? '#374151' : '#e5e7eb',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, marginBottom: 16,
              backgroundColor: isDark ? '#111827' : '#f9fafb',
              color: isDark ? '#f9fafb' : '#111827',
            }}
            placeholder="Item name..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={editLabel}
            onChangeText={setEditLabel}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => { closeAllSwipeables(); setEditModalVisible(false); setEditingItem(null); }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
            >
              <Text style={{ fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: accent.primary }}
            >
              <Text style={{ fontWeight: '600', color: '#ffffff' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardModal>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toastVisible && (
        <View
          style={{
            position: 'absolute', bottom: 120, left: 0, right: 0,
            alignItems: 'center', zIndex: 50,
          }}
          pointerEvents="none"
        >
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#111827',
            paddingHorizontal: 20, paddingVertical: 10,
            borderRadius: 20,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#4ade80" />
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}