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

  /** Devuelve true si el cambio se guardó en localStorage. */
  function set(update: Partial<T> | ((prev: T) => Partial<T>)): boolean {
    const patch = typeof update === "function" ? update(value) : update;
    value = { ...value, ...patch };
    let saved = true;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento: los cambios duran la sesión */
      saved = false;
    }
    listeners.forEach((l) => l());
    return saved;
  }

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    get: () => value,
    set,
    subscribe,
    reset: () => void set(defaults),
    use: (): T => useSyncExternalStore(subscribe, () => value, () => value),
  };
}
