import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';

const GamificationContext = createContext();
const STORAGE_KEY = 'nihongo-gamification';

// XP rewards
const XP_REWARDS = {
  lessonComplete: 20,
  quizCorrect: 5,
  quizPerfect: 25, // bonus for 100%
  reviewCard: 3,
  reviewCorrect: 5,
  markLearned: 2,
  streakBonus: 10, // per day of streak
  firstLessonOfDay: 15,
};

// Level thresholds: level N requires this much total XP
function getLevelInfo(totalXP) {
  // Each level requires progressively more XP
  // Level 1: 0, Level 2: 50, Level 3: 120, Level 4: 210, ...
  // Formula: XP needed for level N = 50 + (N-2) * 20 (for N >= 2)
  let level = 1;
  let xpForNext = 50;
  let accumulated = 0;

  while (totalXP >= accumulated + xpForNext) {
    accumulated += xpForNext;
    level++;
    xpForNext = 50 + (level - 1) * 20;
  }

  return {
    level,
    currentLevelXP: totalXP - accumulated,
    xpForNextLevel: xpForNext,
    totalXP,
    progressPercent: Math.round(((totalXP - accumulated) / xpForNext) * 100),
  };
}

// Level titles
function getLevelTitle(level) {
  if (level <= 3) return 'Débutant';
  if (level <= 7) return 'Apprenti';
  if (level <= 12) return 'Intermédiaire';
  if (level <= 18) return 'Avancé';
  if (level <= 25) return 'Expert';
  if (level <= 35) return 'Maître';
  return 'Sensei';
}

// Achievements
const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '🎯', title: 'Premier pas', desc: 'Terminer sa première leçon', condition: (s) => s.lessonsCompleted >= 1 },
  { id: 'five_lessons', icon: '📚', title: 'Studieux', desc: 'Terminer 5 leçons', condition: (s) => s.lessonsCompleted >= 5 },
  { id: 'ten_lessons', icon: '🎓', title: 'Assidu', desc: 'Terminer 10 leçons', condition: (s) => s.lessonsCompleted >= 10 },
  { id: 'fifty_lessons', icon: '🏫', title: 'Érudit', desc: 'Terminer 50 leçons', condition: (s) => s.lessonsCompleted >= 50 },
  { id: 'hundred_lessons', icon: '🏆', title: 'Centurion', desc: 'Terminer 100 leçons', condition: (s) => s.lessonsCompleted >= 100 },
  { id: 'streak_3', icon: '🔥', title: 'En feu', desc: '3 jours de streak', condition: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', icon: '💪', title: 'Semaine parfaite', desc: '7 jours de streak', condition: (s) => s.bestStreak >= 7 },
  { id: 'streak_30', icon: '⭐', title: 'Marathonien', desc: '30 jours de streak', condition: (s) => s.bestStreak >= 30 },
  { id: 'streak_100', icon: '💎', title: 'Diamant', desc: '100 jours de streak', condition: (s) => s.bestStreak >= 100 },
  { id: 'perfect_quiz', icon: '💯', title: 'Perfection', desc: 'Score parfait à un quiz', condition: (s) => s.perfectQuizzes >= 1 },
  { id: 'ten_perfect', icon: '🌟', title: 'Sans faute', desc: '10 quiz parfaits', condition: (s) => s.perfectQuizzes >= 10 },
  { id: 'xp_100', icon: '✨', title: 'Cent XP', desc: 'Accumuler 100 XP', condition: (s) => s.totalXP >= 100 },
  { id: 'xp_500', icon: '🚀', title: 'Décollage', desc: 'Accumuler 500 XP', condition: (s) => s.totalXP >= 500 },
  { id: 'xp_1000', icon: '🌙', title: 'Millénaire', desc: 'Accumuler 1000 XP', condition: (s) => s.totalXP >= 1000 },
  { id: 'xp_5000', icon: '☀️', title: 'Solaire', desc: 'Accumuler 5000 XP', condition: (s) => s.totalXP >= 5000 },
  { id: 'reviews_50', icon: '🔄', title: 'Réviseur', desc: '50 cartes révisées', condition: (s) => s.totalReviews >= 50 },
  { id: 'reviews_500', icon: '🧠', title: 'Mémoire vive', desc: '500 cartes révisées', condition: (s) => s.totalReviews >= 500 },
  { id: 'vocab_100', icon: '📖', title: 'Lecteur', desc: 'Apprendre 100 mots', condition: (s) => s.wordsLearned >= 100 },
  { id: 'vocab_500', icon: '📕', title: 'Bibliothèque', desc: 'Apprendre 500 mots', condition: (s) => s.wordsLearned >= 500 },
  { id: 'kanji_50', icon: '漢', title: 'Calligraphe', desc: 'Apprendre 50 kanji', condition: (s) => s.kanjiLearned >= 50 },
  { id: 'kanji_200', icon: '字', title: 'Écriture sacrée', desc: 'Apprendre 200 kanji', condition: (s) => s.kanjiLearned >= 200 },
  { id: 'level_5', icon: '🎖️', title: 'Niveau 5', desc: 'Atteindre le niveau 5', condition: (s) => getLevelInfo(s.totalXP).level >= 5 },
  { id: 'level_10', icon: '🏅', title: 'Niveau 10', desc: 'Atteindre le niveau 10', condition: (s) => getLevelInfo(s.totalXP).level >= 10 },
  { id: 'level_25', icon: '👑', title: 'Niveau 25', desc: 'Atteindre le niveau 25', condition: (s) => getLevelInfo(s.totalXP).level >= 25 },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

const defaultState = {
  totalXP: 0,
  todayXP: 0,
  todayDate: getToday(),
  dailyGoal: 30, // XP per day
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  lessonsCompleted: 0,
  perfectQuizzes: 0,
  totalReviews: 0,
  wordsLearned: 0,
  kanjiLearned: 0,
  unlockedAchievements: [],
  xpHistory: [], // [{date, xp}]
};

export function GamificationProvider({ children }) {
  const [state, setState] = usePersistedState(STORAGE_KEY, defaultState);

  // Reset today XP when the stored date is stale. Re-runs on every todayDate
  // change so the hydration from the persisted store (which may land with an
  // older date than the mount-time default) is handled correctly. A
  // visibilitychange listener covers the case where the tab stays open past
  // midnight — returning to the tab picks up the new day.
  useEffect(() => {
    const resetIfStale = () => {
      setState(prev => {
        if (!prev.todayDate) return prev;
        const today = getToday();
        if (prev.todayDate === today) return prev;
        return { ...prev, todayXP: 0, todayDate: today };
      });
    };
    resetIfStale();
    const onVisible = () => {
      if (document.visibilityState === 'visible') resetIfStale();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [setState, state.todayDate]);

  // XP notification queue
  const [notifications, setNotifications] = useState([]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [...prev, { ...notif, id: Date.now() + Math.random() }]);
  }, []);

  const checkAchievements = useCallback((newState) => {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(a => {
      if (!newState.unlockedAchievements.includes(a.id) && a.condition(newState)) {
        newlyUnlocked.push(a);
      }
    });

    if (newlyUnlocked.length > 0) {
      newState.unlockedAchievements = [
        ...newState.unlockedAchievements,
        ...newlyUnlocked.map(a => a.id),
      ];
      newlyUnlocked.forEach(a => {
        addNotification({ type: 'achievement', icon: a.icon, text: a.title });
      });
    }

    return newState;
  }, [addNotification]);

  const updateStreak = useCallback((s) => {
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (s.lastActiveDate === today) {
      // Already active today, no streak change
      return s;
    } else if (s.lastActiveDate === yesterdayStr) {
      // Consecutive day
      s.currentStreak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
      s.lastActiveDate = today;
      if (s.currentStreak > 1) {
        addNotification({ type: 'streak', icon: '🔥', text: `${s.currentStreak} jours !` });
      }
    } else if (s.lastActiveDate === null) {
      // First time
      s.currentStreak = 1;
      s.bestStreak = Math.max(s.bestStreak, 1);
      s.lastActiveDate = today;
    } else {
      // Streak broken
      s.currentStreak = 1;
      s.lastActiveDate = today;
    }

    return s;
  }, [addNotification]);

  const awardXP = useCallback((amount, reason) => {
    setState(prev => {
      const today = getToday();
      let s = { ...prev };

      // Reset daily if new day
      if (s.todayDate !== today) {
        s.todayXP = 0;
        s.todayDate = today;
      }

      // First action of the day bonus
      const isFirstToday = s.todayXP === 0;

      s.totalXP += amount;
      s.todayXP += amount;

      // Update streak
      s = updateStreak(s);

      // First lesson of day bonus
      if (isFirstToday && amount > 0) {
        s.totalXP += XP_REWARDS.firstLessonOfDay;
        s.todayXP += XP_REWARDS.firstLessonOfDay;
        addNotification({ type: 'xp', icon: '☀️', text: `+${XP_REWARDS.firstLessonOfDay} XP bonus du jour !` });
      }

      // Check level up
      const oldLevel = getLevelInfo(prev.totalXP).level;
      const newLevel = getLevelInfo(s.totalXP).level;
      if (newLevel > oldLevel) {
        addNotification({ type: 'levelup', icon: '⬆️', text: `Niveau ${newLevel} !` });
      }

      // XP notification
      addNotification({ type: 'xp', icon: '✨', text: `+${amount} XP` });

      // Update history
      const historyEntry = s.xpHistory.find(h => h.date === today);
      if (historyEntry) {
        historyEntry.xp += amount;
      } else {
        s.xpHistory = [...s.xpHistory.slice(-29), { date: today, xp: amount }];
      }

      // Check achievements
      s = checkAchievements(s);

      // Check daily goal
      const oldGoalMet = prev.todayXP >= prev.dailyGoal;
      const newGoalMet = s.todayXP >= s.dailyGoal;
      if (!oldGoalMet && newGoalMet) {
        addNotification({ type: 'goal', icon: '🎯', text: 'Objectif du jour atteint !' });
      }

      return s;
    });
  }, [updateStreak, checkAchievements, addNotification]);

  const recordLessonComplete = useCallback(() => {
    setState(prev => {
      const s = { ...prev, lessonsCompleted: prev.lessonsCompleted + 1 };
      return checkAchievements(s);
    });
    awardXP(XP_REWARDS.lessonComplete, 'lesson');
  }, [awardXP, checkAchievements]);

  const recordPerfectQuiz = useCallback(() => {
    setState(prev => {
      const s = { ...prev, perfectQuizzes: prev.perfectQuizzes + 1 };
      return checkAchievements(s);
    });
    awardXP(XP_REWARDS.quizPerfect, 'perfect');
  }, [awardXP, checkAchievements]);

  const recordReview = useCallback((wasCorrect) => {
    setState(prev => {
      const s = { ...prev, totalReviews: prev.totalReviews + 1 };
      return checkAchievements(s);
    });
    awardXP(wasCorrect ? XP_REWARDS.reviewCorrect : XP_REWARDS.reviewCard, 'review');
  }, [awardXP, checkAchievements]);

  const recordWordLearned = useCallback(() => {
    setState(prev => {
      const s = { ...prev, wordsLearned: prev.wordsLearned + 1 };
      return checkAchievements(s);
    });
    awardXP(XP_REWARDS.markLearned, 'learn');
  }, [awardXP, checkAchievements]);

  const recordKanjiLearned = useCallback(() => {
    setState(prev => {
      const s = { ...prev, kanjiLearned: prev.kanjiLearned + 1 };
      return checkAchievements(s);
    });
    awardXP(XP_REWARDS.markLearned, 'learn');
  }, [awardXP, checkAchievements]);

  const setDailyGoal = useCallback((goal) => {
    setState(prev => ({ ...prev, dailyGoal: goal }));
  }, []);

  const levelInfo = getLevelInfo(state.totalXP);
  const levelTitle = getLevelTitle(levelInfo.level);

  return (
    <GamificationContext.Provider value={{
      ...state,
      levelInfo,
      levelTitle,
      notifications,
      achievements: ACHIEVEMENTS,
      XP_REWARDS,
      awardXP,
      recordLessonComplete,
      recordPerfectQuiz,
      recordReview,
      recordWordLearned,
      recordKanjiLearned,
      setDailyGoal,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
