import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLesson, curriculum } from '../data/curriculum';
import { useSRS } from '../context/SRSContext';
import { useProgress } from '../context/ProgressContext';
import { SpeakButton, useSpeech } from '../hooks/useSpeech';
import { sfxCorrect, sfxWrong, sfxNext, sfxLessonComplete, sfxPerfect, sfxStreak, sfxUnlock } from '../hooks/useSoundEffects';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// === Step components ===

function PresentStep({ items, onNext }) {
  const [idx, setIdx] = useState(0);
  const { speak } = useSpeech();
  const item = items[idx];

  // Auto-speak when card changes
  useEffect(() => {
    const d = item.data;
    const text = d.kana || d.word || d.kanji || '';
    if (text) speak(text, 0.8);
  }, [idx, item]);

  const renderCard = () => {
    const d = item.data;
    const speakText = d.kana || d.word || d.kanji || '';
    if (item.type === 'kana') {
      return (
        <div className="present-card">
          <div className="present-main">{d.kana}</div>
          <SpeakButton text={d.kana} className="speak-btn-large" />
          <div className="present-sub">{d.romaji}</div>
          <div className="present-meta">{d.kanaType} — groupe {d.group}</div>
        </div>
      );
    }
    if (item.type === 'vocabulary') {
      return (
        <div className="present-card">
          <div className="present-main">{d.word}</div>
          <SpeakButton text={d.word} className="speak-btn-large" />
          <div className="present-sub">{d.reading}</div>
          <div className="present-meaning">{d.meaning}</div>
          <div className="present-meta">{d.category}</div>
        </div>
      );
    }
    if (item.type === 'kanji') {
      return (
        <div className="present-card">
          <div className="present-main">{d.kanji}</div>
          <SpeakButton text={d.kanji} className="speak-btn-large" />
          <div className="present-meaning">{d.meaning}</div>
          <div className="present-readings">
            {d.readings.on.length > 0 && <span className="tag on">{d.readings.on.join(', ')}</span>}
            {d.readings.kun.length > 0 && <span className="tag kun">{d.readings.kun.join(', ')}</span>}
          </div>
          <div className="present-meta">{d.strokes} traits</div>
          {d.examples.length > 0 && (
            <div className="present-examples">
              {d.examples.map((ex, i) => <span key={i}>{ex}</span>)}
            </div>
          )}
        </div>
      );
    }
    if (item.type === 'grammar') {
      return (
        <div className="present-card">
          <div className="present-main grammar">{d.pattern}</div>
          <div className="present-meaning">{d.meaning}</div>
          <p className="present-explanation">{d.explanation}</p>
          <div className="present-examples">
            {d.examples.map((ex, i) => {
              const jpPart = ex.split('(')[0].split('（')[0].trim();
              return <span key={i}>{ex} <SpeakButton text={jpPart} className="speak-btn-inline" /></span>;
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="study-step">
      <div className="step-header">
        <span className="step-label">Découvrir</span>
        <span className="step-counter">{idx + 1}/{items.length}</span>
      </div>
      {renderCard()}
      <div className="step-actions">
        {idx > 0 && <button className="step-btn secondary" onClick={() => setIdx(i => i - 1)}>← Précédent</button>}
        {idx < items.length - 1 ? (
          <button className="step-btn primary" onClick={() => setIdx(i => i + 1)}>Suivant →</button>
        ) : (
          <button className="step-btn primary" onClick={onNext}>Passer au quiz →</button>
        )}
      </div>
    </div>
  );
}

function QuizStep({ items, allItemsPool, onNext }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const q = items.map(item => {
      const d = item.data;
      let correct, lessonWrong, globalWrong;

      // Get answer from the correct item
      if (item.type === 'kana') {
        correct = d.romaji;
        // Prioritize distractors from THIS lesson's items
        lessonWrong = items.filter(x => x.type === 'kana' && x.data.romaji !== d.romaji).map(x => x.data.romaji);
        globalWrong = allItemsPool.filter(x => x.type === 'kana' && x.data.romaji !== d.romaji).map(x => x.data.romaji);
      } else if (item.type === 'vocabulary') {
        correct = d.meaning;
        lessonWrong = items.filter(x => x.type === 'vocabulary' && x.data.word !== d.word).map(x => x.data.meaning);
        globalWrong = allItemsPool.filter(x => x.type === 'vocabulary' && x.data.word !== d.word).map(x => x.data.meaning);
      } else if (item.type === 'kanji') {
        correct = d.meaning;
        lessonWrong = items.filter(x => x.type === 'kanji' && x.data.kanji !== d.kanji).map(x => x.data.meaning);
        globalWrong = allItemsPool.filter(x => x.type === 'kanji' && x.data.kanji !== d.kanji).map(x => x.data.meaning);
      } else if (item.type === 'grammar') {
        correct = d.meaning;
        lessonWrong = items.filter(x => x.type === 'grammar' && x.data.pattern !== d.pattern).map(x => x.data.meaning);
        globalWrong = allItemsPool.filter(x => x.type === 'grammar' && x.data.pattern !== d.pattern).map(x => x.data.meaning);
      }

      // Pick distractors: first from lesson, then fill from global pool if needed
      const uniqueLesson = [...new Set(lessonWrong)];
      const uniqueGlobal = [...new Set(globalWrong)].filter(w => !uniqueLesson.includes(w));
      const wrong = shuffleArray(uniqueLesson).slice(0, 3);
      if (wrong.length < 3) {
        wrong.push(...shuffleArray(uniqueGlobal).slice(0, 3 - wrong.length));
      }
      while (wrong.length < 3) wrong.push('—');

      return {
        item,
        question: item.type === 'kana' ? d.kana :
                  item.type === 'vocabulary' ? `${d.word}（${d.reading}）` :
                  item.type === 'kanji' ? d.kanji : d.pattern,
        correct,
        options: shuffleArray([correct, ...wrong]),
      };
    });
    setQuestions(shuffleArray(q));
  }, [items, allItemsPool]);

  if (questions.length === 0) return null;

  if (currentIdx >= questions.length) {
    return (
      <div className="study-step">
        <div className="quiz-result-mini">
          <h3>{score}/{questions.length} bonnes réponses</h3>
          <p>{score === questions.length ? '完璧！' : score >= questions.length * 0.7 ? 'いいね！' : 'もう一度！'}</p>
        </div>
        <button className="step-btn primary" onClick={() => onNext(results)}>
          Continuer →
        </button>
      </div>
    );
  }

  const current = questions[currentIdx];

  const handleAnswer = (option) => {
    if (answered !== null) return;
    setAnswered(option);
    const isCorrect = option === current.correct;
    if (isCorrect) { setScore(s => s + 1); sfxCorrect(); }
    else { sfxWrong(); }
    setResults(prev => [...prev, { item: current.item, correct: isCorrect }]);
  };

  const next = () => {
    setAnswered(null);
    setCurrentIdx(i => i + 1);
    sfxNext();
  };

  return (
    <div className="study-step">
      <div className="step-header">
        <span className="step-label">Quiz</span>
        <span className="step-counter">{currentIdx + 1}/{questions.length}</span>
      </div>
      <div className="quiz-question">
        <h2>{current.question}</h2>
      </div>
      <div className="quiz-options">
        {current.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (answered !== null) {
            if (opt === current.correct) cls += ' correct';
            else if (opt === answered) cls += ' wrong';
          }
          return <button key={i} className={cls} onClick={() => handleAnswer(opt)}>{opt}</button>;
        })}
      </div>
      {answered !== null && (
        <button className="quiz-next-btn" onClick={next}>Suivant →</button>
      )}
    </div>
  );
}

function ProductionStep({ items, onNext }) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);

  const item = items[idx];
  const d = item.data;

  let question, expectedAnswers, hint;
  if (item.type === 'kana') {
    question = d.kana;
    expectedAnswers = [d.romaji];
    hint = 'Tapez le romaji';
  } else if (item.type === 'vocabulary') {
    question = d.meaning;
    expectedAnswers = [d.reading, d.word];
    hint = 'Tapez la lecture en hiragana ou le mot en kanji';
  } else if (item.type === 'kanji') {
    question = `${d.kanji} (${d.meaning})`;
    expectedAnswers = [...d.readings.on, ...d.readings.kun].map(r => r.replace('-', ''));
    hint = 'Tapez une lecture (on\'yomi ou kun\'yomi)';
  } else if (item.type === 'grammar') {
    question = d.meaning;
    expectedAnswers = [d.pattern.replace(/[〜～]/g, '')];
    hint = 'Tapez le pattern grammatical';
  }

  const normalize = (s) => s.trim().toLowerCase().replace(/[〜～\s]/g, '');
  const isCorrect = submitted && expectedAnswers.some(a => normalize(input) === normalize(a));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitted(true);
    const wasCorrect = expectedAnswers.some(a => normalize(input) === normalize(a));
    if (wasCorrect) sfxCorrect(); else sfxWrong();
    setResults(prev => [...prev, { item, correct: wasCorrect }]);
  };

  const next = () => {
    if (idx + 1 >= items.length) {
      onNext(results);
      return;
    }
    setIdx(i => i + 1);
    setInput('');
    setSubmitted(false);
    sfxNext();
  };

  return (
    <div className="study-step">
      <div className="step-header">
        <span className="step-label">Production</span>
        <span className="step-counter">{idx + 1}/{items.length}</span>
      </div>

      <div className="production-card">
        <div className="production-question">{question}</div>
        <p className="production-hint">{hint}</p>

        <form onSubmit={handleSubmit}>
          <input
            className={`production-input ${submitted ? (isCorrect ? 'correct' : 'wrong') : ''}`}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={submitted}
            autoFocus
            placeholder="Votre réponse..."
          />
          {!submitted && <button type="submit" className="step-btn primary">Vérifier</button>}
        </form>

        {submitted && (
          <div className={`production-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? (
              <span>正解！Correct !</span>
            ) : (
              <span>Réponse attendue : <strong>{expectedAnswers[0]}</strong></span>
            )}
          </div>
        )}
      </div>

      {submitted && (
        <button className="step-btn primary" onClick={next}>
          {idx + 1 >= items.length ? 'Continuer →' : 'Suivant →'}
        </button>
      )}
    </div>
  );
}

function ContextStep({ sentencesList, dialogue, onNext }) {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [showTranslation, setShowTranslation] = useState({});

  const hasSentences = sentencesList && sentencesList.length > 0;
  const hasDialogue = dialogue !== null;

  if (!hasSentences && !hasDialogue) {
    return (
      <div className="study-step">
        <div className="step-header">
          <span className="step-label">Contexte</span>
        </div>
        <p className="empty-message">Pas de contenu contextuel pour cette leçon.</p>
        <button className="step-btn primary" onClick={onNext}>Terminer →</button>
      </div>
    );
  }

  return (
    <div className="study-step">
      <div className="step-header">
        <span className="step-label">Contexte</span>
      </div>

      {hasSentences && (
        <div className="context-section">
          <h3>Phrases d'exemple</h3>
          {sentencesList.map((s, i) => (
            <div key={s.id} className="context-sentence" onClick={() => setShowTranslation(prev => ({ ...prev, [s.id]: !prev[s.id] }))}>
              <div className="context-jp">{s.japanese} <SpeakButton text={s.japanese} className="speak-btn-inline" /></div>
              <div className="context-reading">{s.reading}</div>
              {showTranslation[s.id] && <div className="context-translation">{s.translation}</div>}
              {!showTranslation[s.id] && <div className="context-tap">Cliquez pour voir la traduction</div>}
            </div>
          ))}
        </div>
      )}

      {hasDialogue && (
        <div className="context-section">
          <h3>{dialogue.title}</h3>
          <div className="dialogue-container">
            {dialogue.lines.map((line, i) => (
              <div key={i} className={`dialogue-line ${line.speaker === dialogue.lines[0].speaker ? 'speaker-a' : 'speaker-b'}`}>
                <span className="dialogue-speaker">{line.speaker}</span>
                <div className="dialogue-bubble">
                  <div className="dialogue-jp">{line.japanese} <SpeakButton text={line.japanese} className="speak-btn-inline" /></div>
                  <div
                    className="dialogue-translation-toggle"
                    onClick={() => setShowTranslation(prev => ({ ...prev, [`dl-${i}`]: !prev[`dl-${i}`] }))}
                  >
                    {showTranslation[`dl-${i}`] ? line.translation : '▼ Traduction'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="step-btn primary" onClick={onNext}>Terminer la leçon →</button>
    </div>
  );
}

function LessonComplete({ lesson, onGoHome }) {
  return (
    <div className="study-step lesson-complete">
      <div className="lesson-complete-icon">🎉</div>
      <h2>Leçon terminée !</h2>
      <p className="lesson-complete-title">{lesson.title}</p>
      <p className="lesson-complete-summary">
        {lesson.items.length} éléments ajoutés à vos révisions SRS.
      </p>
      <div className="step-actions">
        <button className="step-btn primary" onClick={onGoHome}>Retour au parcours</button>
      </div>
    </div>
  );
}

// === Main component ===

const STEPS = ['present', 'quiz', 'production', 'context', 'complete'];

export default function StudySession() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = getLesson(lessonId);
  const { addCards } = useSRS();
  const { markKanaLearned, markVocabLearned, markKanjiLearned, markGrammarLearned } = useProgress();

  const [step, setStep] = useState(0);

  // Pool for generating wrong answers in quiz
  const allItemsPool = useMemo(() => {
    return curriculum
      .filter(l => l.level === lesson?.level && l.phase === lesson?.phase)
      .flatMap(l => l.items);
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="study-step">
        <h2>Leçon introuvable</h2>
        <Link to="/curriculum" className="step-btn primary">Retour</Link>
      </div>
    );
  }

  const finishLesson = () => {
    // Add all items to SRS
    addCards(lesson.items);

    // Mark items as learned in progress context
    lesson.items.forEach(item => {
      if (item.type === 'kana') markKanaLearned(item.data.kanaType, item.data.romaji);
      if (item.type === 'vocabulary') markVocabLearned(item.data.word);
      if (item.type === 'kanji') markKanjiLearned(item.data.kanji);
      if (item.type === 'grammar') markGrammarLearned(item.data.pattern);
    });

    // Save lesson completion
    const completedKey = 'nihongo-completed-lessons';
    try {
      const completed = JSON.parse(localStorage.getItem(completedKey) || '[]');
      if (!completed.includes(lesson.id)) {
        completed.push(lesson.id);
        localStorage.setItem(completedKey, JSON.stringify(completed));
      }
    } catch { /* ignore */ }

    setStep(STEPS.indexOf('complete'));
    sfxLessonComplete();
  };

  const currentStep = STEPS[step];

  return (
    <div className="study-session">
      <div className="session-progress-bar">
        <div className="session-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <h1 className="session-title">{lesson.title}</h1>

      {currentStep === 'present' && (
        <PresentStep items={lesson.items} onNext={() => setStep(STEPS.indexOf('quiz'))} />
      )}
      {currentStep === 'quiz' && (
        <QuizStep items={lesson.items} allItemsPool={allItemsPool} onNext={() => setStep(STEPS.indexOf('production'))} />
      )}
      {currentStep === 'production' && (
        <ProductionStep items={lesson.items} onNext={() => {
          if (lesson.sentences.length > 0 || lesson.dialogue) {
            setStep(STEPS.indexOf('context'));
          } else {
            finishLesson();
          }
        }} />
      )}
      {currentStep === 'context' && (
        <ContextStep
          sentencesList={lesson.sentences}
          dialogue={lesson.dialogue}
          onNext={finishLesson}
        />
      )}
      {currentStep === 'complete' && (
        <LessonComplete lesson={lesson} onGoHome={() => navigate('/curriculum')} />
      )}
    </div>
  );
}
