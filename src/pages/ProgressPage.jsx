import { useProgress } from '../context/ProgressContext';
import { vocabulary } from '../data/vocabulary';
import { kanji } from '../data/kanji';
import { grammar } from '../data/grammar';
import { hiragana, katakana } from '../data/kana';

function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-label">
        <span>{label}</span>
        <span>{value}/{max} ({pct}%)</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { progress, resetProgress } = useProgress();
  const level = progress.settings.currentLevel;

  const vocabTotal = vocabulary.filter(v => v.level === level).length;
  const vocabLearned = vocabulary.filter(v => v.level === level && progress.vocabulary.learned.includes(v.word)).length;
  const kanjiTotal = kanji.filter(k => k.level === level).length;
  const kanjiLearned = kanji.filter(k => k.level === level && progress.kanji.learned.includes(k.kanji)).length;
  const grammarTotal = grammar.filter(g => g.level === level).length;
  const grammarLearned = grammar.filter(g => g.level === level && progress.grammar.learned.includes(g.pattern)).length;

  const recentQuizzes = [...progress.quiz.history].reverse().slice(0, 10);

  return (
    <div className="progress-page">
      <h1>Progrès — {level}</h1>

      <div className="progress-section">
        <h2>Kana</h2>
        <ProgressBar value={progress.kana.hiragana.length} max={hiragana.length} label="Hiragana" />
        <ProgressBar value={progress.kana.katakana.length} max={katakana.length} label="Katakana" />
      </div>

      <div className="progress-section">
        <h2>Étude {level}</h2>
        <ProgressBar value={vocabLearned} max={vocabTotal} label="Vocabulaire" />
        <ProgressBar value={kanjiLearned} max={kanjiTotal} label="Kanji" />
        <ProgressBar value={grammarLearned} max={grammarTotal} label="Grammaire" />
      </div>

      <div className="progress-section">
        <h2>Meilleurs scores</h2>
        <div className="best-scores">
          {Object.entries(progress.quiz.bestScores).length === 0 ? (
            <p className="empty-message">Aucun quiz complété.</p>
          ) : (
            Object.entries(progress.quiz.bestScores).map(([key, score]) => (
              <div key={key} className="best-score-item">
                <span>{key}</span>
                <span className="best-score-value">{score}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="progress-section">
        <h2>Historique récent</h2>
        {recentQuizzes.length === 0 ? (
          <p className="empty-message">Aucun quiz complété.</p>
        ) : (
          <div className="quiz-history">
            {recentQuizzes.map((q, i) => (
              <div key={i} className="quiz-history-item">
                <span className="quiz-history-type">{q.type} ({q.level})</span>
                <span className="quiz-history-score">{q.score}/{q.total}</span>
                <span className="quiz-history-date">{new Date(q.date).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section">
        <button className="reset-btn" onClick={() => {
          if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ?')) {
            resetProgress();
          }
        }}>
          Réinitialiser la progression
        </button>
      </div>
    </div>
  );
}
