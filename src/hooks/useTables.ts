import { useState, useCallback } from "react";
import {
  loadTables,
  addTable,
  updateTable,
  deleteTable,
  saveTables,
} from "../storage/storage";
import { CustomTable } from "../types";

export function useTables() {
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTables = useCallback(async () => {
    setIsLoading(true);
    const data = await loadTables();
    setTables(data);
    setIsLoading(false);
  }, []);

  const createTable = useCallback(async (table: CustomTable) => {
    const all = await loadTables();
    const updated = [table, ...all];
    await saveTables(updated);
    setTables(updated);
    return updated;
  }, []);

  const editTable = useCallback(async (updated: CustomTable) => {
    const all = await loadTables(); // ← read fresh from storage
    const next = all.map((t) => (t.id === updated.id ? updated : t));
    await saveTables(next);
    setTables(next);
    return next;
  }, []);

  const removeTable = useCallback(async (id: string) => {
    const all = await loadTables();
    const updated = all.filter((t) => t.id !== id);
    await saveTables(updated);
    setTables(updated);
    return updated;
  }, []);

  return {
    tables,
    isLoading,
    refreshTables,
    createTable,
    editTable,
    removeTable,
  };
}
