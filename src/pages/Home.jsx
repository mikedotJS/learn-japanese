import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useSRS } from '../context/SRSContext';
import { curriculum } from '../data/curriculum';

function getCompletedLessons() {
  try {
    return JSON.parse(localStorage.getItem('nihongo-completed-lessons') || '[]');
  } catch {
    return [];
  }
}

export default function Home() {
  const { progress } = useProgress();
  const { getStats, getDueCards } = useSRS();
  const stats = getStats();
  const dueCards = getDueCards();
  const [completed] = useState(getCompletedLessons);

  const nextLesson = curriculum.find(l => !completed.includes(l.id));
  const completedPct = Math.round((completed.length / curriculum.length) * 100);

  return (
    <div className="home">
      <div className="home-hero">
        <h1>日本語マスター</h1>
        <p>Apprenez le japonais du N5 au N1, guidé pas à pas.</p>
      </div>

      {/* Primary CTAs */}
      <div className="home-cta-section">
        {dueCards.length > 0 && (
          <Link to="/review" className="home-cta-card review">
            <div className="home-cta-left">
              <span className="home-cta-icon">🔄</span>
              <div>
                <h2>Réviser maintenant</h2>
                <p>{dueCards.length} carte{dueCards.length > 1 ? 's' : ''} à réviser</p>
              </div>
            </div>
            <span className="home-cta-arrow">→</span>
          </Link>
        )}

        {nextLesson ? (
          <Link to={`/study/${nextLesson.id}`} className="home-cta-card study">
            <div className="home-cta-left">
              <span className="home-cta-icon">📖</span>
              <div>
                <h2>Prochaine leçon</h2>
                <p>{nextLesson.title}</p>
              </div>
            </div>
            <span className="home-cta-arrow">→</span>
          </Link>
        ) : (
          <div className="home-cta-card complete">
            <div className="home-cta-left">
              <span className="home-cta-icon">🏆</span>
              <div>
                <h2>Parcours terminé !</h2>
                <p>Continuez les révisions pour consolider.</p>
              </div>
            </div>
          </div>
        )}

        <Link to="/curriculum" className="home-cta-card curriculum">
          <div className="home-cta-left">
            <span className="home-cta-icon">🗺️</span>
            <div>
              <h2>Voir le parcours</h2>
              <p>{completedPct}% complété — {completed.length}/{curriculum.length} leçons</p>
            </div>
          </div>
          <span className="home-cta-arrow">→</span>
        </Link>
      </div>

      {/* SRS Stats if any */}
      {stats.totalCards > 0 && (
        <div className="home-stats">
          <h3>Votre mémoire</h3>
          <div className="srs-stats-grid">
            <div className="srs-stat"><span className="srs-stat-num">{stats.totalCards}</span><span>Cartes</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.mature}</span><span>Matures</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.young}</span><span>En cours</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.reviewedToday}</span><span>Aujourd'hui</span></div>
          </div>
        </div>
      )}

      {/* Secondary navigation */}
      <div className="home-secondary">
        <h3>Explorer librement</h3>
        <div className="home-grid">
          <Link to="/kana" className="home-card">
            <div className="home-card-icon">あ</div>
            <h2>Kana</h2>
            <p>Hiragana & Katakana</p>
          </Link>
          <Link to="/vocabulary" className="home-card">
            <div className="home-card-icon">言</div>
            <h2>Vocabulaire</h2>
            <p>Tous les mots par niveau</p>
          </Link>
          <Link to="/kanji" className="home-card">
            <div className="home-card-icon">漢</div>
            <h2>Kanji</h2>
            <p>Tous les kanji par niveau</p>
          </Link>
          <Link to="/grammar" className="home-card">
            <div className="home-card-icon">文</div>
            <h2>Grammaire</h2>
            <p>Points de grammaire</p>
          </Link>
          <Link to="/quiz" className="home-card">
            <div className="home-card-icon">試</div>
            <h2>Quiz</h2>
            <p>Testez-vous librement</p>
          </Link>
          <Link to="/progress" className="home-card">
            <div className="home-card-icon">進</div>
            <h2>Progrès</h2>
            <p>Statistiques détaillées</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
