import { useState, useCallback } from 'react'
import { loadLists, addList, updateList, deleteList } from '../storage/storage'
import { List } from '../types'

export function useLists() {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshLists = useCallback(async () => {
    setIsLoading(true)
    const data = await loadLists()
    setLists(data)
    setIsLoading(false)
  }, [])

  const createList = useCallback(async (list: List) => {
    const updated = await addList(list, lists)
    setLists(updated)
    return updated
  }, [lists])

  const editList = useCallback(async (updated: List) => {
    const next = await updateList(updated, lists)
    setLists(next)
    return next
  }, [lists])

  const removeList = useCallback(async (id: string) => {
    const updated = await deleteList(id, lists)
    setLists(updated)
    return updated
  }, [lists])

  return {
    lists,
    isLoading,
    refreshLists,
    createList,
    editList,
    removeList,
  }
}