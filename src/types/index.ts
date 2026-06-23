export type BuiltInCategoryKey =
  | "grocery"
  | "travel"
  | "work"
  | "home"
  | "fitness"
  | "party"
  | "study"
  | "health"
  | "food"
  | "gaming"
  | "shopping"
  | "other";

// Custom categories will have a string id (e.g. "custom_abc123")
export type CategoryKey = BuiltInCategoryKey | string;

export type Category = {
  key: CategoryKey;
  label: string;
  icon: string;       // Ionicon name
  color: string;      // hex
  tint: string;       // rgba tint for background
  isCustom?: boolean;
};

export type Item = {
  id: string;
  label: string;
  checked: boolean;
  createdAt?: string;
};

export type List = {
  id: string;
  name: string;
  createdAt: string;
  items: Item[];
  category?: CategoryKey;
  reminder?: {
    time: string;
  };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Transition: undefined;
  Tabs: undefined;
  Home: { openModal?: boolean } | undefined;
  ListDetail: { listId: string };
  TableDetail: { tableId: string };
  Success: { listId: string };
  MissingItems: { missing: string[]; listId: string };
  Pro: undefined;
  Interstitial: undefined
};

// For tables
export type ColumnType = 'text' | 'number' | 'checkbox' | 'date'

// CellValue can be string, number, boolean, or null (for empty cells)

export type CellValue = string | number | boolean | null

// Column definition
export type Column = {
  id: string
  label: string
  type: ColumnType
}

// Each row has an id and a mapping of columnId to cell value
export type TableRow = {
  id: string
  cells: {
    [columnId: string]: CellValue
  }
}

// CustomTable includes metadata and the structure of the table
export type CustomTable = {
  id: string
  name: string
  emoji: string
  description?: string
  date?: string
  createdAt: string
  columns: Column[]
  rows: TableRow[]
  reminder?: {
    time: string
  }
}
