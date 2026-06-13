import AsyncStorage from '@react-native-async-storage/async-storage'
import { List } from '../types'

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