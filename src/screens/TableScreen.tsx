import { useState, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import uuid from "react-native-uuid";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useTables } from "../hooks/useTables";
import { CustomTable, Column, ColumnType, RootStackParamList } from "../types";
import ReminderModal from "../components/ReminderModal";
import TableEditModal from "../components/TableEditModal";
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from "../utils/notifications";
import { t } from "../i18n/index";
import { loadTables } from "../storage/storage";

const ICON_OPTIONS: { icon: string; color: string }[] = [
  { icon: "football-outline",        color: "#22c55e" },
  { icon: "happy-outline",           color: "#f97316" },
  { icon: "airplane-outline",        color: "#3b82f6" },
  { icon: "pizza-outline",           color: "#ef4444" },
  { icon: "basketball-outline",      color: "#f97316" },
  { icon: "game-controller-outline", color: "#8b5cf6" },
  { icon: "cash-outline",            color: "#22c55e" },
  { icon: "clipboard-outline",       color: "#6b7280" },
  { icon: "barbell-outline",         color: "#f43f5e" },
  { icon: "musical-notes-outline",   color: "#a855f7" },
  { icon: "trophy-outline",          color: "#eab308" },
  { icon: "people-outline",          color: "#0ea5e9" },
];

const COLUMN_TYPES: { type: ColumnType; label: string; icon: string }[] = [
  { type: "text",     label: "Text",     icon: "text-outline"      },
  { type: "number",   label: "Number",   icon: "calculator-outline" },
  { type: "checkbox", label: "Checkbox", icon: "checkbox-outline"  },
  { type: "date",     label: "Date",     icon: "calendar-outline"  },
];

const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  text:     "text-outline",
  number:   "calculator-outline",
  checkbox: "checkbox-outline",
  date:     "calendar-outline",
};

export default function TableScreen() {
  const { isDark, accent } = useTheme();
  const { tables, refreshTables, createTable, editTable, removeTable } = useTables();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [createVisible,    setCreateVisible]    = useState(false);
  const [tableName,        setTableName]        = useState("");
  const [tableIcon,        setTableIcon]        = useState("clipboard-outline");
  const [tableDescription, setTableDescription] = useState("");
  const [columns,          setColumns]          = useState<Column[]>([]);
  const [newColumnLabel,   setNewColumnLabel]   = useState("");
  const [newColumnType,    setNewColumnType]    = useState<ColumnType>("text");

  const [editVisible,   setEditVisible]   = useState(false);
  const [editingTable,  setEditingTable]  = useState<CustomTable | null>(null);
  const [menuVisible,   setMenuVisible]   = useState(false);
  const [menuTable,     setMenuTable]     = useState<CustomTable | null>(null);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshTables();
    }, []),
  );

  const handleOpenEdit = (table: CustomTable) => {
    setEditingTable(table);
    setMenuVisible(false);
    setEditVisible(true);
  };

  const handleSaveEdit = async (updated: CustomTable) => {
    const allTables = await loadTables();
    const freshTable = allTables.find((t) => t.id === updated.id);
    await editTable({ ...updated, rows: freshTable?.rows ?? updated.rows });
    setEditVisible(false);
    setEditingTable(null);
  };

  const handleOpenCreate = () => {
    setTableName("");
    setTableIcon("clipboard-outline");
    setTableDescription("");
    setColumns([]);
    setNewColumnLabel("");
    setNewColumnType("text");
    setCreateVisible(true);
  };

  const handleAddColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;
    setColumns((prev) => [
      ...prev,
      { id: uuid.v4() as string, label, type: newColumnType },
    ]);
    setNewColumnLabel("");
    setNewColumnType("text");
  };

  const handleRemoveColumn = (id: string) =>
    setColumns((prev) => prev.filter((c) => c.id !== id));

  const handleCreateTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    if (columns.length === 0) {
      Alert.alert("No Columns", "Add at least one column before creating the table.");
      return;
    }
    await createTable({
      id: uuid.v4() as string,
      name,
      emoji: tableIcon,
      description: tableDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
      columns,
      rows: [],
    });
    setCreateVisible(false);
  };

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

  const handleSetReminder = async (date: Date) => {
    if (!menuTable) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission Denied", "Enable notifications in Settings.");
      return;
    }
    await cancelReminder(menuTable.id);
    await scheduleReminder(
      menuTable.name,
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

  const inputStyle = {
    borderWidth: 0.5,
    borderColor: isDark ? "#374151" : "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: isDark ? "#111827" : "#f9fafb",
    color: isDark ? "#f9fafb" : "#111827",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#9ca3af",
    marginBottom: 8,
  };

  // ── Icon color lookup ──────────────────────────────────────────────────────
  const getIconColor = (icon: string) =>
    ICON_OPTIONS.find((o) => o.icon === icon)?.color ?? "#6b7280";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : accent.light }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ alignItems: "center", paddingTop: 64, paddingBottom: 16 }}>
        <Text style={{
          fontSize: 32, fontWeight: "800", letterSpacing: -0.5,
          color: isDark ? "#fda4af" : accent.text,
        }}>
          {t("table.title")}
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, color: isDark ? "#6b7280" : "#9ca3af" }}>
          {tables.length} {tables.length === 1 ? "table" : "tables"}
        </Text>
      </View>

      {tables.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
          <LottieView
            source={require("../../assets/lottie/checkList.json")}
            autoPlay loop
            style={{ width: 220, height: 220 }}
          />
          <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 8, color: isDark ? "#fda4af" : accent.text }}>
            No tables yet!
          </Text>
          <Text style={{ fontSize: 14, marginTop: 6, color: isDark ? "#6b7280" : "#9ca3af" }}>
            Tap + to create your first table
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const iconColor = getIconColor(item.emoji);
            const numberTotals = item.columns
              .filter((col) => col.type === "number")
              .map((col) => ({
                label: col.label,
                total: item.rows.reduce(
                  (sum, row) => sum + (Number(row.cells[col.id]) || 0), 0,
                ),
              }));

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate("TableDetail", { tableId: item.id })}
                activeOpacity={0.8}
                style={{
                  borderRadius: 16,
                  marginBottom: 10,
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 6,
                  elevation: 1,
                  borderWidth: isDark ? 0 : 0.5,
                  borderColor: "#f3f4f6",
                }}
              >
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  {/* Header row */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                      <View style={{
                        width: 42, height: 42, borderRadius: 12,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: iconColor + "18",
                      }}>
                        <Ionicons name={item.emoji as any} size={20} color={iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 15, fontWeight: "700",
                          color: isDark ? "#f9fafb" : "#111827",
                        }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.description && (
                          <Text style={{
                            fontSize: 12, marginTop: 1,
                            color: isDark ? "#9ca3af" : "#6b7280",
                          }} numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                        backgroundColor: isDark ? "#374151" : "#f3f4f6",
                      }}>
                        <Text style={{
                          fontSize: 12, fontWeight: "600",
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}>
                          {item.rows.length} rows
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleOpenMenu(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={18}
                          color={isDark ? "#4b5563" : "#d1d5db"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Column chips */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {item.columns.map((col) => (
                      <View
                        key={col.id}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 4,
                          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                          backgroundColor: isDark ? "#374151" : "#f3f4f6",
                        }}
                      >
                        <Ionicons name={COLUMN_TYPE_ICONS[col.type] as any} size={11} color={isDark ? "#9ca3af" : "#6b7280"} />
                        <Text style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}>
                          {col.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Number totals */}
                  {numberTotals.length > 0 && item.rows.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                      {numberTotals.map((t, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={{ fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>
                            {t.label}:
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: iconColor }}>
                            {t.total.toLocaleString("en-US")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Reminder badge */}
                  {item.reminder && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                      <Ionicons name="notifications-outline" size={11} color={iconColor} />
                      <Text style={{ fontSize: 11, color: iconColor }}>Reminder set</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={handleOpenCreate}
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
              borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6",
            }}>
              <Text style={{ fontSize: 13, fontWeight: "600", textAlign: "center", color: isDark ? "#9ca3af" : "#6b7280" }}>
                {menuTable?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleOpenEdit(menuTable!)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
              <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                Edit Table
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); setReminderModalVisible(true); }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={isDark ? "#f9fafb" : "#111827"} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                  Set Reminder
                </Text>
                {menuTable?.reminder && (
                  <Text style={{ fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af", marginTop: 1 }}>
                    Already set — tap to change
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {menuTable?.reminder && (
              <TouchableOpacity
                onPress={handleCancelReminder}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  paddingHorizontal: 20, paddingVertical: 16,
                  borderBottomWidth: 0.5, borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                }}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#f43f5e" />
                <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>Cancel Reminder</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDeletePress}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <Text style={{ fontSize: 15, fontWeight: "500", color: "#f43f5e" }}>Delete Table</Text>
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

      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onSelectTime={handleSetReminder}
      />

      {editingTable && (
        <TableEditModal
          visible={editVisible}
          table={editingTable}
          onClose={() => { setEditVisible(false); setEditingTable(null); }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Create Modal */}
      <Modal visible={createVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "90%",
          }}>
            <View style={{ paddingVertical: 14, alignItems: "center" }}>
              <View style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: isDark ? "#4b5563" : "#d1d5db",
              }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 20, color: isDark ? "#f9fafb" : "#111827" }}>
                New Table
              </Text>

              {/* Icon */}
              <Text style={labelStyle}>Icon</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {ICON_OPTIONS.map((item) => {
                  const isSelected = tableIcon === item.icon;
                  return (
                    <TouchableOpacity
                      key={item.icon}
                      onPress={() => setTableIcon(item.icon)}
                      style={{
                        width: 48, height: 48, borderRadius: 14,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: isSelected ? item.color + "22" : isDark ? "#374151" : "#f3f4f6",
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: item.color,
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={isSelected ? item.color : isDark ? "#9ca3af" : "#6b7280"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Name */}
              <Text style={labelStyle}>Table Name</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Football, Party, Trip..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={tableName}
                onChangeText={setTableName}
              />

              {/* Description */}
              <Text style={labelStyle}>Description (optional)</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Monthly session..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={tableDescription}
                onChangeText={setTableDescription}
              />

              {/* Columns */}
              <Text style={labelStyle}>Columns</Text>
              {columns.map((col) => (
                <View
                  key={col.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 14, paddingVertical: 12,
                    borderRadius: 12, marginBottom: 8,
                    backgroundColor: isDark ? "#374151" : "#f9fafb",
                    borderWidth: 0.5, borderColor: isDark ? "#4b5563" : "#e5e7eb",
                  }}
                >
                  <Ionicons name={COLUMN_TYPE_ICONS[col.type] as any} size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
                  <Text style={{ flex: 1, fontSize: 14, color: isDark ? "#f9fafb" : "#111827", marginHorizontal: 10 }}>
                    {col.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af", marginRight: 10 }}>
                    {col.type}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveColumn(col.id)}>
                    <Ionicons name="close-circle" size={20} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* New column input */}
              <View style={{
                borderWidth: 0.5, borderColor: isDark ? "#374151" : "#e5e7eb",
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                marginBottom: 10, backgroundColor: isDark ? "#111827" : "#f9fafb",
              }}>
                <TextInput
                  style={{ fontSize: 15, color: isDark ? "#f9fafb" : "#111827", marginBottom: 10 }}
                  placeholder="Column name..."
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  value={newColumnLabel}
                  onChangeText={setNewColumnLabel}
                  blurOnSubmit={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAddColumn}
                />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {COLUMN_TYPES.map((ct) => (
                    <TouchableOpacity
                      key={ct.type}
                      onPress={() => setNewColumnType(ct.type)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                        backgroundColor: newColumnType === ct.type
                          ? accent.primary
                          : isDark ? "#374151" : "#e5e7eb",
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
                style={{
                  borderRadius: 12, paddingVertical: 12, alignItems: "center",
                  marginBottom: 24, backgroundColor: accent.primary + "22",
                  flexDirection: "row", justifyContent: "center", gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color={accent.primary} />
                <Text style={{ color: accent.primary, fontWeight: "600", fontSize: 14 }}>
                  Add Column
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setCreateVisible(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
                >
                  <Text style={{ fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTable}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: accent.primary }}
                >
                  <Text style={{ fontWeight: "600", color: "#ffffff" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
