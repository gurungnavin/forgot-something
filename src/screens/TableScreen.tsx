import { useState, useEffect } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import uuid from "react-native-uuid";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useTables } from "../hooks/useTables";
import { CustomTable, Column, ColumnType } from "../types";
import { RootStackParamList } from "../types";
import ReminderModal from "../components/ReminderModal";
import TableEditModal from "../components/TableEditModal";
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../utils/notifications";
import { loadTables } from "../storage/storage";

const EMOJI_OPTIONS = [
  "⚽", "🎉", "✈️", "🍕", "🏀", "🎮",
  "💰", "📋", "🏋️", "🎵", "🎯", "👥",
];

const COLUMN_TYPES: { type: ColumnType; label: string; icon: string }[] = [
  { type: "text",     label: "Text",     icon: "text-outline"       },
  { type: "number",   label: "Number",   icon: "calculator-outline" },
  { type: "checkbox", label: "Checkbox", icon: "checkbox-outline"   },
  { type: "date",     label: "Date",     icon: "calendar-outline"   },
];

const PASTEL_LIGHT = ["#fff1f2", "#fdf4ff", "#eff6ff", "#f0fdf4", "#fff7ed"];

export default function TableScreen() {
  const { isDark, accent } = useTheme();
  const { tables, refreshTables, createTable, editTable, removeTable } = useTables();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Create modal
  const [createVisible, setCreateVisible] = useState(false);
  const [tableName, setTableName] = useState("");
  const [tableEmoji, setTableEmoji] = useState("📋");
  const [tableDescription, setTableDescription] = useState("");
  const [tableDate, setTableDate] = useState("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("text");

  // Edit modal — now uses TableEditModal component
  const [editVisible, setEditVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<CustomTable | null>(null);

  // Menu
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTable, setMenuTable] = useState<CustomTable | null>(null);

  // Reminder
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  useEffect(() => {
    refreshTables();
  }, []);

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleOpenEdit = (table: CustomTable) => {
    setEditingTable(table);
    setMenuVisible(false);
    setEditVisible(true);
  };

  const handleSaveEdit = async (updated: CustomTable) => {
    // Read fresh from storage to preserve latest rows
    const allTables = await loadTables();
    const freshTable = allTables.find((t) => t.id === updated.id);
    const updatedWithFreshRows = {
      ...updated,
      rows: freshTable?.rows ?? updated.rows,
    };
    await editTable(updatedWithFreshRows);
    setEditVisible(false);
    setEditingTable(null);
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setTableName("");
    setTableEmoji("📋");
    setTableDescription("");
    setTableDate("");
    setColumns([]);
    setNewColumnLabel("");
    setNewColumnType("text");
    setCreateVisible(true);
  };

  const handleAddColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;
    const newColumn: Column = {
      id: uuid.v4() as string,
      label,
      type: newColumnType,
    };
    setColumns([...columns, newColumn]);
    setNewColumnLabel("");
    setNewColumnType("text");
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const handleCreateTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    if (columns.length === 0) {
      Alert.alert("No Columns", "Add at least one column before creating the table.");
      return;
    }
    const newTable: CustomTable = {
      id: uuid.v4() as string,
      name,
      emoji: tableEmoji,
      description: tableDescription.trim() || undefined,
      date: tableDate.trim() || undefined,
      createdAt: new Date().toISOString(),
      columns,
      rows: [],
    };
    await createTable(newTable);
    setCreateVisible(false);
  };

  // ── Menu ───────────────────────────────────────────────────────────────────
  const handleOpenMenu = (table: CustomTable) => {
    setMenuTable(table);
    setMenuVisible(true);
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    if (!menuTable) return;
    Alert.alert("Delete Table", `Delete "${menuTable.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeTable(menuTable.id);
          setMenuTable(null);
        },
      },
    ]);
  };

  // ── Reminder ───────────────────────────────────────────────────────────────
  const handleSetReminder = async (date: Date) => {
    if (!menuTable) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission Denied", "Enable notifications in Settings.");
      return;
    }
    await cancelReminder(menuTable.id);
    await scheduleReminder(
      `📋 ${menuTable.name}`,
      "Don't forget to follow up on your table!",
      date,
      menuTable.id,
    );
    await editTable({ ...menuTable, reminder: { time: date.toISOString() } });
    setMenuTable(null);
  };

  const handleCancelReminder = async () => {
    setMenuVisible(false);
    if (!menuTable) return;
    await cancelReminder(menuTable.id);
    await editTable({ ...menuTable, reminder: undefined });
    setMenuTable(null);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <View
      className="flex-1 px-5 pt-14"
      style={{ backgroundColor: isDark ? "#111827" : accent.light }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="items-center mb-6 mt-4">
        <Text
          className="text-2xl font-bold text-center mt-3"
          style={{ color: isDark ? "#fda4af" : accent.text }}
        >
          My Tables
        </Text>
        <Text className="text-sm mt-1 text-center text-gray-400">
          {tables.length} tables
        </Text>
      </View>

      {/* Empty State */}
      {tables.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">📊</Text>
          <Text className={`text-lg font-semibold ${isDark ? "text-gray-300" : "text-gray-500"}`}>
            No tables yet!
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Tap + to create your first table
          </Text>
        </View>
      )}

      {/* Table List */}
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const cardBg = isDark ? undefined : PASTEL_LIGHT[index % PASTEL_LIGHT.length];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate("TableDetail", { tableId: item.id })}
              activeOpacity={0.8}
              className={`rounded-3xl px-5 py-4 mb-4 ${isDark ? "bg-gray-800" : ""}`}
              style={[
                !isDark
                  ? { backgroundColor: cardBg, borderWidth: 1.5, borderColor: accent.primary }
                  : { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: isDark ? "#f9fafb" : accent.text }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    )}
                    {item.date && (
                      <Text
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
                      >
                        📅 {item.date}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: accent.primary + "22" }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: accent.primary }}
                    >
                      {item.rows.length} rows
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenMenu(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Column tags */}
              <View className="flex-row flex-wrap gap-2 mt-3">
                {item.columns.map((col) => (
                  <View
                    key={col.id}
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: isDark ? "#1f2937" : "#ffffff80" }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                    >
                      {col.type === "text" ? "📝" :
                       col.type === "number" ? "🔢" :
                       col.type === "checkbox" ? "✅" : "📅"}{" "}
                      {col.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Reminder badge */}
              {item.reminder && (
                <View className="flex-row items-center mt-2 gap-1">
                  <Text className="text-xs">🔔</Text>
                  <Text className="text-xs text-gray-400">Reminder set</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleOpenCreate}
        className="absolute bottom-32 right-6 w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: accent.primary }}
        activeOpacity={0.8}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>

      {/* Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <View className={`px-5 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <Text className={`text-sm font-medium text-center ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                {menuTable?.emoji} {menuTable?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleOpenEdit(menuTable!)}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Text className="text-xl mr-4">✏️</Text>
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                Edit Table
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); setReminderModalVisible(true); }}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
            >
              <Text className="text-xl mr-4">🔔</Text>
              <View className="flex-1">
                <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                  Set Reminder
                </Text>
                {menuTable?.reminder && (
                  <Text className="text-xs mt-0.5 text-gray-400">
                    Already set — tap to change
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {menuTable?.reminder && (
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
              <Text className="text-base font-medium text-rose-500">Delete Table</Text>
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

      {/* Edit Table Modal — extracted component */}
      {editingTable && (
        <TableEditModal
          visible={editVisible}
          table={editingTable}
          onClose={() => { setEditVisible(false); setEditingTable(null); }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Create Table Modal */}
      <Modal visible={createVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "90%",
          }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: isDark ? "#4b5563" : "#d1d5db",
              alignSelf: "center", marginTop: 12, marginBottom: 8,
            }} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-700"}`}>
                New Table 📋
              </Text>

              <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Icon</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => setTableEmoji(emoji)}
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: tableEmoji === emoji ? accent.primary + "33" : isDark ? "#374151" : "#f3f4f6",
                      borderWidth: tableEmoji === emoji ? 2 : 0,
                      borderColor: accent.primary,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Table Name</Text>
              <TextInput
                className={`border rounded-xl px-4 mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                style={{ paddingVertical: 14, fontSize: 16 }}
                placeholder="e.g. Football, Party, Trip..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={tableName}
                onChangeText={setTableName}
                autoFocus
              />

              <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Description (optional)</Text>
              <TextInput
                className={`border rounded-xl px-4 mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                style={{ paddingVertical: 14, fontSize: 16 }}
                placeholder="e.g. Monthly session..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={tableDescription}
                onChangeText={setTableDescription}
              />

              <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Date (optional)</Text>
              <TextInput
                className={`border rounded-xl px-4 mb-4 ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                style={{ paddingVertical: 14, fontSize: 16 }}
                placeholder="e.g. 2026/06/13..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={tableDate}
                onChangeText={setTableDate}
              />

              <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Columns</Text>

              {columns.map((col) => (
                <View
                  key={col.id}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-xl mb-2 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 16 }}>
                      {col.type === "text" ? "📝" :
                       col.type === "number" ? "🔢" :
                       col.type === "checkbox" ? "✅" : "📅"}
                    </Text>
                    <Text style={{ color: isDark ? "#f9fafb" : "#374151" }}>{col.label}</Text>
                    <Text className="text-xs text-gray-400">({col.type})</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveColumn(col.id)}>
                    <Ionicons name="close-circle" size={20} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              ))}

              <View className={`border rounded-xl px-4 py-3 mb-2 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                <TextInput
                  style={{ fontSize: 15, color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }}
                  placeholder="Column name..."
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  value={newColumnLabel}
                  onChangeText={setNewColumnLabel}
                />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {COLUMN_TYPES.map((ct) => (
                    <TouchableOpacity
                      key={ct.type}
                      onPress={() => setNewColumnType(ct.type)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                        backgroundColor: newColumnType === ct.type ? accent.primary : isDark ? "#374151" : "#e5e7eb",
                      }}
                    >
                      <Ionicons
                        name={ct.icon as any}
                        size={12}
                        color={newColumnType === ct.type ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                      />
                      <Text style={{
                        fontSize: 12,
                        color: newColumnType === ct.type ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280",
                      }}>
                        {ct.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddColumn}
                className="rounded-xl py-3 items-center mb-4"
                style={{ backgroundColor: accent.primary + "22" }}
              >
                <Text style={{ color: accent.primary, fontWeight: "600" }}>+ Add Column</Text>
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setCreateVisible(false)}
                  className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTable}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: accent.primary }}
                >
                  <Text className="text-white font-semibold">Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}