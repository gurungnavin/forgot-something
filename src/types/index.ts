export type CategoryKey =
  | 'grocery' | 'travel' | 'work' | 'home'
  | 'fitness' | 'party' | 'study' | 'health'
  | 'food' | 'gaming' | 'shopping' | 'other'

export type Item = {
  id: string
  label: string
  checked: boolean
  createdAt?: string
}

export type List = {
  id: string
  name: string
  createdAt: string
  items: Item[]
  category?: CategoryKey
  reminder?: {
    time: string
  }
}


export type RootStackParamList = {
  Onboarding: undefined
  Transition: undefined
  Tabs: undefined
  ListDetail: { listId: string }
  Success: { listId: string }
  MissingItems: { missing: string[]; listId: string }
}