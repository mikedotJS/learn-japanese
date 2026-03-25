import { useGamification } from '../context/GamificationContext';

export default function AchievementsPage() {
  const { achievements, unlockedAchievements, levelInfo, levelTitle, totalXP, currentStreak, bestStreak, lessonsCompleted, perfectQuizzes, totalReviews, wordsLearned, kanjiLearned, dailyGoal, setDailyGoal, xpHistory } = useGamification();

  const unlocked = achievements.filter(a => unlockedAchievements.includes(a.id));
  const locked = achievements.filter(a => !unlockedAchievements.includes(a.id));

  return (
    <div className="achievements-page">
      <h1>Succès</h1>

      {/* Stats overview */}
      <div className="achievement-stats">
        <div className="achievement-stat-card hero">
          <span className="stat-big">{levelInfo.level}</span>
          <span className="stat-label">{levelTitle}</span>
          <div className="stat-xp-bar">
            <div className="stat-xp-fill" style={{ width: `${levelInfo.progressPercent}%` }} />
          </div>
          <span className="stat-detail">{levelInfo.currentLevelXP}/{levelInfo.xpForNextLevel} XP</span>
        </div>

        <div className="achievement-stats-grid">
          <div className="achievement-stat-card">
            <span className="stat-icon">✨</span>
            <span className="stat-big">{totalXP}</span>
            <span className="stat-label">XP total</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">🔥</span>
            <span className="stat-big">{currentStreak}</span>
            <span className="stat-label">Streak actuel</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">⭐</span>
            <span className="stat-big">{bestStreak}</span>
            <span className="stat-label">Meilleur streak</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">📚</span>
            <span className="stat-big">{lessonsCompleted}</span>
            <span className="stat-label">Leçons</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">💯</span>
            <span className="stat-big">{perfectQuizzes}</span>
            <span className="stat-label">Quiz parfaits</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">🔄</span>
            <span className="stat-big">{totalReviews}</span>
            <span className="stat-label">Révisions</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">📖</span>
            <span className="stat-big">{wordsLearned}</span>
            <span className="stat-label">Mots appris</span>
          </div>
          <div className="achievement-stat-card">
            <span className="stat-icon">漢</span>
            <span className="stat-big">{kanjiLearned}</span>
            <span className="stat-label">Kanji appris</span>
          </div>
        </div>
      </div>

      {/* Daily goal setting */}
      <div className="daily-goal-setting">
        <h2>Objectif quotidien</h2>
        <div className="goal-options">
          {[20, 30, 50, 100].map(goal => (
            <button
              key={goal}
              className={`goal-btn ${dailyGoal === goal ? 'active' : ''}`}
              onClick={() => setDailyGoal(goal)}
            >
              <span className="goal-xp">{goal} XP</span>
              <span className="goal-label">
                {goal <= 20 ? 'Tranquille' : goal <= 30 ? 'Normal' : goal <= 50 ? 'Sérieux' : 'Intense'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* XP history */}
      {xpHistory.length > 0 && (
        <div className="xp-history-section">
          <h2>Historique XP (30 derniers jours)</h2>
          <div className="xp-history-chart">
            {xpHistory.slice(-14).map(h => {
              const maxXP = Math.max(...xpHistory.map(x => x.xp), dailyGoal);
              const height = Math.max(4, Math.round((h.xp / maxXP) * 100));
              const day = new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2);
              return (
                <div key={h.date} className="xp-history-bar-wrap">
                  <div className={`xp-history-bar ${h.xp >= dailyGoal ? 'goal-met' : ''}`} style={{ height: `${height}%` }}>
                    <span className="xp-history-value">{h.xp}</span>
                  </div>
                  <span className="xp-history-day">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlocked */}
      <div className="achievements-section">
        <h2>Débloqués ({unlocked.length}/{achievements.length})</h2>
        <div className="achievements-grid">
          {unlocked.map(a => (
            <div key={a.id} className="achievement-card unlocked">
              <span className="achievement-icon">{a.icon}</span>
              <span className="achievement-title">{a.title}</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          ))}
          {unlocked.length === 0 && <p className="empty-message">Terminez des leçons pour débloquer des succès !</p>}
        </div>
      </div>

      {/* Locked */}
      <div className="achievements-section">
        <h2>À débloquer</h2>
        <div className="achievements-grid">
          {locked.map(a => (
            <div key={a.id} className="achievement-card locked">
              <span className="achievement-icon">🔒</span>
              <span className="achievement-title">???</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
