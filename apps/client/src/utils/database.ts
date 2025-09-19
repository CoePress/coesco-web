export type StoreNames = "submissions" | "users" | "machines" | "cache";

export interface Submission {
  id: string;
  payload: any;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Machine {
  id: string;
  name: string;
  status: "online" | "offline" | "maintenance";
}

export interface CacheItem {
  key: string;
  data: any;
  timestamp: Date;
  ttl?: number;
}

type DBRecord = Submission | User | Machine | CacheItem;

class LocalDatabase {
  private dbName = "AppDB";
  private version = 1;

  private async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);

      req.onupgradeneeded = () => {
        const db = req.result;

        if (!db.objectStoreNames.contains("submissions")) {
          db.createObjectStore("submissions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("machines")) {
          db.createObjectStore("machines", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T extends StoreNames>(store: T, record: DBRecord) {
    const db = await this.open();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(record);
    return tx.complete;
  }

  async getAll<T extends StoreNames>(store: T): Promise<DBRecord[]> {
    const db = await this.open();
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete<T extends StoreNames>(store: T, key: string) {
    const db = await this.open();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    return tx.complete;
  }
}

export const localDatabase = new LocalDatabase();
