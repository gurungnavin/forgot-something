import { CategoryKey } from '../types'

export const CATEGORIES: { key: CategoryKey; icon: string; label: string }[] = [
  { key: 'grocery',  icon: 'cart-outline',          label: 'Grocery'  },
  { key: 'travel',   icon: 'airplane-outline',       label: 'Travel'   },
  { key: 'work',     icon: 'briefcase-outline',      label: 'Work'     },
  { key: 'home',     icon: 'home-outline',           label: 'Home'     },
  { key: 'fitness',  icon: 'barbell-outline',        label: 'Fitness'  },
  { key: 'party',    icon: 'sparkles-outline',       label: 'Party'    },
  { key: 'study',    icon: 'book-outline',           label: 'Study'    },
  { key: 'health',   icon: 'medkit-outline',         label: 'Health'   },
  { key: 'food',     icon: 'pizza-outline',          label: 'Food'     },
  { key: 'gaming',   icon: 'game-controller-outline',label: 'Gaming'   },
  { key: 'shopping', icon: 'bag-handle-outline',     label: 'Shopping' },
  { key: 'other',    icon: 'list-outline',           label: 'Other'    },
]