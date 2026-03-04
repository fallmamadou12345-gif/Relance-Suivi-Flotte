
if (!window.storage) {
  window.storage = {
    get: async (key: string) => {
      try {
        const res = await fetch(`/api/storage/${key}`);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        console.error("Storage GET error", e);
        return null;
      }
    },
    set: async (key: string, value: string) => {
      try {
        await fetch(`/api/storage/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      } catch (e) {
        console.error("Storage SET error", e);
      }
    },
    delete: async (key: string) => {
      try {
        await fetch(`/api/storage/${key}`, { method: 'DELETE' });
      } catch (e) {
        console.error("Storage DELETE error", e);
      }
    },
  };
}
