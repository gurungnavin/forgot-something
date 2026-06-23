import { Category } from '../types'

export const CATEGORIES: Category[] = [
  {
    key:   'grocery',
    label: 'Grocery',
    icon:  'cart-outline',
    color: '#f97316',
    tint:  '#fff7ed',
  },
  {
    key:   'travel',
    label: 'Travel',
    icon:  'airplane-outline',
    color: '#8B6BE8',
    tint:  '#f5f3ff',
  },
  {
    key:   'work',
    label: 'Work',
    icon:  'briefcase-outline',
    color: '#3E8BF5',
    tint:  '#eff6ff',
  },
  {
    key:   'home',
    label: 'Home',
    icon:  'home-outline',
    color: '#27B073',
    tint:  '#f0fdf4',
  },
  {
    key:   'fitness',
    label: 'Fitness',
    icon:  'barbell-outline',
    color: '#EE5D74',
    tint:  '#fff1f2',
  },
  {
    key:   'party',
    label: 'Party',
    icon:  'sparkles-outline',
    color: '#FB7150',
    tint:  '#fff4f0',
  },
  {
    key:   'study',
    label: 'Study',
    icon:  'book-outline',
    color: '#0ea5e9',
    tint:  '#f0f9ff',
  },
  {
    key:   'health',
    label: 'Health',
    icon:  'medkit-outline',
    color: '#22c55e',
    tint:  '#f0fdf4',
  },
  {
    key:   'food',
    label: 'Food',
    icon:  'pizza-outline',
    color: '#ef4444',
    tint:  '#fef2f2',
  },
  {
    key:   'gaming',
    label: 'Gaming',
    icon:  'game-controller-outline',
    color: '#a855f7',
    tint:  '#faf5ff',
  },
  {
    key:   'shopping',
    label: 'Shopping',
    icon:  'bag-handle-outline',
    color: '#ec4899',
    tint:  '#fdf2f8',
  },
  {
    key:   'other',
    label: 'Other',
    icon:  'list-outline',
    color: '#6b7280',
    tint:  '#f9fafb',
  },
]

// Dark mode tints per category
export const CATEGORY_DARK_TINTS: Record<string, string> = {
  grocery:  '#2d1b0e',
  travel:   '#1e1433',
  work:     '#0d1f3c',
  home:     '#0d2818',
  fitness:  '#2d1417',
  party:    '#2d1810',
  study:    '#0c1f2d',
  health:   '#0d2818',
  food:     '#2d0f0f',
  gaming:   '#1e0d33',
  shopping: '#2d0f20',
  other:    '#1f2937',
}
