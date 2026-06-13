# src/types/index.ts

## What is this file?
Central place for all shared TypeScript types.
Every file that needs these types imports from here — no more duplicating.

---

## CategoryKey
A union type — means the value can only be one of these exact strings.
Used to type the `category` field on a `List`.

```typescript
export type CategoryKey =
  | 'grocery' | 'travel' | 'work' | 'home'
  | 'fitness' | 'party' | 'study' | 'health'
  | 'food' | 'gaming' | 'shopping' | 'other'
```

Used in: `categories.ts`, `ListCard.tsx`, `HomeScreen.tsx`, `ListDetailScreen.tsx`

---

## Item
A single checklist item inside a list.

```typescript
export type Item = {
  id: string        // unique ID (uuid)
  label: string     // the text e.g. "Passport"
  checked: boolean  // ticked or not
  createdAt?: string // when it was added (ISO string), optional
}
```

Used in: `ListDetailScreen.tsx`, `ChecklistItem.tsx`

---

## List
A full checklist — contains multiple items.

```typescript
export type List = {
  id: string
  name: string       // e.g. "Osaka Trip"
  createdAt: string  // ISO string
  items: Item[]
  category?: CategoryKey
  reminder?: {
    time: string     // ISO string — when to fire the notification
    // notificationId removed — notifications.ts handles this via AsyncStorage
  }
}
```

Used in: every screen, storage.ts, ListCard.tsx

---

## RootStackParamList
Defines every screen in the app and what params they accept.
Used to type `useNavigation` and `useRoute` hooks — so TypeScript
knows which params each screen expects.

```typescript
export type RootStackParamList = {
  Onboarding: undefined           // no params
  Transition: undefined           // no params
  Tabs: undefined                 // no params (bottom tab container)
  ListDetail: { listId: string }  // needs a list ID to load the right list
  Success: { listId: string }     // needs list ID to show completion screen
  MissingItems: { missing: string[]; listId: string } // unchecked item labels
}
```

Used in: App.tsx, HomeScreen.tsx, ListDetailScreen.tsx, any screen that navigates