import AsyncStorage from '@react-native-async-storage/async-storage'
import { List, CustomTable } from '../types'

const STORAGE_KEY = 'forgot_something_lists'

export const loadLists = async (): Promise<List[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveLists = async (lists: List[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  // Let it throw — callers should handle errors
}

export const addList = async (list: List, current: List[]): Promise<List[]> => {
  const updated = [list, ...current]  // use what caller already has
  await saveLists(updated)
  return updated
}

export const updateList = async (updated: List, current: List[]): Promise<List[]> => {
  const next = current.map((l) => (l.id === updated.id ? updated : l))
  await saveLists(next)
  return next
}

export const deleteList = async (id: string, current: List[]): Promise<List[]> => {
  const updated = current.filter((l) => l.id !== id)
  await saveLists(updated)
  return updated
}


const TABLE_STORAGE_KEY = 'forgot_something_tables'

export const loadTables = async (): Promise<CustomTable[]> => {
  try {
    const data = await AsyncStorage.getItem(TABLE_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveTables = async (tables: CustomTable[]): Promise<void> => {
  await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(tables))
}

export const addTable = async (table: CustomTable, current: CustomTable[]): Promise<CustomTable[]> => {
  const updated = [table, ...current]
  await saveTables(updated)
  return updated
}

export const updateTable = async (updated: CustomTable, current: CustomTable[]): Promise<CustomTable[]> => {
  const all = await loadTables()
  const next = all.map((t) => (t.id === updated.id ? updated : t))
  await saveTables(next)
  return next
}

export const deleteTable = async (id: string, current: CustomTable[]): Promise<CustomTable[]> => {
  const updated = current.filter((t) => t.id !== id)
  await saveTables(updated)
  return updated
}