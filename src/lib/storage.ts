
const API_URL = "/api/storage";

// --- IndexedDB Helpers ---
const DB_NAME = "flotte_db";
const STORE_NAME = "kv_store";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IDB Get Error", e);
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IDB Delete Error", e);
  }
}
// -------------------------

async function apiRequest(key: string, method: string, value?: string) {
  const res = await fetch(`${API_URL}/${key}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: value ? JSON.stringify({ value }) : undefined
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response type (likely static fallback)");
  }
  return method === "GET" ? await res.json() : { success: true };
}

window.storage = {
  mode: "unknown",
  
  get: async (key: string) => {
    try {
      const data = await apiRequest(key, "GET");
      window.storage.mode = "cloud";
      return data;
    } catch (e) {
      console.warn(`[Storage] Cloud failed (${e}), falling back to local`);
      window.storage.mode = "local";
      
      // Try IndexedDB first (supports large data)
      const idbVal = await idbGet(key);
      if (idbVal) return { value: idbVal };

      // Fallback to localStorage (legacy/small data)
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    }
  },

  set: async (key: string, value: string) => {
    try {
      await apiRequest(key, "POST", value);
      window.storage.mode = "cloud";
    } catch (e) {
      window.storage.mode = "local";
      try {
        // Try IndexedDB for local storage (no quota issues)
        await idbSet(key, value);
        // If successful, clean up legacy localStorage to free space
        localStorage.removeItem(key);
      } catch (idbErr) {
        console.error("IDB Save Failed", idbErr);
        // Last resort: localStorage (might fail with QuotaExceeded)
        localStorage.setItem(key, value);
      }
    }
  },

  delete: async (key: string) => {
    try {
      await apiRequest(key, "DELETE");
    } catch (e) {
      await idbDelete(key);
      localStorage.removeItem(key);
    }
  },
};
