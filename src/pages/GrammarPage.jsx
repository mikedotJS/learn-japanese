import { useState } from 'react';
import { grammar } from '../data/grammar';
import { useProgress } from '../context/ProgressContext';
import { SpeakButton } from '../hooks/useSpeech';

export default function GrammarPage() {
  const { progress, markGrammarLearned } = useProgress();
  const level = progress.settings.currentLevel;
  const [expandedPattern, setExpandedPattern] = useState(null);

  const filtered = grammar.filter(g => g.level === level);
  const learnedCount = filtered.filter(g => progress.grammar.learned.includes(g.pattern)).length;

  return (
    <div className="grammar-page">
      <h1>Grammaire {level}</h1>
      <p className="grammar-stats">{learnedCount}/{filtered.length} points de grammaire appris</p>

      <div className="grammar-list">
        {filtered.map(g => {
          const isLearned = progress.grammar.learned.includes(g.pattern);
          const isExpanded = expandedPattern === g.pattern;
          return (
            <div
              key={g.pattern}
              className={`grammar-card ${isLearned ? 'learned' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedPattern(isExpanded ? null : g.pattern)}
            >
              <div className="grammar-header">
                <span className="grammar-pattern">{g.pattern}</span>
                <span className="grammar-meaning">{g.meaning}</span>
                {isLearned && <span className="learned-badge">✓</span>}
              </div>

              {isExpanded && (
                <div className="grammar-details">
                  <p className="grammar-explanation">{g.explanation}</p>
                  <div className="grammar-examples">
                    <h4>Exemples :</h4>
                    <ul>
                      {g.examples.map((ex, i) => {
                        const jpPart = ex.split('(')[0].split('（')[0].trim();
                        return <li key={i}>{ex} <SpeakButton text={jpPart} className="speak-btn-inline" /></li>;
                      })}
                    </ul>
                  </div>
                  <button
                    className={`learn-btn ${isLearned ? 'learned' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      markGrammarLearned(g.pattern);
                    }}
                  >
                    {isLearned ? '✓ Appris' : 'Marquer comme appris'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
