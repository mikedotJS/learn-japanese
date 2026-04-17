import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecord, useMutation } from '@weirdscience/based-client';
import { useAuth } from '../context/AuthContext';

function rowIdFor(userId, storageKey) {
  return `u-${userId}--${storageKey}`;
}

/**
 * Drop-in replacement for useState that persists to localStorage and syncs to
 * Based when authenticated. Uses the upsert operation (PUT with RFC 7231
 * upsert semantics) so the first save lands regardless of whether the row
 * already exists on the server.
 */
export function usePersistedState(storageKey, defaultValue) {
  const { user } = useAuth();
  const rowId = user ? rowIdFor(user.id, storageKey) : null;

  const [state, setStateRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      return Array.isArray(defaultValue)
        ? parsed
        : { ...defaultValue, ...parsed };
    } catch {
      return defaultValue;
    }
  });

  const { data: row, isLoading: isFetching } = useRecord('user_data', rowId);
  const hydrated = useRef(false);
  const lastRowIdRef = useRef(rowId);

  // Reset hydration when the signed-in user changes so the next render
  // re-hydrates against the new user's row.
  if (lastRowIdRef.current !== rowId) {
    lastRowIdRef.current = rowId;
    hydrated.current = false;
  }

  useEffect(() => {
    if (hydrated.current || !rowId || isFetching) return;
    if (row?.data) {
      try {
        const parsed = JSON.parse(row.data);
        const merged = Array.isArray(defaultValue)
          ? parsed
          : { ...defaultValue, ...parsed };
        // One-shot sync of server row into local state on hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStateRaw(merged);
      } catch { /* corrupt row — will overwrite on next save */ }
    }
    hydrated.current = true;
  }, [isFetching, row, rowId, defaultValue]);

  const setState = useCallback((updater) => {
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
    if (!user || !hydrated.current) return;
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
  }, [state, user, storageKey, rowId, upsertRow]);

  return [state, setState];
}
