# IndexedDB Setup for Coesco PWA

This directory contains a complete IndexedDB implementation for the Coesco PWA, providing persistent client-side storage with TypeScript support.

## 📁 Files Overview

- `indexeddb.ts` - Core IndexedDB service with all database operations
- `../hooks/use-indexed-db.ts` - React hooks for easy component integration
- `../components/IndexedDBExample.tsx` - Example component (can be deleted)

## 🗄️ Database Schema

The database is set up with the following stores (tables):

### **user** store

- `id: string` - Unique identifier
- `name: string` - User's name
- `email: string` - User's email (indexed)
- `lastLogin: Date` - Last login timestamp
- `settings: Record<string, any>` - User preferences

### **quotes** store

- `id: string` - Unique identifier
- `companyId: string` - Associated company (indexed)
- `items: any[]` - Quote items array
- `status: string` - Quote status (indexed)
- `createdAt: Date` - Creation timestamp (indexed)
- `updatedAt: Date` - Last update timestamp

### **machines** store

- `id: string` - Unique identifier
- `name: string` - Machine name
- `status: 'online' | 'offline' | 'maintenance'` - Machine status (indexed)
- `lastHeartbeat: Date` - Last communication timestamp
- `location: string` - Machine location (indexed)

### **cache** store

- `key: string` - Cache key
- `data: any` - Cached data
- `timestamp: Date` - Cache creation time
- `ttl?: number` - Time to live in milliseconds (optional)

## 🚀 Quick Start

### 1. Basic Usage with Hooks

```typescript
import { useIndexedDB } from '../hooks/use-indexed-db';

function MyComponent() {
  const userDB = useIndexedDB('user');

  // Data is automatically loaded
  const users = userDB.data;

  // Add a new user
  const addUser = async () => {
    await userDB.add({
      id: Date.now().toString(),
      name: 'John Doe',
      email: 'john@example.com',
      lastLogin: new Date(),
      settings: { theme: 'dark' }
    });
  };

  // Update a user
  const updateUser = async (userId: string) => {
    await userDB.update({
      id: userId,
      name: 'Jane Doe',
      email: 'jane@example.com',
      lastLogin: new Date(),
      settings: { theme: 'light' }
    });
  };

  // Delete a user
  const deleteUser = async (userId: string) => {
    await userDB.remove(userId);
  };

  return (
    <div>
      {userDB.loading && <p>Loading...</p>}
      {userDB.error && <p>Error: {userDB.error}</p>}
      {users?.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
    </div>
  );
}
```

### 2. Cache Management

```typescript
import { useCache } from "../hooks/use-indexed-db";

function CacheExample() {
  const cache = useCache();

  // Cache API response for 5 minutes
  const cacheApiResponse = async (data: any) => {
    await cache.setCache("api-response", data, 5 * 60 * 1000);
  };

  // Get cached data
  const getCachedData = async () => {
    const cachedData = await cache.getCache("api-response");
    return cachedData; // null if not found or expired
  };

  // Clean up expired cache
  const cleanup = async () => {
    await cache.clearExpiredCache();
  };
}
```

### 3. Direct Service Usage

```typescript
import { indexedDB } from '../services/indexeddb';

// Direct database operations
const directOperations = async () => {
  // Add record
  await indexedDB.add('user', {
    id: '1',
    name: 'Direct User',
    email: 'direct@example.com',
    lastLogin: new Date(),
    settings: {}
  });

  // Get record
  const user = await indexedDB.get('user', '1');

  // Get all records
  const allUsers = await indexedDB.getAll('user');

  // Query by index
  const onlineUsers = await indexedDB.getByIndex('user', 'status', 'online');

  // Count records
  const userCount = await indexedDB.count('user');

  // Update record
  await indexedDB.update('user', { id: '1', name: 'Updated Name', ... });

  // Delete record
  await indexedDB.delete('user', '1');

  // Clear all records
  await indexedDB.clear('user');
};
```

## 🔧 Available Hooks

### `useIndexedDB<T>(storeName, autoLoad?)`

Main hook for managing a specific store.

**Parameters:**

- `storeName` - Name of the store to manage
- `autoLoad` - Whether to automatically load data on mount (default: true)

**Returns:**

- `data` - Array of records from the store
- `loading` - Loading state
- `error` - Error message if any
- `add(item)` - Add a new record
- `get(id)` - Get a specific record
- `update(item)` - Update a record
- `remove(id)` - Delete a record
- `clear()` - Clear all records
- `count()` - Count records
- `refresh()` - Reload data
- `getByIndex(indexName, value)` - Query by index

### `useCache()`

Hook for cache operations.

**Returns:**

- `setCache(key, data, ttl?)` - Set cache with optional TTL
- `getCache(key)` - Get cached data
- `clearExpiredCache()` - Remove expired entries
- `loading` - Loading state
- `error` - Error message if any

### `useDatabaseInfo()`

Hook for database metadata.

**Returns:**

- `info` - Database information object
- `loading` - Loading state
- `error` - Error message if any
- `refresh()` - Reload database info

## 📋 Common Patterns

### 1. Offline-First Data Management

```typescript
const quotesDB = useIndexedDB("quotes");

// Load data from API and cache locally
const syncQuotes = async () => {
  try {
    const response = await fetch("/api/quotes");
    const quotes = await response.json();

    // Clear old data and add new
    await quotesDB.clear();
    for (const quote of quotes) {
      await quotesDB.add(quote);
    }
  } catch (error) {
    // Use cached data when offline
    console.log("Using cached quotes:", quotesDB.data);
  }
};
```

### 2. Smart Caching

```typescript
const cache = useCache();

// Cache with different TTL based on data type
const cacheWithTTL = async (key: string, data: any, type: "short" | "long") => {
  const ttl = type === "short" ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5min or 1hr
  await cache.setCache(key, data, ttl);
};
```

### 3. Background Sync

```typescript
// Clean up expired cache periodically
useEffect(() => {
  const interval = setInterval(
    async () => {
      await cache.clearExpiredCache();
    },
    10 * 60 * 1000
  ); // Every 10 minutes

  return () => clearInterval(interval);
}, []);
```

## 🛠️ Customization

### Adding New Stores

1. Update the `DatabaseSchema` interface in `indexeddb.ts`
2. Add the store creation logic in `createObjectStores()`
3. The store will be automatically available in hooks

### Modifying Schema

1. Update the interface in `DatabaseSchema`
2. Increment the `version` number in `IndexedDBService`
3. Handle migration logic in `createObjectStores()` if needed

### Custom Indexes

Add indexes in the `createObjectStores()` method:

```typescript
const store = db.createObjectStore("myStore", { keyPath: "id" });
store.createIndex("myIndex", "myField", { unique: false });
```

## 🚫 Important Notes

- **Browser Support**: IndexedDB is supported in all modern browsers
- **Storage Limits**: Varies by browser, typically 10% of available disk space
- **Performance**: Designed for storing structured data, not files
- **Security**: Data is domain-specific and not shared across origins
- **Persistence**: Data persists until explicitly deleted or browser storage is cleared

## 🔗 Integration Tips

1. **Use with Service Workers**: Great for offline functionality
2. **Combine with API**: Use as a cache layer for API responses
3. **Error Handling**: Always handle potential IndexedDB errors
4. **Migration Strategy**: Plan for schema changes with version management

## 📊 Performance Best Practices

- Use transactions for multiple operations
- Avoid storing large binary data (use ObjectURL instead)
- Index frequently queried fields
- Clean up expired cache regularly
- Use pagination for large datasets

This setup provides a solid foundation for persistent storage in your PWA. The hooks make it React-friendly, while the service provides direct access when needed.
