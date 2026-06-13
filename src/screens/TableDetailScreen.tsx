import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native'
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import uuid from 'react-native-uuid'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../context/ThemeContext'
import { RootStackParamList, CustomTable, TableRow, CellValue, Column } from '../types'
import { loadTables, saveTables } from '../storage/storage'
import TableEditModal from '../components/TableEditModal'

export default function TableDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TableDetail'>>()
  const { tableId } = route.params
  const { isDark, accent } = useTheme()

  const [table, setTable] = useState<CustomTable | null>(null)
  const [editVisible, setEditVisible] = useState(false)

  // Cell editing
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null)
  const [cellInput, setCellInput] = useState('')

  // Date picker
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerRowId, setDatePickerRowId] = useState<string | null>(null)
  const [datePickerColId, setDatePickerColId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Header menu
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadTables().then((all) => {
        const found = all.find((t) => t.id === tableId)
        if (found) setTable(found)
      })
    }, [tableId])
  )

  const updateTable = async (updated: CustomTable) => {
    const all = await loadTables()
    const next = all.map((t) => (t.id === updated.id ? updated : t))
    await saveTables(next)
    setTable(updated)
  }

  // ── Edit Table ─────────────────────────────────────────────────────────────
  const handleOpenEdit = () => {
    setHeaderMenuVisible(false)
    setEditVisible(true)
  }

  const handleSaveEdit = async (updated: CustomTable) => {
    await updateTable(updated)
    setEditVisible(false)
  }

  // ── Add Row ────────────────────────────────────────────────────────────────
  const handleAddRow = async () => {
    if (!table) return
    const cells: { [colId: string]: CellValue } = {}
    table.columns.forEach((col) => {
      cells[col.id] = col.type === 'checkbox' ? false : null
    })
    const newRow: TableRow = {
      id: uuid.v4() as string,
      cells,
    }
    await updateTable({ ...table, rows: [...table.rows, newRow] })
  }

  // ── Delete Row ─────────────────────────────────────────────────────────────
  const handleDeleteRow = (rowId: string) => {
    if (!table) return
    Alert.alert('Delete Row', 'Delete this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await updateTable({
            ...table,
            rows: table.rows.filter((r) => r.id !== rowId),
          })
        },
      },
    ])
  }

  // ── Cell Press ─────────────────────────────────────────────────────────────
  const handleCellPress = (row: TableRow, col: Column) => {
    if (col.type === 'checkbox') {
      handleToggleCheckbox(row.id, col.id)
      return
    }
    if (col.type === 'date') {
      setDatePickerRowId(row.id)
      setDatePickerColId(col.id)
      const existing = row.cells[col.id]
      setSelectedDate(existing ? new Date(existing as string) : new Date())
      setDatePickerVisible(true)
      return
    }
    setEditingCell({ rowId: row.id, colId: col.id })
    setCellInput(row.cells[col.id]?.toString() ?? '')
  }

  const handleToggleCheckbox = async (rowId: string, colId: string) => {
    if (!table) return
    const updatedRows = table.rows.map((r) =>
      r.id === rowId
        ? { ...r, cells: { ...r.cells, [colId]: !r.cells[colId] } }
        : r
    )
    await updateTable({ ...table, rows: updatedRows })
  }

  const handleSaveCell = async () => {
    if (!table || !editingCell) return
    const col = table.columns.find((c) => c.id === editingCell.colId)
    const value: CellValue =
      col?.type === 'number'
        ? parseFloat(cellInput) || 0
        : cellInput.trim() || null
    const updatedRows = table.rows.map((r) =>
      r.id === editingCell.rowId
        ? { ...r, cells: { ...r.cells, [editingCell.colId]: value } }
        : r
    )
    await updateTable({ ...table, rows: updatedRows })
    setEditingCell(null)
    setCellInput('')
  }

  const handleSaveDate = async (date: Date) => {
    if (!table || !datePickerRowId || !datePickerColId) return
    const isoDate = date.toISOString().split('T')[0]
    const updatedRows = table.rows.map((r) =>
      r.id === datePickerRowId
        ? { ...r, cells: { ...r.cells, [datePickerColId]: isoDate } }
        : r
    )
    await updateTable({ ...table, rows: updatedRows })
    setDatePickerVisible(false)
  }

  // ── Delete All ─────────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    setHeaderMenuVisible(false)
    if (!table || table.rows.length === 0) return
    Alert.alert('Delete All', 'Delete all members?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          await updateTable({ ...table, rows: [] })
        },
      },
    ])
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  const getTotals = () => {
    if (!table) return []
    return table.columns.map((col) => {
      if (col.type === 'checkbox') {
        const checked = table.rows.filter((r) => r.cells[col.id] === true).length
        return { label: col.label, value: `${checked}/${table.rows.length}`, type: col.type }
      }
      if (col.type === 'number') {
        const sum = table.rows.reduce(
          (acc, r) => acc + (Number(r.cells[col.id]) || 0), 0
        )
        return { label: col.label, value: sum.toString(), type: col.type }
      }
      return null
    }).filter(Boolean)
  }

  const formatCellValue = (value: CellValue, type: string) => {
    if (value === null || value === undefined) return '—'
    if (type === 'checkbox') return value ? '✅' : '❌'
    return value.toString()
  }

  if (!table) return null

  const totals = getTotals()

  return (
    <View
      className="flex-1 pt-14"
      style={{ backgroundColor: isDark ? '#111827' : accent.light }}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Row */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`flex-row items-center px-4 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          activeOpacity={0.7}
        >
          <Text className="text-base font-semibold" style={{ color: accent.primary }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setHeaderMenuVisible(true)}
          className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 20 }}
      >
        {/* Table Info */}
        <View className="mb-4">
          <View className="flex-row items-center gap-3 mb-1">
            <Text style={{ fontSize: 28 }}>{table.emoji}</Text>
            <Text
              className="text-2xl font-bold flex-1"
              style={{ color: isDark ? '#fda4af' : accent.text }}
            >
              {table.name}
            </Text>
          </View>
          {table.description && (
            <Text className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              {table.description}
            </Text>
          )}
          {table.date && (
            <Text className="text-xs mt-1" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
              📅 {table.date}
            </Text>
          )}
          <Text className="text-xs mt-1" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
            {table.rows.length} members
          </Text>
        </View>

        {/* Summary Card */}
        {totals.length > 0 && table.rows.length > 0 && (
          <View
            className={`rounded-2xl px-4 py-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : accent.primary + '33',
            }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
            >
              Summary
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="px-3 py-2 rounded-xl" style={{ backgroundColor: accent.primary + '22' }}>
                <Text className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Members</Text>
                <Text className="text-base font-bold" style={{ color: accent.primary }}>
                  {table.rows.length}
                </Text>
              </View>
              {totals.map((total, i) => (
                <View key={i} className="px-3 py-2 rounded-xl" style={{ backgroundColor: accent.primary + '22' }}>
                  <Text className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {total!.label}
                  </Text>
                  <Text className="text-base font-bold" style={{ color: accent.primary }}>
                    {total!.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {table.rows.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">👥</Text>
            <Text className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              No members yet!
            </Text>
            <Text className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tap + to add your first member
            </Text>
          </View>
        )}

        {/* Row Cards */}
        {table.rows.map((row, rowIndex) => (
          <View
            key={row.id}
            className={`rounded-2xl mb-3 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}
          >
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{
                backgroundColor: isDark ? '#1f2937' : accent.primary + '11',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
              }}
            >
              <Text className="text-sm font-bold" style={{ color: isDark ? '#f9fafb' : accent.text }}>
                #{rowIndex + 1}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteRow(row.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#f43f5e" />
              </TouchableOpacity>
            </View>

            {table.columns.map((col, colIndex) => (
              <TouchableOpacity
                key={col.id}
                onPress={() => handleCellPress(row, col)}
                activeOpacity={col.type === 'checkbox' ? 0.6 : 0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: colIndex < table.columns.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Text style={{ fontSize: 14 }}>
                    {col.type === 'text' ? '📝' :
                     col.type === 'number' ? '🔢' :
                     col.type === 'checkbox' ? '☑️' : '📅'}
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {col.label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: row.cells[col.id] === null || row.cells[col.id] === undefined
                        ? isDark ? '#4b5563' : '#d1d5db'
                        : isDark ? '#f9fafb' : '#374151',
                    }}
                  >
                    {formatCellValue(row.cells[col.id], col.type)}
                  </Text>
                  {col.type !== 'checkbox' && (
                    <Ionicons name="chevron-forward" size={14} color={isDark ? '#4b5563' : '#d1d5db'} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleAddRow}
        className="absolute bottom-32 right-6 w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: accent.primary }}
        activeOpacity={0.8}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>

      {/* Header Menu */}
      <Modal visible={headerMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View className={`mx-4 mb-10 rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <Text className={`text-sm font-medium text-center ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                {table.emoji} {table.name}
              </Text>
            </View>

            {/* Edit Table */}
            <TouchableOpacity
              onPress={handleOpenEdit}
              className={`px-5 py-4 flex-row items-center border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <Ionicons name="pencil-outline" size={22} color={isDark ? '#ffffff' : '#111827'} style={{ marginRight: 16 }} />
              <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Edit Table
              </Text>
            </TouchableOpacity>

            {/* Delete All */}
            <TouchableOpacity
              onPress={handleDeleteAll}
              className="px-5 py-4 flex-row items-center"
            >
              <Ionicons name="trash-outline" size={22} color="#f43f5e" style={{ marginRight: 16 }} />
              <View>
                <Text className="text-base font-medium text-rose-500">Delete All Members</Text>
                <Text className="text-xs mt-0.5 text-gray-400">Remove all rows from this table</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setHeaderMenuVisible(false)}
            className={`mx-4 mb-6 py-4 rounded-2xl items-center ${isDark ? 'bg-gray-700' : 'bg-white'}`}
          >
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Cell Edit Modal */}
      <Modal visible={!!editingCell} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 items-center justify-center px-8"
          activeOpacity={1}
          onPress={() => setEditingCell(null)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              className={`rounded-3xl px-6 py-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ minWidth: 280 }}
            >
              <Text className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {table.columns.find((c) => c.id === editingCell?.colId)?.label}
              </Text>
              <TextInput
                className={`border rounded-xl px-4 mb-4 ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                style={{ paddingVertical: 14, fontSize: 16 }}
                placeholder="Enter value..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={cellInput}
                onChangeText={setCellInput}
                autoFocus
                keyboardType={
                  table.columns.find((c) => c.id === editingCell?.colId)?.type === 'number'
                    ? 'numeric' : 'default'
                }
                onSubmitEditing={handleSaveCell}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveCell}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: accent.primary }}
                >
                  <Text className="text-white font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker iOS */}
      {Platform.OS === 'ios' && datePickerVisible && (
        <Modal visible={datePickerVisible} transparent={false} animationType="slide">
          <View className="flex-1" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <View
              className="flex-row items-center justify-between px-5 pt-14 pb-4"
              style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}
            >
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Text className="text-base font-medium" style={{ color: accent.primary }}>Cancel</Text>
              </TouchableOpacity>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Pick Date
              </Text>
              <TouchableOpacity onPress={() => handleSaveDate(selectedDate)}>
                <Text className="text-base font-semibold" style={{ color: accent.primary }}>Save</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 justify-center items-center">
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                textColor={isDark ? '#ffffff' : '#111827'}
                onChange={(_, date) => { if (date) setSelectedDate(date) }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker Android */}
      {Platform.OS === 'android' && datePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setDatePickerVisible(false)
            if (date) handleSaveDate(date)
          }}
        />
      )}

      {/* Edit Table Modal — outside all other modals */}
      {table && (
        <TableEditModal
          visible={editVisible}
          table={table}
          onClose={() => setEditVisible(false)}
          onSave={handleSaveEdit}
        />
      )}
    </View>
  )
}