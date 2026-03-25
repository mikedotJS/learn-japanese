import { useGamification } from '../context/GamificationContext';

export default function XPBar() {
  const { levelInfo, levelTitle, currentStreak, todayXP, dailyGoal } = useGamification();
  const goalPercent = Math.min(100, Math.round((todayXP / dailyGoal) * 100));
  const goalMet = todayXP >= dailyGoal;

  return (
    <div className="xp-bar-widget">
      <div className="xp-bar-top">
        <div className="xp-level">
          <span className="xp-level-number">{levelInfo.level}</span>
          <span className="xp-level-title">{levelTitle}</span>
        </div>
        {currentStreak > 0 && (
          <div className="xp-streak">
            <span className="xp-streak-fire">🔥</span>
            <span>{currentStreak}j</span>
          </div>
        )}
        <div className="xp-today">
          {goalMet ? (
            <span className="xp-today-label goal-met">✓ {todayXP} XP aujourd'hui</span>
          ) : (
            <span className="xp-today-label">{todayXP}/{dailyGoal} XP</span>
          )}
        </div>
      </div>

      <div className="xp-bar-tracks">
        {/* Level progress */}
        <div className="xp-track">
          <div className="xp-track-fill level" style={{ width: `${levelInfo.progressPercent}%` }} />
        </div>
        {/* Daily goal progress */}
        <div className="xp-track daily">
          <div className={`xp-track-fill daily ${goalMet ? 'complete' : ''}`} style={{ width: `${goalPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
