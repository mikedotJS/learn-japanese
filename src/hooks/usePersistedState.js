import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecord, useMutation } from '@weirdscience/based-client';
import { useAuth } from '../context/AuthContext';

function rowIdFor(userId, storageKey) {
  return `u-${userId}--${storageKey}`;
}

function readLocal(storageKey, defaultValue) {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultValue;
    const parsed = JSON.parse(saved);
    return Array.isArray(defaultValue) ? parsed : { ...defaultValue, ...parsed };
  } catch {
    return defaultValue;
  }
}

/**
 * Drop-in replacement for useState that persists to localStorage and syncs to
 * Based when authenticated. Uses the upsert operation (PUT with RFC 7231
 * upsert semantics) so the first save lands regardless of whether the row
 * already exists on the server.
 *
 * Hydration rule: the server row only replaces local state when the user has
 * NOT already changed something this session. If a change happens before the
 * server fetch resolves (e.g. completing the very first lesson right after
 * page load), the local change wins and is pushed to the server — it is never
 * silently discarded by the slower server fetch. Without this, progress made
 * during the hydration window was lost, leaving the user stuck on the first
 * lesson.
 */
export function usePersistedState(storageKey, defaultValue) {
  const { user } = useAuth();
  const rowId = user ? rowIdFor(user.id, storageKey) : null;

  const [state, setStateRaw] = useState(() => readLocal(storageKey, defaultValue));

  const { data: row, isLoading: isFetching } = useRecord('user_data', rowId);

  // The rowId we have already hydrated against. Lets us re-hydrate when the
  // signed-in user changes without mutating refs during render.
  const hydratedRowId = useRef(null);
  // Set the moment the user changes state, even before hydration finishes.
  // Guards against the server fetch clobbering a pending local change and
  // gates whether there is anything worth syncing.
  const userTouched = useRef(false);
  // Bumped when hydration finishes so the save effect re-runs and flushes a
  // change that was made (and skipped) while hydration was still in flight.
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    if (!rowId || isFetching) return;
    if (hydratedRowId.current === rowId) return;
    // The signed-in user changed — discard the previous user's pending-edit
    // flag so their state is not attributed to this account.
    if (hydratedRowId.current !== null) userTouched.current = false;
    // Adopt the server row only if the user has not already made a local edit
    // this session — a pending local change is newer and must not be lost.
    if (row?.data && !userTouched.current) {
      try {
        const parsed = JSON.parse(row.data);
        const merged = Array.isArray(defaultValue)
          ? parsed
          : { ...defaultValue, ...parsed };
        // One-shot sync of the server row into local state on hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStateRaw(merged);
      } catch { /* corrupt row — will overwrite on next save */ }
    }
    hydratedRowId.current = rowId;
    // Re-arm the save effect now that syncing is permitted.
    setSyncTick((t) => t + 1);
  }, [isFetching, row, rowId, defaultValue]);

  const setState = useCallback((updater) => {
    userTouched.current = true;
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch { /* quota exceeded */ }
      return next;
    });
  }, [storageKey]);

  const { mutate: upsertRow } = useMutation('user_data', 'upsert');
  const debounceRef = useRef(null);

  useEffect(() => {
    // Only sync once hydrated for the current user and only when the user has
    // actually changed something — hydration itself must not trigger a write.
    if (!user || hydratedRowId.current !== rowId || !userTouched.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertRow({
        id: rowId,
        userId: user.id,
        key: storageKey,
        data: JSON.stringify(state),
      }).catch(() => { /* localStorage still has it — retry on next write */ });
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [state, syncTick, user, storageKey, rowId, upsertRow]);

  return [state, setState];
}
