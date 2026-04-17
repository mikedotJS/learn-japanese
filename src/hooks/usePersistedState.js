import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecord, useMutation } from '@weirdscience/based-client';
import { useAuth } from '../context/AuthContext';

function rowIdFor(userId, storageKey) {
  return `u-${userId}--${storageKey}`;
}

/**
 * Drop-in replacement for useState that persists to localStorage
 * and syncs to Based when authenticated.
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

  const { mutate } = useMutation('user_data', 'update');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user || !hydrated.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutate({
        id: rowId,
        userId: user.id,
        key: storageKey,
        data: JSON.stringify(state),
      }).catch(() => { /* network hiccup — localStorage still has it */ });
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [state, user, storageKey, rowId, mutate]);

  return [state, setState];
}
