import { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

const STORAGE_KEY = 'nihongo-progress';

const defaultProgress = {
  kana: { hiragana: [], katakana: [] },
  vocabulary: { learned: [], reviewed: [] },
  kanji: { learned: [], reviewed: [] },
  grammar: { learned: [], reviewed: [] },
  quiz: { history: [], bestScores: {} },
  settings: { currentLevel: 'N5' },
};

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markKanaLearned = (type, romaji) => {
    setProgress(prev => {
      const list = prev.kana[type];
      if (list.includes(romaji)) return prev;
      return { ...prev, kana: { ...prev.kana, [type]: [...list, romaji] } };
    });
  };

  const markVocabLearned = (word) => {
    setProgress(prev => {
      if (prev.vocabulary.learned.includes(word)) return prev;
      return { ...prev, vocabulary: { ...prev.vocabulary, learned: [...prev.vocabulary.learned, word] } };
    });
  };

  const markKanjiLearned = (kanjiChar) => {
    setProgress(prev => {
      if (prev.kanji.learned.includes(kanjiChar)) return prev;
      return { ...prev, kanji: { ...prev.kanji, learned: [...prev.kanji.learned, kanjiChar] } };
    });
  };

  const markGrammarLearned = (pattern) => {
    setProgress(prev => {
      if (prev.grammar.learned.includes(pattern)) return prev;
      return { ...prev, grammar: { ...prev.grammar, learned: [...prev.grammar.learned, pattern] } };
    });
  };

  const addQuizResult = (type, score, total, level) => {
    const result = { type, score, total, level, date: new Date().toISOString() };
    setProgress(prev => {
      const key = `${type}-${level}`;
      const currentBest = prev.quiz.bestScores[key] || 0;
      const percentage = Math.round((score / total) * 100);
      return {
        ...prev,
        quiz: {
          history: [...prev.quiz.history.slice(-49), result],
          bestScores: { ...prev.quiz.bestScores, [key]: Math.max(currentBest, percentage) },
        },
      };
    });
  };

  const setCurrentLevel = (level) => {
    setProgress(prev => ({ ...prev, settings: { ...prev.settings, currentLevel: level } }));
  };

  const resetProgress = () => {
    setProgress(defaultProgress);
  };

  return (
    <ProgressContext.Provider value={{
      progress,
      markKanaLearned,
      markVocabLearned,
      markKanjiLearned,
      markGrammarLearned,
      addQuizResult,
      setCurrentLevel,
      resetProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
