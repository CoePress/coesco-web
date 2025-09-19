this.addEventListener("install", () => this.skipWaiting());
this.addEventListener("activate", () => this.clients.claim());

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("AppDB", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("submissions")) {
        db.createObjectStore("submissions", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllSubmissions() {
  const db = await openDB();
  const tx = db.transaction("submissions", "readonly");
  return new Promise((resolve, reject) => {
    const req = tx.objectStore("submissions").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteSubmission(id) {
  const db = await openDB();
  const tx = db.transaction("submissions", "readwrite");
  tx.objectStore("submissions").delete(id);
  return tx.complete;
}

async function flushSubmissions() {
  const subs = await getAllSubmissions();
  for (const sub of subs) {
    try {
      const baseURL = self.location.origin;
      const res = await fetch(`${baseURL}/api/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(sub.payload),
      });
      if (res.ok) {
        await deleteSubmission(sub.id);
      }
    }
    catch {
      return;
    }
  }
}

this.addEventListener("sync", (event) => {
  if (event.tag === "sync-submissions") {
    event.waitUntil(flushSubmissions());
  }
});

this.addEventListener("message", (event) => {
  if (event.data.type === "FLUSH_SUBMISSIONS") {
    flushSubmissions();
  }
});
