import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { curriculum, getLessonsByLevel } from '../data/curriculum';
import { useProgress } from '../context/ProgressContext';
import { useSRS } from '../context/SRSContext';

function getCompletedLessons() {
  try {
    return JSON.parse(localStorage.getItem('nihongo-completed-lessons') || '[]');
  } catch {
    return [];
  }
}

export default function CurriculumPage() {
  const { progress } = useProgress();
  const { getStats, getDueCards } = useSRS();
  const navigate = useNavigate();
  const [completedLessons, setCompletedLessons] = useState(getCompletedLessons);

  // Re-read on focus
  useEffect(() => {
    const handler = () => setCompletedLessons(getCompletedLessons());
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  // Also refresh when navigating back
  useEffect(() => {
    setCompletedLessons(getCompletedLessons());
  }, []);

  const stats = getStats();
  const dueCards = getDueCards();
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Find next lesson
  const nextLesson = useMemo(() => {
    return curriculum.find(l => !completedLessons.includes(l.id));
  }, [completedLessons]);

  const totalLessons = curriculum.length;
  const completedCount = completedLessons.length;
  const overallPct = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="curriculum-page">
      {/* Hero / CTA */}
      <div className="curriculum-hero">
        <h1>Votre parcours</h1>
        <div className="curriculum-overview">
          <div className="curriculum-progress-ring">
            <span className="curriculum-pct">{overallPct}%</span>
            <span className="curriculum-pct-label">{completedCount}/{totalLessons} leçons</span>
          </div>
        </div>

        <div className="curriculum-cta-group">
          {dueCards.length > 0 && (
            <Link to="/review" className="curriculum-cta review">
              <span className="cta-icon">🔄</span>
              <div>
                <strong>Réviser ({dueCards.length} cartes)</strong>
                <span>Répétition espacée</span>
              </div>
            </Link>
          )}

          {nextLesson && (
            <Link to={`/study/${nextLesson.id}`} className="curriculum-cta study">
              <span className="cta-icon">📖</span>
              <div>
                <strong>Leçon suivante</strong>
                <span>{nextLesson.title}</span>
              </div>
            </Link>
          )}

          {!nextLesson && dueCards.length === 0 && (
            <div className="curriculum-cta complete">
              <span className="cta-icon">🏆</span>
              <div>
                <strong>Parcours terminé !</strong>
                <span>Félicitations, vous avez tout complété.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SRS Stats */}
      {stats.totalCards > 0 && (
        <div className="srs-overview">
          <h2>Statistiques SRS</h2>
          <div className="srs-stats-grid">
            <div className="srs-stat"><span className="srs-stat-num">{stats.totalCards}</span><span>Cartes</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.dueCount}</span><span>À réviser</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.mature}</span><span>Matures (21j+)</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.reviewedToday}</span><span>Aujourd'hui</span></div>
          </div>
        </div>
      )}

      {/* Lessons by level */}
      {levels.map(level => {
        const lessons = getLessonsByLevel(level);
        if (lessons.length === 0) return null;
        const levelCompleted = lessons.filter(l => completedLessons.includes(l.id)).length;
        const levelPct = Math.round((levelCompleted / lessons.length) * 100);

        return (
          <div key={level} className="curriculum-level">
            <div className="curriculum-level-header">
              <h2>{level}</h2>
              <span className="curriculum-level-progress">{levelCompleted}/{lessons.length} — {levelPct}%</span>
            </div>
            <div className="curriculum-lessons">
              {lessons.map((lesson, i) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isNext = nextLesson?.id === lesson.id;
                const prevCompleted = i === 0 || completedLessons.includes(lessons[i - 1].id);
                const isLocked = !isCompleted && !prevCompleted && !isNext;

                return (
                  <div key={lesson.id} className="curriculum-lesson-row">
                    <div className={`lesson-connector ${isCompleted ? 'completed' : ''}`} />
                    <div
                      className={`curriculum-lesson ${isCompleted ? 'completed' : ''} ${isNext ? 'next' : ''} ${isLocked ? 'locked' : ''} ${lesson.isCheckpoint ? 'checkpoint' : ''}`}
                      onClick={() => {
                        if (!isLocked) navigate(`/study/${lesson.id}`);
                      }}
                    >
                      <span className="lesson-number">
                        {isCompleted ? '✓' : isLocked ? '🔒' : lesson.isCheckpoint ? '🏁' : lesson.number}
                      </span>
                      <div className="lesson-info">
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-meta">{lesson.items.length} éléments · {lesson.isCheckpoint ? 'checkpoint' : lesson.phase}</span>
                      </div>
                      {isNext && <span className="lesson-next-badge">Suivante</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
