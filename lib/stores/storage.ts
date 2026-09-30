/**
 * Compatibility shim â€” ConnectedStore type is now defined in StoreContext.
 * All imports from this module continue to work unchanged.
 * Actual data persistence is handled by Supabase via StoreContext + lib/supabase/db.ts
 */
export type { ConnectedStore } from "@/context/StoreContext";

// No-op stubs â€” StoreContext + Supabase handles all real persistence now.
export function getStoredStores(): never[] { return []; }
export function saveStoreToStorage(_store: unknown): never[] { return []; }
export function removeStoreFromStorage(_id: string): never[] { return []; }
export function updateStoreInStorage(_id: string, _patch: unknown): never[] { return []; }