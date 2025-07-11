import React, { useState } from "react";
import {
  useIndexedDB,
  useCache,
  useDatabaseInfo,
} from "../hooks/use-indexed-db";

/**
 * Example component showing how to use IndexedDB in your PWA
 * This is just for demonstration - you can delete this file when you're ready
 */
const IndexedDBExample: React.FC = () => {
  // Example: Managing user data
  const userDB = useIndexedDB("user");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  // Example: Managing cache
  const cache = useCache();
  const [cacheKey, setCacheKey] = useState("");
  const [cacheValue, setCacheValue] = useState("");

  // Example: Database info
  const dbInfo = useDatabaseInfo();

  // Add a new user
  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return;

    try {
      await userDB.add({
        id: Date.now().toString(),
        name: newUserName,
        email: newUserEmail,
        lastLogin: new Date(),
        settings: { theme: "dark", notifications: true },
      });

      setNewUserName("");
      setNewUserEmail("");
      alert("User added successfully!");
    } catch (error) {
      alert("Failed to add user");
    }
  };

  // Delete a user
  const handleDeleteUser = async (id: string) => {
    try {
      await userDB.remove(id);
      alert("User deleted successfully!");
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  // Cache operations
  const handleSetCache = async () => {
    if (!cacheKey || !cacheValue) return;

    try {
      await cache.setCache(cacheKey, cacheValue, 60000); // 1 minute TTL
      alert("Cache set successfully!");
    } catch (error) {
      alert("Failed to set cache");
    }
  };

  const handleGetCache = async () => {
    if (!cacheKey) return;

    try {
      const result = await cache.getCache(cacheKey);
      alert(result ? `Cache value: ${result}` : "Cache not found or expired");
    } catch (error) {
      alert("Failed to get cache");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">IndexedDB Example</h1>

      {/* Users Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Users Management</h2>

        {/* Add User Form */}
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Add New User</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleAddUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add User
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">
            Users ({userDB.data?.length || 0})
          </h3>

          {userDB.loading && <p className="text-gray-500">Loading users...</p>}

          {userDB.error && (
            <p className="text-red-500">Error: {userDB.error}</p>
          )}

          {userDB.data && userDB.data.length === 0 && (
            <p className="text-gray-500">
              No users found. Add some users above.
            </p>
          )}

          {userDB.data &&
            userDB.data.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center py-2 border-b">
                <div>
                  <strong>{user.name}</strong> ({user.email})
                  <div className="text-sm text-gray-500">
                    Last login: {new Date(user.lastLogin).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                  Delete
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Cache Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cache Management</h2>

        <div className="border rounded-lg p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Cache Key"
              value={cacheKey}
              onChange={(e) => setCacheKey(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Cache Value"
              value={cacheValue}
              onChange={(e) => setCacheValue(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleSetCache}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Set Cache
            </button>
            <button
              onClick={handleGetCache}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Get Cache
            </button>
          </div>

          <button
            onClick={cache.clearExpiredCache}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
            Clear Expired Cache
          </button>
        </div>
      </div>

      {/* Database Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Information</h2>

        <div className="border rounded-lg p-4">
          {dbInfo.loading && (
            <p className="text-gray-500">Loading database info...</p>
          )}

          {dbInfo.error && (
            <p className="text-red-500">Error: {dbInfo.error}</p>
          )}

          {dbInfo.info && (
            <div>
              <p>
                <strong>Database Name:</strong> {dbInfo.info.name}
              </p>
              <p>
                <strong>Version:</strong> {dbInfo.info.version}
              </p>
              <p>
                <strong>Stores:</strong> {dbInfo.info.stores.join(", ")}
              </p>
              <div className="mt-2">
                <strong>Record Counts:</strong>
                <ul className="ml-4 mt-1">
                  {Object.entries(dbInfo.info.totalRecords).map(
                    ([store, count]) => (
                      <li key={store}>
                        {store}: {count} records
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={dbInfo.refresh}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Refresh Info
          </button>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Quick Start Code Examples:</h3>

          <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">Basic Usage:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
              {`// In your component
const userDB = useIndexedDB('user');

// Add a user
await userDB.add({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  lastLogin: new Date(),
  settings: {}
});

// Get all users
const users = userDB.data; // Automatically loaded

// Update a user
await userDB.update({ id: '1', name: 'Jane Doe', ... });

// Delete a user
await userDB.remove('1');`}
            </pre>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">Cache Usage:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
              {`const cache = useCache();

// Cache data for 5 minutes
await cache.setCache('api-response', data, 5 * 60 * 1000);

// Get cached data
const cachedData = await cache.getCache('api-response');

// Clean up expired cache
await cache.clearExpiredCache();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexedDBExample;
