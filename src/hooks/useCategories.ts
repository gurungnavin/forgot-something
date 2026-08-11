import { useState, useCallback } from 'react'
import { Category } from '../types'
import {
  loadCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '../storage/storage'
import { CATEGORIES } from '../constants/categories'

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshCategories = useCallback(async () => {
    setIsLoading(true)
    const data = await loadCustomCategories()
    setCustomCategories(data)
    setIsLoading(false)
  }, [])

  // All categories — built-in + custom
  const allCategories = [...CATEGORIES, ...customCategories]

  const createCategory = useCallback(async (category: Category) => {
    const updated = await addCustomCategory(category, customCategories)
    setCustomCategories(updated)
  }, [customCategories])

  const editCategory = useCallback(async (updated: Category) => {
    const next = await updateCustomCategory(updated, customCategories)
    setCustomCategories(next)
  }, [customCategories])

  const removeCategory = useCallback(async (key: string) => {
    const updated = await deleteCustomCategory(key, customCategories)
    setCustomCategories(updated)
  }, [customCategories])

  return {
    customCategories,
    allCategories,
    isLoading,
    refreshCategories,
    createCategory,
    editCategory,
    removeCategory,
  }
}