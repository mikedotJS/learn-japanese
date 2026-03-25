import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSRS } from '../context/SRSContext';
import { SpeakButton, useSpeech } from '../hooks/useSpeech';
import { sfxCorrect, sfxWrong, sfxRate, sfxLessonComplete, sfxPerfect } from '../hooks/useSoundEffects';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ReviewCard({ card, allCards, onReview }) {
  const [mode, setMode] = useState(null);
  const [answered, setAnswered] = useState(null);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [options, setOptions] = useState([]);
  const { speak } = useSpeech();

  const d = card.data;
  const type = card.type;

  // Question display
  let questionDisplay;
  if (type === 'kana') questionDisplay = d.kana;
  else if (type === 'vocabulary') questionDisplay = `${d.word}（${d.reading}）`;
  else if (type === 'kanji') questionDisplay = d.kanji;
  else if (type === 'grammar') questionDisplay = d.pattern;

  // Correct answer(s)
  let correctAnswer;
  let allCorrectAnswers;
  if (type === 'kana') {
    correctAnswer = d.romaji;
    allCorrectAnswers = [d.romaji];
  } else if (type === 'vocabulary') {
    correctAnswer = d.meaning;
    allCorrectAnswers = [d.meaning, d.reading, d.word];
  } else if (type === 'kanji') {
    correctAnswer = d.meaning;
    allCorrectAnswers = [d.meaning, ...d.readings.on, ...d.readings.kun.map(r => r.replace('-', ''))];
  } else if (type === 'grammar') {
    correctAnswer = d.meaning;
    allCorrectAnswers = [d.meaning, d.pattern.replace(/[〜～]/g, '')];
  }

  useEffect(() => {
    // Generate QCM options
    const sameType = allCards.filter(c => c.type === type && c.id !== card.id);
    let wrongAnswers;
    if (type === 'kana') wrongAnswers = sameType.map(c => c.data.romaji);
    else if (type === 'vocabulary') wrongAnswers = sameType.map(c => c.data.meaning);
    else if (type === 'kanji') wrongAnswers = sameType.map(c => c.data.meaning);
    else wrongAnswers = sameType.map(c => c.data.meaning);

    const wrong = shuffleArray([...new Set(wrongAnswers)]).slice(0, 3);
    while (wrong.length < 3) wrong.push('—');
    setOptions(shuffleArray([correctAnswer, ...wrong]));
  }, [card]);

  const normalize = (s) => s.trim().toLowerCase().replace(/[〜～\s-]/g, '');

  const handleRecognitionAnswer = (option) => {
    if (answered !== null) return;
    setAnswered(option);
    if (option === correctAnswer) sfxCorrect(); else sfxWrong();
  };

  const handleProductionSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;
    setSubmitted(true);
    const correct = allCorrectAnswers.some(a => normalize(input) === normalize(a));
    if (correct) sfxCorrect(); else sfxWrong();
  };

  const isProductionCorrect = submitted && allCorrectAnswers.some(a => normalize(input) === normalize(a));
  const isRecognitionCorrect = answered === correctAnswer;

  const getQuality = () => {
    if (mode === 'recognition') {
      return isRecognitionCorrect ? 4 : 1;
    } else {
      return isProductionCorrect ? 5 : 1; // Production is harder, so correct = 5
    }
  };

  const showResult = (mode === 'recognition' && answered !== null) || (mode === 'production' && submitted);

  // Auto-select mode: alternate, prefer production for mature cards
  useEffect(() => {
    if (card.interval >= 7) {
      setMode('production');
    } else if (card.repetitions === 0) {
      setMode('recognition');
    } else {
      setMode(Math.random() > 0.5 ? 'production' : 'recognition');
    }
    setAnswered(null);
    setInput('');
    setSubmitted(false);

    // Only auto-speak in production mode (recognition = it would spoil the answer)
  }, [card]);

  return (
    <div className="review-card-container">
      <div className="review-type-badge">{type}</div>

      <div className="review-question">
        <h2>{questionDisplay}</h2>
        {showResult && <SpeakButton text={d.kana || d.word || d.kanji || ''} className="speak-btn-large" />}
      </div>

      {mode === 'recognition' && (
        <div className="quiz-options">
          {options.map((opt, i) => {
            let cls = 'quiz-option';
            if (answered !== null) {
              if (opt === correctAnswer) cls += ' correct';
              else if (opt === answered) cls += ' wrong';
            }
            return <button key={i} className={cls} onClick={() => handleRecognitionAnswer(opt)}>{opt}</button>;
          })}
        </div>
      )}

      {mode === 'production' && (
        <form onSubmit={handleProductionSubmit} className="production-form">
          <input
            className={`production-input ${submitted ? (isProductionCorrect ? 'correct' : 'wrong') : ''}`}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={submitted}
            autoFocus
            placeholder="Votre réponse..."
          />
          {!submitted && <button type="submit" className="step-btn primary">Vérifier</button>}
          {submitted && !isProductionCorrect && (
            <div className="production-feedback wrong">
              Réponse attendue : <strong>{correctAnswer}</strong>
            </div>
          )}
          {submitted && isProductionCorrect && (
            <div className="production-feedback correct">正解！Correct !</div>
          )}
        </form>
      )}

      {showResult && (
        <div className="review-rating">
          <p className="review-rating-label">Comment c'était ?</p>
          <div className="review-rating-buttons">
            <button className="rating-btn hard" onClick={() => { sfxRate(); onReview(card.id, 1); }}>
              Pas su
            </button>
            <button className="rating-btn ok" onClick={() => { sfxRate(); onReview(card.id, 3); }}>
              Difficile
            </button>
            <button className="rating-btn good" onClick={() => { sfxRate(); onReview(card.id, 4); }}>
              Bien
            </button>
            <button className="rating-btn easy" onClick={() => { sfxRate(); onReview(card.id, 5); }}>
              Facile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { getDueCards, reviewCard, getStats, cards } = useSRS();
  const [dueCards, setDueCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const due = getDueCards(null, 20);
    setDueCards(due);
    setCurrentIdx(0);
    setFinished(false);
    setSessionStats({ reviewed: 0, correct: 0 });
  }, []);

  const stats = getStats();

  const handleReview = (cardId, quality) => {
    reviewCard(cardId, quality);
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0),
    }));

    if (currentIdx + 1 >= dueCards.length) {
      setFinished(true);
      sfxLessonComplete();
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  if (dueCards.length === 0 && !finished) {
    return (
      <div className="review-page">
        <h1>Révisions</h1>
        <div className="review-empty">
          <div className="review-empty-icon">🎌</div>
          <h2>Aucune carte à réviser !</h2>
          <p>Toutes vos cartes sont à jour. Revenez plus tard ou étudiez de nouvelles leçons.</p>
          <div className="srs-stats-grid">
            <div className="srs-stat"><span className="srs-stat-num">{stats.totalCards}</span><span>Total</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.mature}</span><span>Matures</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.young}</span><span>En cours</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.reviewedToday}</span><span>Révisées aujourd'hui</span></div>
          </div>
          <Link to="/curriculum" className="step-btn primary">Continuer le parcours</Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;
    return (
      <div className="review-page">
        <h1>Révisions terminées</h1>
        <div className="review-complete">
          <div className="review-empty-icon">✨</div>
          <div className="quiz-score-display">
            <span className="quiz-score-number">{pct}%</span>
            <span className="quiz-score-detail">{sessionStats.correct}/{sessionStats.reviewed} réussies</span>
          </div>
          <div className="srs-stats-grid">
            <div className="srs-stat"><span className="srs-stat-num">{stats.totalCards}</span><span>Total</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.dueCount}</span><span>Encore dues</span></div>
            <div className="srs-stat"><span className="srs-stat-num">{stats.mature}</span><span>Matures</span></div>
          </div>
          <div className="step-actions">
            {stats.dueCount > 0 && (
              <button className="step-btn primary" onClick={() => {
                setDueCards(getDueCards(null, 20));
                setCurrentIdx(0);
                setFinished(false);
                setSessionStats({ reviewed: 0, correct: 0 });
              }}>Continuer les révisions</button>
            )}
            <Link to="/curriculum" className="step-btn secondary">Retour au parcours</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-header">
        <h1>Révisions</h1>
        <span className="review-counter">{currentIdx + 1}/{dueCards.length}</span>
        <span className="review-due-badge">{stats.dueCount} dues au total</span>
      </div>

      <ReviewCard
        key={dueCards[currentIdx].id}
        card={dueCards[currentIdx]}
        allCards={cards}
        onReview={handleReview}
      />
    </div>
  );
}
