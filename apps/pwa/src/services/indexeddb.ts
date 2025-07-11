// IndexedDB Service for PWA
// Provides a clean interface for IndexedDB operations

export interface DatabaseSchema {
  // Define your data models here
  user: {
    id: string;
    name: string;
    email: string;
    lastLogin: Date;
    settings: Record<string, any>;
  };

  quotes: {
    id: string;
    companyId: string;
    items: any[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };

  machines: {
    id: string;
    name: string;
    status: "online" | "offline" | "maintenance";
    lastHeartbeat: Date;
    location: string;
  };

  // Add more schemas as needed
  cache: {
    key: string;
    data: any;
    timestamp: Date;
    ttl?: number; // Time to live in milliseconds
  };
}

type StoreNames = keyof DatabaseSchema;

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName = "CoescoPWA";
  private version = 1;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Auto-initialize when service is created
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not supported in this browser"));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;

        // Handle database errors after opening
        this.db.onerror = (event: Event) => {
          console.error("Database error:", event);
        };

        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores (tables)
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores based on the schema
   */
  private createObjectStores(db: IDBDatabase): void {
    // Users store
    if (!db.objectStoreNames.contains("user")) {
      const userStore = db.createObjectStore("user", { keyPath: "id" });
      userStore.createIndex("email", "email", { unique: true });
      userStore.createIndex("lastLogin", "lastLogin", { unique: false });
    }

    // Quotes store
    if (!db.objectStoreNames.contains("quotes")) {
      const quotesStore = db.createObjectStore("quotes", { keyPath: "id" });
      quotesStore.createIndex("companyId", "companyId", { unique: false });
      quotesStore.createIndex("status", "status", { unique: false });
      quotesStore.createIndex("createdAt", "createdAt", { unique: false });
    }

    // Machines store
    if (!db.objectStoreNames.contains("machines")) {
      const machinesStore = db.createObjectStore("machines", { keyPath: "id" });
      machinesStore.createIndex("status", "status", { unique: false });
      machinesStore.createIndex("location", "location", { unique: false });
    }

    // Cache store
    if (!db.objectStoreNames.contains("cache")) {
      const cacheStore = db.createObjectStore("cache", { keyPath: "key" });
      cacheStore.createIndex("timestamp", "timestamp", { unique: false });
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    if (!this.db) {
      throw new Error("Database not initialized");
    }
  }

  /**
   * Add a record to a store
   */
  async add<T extends StoreNames>(
    storeName: T,
    data: DatabaseSchema[T]
  ): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by ID
   */
  async get<T extends StoreNames>(
    storeName: T,
    id: string
  ): Promise<DatabaseSchema[T] | undefined> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T extends StoreNames>(
    storeName: T
  ): Promise<DatabaseSchema[T][]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a record (put operation)
   */
  async update<T extends StoreNames>(
    storeName: T,
    data: DatabaseSchema[T]
  ): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record
   */
  async delete<T extends StoreNames>(storeName: T, id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear<T extends StoreNames>(storeName: T): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  async getByIndex<T extends StoreNames>(
    storeName: T,
    indexName: string,
    value: any
  ): Promise<DatabaseSchema[T][]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count<T extends StoreNames>(storeName: T): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache operations with TTL support
   */
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    const cacheItem: DatabaseSchema["cache"] = {
      key,
      data,
      timestamp: new Date(),
      ttl,
    };

    await this.update("cache", cacheItem);
  }

  async getCache(key: string): Promise<any | null> {
    const cacheItem = await this.get("cache", key);

    if (!cacheItem) return null;

    // Check if cache has expired
    if (cacheItem.ttl) {
      const now = new Date().getTime();
      const cacheTime = cacheItem.timestamp.getTime();

      if (now - cacheTime > cacheItem.ttl) {
        // Cache expired, remove it
        await this.delete("cache", key);
        return null;
      }
    }

    return cacheItem.data;
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    const allCacheItems = await this.getAll("cache");
    const now = new Date().getTime();

    for (const item of allCacheItems) {
      if (item.ttl && now - item.timestamp.getTime() > item.ttl) {
        await this.delete("cache", item.key);
      }
    }
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    stores: string[];
    totalRecords: Record<string, number>;
  }> {
    await this.ensureInitialized();

    const stores = Array.from(this.db!.objectStoreNames);
    const totalRecords: Record<string, number> = {};

    for (const storeName of stores) {
      totalRecords[storeName] = await this.count(storeName as StoreNames);
    }

    return {
      name: this.dbName,
      version: this.version,
      stores,
      totalRecords,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBService();

// Export types for use in components
export type { StoreNames };
