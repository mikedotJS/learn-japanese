import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecord, useMutation } from '@weirdscience/based-client';
import { useAuth } from '../context/AuthContext';

function rowIdFor(userId, storageKey) {
  return `u-${userId}--${storageKey}`;
}

/**
 * Drop-in replacement for useState that persists to localStorage
 * and syncs to Based when authenticated.
 *
 * Sync model: on hydration we check whether the server row exists. The first
 * write for a new user must be a CREATE (POST) because UPDATE (PUT) against a
 * missing row 404s. After the first successful create we flip to update. If a
 * write fails we retry once with the opposite operation — covers the race
 * where a second device created the row in between our hydration and write.
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
  const rowExists = useRef(null); // null = unknown, true/false once hydrated
  const lastRowIdRef = useRef(rowId);

  // Reset sync state when the signed-in user changes so the next render
  // re-hydrates against the new user's row.
  if (lastRowIdRef.current !== rowId) {
    lastRowIdRef.current = rowId;
    hydrated.current = false;
    rowExists.current = null;
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
      rowExists.current = true;
    } else {
      rowExists.current = false;
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

  const { mutate: updateRow } = useMutation('user_data', 'update');
  const { mutate: createRow } = useMutation('user_data', 'create');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user || !hydrated.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const payload = {
        id: rowId,
        userId: user.id,
        key: storageKey,
        data: JSON.stringify(state),
      };
      try {
        if (rowExists.current) {
          await updateRow(payload);
        } else {
          await createRow(payload);
          rowExists.current = true;
        }
      } catch {
        try {
          if (rowExists.current) {
            await createRow(payload);
          } else {
            await updateRow(payload);
            rowExists.current = true;
          }
        } catch { /* localStorage still has it — retry on next write */ }
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [state, user, storageKey, rowId, updateRow, createRow]);

  return [state, setState];
}
