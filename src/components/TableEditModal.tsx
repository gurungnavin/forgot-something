import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { CustomTable, Column, ColumnType } from "../types";

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

type Props = {
  visible: boolean;
  table: CustomTable;
  onClose: () => void;
  onSave: (updated: CustomTable) => void;
};

export default function TableEditModal({ visible, table, onClose, onSave }: Props) {
  const { isDark, accent } = useTheme();

  const [editName,        setEditName]        = useState("");
  const [editIcon,        setEditIcon]        = useState("clipboard-outline");
  const [editDescription, setEditDescription] = useState("");
  const [editColumns,     setEditColumns]     = useState<Column[]>([]);
  const [newColumnLabel,  setNewColumnLabel]  = useState("");
  const [newColumnType,   setNewColumnType]   = useState<ColumnType>("text");

  useEffect(() => {
    if (visible) {
      setEditName(table.name);
      setEditIcon(table.emoji);
      setEditDescription(table.description ?? "");
      setEditColumns(table.columns);
      setNewColumnLabel("");
      setNewColumnType("text");
    }
  }, [visible]);

  const handleAddColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;
    setEditColumns((prev) => [
      ...prev,
      { id: uuid.v4() as string, label, type: newColumnType },
    ]);
    setNewColumnLabel("");
    setNewColumnType("text");
  };

  const handleRemoveColumn = (id: string) => {
    const hasData = table.rows.some((r) => {
      const val = r.cells[id];
      return val !== null && val !== undefined && val !== false && val !== "";
    });
    if (hasData) {
      Alert.alert(
        "Column Has Data",
        "Deleting will remove all values in this column. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => setEditColumns((prev) => prev.filter((c) => c.id !== id)),
          },
        ],
      );
      return;
    }
    setEditColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    const name = editName.trim();
    if (!name) return;
    if (editColumns.length === 0) {
      Alert.alert("No Columns", "Add at least one column.");
      return;
    }
    const originalColIds = table.columns.map((c) => c.id);
    const newColumns     = editColumns.filter((c) => !originalColIds.includes(c.id));
    const updatedRows    = table.rows.map((row) => {
      const newCells = { ...row.cells };
      newColumns.forEach((col) => {
        newCells[col.id] = col.type === "checkbox" ? false : null;
      });
      return { ...row, cells: newCells };
    });
    onSave({
      ...table,
      name,
      emoji: editIcon,
      description: editDescription.trim() || undefined,
      columns: editColumns,
      rows: updatedRows,
    });
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "92%",
          }}
        >
          {/* Handle */}
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
            <Text style={{
              fontSize: 20, fontWeight: "700", marginBottom: 20,
              color: isDark ? "#f9fafb" : "#111827",
            }}>
              Edit Table
            </Text>

            {/* Icon */}
            <Text style={labelStyle}>Icon</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {ICON_OPTIONS.map((item) => {
                const isSelected = editIcon === item.icon;
                return (
                  <TouchableOpacity
                    key={item.icon}
                    onPress={() => setEditIcon(item.icon)}
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
              placeholder="Table name..."
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              value={editName}
              onChangeText={setEditName}
            />

            {/* Description */}
            <Text style={labelStyle}>Description (optional)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Monthly session..."
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              value={editDescription}
              onChangeText={setEditDescription}
            />

            {/* Columns */}
            <Text style={labelStyle}>Columns</Text>
            {editColumns.map((col) => (
              <View
                key={col.id}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 14, paddingVertical: 12,
                  borderRadius: 12, marginBottom: 8,
                  backgroundColor: isDark ? "#374151" : "#f9fafb",
                  borderWidth: 0.5,
                  borderColor: isDark ? "#4b5563" : "#e5e7eb",
                }}
              >
                <Ionicons
                  name={COLUMN_TYPE_ICONS[col.type] as any}
                  size={16}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
                <TextInput
                  style={{
                    flex: 1, fontSize: 14,
                    color: isDark ? "#f9fafb" : "#111827",
                    marginHorizontal: 10,
                  }}
                  value={col.label}
                  onChangeText={(text) =>
                    setEditColumns((prev) =>
                      prev.map((c) => c.id === col.id ? { ...c, label: text } : c)
                    )
                  }
                />
                <Text style={{
                  fontSize: 11,
                  color: isDark ? "#6b7280" : "#9ca3af",
                  marginRight: 10,
                }}>
                  {col.type}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveColumn(col.id)}>
                  <Ionicons name="close-circle" size={20} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            ))}

            {/* New column input */}
            <View style={{
              borderWidth: 0.5,
              borderColor: isDark ? "#374151" : "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              marginBottom: 10,
              backgroundColor: isDark ? "#111827" : "#f9fafb",
            }}>
              <TextInput
                style={{
                  fontSize: 15,
                  color: isDark ? "#f9fafb" : "#111827",
                  marginBottom: 10,
                }}
                placeholder="New column name..."
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
                      paddingHorizontal: 10, paddingVertical: 6,
                      borderRadius: 20,
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
                borderRadius: 12, paddingVertical: 12,
                alignItems: "center", marginBottom: 24,
                backgroundColor: accent.primary + "22",
                flexDirection: "row", justifyContent: "center", gap: 6,
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color={accent.primary} />
              <Text style={{ color: accent.primary, fontWeight: "600", fontSize: 14 }}>
                Add Column
              </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: isDark ? "#374151" : "#f3f4f6",
                }}
              >
                <Text style={{ fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: accent.primary,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#ffffff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
