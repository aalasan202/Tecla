import { useSyncExternalStore } from "react";

/** Almacén mínimo persistido en localStorage, con suscripción para React. */
export function createStore<T extends object>(key: string, defaults: T, migrate?: (raw: unknown) => Partial<T>) {
  let value: T = load();
  const listeners = new Set<() => void>();

  function load(): T {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "null");
      if (raw && typeof raw === "object") return { ...defaults, ...(raw as Partial<T>) };
      const migrated = migrate?.(raw);
      return { ...defaults, ...migrated };
    } catch {
      return { ...defaults };
    }
  }

  function set(update: Partial<T> | ((prev: T) => Partial<T>)): void {
    const patch = typeof update === "function" ? update(value) : update;
    value = { ...value, ...patch };
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento: los cambios duran la sesión */
    }
    listeners.forEach((l) => l());
  }

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    get: () => value,
    set,
    reset: () => set(defaults),
    use: (): T => useSyncExternalStore(subscribe, () => value, () => value),
  };
}
