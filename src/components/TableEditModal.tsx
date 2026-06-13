import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import uuid from 'react-native-uuid'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { CustomTable, Column, ColumnType } from '../types'

const EMOJI_OPTIONS = ['⚽', '🎉', '✈️', '🍕', '🏀', '🎮', '💰', '📋', '🏋️', '🎵', '🎯', '👥']

const COLUMN_TYPES: { type: ColumnType; label: string; icon: string }[] = [
  { type: 'text',     label: 'Text',     icon: 'text-outline'       },
  { type: 'number',   label: 'Number',   icon: 'calculator-outline' },
  { type: 'checkbox', label: 'Checkbox', icon: 'checkbox-outline'   },
  { type: 'date',     label: 'Date',     icon: 'calendar-outline'   },
]

type Props = {
  visible: boolean
  table: CustomTable
  onClose: () => void
  onSave: (updated: CustomTable) => void
}

export default function TableEditModal({ visible, table, onClose, onSave }: Props) {
  const { isDark, accent } = useTheme()

  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('📋')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editColumns, setEditColumns] = useState<Column[]>([])
  const [newColumnLabel, setNewColumnLabel] = useState('')
  const [newColumnType, setNewColumnType] = useState<ColumnType>('text')

  // Pre-fill when modal opens
  useEffect(() => {
    if (visible) {
      setEditName(table.name)
      setEditEmoji(table.emoji)
      setEditDescription(table.description ?? '')
      setEditDate(table.date ?? '')
      setEditColumns(table.columns)
      setNewColumnLabel('')
      setNewColumnType('text')
    }
  }, [visible])

  const handleAddColumn = () => {
    const label = newColumnLabel.trim()
    if (!label) return
    const newColumn: Column = {
      id: uuid.v4() as string,
      label,
      type: newColumnType,
    }
    setEditColumns([...editColumns, newColumn])
    setNewColumnLabel('')
    setNewColumnType('text')
  }

  const handleRemoveColumn = (id: string) => {
    const hasData = table.rows.some((r) => {
      const val = r.cells[id]
      return val !== null && val !== undefined && val !== false && val !== ''
    })
    if (hasData) {
      Alert.alert(
        'Column Has Data',
        'This column has data. Deleting will lose all data in this column. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => setEditColumns(editColumns.filter((c) => c.id !== id))
          }
        ]
      )
      return
    }
    setEditColumns(editColumns.filter((c) => c.id !== id))
  }

  const handleSave = () => {
    const name = editName.trim()
    if (!name) return
    if (editColumns.length === 0) {
      Alert.alert('No Columns', 'Add at least one column.')
      return
    }

    // Find new columns
    const originalColIds = table.columns.map((c) => c.id)
    const newColumns = editColumns.filter((c) => !originalColIds.includes(c.id))

    // Add empty cells for new columns in existing rows
    const updatedRows = table.rows.map((row) => {
      const newCells = { ...row.cells }
      newColumns.forEach((col) => {
        newCells[col.id] = col.type === 'checkbox' ? false : null
      })
      return { ...row, cells: newCells }
    })

    onSave({
      ...table,
      name,
      emoji: editEmoji,
      description: editDescription.trim() || undefined,
      date: editDate.trim() || undefined,
      columns: editColumns,
      rows: updatedRows,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: '90%',
        }}>
          {/* Handle bar */}
          <View style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: isDark ? '#4b5563' : '#d1d5db',
            alignSelf: 'center', marginTop: 12, marginBottom: 8,
          }} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Edit Table ✏️
            </Text>

            {/* Emoji */}
            <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setEditEmoji(emoji)}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: editEmoji === emoji ? accent.primary + '33' : isDark ? '#374151' : '#f3f4f6',
                    borderWidth: editEmoji === emoji ? 2 : 0,
                    borderColor: accent.primary,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Table Name</Text>
            <TextInput
              className={`border rounded-xl px-4 mb-4 ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
              style={{ paddingVertical: 14, fontSize: 16 }}
              placeholder="Table name..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={editName}
              onChangeText={setEditName}
            />

            {/* Description */}
            <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Description (optional)</Text>
            <TextInput
              className={`border rounded-xl px-4 mb-4 ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
              style={{ paddingVertical: 14, fontSize: 16 }}
              placeholder="e.g. Monthly session..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={editDescription}
              onChangeText={setEditDescription}
            />

            {/* Date */}
            <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Date (optional)</Text>
            <TextInput
              className={`border rounded-xl px-4 mb-4 ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
              style={{ paddingVertical: 14, fontSize: 16 }}
              placeholder="e.g. 2026/06/13..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={editDate}
              onChangeText={setEditDate}
            />

            {/* Columns */}
            <Text className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">Columns</Text>

            {editColumns.map((col) => (
              <View
                key={col.id}
                className={`flex-row items-center justify-between px-4 py-3 rounded-xl mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <Text style={{ fontSize: 16 }}>
                    {col.type === 'text' ? '📝' :
                     col.type === 'number' ? '🔢' :
                     col.type === 'checkbox' ? '✅' : '📅'}
                  </Text>
                  <TextInput
                    style={{
                      flex: 1, fontSize: 14,
                      color: isDark ? '#f9fafb' : '#374151',
                      paddingVertical: 2,
                    }}
                    value={col.label}
                    onChangeText={(text) =>
                      setEditColumns(editColumns.map((c) =>
                        c.id === col.id ? { ...c, label: text } : c
                      ))
                    }
                  />
                  <Text className="text-xs text-gray-400">({col.type})</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveColumn(col.id)}>
                  <Ionicons name="close-circle" size={20} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add new column */}
            <View className={`border rounded-xl px-4 py-3 mb-2 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
              <TextInput
                style={{ fontSize: 15, color: isDark ? '#f9fafb' : '#374151', marginBottom: 8 }}
                placeholder="New column name..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={newColumnLabel}
                onChangeText={setNewColumnLabel}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {COLUMN_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct.type}
                    onPress={() => setNewColumnType(ct.type)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                      backgroundColor: newColumnType === ct.type
                        ? accent.primary : isDark ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <Ionicons
                      name={ct.icon as any}
                      size={12}
                      color={newColumnType === ct.type ? '#ffffff' : isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text style={{
                      fontSize: 12,
                      color: newColumnType === ct.type ? '#ffffff' : isDark ? '#9ca3af' : '#6b7280',
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
              style={{ backgroundColor: accent.primary + '22' }}
            >
              <Text style={{ color: accent.primary, fontWeight: '600' }}>+ Add Column</Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-500 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: accent.primary }}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}