// Archivos originales de las piezas importadas, en IndexedDB (no caben en localStorage).
// Se guardan sin modificar para poder convertirlos de nuevo más adelante (FR-013).

const DB = "tecla";
const STORE = "originals";

interface Original {
  id: string;
  bytes: ArrayBuffer;
  type: string;
}

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IndexedDB bloqueada"));
  }).catch((e) => {
    opening = null;
    throw e;
  });
  return opening;
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = work(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error);
    tx.onabort = () => reject(tx.error ?? new Error("transacción cancelada"));
  });
}

export async function putOriginal(id: string, bytes: Uint8Array, type: string): Promise<void> {
  const copy = bytes.slice().buffer;
  await run("readwrite", (s) => s.put({ id, bytes: copy, type } satisfies Original));
}

export async function deleteOriginal(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

export async function getOriginal(id: string): Promise<Uint8Array | undefined> {
  const found = (await run("readonly", (s) => s.get(id))) as Original | undefined;
  return found ? new Uint8Array(found.bytes) : undefined;
}
