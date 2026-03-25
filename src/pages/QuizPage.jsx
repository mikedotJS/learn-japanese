import { useState, useMemo, useCallback } from 'react';
import { vocabulary } from '../data/vocabulary';
import { kanji } from '../data/kanji';
import { hiragana, katakana } from '../data/kana';
import { grammar } from '../data/grammar';
import { useProgress } from '../context/ProgressContext';
import { sfxCorrect, sfxWrong, sfxNext, sfxPerfect, sfxLessonComplete } from '../hooks/useSoundEffects';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(type, level) {
  let questions = [];

  if (type === 'kana') {
    const all = [...hiragana, ...katakana];
    const shuffled = shuffleArray(all).slice(0, 10);
    questions = shuffled.map(k => {
      const others = all.filter(x => x.romaji !== k.romaji);
      const wrongAnswers = shuffleArray(others).slice(0, 3).map(x => x.romaji);
      return {
        question: k.kana,
        correct: k.romaji,
        options: shuffleArray([k.romaji, ...wrongAnswers]),
        type: 'kana',
      };
    });
  } else if (type === 'vocabulary') {
    const pool = vocabulary.filter(v => v.level === level);
    if (pool.length < 4) return [];
    const shuffled = shuffleArray(pool).slice(0, 10);
    questions = shuffled.map(v => {
      const others = pool.filter(x => x.word !== v.word);
      const wrongAnswers = shuffleArray(others).slice(0, 3).map(x => x.meaning);
      return {
        question: `${v.word}（${v.reading}）`,
        correct: v.meaning,
        options: shuffleArray([v.meaning, ...wrongAnswers]),
        type: 'vocabulary',
      };
    });
  } else if (type === 'kanji') {
    const pool = kanji.filter(k => k.level === level);
    if (pool.length < 4) return [];
    const shuffled = shuffleArray(pool).slice(0, 10);
    questions = shuffled.map(k => {
      const others = pool.filter(x => x.kanji !== k.kanji);
      const wrongAnswers = shuffleArray(others).slice(0, 3).map(x => x.meaning);
      return {
        question: k.kanji,
        correct: k.meaning,
        options: shuffleArray([k.meaning, ...wrongAnswers]),
        type: 'kanji',
      };
    });
  } else if (type === 'grammar') {
    const pool = grammar.filter(g => g.level === level);
    if (pool.length < 4) return [];
    const shuffled = shuffleArray(pool).slice(0, 10);
    questions = shuffled.map(g => {
      const others = pool.filter(x => x.pattern !== g.pattern);
      const wrongAnswers = shuffleArray(others).slice(0, 3).map(x => x.meaning);
      return {
        question: g.pattern,
        correct: g.meaning,
        options: shuffleArray([g.meaning, ...wrongAnswers]),
        type: 'grammar',
      };
    });
  }

  return questions;
}

export default function QuizPage() {
  const { progress, addQuizResult } = useProgress();
  const level = progress.settings.currentLevel;

  const [quizType, setQuizType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [finished, setFinished] = useState(false);

  const startQuiz = (type) => {
    const q = generateQuestions(type, level);
    if (q.length === 0) return;
    setQuizType(type);
    setQuestions(q);
    setCurrentIdx(0);
    setScore(0);
    setAnswered(null);
    setFinished(false);
  };

  const handleAnswer = (option) => {
    if (answered !== null) return;
    setAnswered(option);
    if (option === questions[currentIdx].correct) {
      setScore(s => s + 1);
      sfxCorrect();
    } else {
      sfxWrong();
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
      addQuizResult(quizType, score, questions.length, level);
      const pct = Math.round((score / questions.length) * 100);
      if (pct === 100) sfxPerfect();
      else sfxLessonComplete();
    } else {
      setCurrentIdx(i => i + 1);
      setAnswered(null);
      sfxNext();
    }
  };

  if (!quizType) {
    return (
      <div className="quiz-page">
        <h1>Quiz</h1>
        <p>Choisissez un type de quiz pour tester vos connaissances.</p>
        <div className="quiz-type-grid">
          <button className="quiz-type-btn" onClick={() => startQuiz('kana')}>
            <span className="quiz-type-icon">あ</span>
            <span>Kana</span>
          </button>
          <button className="quiz-type-btn" onClick={() => startQuiz('vocabulary')}>
            <span className="quiz-type-icon">言</span>
            <span>Vocabulaire {level}</span>
          </button>
          <button className="quiz-type-btn" onClick={() => startQuiz('kanji')}>
            <span className="quiz-type-icon">漢</span>
            <span>Kanji {level}</span>
          </button>
          <button className="quiz-type-btn" onClick={() => startQuiz('grammar')}>
            <span className="quiz-type-icon">文</span>
            <span>Grammaire {level}</span>
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-page">
        <div className="quiz-result">
          <h1>Résultat</h1>
          <div className="quiz-score-display">
            <span className="quiz-score-number">{percentage}%</span>
            <span className="quiz-score-detail">{score}/{questions.length} bonnes réponses</span>
          </div>
          <p className="quiz-score-message">
            {percentage === 100 ? '完璧！Parfait !' :
             percentage >= 80 ? 'すごい！Excellent !' :
             percentage >= 60 ? 'いいね！Pas mal !' :
             'もっと頑張って！Continuez à étudier !'}
          </p>
          <div className="quiz-result-actions">
            <button onClick={() => startQuiz(quizType)}>Recommencer</button>
            <button onClick={() => setQuizType(null)}>Autre quiz</button>
          </div>
        </div>
      </div>
    );
  }

  const current = questions[currentIdx];

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <span>Question {currentIdx + 1}/{questions.length}</span>
        <span>Score : {score}</span>
      </div>

      <div className="quiz-question">
        <h2>{current.question}</h2>
      </div>

      <div className="quiz-options">
        {current.options.map((option, i) => {
          let className = 'quiz-option';
          if (answered !== null) {
            if (option === current.correct) className += ' correct';
            else if (option === answered) className += ' wrong';
          }
          return (
            <button key={i} className={className} onClick={() => handleAnswer(option)}>
              {option}
            </button>
          );
        })}
      </div>

      {answered !== null && (
        <button className="quiz-next-btn" onClick={nextQuestion}>
          {currentIdx + 1 >= questions.length ? 'Voir le résultat' : 'Question suivante →'}
        </button>
      )}
    </div>
  );
}
