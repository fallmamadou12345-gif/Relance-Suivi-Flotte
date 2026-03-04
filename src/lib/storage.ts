
if (!window.storage) {
  window.storage = {
    get: async (key: string) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    delete: async (key: string) => {
      localStorage.removeItem(key);
    },
  };
}
