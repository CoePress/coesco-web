import { useState, useEffect, useCallback } from "react";
import { indexedDB, DatabaseSchema, StoreNames } from "../services/indexeddb";

interface UseIndexedDBReturn<T extends StoreNames> {
  data: DatabaseSchema[T][] | null;
  loading: boolean;
  error: string | null;

  // CRUD operations
  add: (item: DatabaseSchema[T]) => Promise<void>;
  get: (id: string) => Promise<DatabaseSchema[T] | undefined>;
  update: (item: DatabaseSchema[T]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;

  // Utility operations
  count: () => Promise<number>;
  refresh: () => Promise<void>;
  getByIndex: (indexName: string, value: any) => Promise<DatabaseSchema[T][]>;
}

interface CacheHookReturn {
  setCache: (key: string, data: any, ttl?: number) => Promise<void>;
  getCache: (key: string) => Promise<any | null>;
  clearExpiredCache: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing IndexedDB operations with a specific store
 */
export function useIndexedDB<T extends StoreNames>(
  storeName: T,
  autoLoad: boolean = true
): UseIndexedDBReturn<T> {
  const [data, setData] = useState<DatabaseSchema[T][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data from the store
  const loadData = useCallback(async () => {
    if (!autoLoad) return;

    setLoading(true);
    setError(null);

    try {
      const result = await indexedDB.getAll(storeName);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error(`Error loading data from ${storeName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [storeName, autoLoad]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add a new item
  const add = useCallback(
    async (item: DatabaseSchema[T]) => {
      setError(null);

      try {
        await indexedDB.add(storeName, item);
        // Refresh data after adding
        await loadData();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [storeName, loadData]
  );

  // Get a single item
  const get = useCallback(
    async (id: string): Promise<DatabaseSchema[T] | undefined> => {
      setError(null);

      try {
        return await indexedDB.get(storeName, id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [storeName]
  );

  // Update an item
  const update = useCallback(
    async (item: DatabaseSchema[T]) => {
      setError(null);

      try {
        await indexedDB.update(storeName, item);
        // Refresh data after updating
        await loadData();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [storeName, loadData]
  );

  // Delete an item
  const remove = useCallback(
    async (id: string) => {
      setError(null);

      try {
        await indexedDB.delete(storeName, id);
        // Refresh data after deleting
        await loadData();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [storeName, loadData]
  );

  // Clear all items
  const clear = useCallback(async () => {
    setError(null);

    try {
      await indexedDB.clear(storeName);
      // Refresh data after clearing
      await loadData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear store";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [storeName, loadData]);

  // Count items
  const count = useCallback(async (): Promise<number> => {
    setError(null);

    try {
      return await indexedDB.count(storeName);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to count items";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [storeName]);

  // Refresh data manually
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Get items by index
  const getByIndex = useCallback(
    async (indexName: string, value: any): Promise<DatabaseSchema[T][]> => {
      setError(null);

      try {
        return await indexedDB.getByIndex(storeName, indexName, value);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get items by index";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [storeName]
  );

  return {
    data,
    loading,
    error,
    add,
    get,
    update,
    remove,
    clear,
    count,
    refresh,
    getByIndex,
  };
}

/**
 * Hook for managing cache operations
 */
export function useCache(): CacheHookReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCache = useCallback(async (key: string, data: any, ttl?: number) => {
    setError(null);
    setLoading(true);

    try {
      await indexedDB.setCache(key, data, ttl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set cache";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCache = useCallback(async (key: string): Promise<any | null> => {
    setError(null);
    setLoading(true);

    try {
      return await indexedDB.getCache(key);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get cache";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearExpiredCache = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      await indexedDB.cleanupExpiredCache();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear expired cache";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    setCache,
    getCache,
    clearExpiredCache,
    loading,
    error,
  };
}

/**
 * Hook for getting database statistics and info
 */
export function useDatabaseInfo() {
  const [info, setInfo] = useState<{
    name: string;
    version: number;
    stores: string[];
    totalRecords: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await indexedDB.getDatabaseInfo();
      setInfo(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load database info";
      setError(errorMessage);
      console.error("Error loading database info:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  return {
    info,
    loading,
    error,
    refresh: loadInfo,
  };
}
