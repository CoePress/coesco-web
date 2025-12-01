# Outbox/Retry Queue System

## Overview

The outbox system provides reliable request queuing and automatic retry for write operations when the network is offline or unstable. It prevents data loss and handles transient network failures with exponential backoff.

## Features

- Automatic queuing of POST/PATCH/PUT/DELETE when offline or on slow connections
- IndexedDB persistence (survives page reloads)
- Exponential backoff with jitter (2s \* 2^attempts, max 60s)
- Idempotency-Key headers to prevent duplicate operations
- Automatic replay on network recovery
- Configurable retry attempts (default: 5)
- DOM events for success/failure notifications
- Optional UI indicator component

## Usage

### Enable the feature

Set the environment variable:

```env
VITE_ENABLE_OUTBOX=true
```

### Basic usage (automatic)

When enabled, write operations automatically queue when offline:

```typescript
const api = useApi();

// This will auto-queue if offline/slow
await api.post("/forms", { name: "New Form" });

// Returns { queued: true, id: "...", idempotencyKey: "..." } when queued
// Returns normal response when sent live
```

### Advanced configuration

Fine-tune queuing behavior:

```typescript
// Force queue even when online
await api.post("/forms", data, {
  queue: {
    forceQueue: true,
    maxAttempts: 10
  }
});

// Skip queue even when offline
await api.post("/urgent", data, {
  queue: {
    skipQueue: true
  }
});

// Use custom idempotency key
await api.post("/forms", data, {
  queue: {
    idempotencyKey: "custom-key-123"
  }
});
```

### Listen to events

```typescript
window.addEventListener("outbox:flushed", (event) => {
  console.log("Request succeeded:", event.detail);
  // Show toast notification
});

window.addEventListener("outbox:failed", (event) => {
  console.error("Request failed:", event.detail);
  // Show error notification
});
```

### UI Indicator

Add the OutboxIndicator component to show queue status:

```tsx
import OutboxIndicator from "@/components/outbox-indicator";

function App() {
  return (
    <>
      <YourApp />
      <OutboxIndicator />
    </>
  );
}
```

### Manual queue management

```typescript
import { useOutbox } from "@/hooks/use-outbox";

function DebugPanel() {
  const { stats, queuedItems, clearQueue, forceReplay } = useOutbox();

  return (
    <div>
      <p>Queued: {stats.queued_count}</p>
      <p>Flushed: {stats.flushed_count}</p>
      <p>Failed: {stats.failed_count}</p>

      <button onClick={forceReplay}>Retry Now</button>
      <button onClick={clearQueue}>Clear Queue</button>
    </div>
  );
}
```

## Server-side (recommended)

To prevent duplicate operations, implement Idempotency-Key handling:

```typescript
// Example Express middleware
const idempotencyStore = new Map(); // Use Redis in production

app.use((req, res, next) => {
  const key = req.headers["idempotency-key"];

  if (!key || req.method === "GET") {
    return next();
  }

  // Check if we've seen this key before
  const cached = idempotencyStore.get(`${req.user.id}:${key}`);
  if (cached) {
    return res.json(cached); // Return original response
  }

  // Store response on success
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    idempotencyStore.set(`${req.user.id}:${key}`, body);
    // Set TTL to 24-72h in production
    return originalJson(body);
  };

  next();
});
```

## Architecture

- `outbox.service.ts` - IndexedDB operations
- `outbox-replayer.service.ts` - Retry engine with backoff
- `use-api.ts` - Integration with API calls
- `use-outbox.ts` - Hook for queue management
- `outbox-indicator.tsx` - UI component
- `outbox-init.ts` - Initialization on app start

## Testing

```typescript
// Simulate offline
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: false
});

// Make request (should queue)
await api.post("/test", { data: "test" });

// Go online
Object.defineProperty(navigator, "onLine", { value: true });
window.dispatchEvent(new Event("online"));

// Should auto-replay
```

## Configuration

- `BATCH_SIZE`: 10 requests per replay cycle
- `REPLAY_INTERVAL`: 5 seconds between checks
- `MAX_ATTEMPTS`: 5 (configurable per request)
- `BASE_DELAY`: 2 seconds
- `MAX_DELAY`: 60 seconds

## Limitations

- Only JSON payloads (no file uploads yet)
- GET requests never queue (by design)
- Hard 4xx errors stop retries immediately
- Queue length not capped (future enhancement)
