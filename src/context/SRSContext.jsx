import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SRSContext = createContext();
const SRS_STORAGE_KEY = 'nihongo-srs';

// SM-2 algorithm simplified
// Quality: 0 = blackout, 1 = wrong, 2 = hard, 3 = hesitant, 4 = correct, 5 = easy
function calculateNextReview(card, quality) {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Adjust ease factor (minimum 1.3)
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
    lastQuality: quality,
  };
}

function createSRSCard(id, type, data) {
  return {
    id,
    type, // 'kana' | 'vocabulary' | 'kanji' | 'grammar' | 'sentence'
    data,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    lastQuality: null,
    introduced: new Date().toISOString(),
  };
}

function isDue(card) {
  return new Date(card.nextReview) <= new Date();
}

export function SRSProvider({ children }) {
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem(SRS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const addCard = useCallback((id, type, data) => {
    setCards(prev => {
      if (prev.find(c => c.id === id)) return prev;
      return [...prev, createSRSCard(id, type, data)];
    });
  }, []);

  const addCards = useCallback((items) => {
    setCards(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newCards = items
        .filter(item => !existingIds.has(item.id))
        .map(item => createSRSCard(item.id, item.type, item.data));
      if (newCards.length === 0) return prev;
      return [...prev, ...newCards];
    });
  }, []);

  const reviewCard = useCallback((cardId, quality) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      return calculateNextReview(c, quality);
    }));
  }, []);

  const getDueCards = useCallback((type = null, limit = null) => {
    let due = cards.filter(c => isDue(c));
    if (type) due = due.filter(c => c.type === type);
    due.sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
    if (limit) due = due.slice(0, limit);
    return due;
  }, [cards]);

  const getCardsByType = useCallback((type) => {
    return cards.filter(c => c.type === type);
  }, [cards]);

  const hasCard = useCallback((id) => {
    return cards.some(c => c.id === id);
  }, [cards]);

  const getStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const totalCards = cards.length;
    const dueCount = cards.filter(c => isDue(c)).length;
    const reviewedToday = cards.filter(c => c.lastReview && new Date(c.lastReview) >= today).length;
    const mature = cards.filter(c => c.interval >= 21).length;
    const young = cards.filter(c => c.interval > 0 && c.interval < 21).length;
    const newCards = cards.filter(c => c.repetitions === 0).length;

    return { totalCards, dueCount, reviewedToday, mature, young, newCards };
  }, [cards]);

  const resetSRS = useCallback(() => {
    setCards([]);
  }, []);

  return (
    <SRSContext.Provider value={{
      cards,
      addCard,
      addCards,
      reviewCard,
      getDueCards,
      getCardsByType,
      hasCard,
      getStats,
      resetSRS,
    }}>
      {children}
    </SRSContext.Provider>
  );
}

export function useSRS() {
  const ctx = useContext(SRSContext);
  if (!ctx) throw new Error('useSRS must be used within SRSProvider');
  return ctx;
}
