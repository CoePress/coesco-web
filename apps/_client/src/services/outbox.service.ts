import type { OutboxRecord } from "@/types/outbox.types";

const DB_NAME = "offline-outbox";
const STORE_NAME = "outbox";
const DB_VERSION = 1;

class OutboxService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db)
      return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("nextAttemptAt", "nextAttemptAt", { unique: false });
        }
      };
    });
  }

  async add(record: OutboxRecord): Promise<void> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(id: string): Promise<OutboxRecord | undefined> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getReady(limit: number = 10): Promise<OutboxRecord[]> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("nextAttemptAt");
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      const results: OutboxRecord[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        }
        else {
          resolve(results);
        }
      };
    });
  }

  async getAll(): Promise<OutboxRecord[]> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async update(record: OutboxRecord): Promise<void> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(id: string): Promise<void> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async count(): Promise<number> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db)
      throw new Error("[outbox] DB not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const outboxService = new OutboxService();
