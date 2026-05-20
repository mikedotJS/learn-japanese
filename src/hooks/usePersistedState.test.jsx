import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Shared, hoisted mock state so the vi.mock factories below can reach it.
const h = vi.hoisted(() => ({
  // What `useRecord` reports. `isLoading: true` means the server fetch is
  // still in flight (the "hydration window").
  record: { data: null, isLoading: true },
  // Every payload passed to the `upsert` mutation.
  upsertCalls: [],
  user: { id: 'user1' },
}));

vi.mock('@weirdscience/based-client', () => ({
  useRecord: () => h.record,
  useMutation: () => ({
    mutate: (payload) => {
      h.upsertCalls.push(payload);
      return Promise.resolve();
    },
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: h.user }),
}));

import { usePersistedState } from './usePersistedState';

const STORAGE_KEY = 'nihongo-progress';
// Stable reference — the hook keeps it in effect dependency arrays.
const DEFAULT = { completedLessons: [], settings: { currentLevel: 'N5' } };

function renderPersisted() {
  return renderHook(() => usePersistedState(STORAGE_KEY, DEFAULT));
}

/**
 * Resolve the in-flight server fetch. `useRecord` exposes `{ data: record }`
 * where the record row carries the persisted JSON in its own `data` column.
 */
function resolveServer(rerender, data) {
  act(() => {
    h.record = {
      data: data == null ? null : { data: JSON.stringify(data) },
      isLoading: false,
    };
    rerender();
  });
}

beforeEach(() => {
  h.record = { data: null, isLoading: true };
  h.upsertCalls = [];
  h.user = { id: 'user1' };
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('usePersistedState', () => {
  it('adopts the server row when the user has made no local changes', () => {
    const { result, rerender } = renderPersisted();
    expect(result.current[0].completedLessons).toEqual([]);

    resolveServer(rerender, { completedLessons: ['L1', 'L2'] });

    expect(result.current[0].completedLessons).toEqual(['L1', 'L2']);
  });

  it('does NOT sync to the server when nothing was changed locally', () => {
    const { rerender } = renderPersisted();
    resolveServer(rerender, { completedLessons: ['L1'] });

    act(() => vi.advanceTimersByTime(1000));

    expect(h.upsertCalls).toHaveLength(0);
  });

  it('keeps a change made before hydration and syncs it to the server', () => {
    // Reproduces the "stuck at hiragana" bug: the user completes the first
    // lesson while the server fetch is still in flight.
    const { result, rerender } = renderPersisted();

    act(() => {
      result.current[1]((prev) => ({
        ...prev,
        completedLessons: [...prev.completedLessons, 'L1'],
      }));
    });
    expect(result.current[0].completedLessons).toEqual(['L1']);

    // Server fetch resolves with an empty row — the older, slower state.
    resolveServer(rerender, { completedLessons: [] });

    // The local change must survive: the stale server row must not clobber it.
    expect(result.current[0].completedLessons).toEqual(['L1']);

    // ...and it must be pushed up to the server after the debounce.
    act(() => vi.advanceTimersByTime(500));
    expect(h.upsertCalls).toHaveLength(1);
    expect(JSON.parse(h.upsertCalls[0].data).completedLessons).toEqual(['L1']);
    expect(h.upsertCalls[0].id).toBe('u-user1--nihongo-progress');
  });

  it('syncs changes made after hydration', () => {
    const { result, rerender } = renderPersisted();
    resolveServer(rerender, { completedLessons: ['L1'] });

    act(() => {
      result.current[1]((prev) => ({
        ...prev,
        completedLessons: [...prev.completedLessons, 'L2'],
      }));
    });

    act(() => vi.advanceTimersByTime(500));

    expect(h.upsertCalls).toHaveLength(1);
    expect(JSON.parse(h.upsertCalls[0].data).completedLessons).toEqual(['L1', 'L2']);
  });

  it('debounces rapid successive changes into a single sync', () => {
    const { result, rerender } = renderPersisted();
    resolveServer(rerender, { completedLessons: [] });

    act(() => {
      result.current[1]((p) => ({ ...p, completedLessons: ['L1'] }));
    });
    act(() => vi.advanceTimersByTime(200));
    act(() => {
      result.current[1]((p) => ({ ...p, completedLessons: ['L1', 'L2'] }));
    });
    act(() => vi.advanceTimersByTime(500));

    expect(h.upsertCalls).toHaveLength(1);
    expect(JSON.parse(h.upsertCalls[0].data).completedLessons).toEqual(['L1', 'L2']);
  });

  it('persists changes to localStorage immediately', () => {
    const { result, rerender } = renderPersisted();
    resolveServer(rerender, null);

    act(() => {
      result.current[1]((prev) => ({ ...prev, completedLessons: ['L1'] }));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.completedLessons).toEqual(['L1']);
  });

  it('seeds initial state from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ completedLessons: ['L1', 'L2', 'L3'] }),
    );

    const { result } = renderPersisted();

    expect(result.current[0].completedLessons).toEqual(['L1', 'L2', 'L3']);
    expect(result.current[0].settings.currentLevel).toBe('N5');
  });
});
