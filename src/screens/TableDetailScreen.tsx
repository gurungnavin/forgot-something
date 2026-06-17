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

// ── Column type → Ionicon mapping ─────────────────────────────────────────────
const COLUMN_TYPE_ICONS: Record<string, string> = {
  text:     'text-outline',
  number:   'calculator-outline',
  checkbox: 'checkbox-outline',
  date:     'calendar-outline',
}

export default function TableDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TableDetail'>>()
  const { tableId } = route.params
  const { isDark, accent } = useTheme()

  const [table, setTable] = useState<CustomTable | null>(null)
  const [editVisible, setEditVisible] = useState(false)

  // ── Cell editing state ────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null)
  const [cellInput, setCellInput] = useState('')

  // ── Date picker state ─────────────────────────────────────────────────────
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerRowId, setDatePickerRowId] = useState<string | null>(null)
  const [datePickerColId, setDatePickerColId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // ── Header menu state ─────────────────────────────────────────────────────
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false)

  // ── Load table on focus ───────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadTables().then((all) => {
        const found = all.find((t) => t.id === tableId)
        if (found) setTable(found)
      })
    }, [tableId])
  )

  // ── Save updated table to storage and state ───────────────────────────────
  const updateTable = async (updated: CustomTable) => {
    const all = await loadTables()
    const next = all.map((t) => (t.id === updated.id ? updated : t))
    await saveTables(next)
    setTable(updated)
  }

  // ── Edit table metadata ───────────────────────────────────────────────────
  const handleOpenEdit = () => {
    setHeaderMenuVisible(false)
    setEditVisible(true)
  }

  const handleSaveEdit = async (updated: CustomTable) => {
    await updateTable(updated)
    setEditVisible(false)
  }

  // ── Add empty row ─────────────────────────────────────────────────────────
  const handleAddRow = async () => {
    if (!table) return
    const cells: { [colId: string]: CellValue } = {}
    table.columns.forEach((col) => {
      cells[col.id] = col.type === 'checkbox' ? false : null
    })
    await updateTable({
      ...table,
      rows: [...table.rows, { id: uuid.v4() as string, cells }],
    })
  }

  // ── Delete row ────────────────────────────────────────────────────────────
  const handleDeleteRow = (rowId: string) => {
    if (!table) return
    Alert.alert('Delete Row', 'Delete this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await updateTable({ ...table, rows: table.rows.filter((r) => r.id !== rowId) })
        },
      },
    ])
  }

  // ── Cell press — route to correct editor by type ──────────────────────────
  const handleCellPress = (row: TableRow, col: Column) => {
    if (col.type === 'checkbox') {
      // Toggle directly — no modal needed
      handleToggleCheckbox(row.id, col.id)
      return
    }
    if (col.type === 'date') {
      // Show native date picker
      setDatePickerRowId(row.id)
      setDatePickerColId(col.id)
      const existing = row.cells[col.id]
      setSelectedDate(existing ? new Date(existing as string) : new Date())
      setDatePickerVisible(true)
      return
    }
    // Text or number — show text input modal
    setEditingCell({ rowId: row.id, colId: col.id })
    setCellInput(row.cells[col.id]?.toString() ?? '')
  }

  // ── Toggle checkbox cell ──────────────────────────────────────────────────
  const handleToggleCheckbox = async (rowId: string, colId: string) => {
    if (!table) return
    const updatedRows = table.rows.map((r) =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: !r.cells[colId] } } : r
    )
    await updateTable({ ...table, rows: updatedRows })
  }

  // ── Save text/number cell ─────────────────────────────────────────────────
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

  // ── Save date cell ────────────────────────────────────────────────────────
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

  // ── Delete all rows ───────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    setHeaderMenuVisible(false)
    if (!table || table.rows.length === 0) return
    Alert.alert('Delete All', 'Delete all members?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => await updateTable({ ...table, rows: [] }),
      },
    ])
  }

  // ── Calculate column totals for summary card ──────────────────────────────
  const getTotals = () => {
    if (!table) return []
    return table.columns.map((col) => {
      if (col.type === 'checkbox') {
        const checked = table.rows.filter((r) => r.cells[col.id] === true).length
        return { label: col.label, value: `${checked}/${table.rows.length}`, type: col.type }
      }
      if (col.type === 'number') {
        const sum = table.rows.reduce((acc, r) => acc + (Number(r.cells[col.id]) || 0), 0)
        return { label: col.label, value: sum.toLocaleString('en-US'), type: col.type }
      }
      return null
    }).filter(Boolean)
  }

  // ── Format cell value for display ─────────────────────────────────────────
  const formatCellValue = (value: CellValue, type: string) => {
    if (value === null || value === undefined) return '—'
    if (type === 'number') return Number(value).toLocaleString('en-US')
    return value.toString()
  }

  if (!table) return null

  const totals = getTotals()

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : accent.light }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Top navigation row ───────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 20 }}
      >
        {/* ── Table header info ────────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }}>
              <Ionicons name={table.emoji as any} size={24} color={accent.primary} />
            </View>
            <Text style={{
              fontSize: 22, fontWeight: '800', flex: 1,
              color: isDark ? '#f9fafb' : '#111827',
            }}>
              {table.name}
            </Text>
          </View>

          {table.description && (
            <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }}>
              {table.description}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            {table.date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar-outline" size={12} color={isDark ? '#6b7280' : '#9ca3af'} />
                <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>{table.date}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={12} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
                {table.rows.length} members
              </Text>
            </View>
          </View>
        </View>

        {/* ── Summary card ─────────────────────────────────────────────── */}
        {totals.length > 0 && table.rows.length > 0 && (
          <View style={{
            borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
            marginBottom: 16,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
          }}>
            <Text style={{
              fontSize: 11, fontWeight: '600', textTransform: 'uppercase',
              letterSpacing: 1, color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 12,
            }}>
              Summary
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                backgroundColor: accent.primary + '18',
              }}>
                <Text style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280' }}>Members</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: accent.primary }}>
                  {table.rows.length}
                </Text>
              </View>
              {totals.map((total, i) => (
                <View key={i} style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: accent.primary + '18',
                }}>
                  <Text style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {total!.label}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: accent.primary }}>
                    {total!.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {table.rows.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Ionicons name="people-outline" size={32} color={isDark ? '#4b5563' : '#d1d5db'} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#6b7280' : '#9ca3af' }}>
              No members yet
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? '#4b5563' : '#d1d5db', marginTop: 4 }}>
              Tap + to add your first member
            </Text>
          </View>
        )}

        {/* ── Row cards ─────────────────────────────────────────────────── */}
        {table.rows.map((row, rowIndex) => (
          <View
            key={row.id}
            style={{
              borderRadius: 16, marginBottom: 10, overflow: 'hidden',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderWidth: 0.5,
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
            }}
          >
            {/* Row header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: isDark ? '#111827' : accent.primary + '0d',
              borderBottomWidth: 0.5,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#f9fafb' : accent.text }}>
                #{rowIndex + 1}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteRow(row.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={15} color="#f43f5e" />
              </TouchableOpacity>
            </View>

            {/* Row cells */}
            {table.columns.map((col, colIndex) => {
              const value = row.cells[col.id]
              const isChecked = col.type === 'checkbox' && value === true
              const isEmpty = value === null || value === undefined

              return (
                <TouchableOpacity
                  key={col.id}
                  onPress={() => handleCellPress(row, col)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderBottomWidth: colIndex < table.columns.length - 1 ? 0.5 : 0,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
                  }}
                >
                  {/* Column label + icon */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons
                      name={COLUMN_TYPE_ICONS[col.type] as any}
                      size={15}
                      color={isDark ? '#6b7280' : '#9ca3af'}
                    />
                    <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                      {col.label}
                    </Text>
                  </View>

                  {/* Cell value */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {col.type === 'checkbox' ? (
                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isChecked ? '#22c55e' : isDark ? '#374151' : '#d1d5db'}
                      />
                    ) : (
                      <>
                        <Text style={{
                          fontSize: 14, fontWeight: '500',
                          color: isEmpty
                            ? isDark ? '#374151' : '#d1d5db'
                            : isDark ? '#f9fafb' : '#111827',
                        }}>
                          {formatCellValue(value, col.type)}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={isDark ? '#374151' : '#e5e7eb'}
                        />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleAddRow}
        style={{
          position: 'absolute', bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: accent.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: accent.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

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
                {table.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenEdit}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 0.5, borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#f9fafb' : '#111827' }}>
                Edit Table
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAll}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}
            >
              <Ionicons name="trash-outline" size={20} color="#f43f5e" />
              <View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#f43f5e' }}>Delete All Members</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 2 }}>
                  Remove all rows from this table
                </Text>
              </View>
            </TouchableOpacity>
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

      {/* ── Cell text/number edit modal ───────────────────────────────────── */}
      <Modal visible={!!editingCell} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
          activeOpacity={1}
          onPress={() => setEditingCell(null)}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={{
              borderRadius: 24, paddingHorizontal: 24, paddingVertical: 24,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 16, color: isDark ? '#f9fafb' : '#111827' }}>
                {table.columns.find((c) => c.id === editingCell?.colId)?.label}
              </Text>
              <TextInput
                style={{
                  borderWidth: 0.5,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 15, marginBottom: 16,
                  backgroundColor: isDark ? '#111827' : '#f9fafb',
                  color: isDark ? '#f9fafb' : '#111827',
                }}
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
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                >
                  <Text style={{ fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveCell}
                  style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: accent.primary }}
                >
                  <Text style={{ fontWeight: '600', color: '#ffffff' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Date picker iOS — full screen modal ───────────────────────────── */}
      {Platform.OS === 'ios' && datePickerVisible && (
        <Modal visible={datePickerVisible} transparent={false} animationType="slide">
          <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: isDark ? '#374151' : '#e5e7eb',
            }}>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: accent.primary }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f9fafb' : '#111827' }}>
                Pick Date
              </Text>
              <TouchableOpacity onPress={() => handleSaveDate(selectedDate)}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: accent.primary }}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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

      {/* ── Date picker Android ───────────────────────────────────────────── */}
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

      {/* ── Edit table modal ──────────────────────────────────────────────── */}
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