
const API_URL = "/api/storage";

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
      localStorage.setItem(key, value);
    }
  },

  delete: async (key: string) => {
    try {
      await apiRequest(key, "DELETE");
    } catch (e) {
      localStorage.removeItem(key);
    }
  },
};
