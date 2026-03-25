import { useState } from 'react';
import { vocabulary, jlptLevels, categories } from '../data/vocabulary';
import { useProgress } from '../context/ProgressContext';
import { SpeakButton } from '../hooks/useSpeech';
import { sfxLearned } from '../hooks/useSoundEffects';

export default function VocabularyPage() {
  const { progress, markVocabLearned } = useProgress();
  const level = progress.settings.currentLevel;
  const [filterCat, setFilterCat] = useState('all');
  const [showLearned, setShowLearned] = useState(true);
  const [expandedWord, setExpandedWord] = useState(null);

  const filtered = vocabulary
    .filter(v => v.level === level)
    .filter(v => filterCat === 'all' || v.category === filterCat)
    .filter(v => showLearned || !progress.vocabulary.learned.includes(v.word));

  const learnedCount = vocabulary
    .filter(v => v.level === level)
    .filter(v => progress.vocabulary.learned.includes(v.word)).length;
  const totalCount = vocabulary.filter(v => v.level === level).length;

  return (
    <div className="vocab-page">
      <h1>Vocabulaire {level}</h1>

      <div className="vocab-controls">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="checkbox-label">
          <input type="checkbox" checked={showLearned} onChange={e => setShowLearned(e.target.checked)} />
          Afficher les mots appris
        </label>

        <span className="vocab-progress">{learnedCount}/{totalCount} appris</span>
      </div>

      <div className="vocab-list">
        {filtered.map(v => {
          const isLearned = progress.vocabulary.learned.includes(v.word);
          const isExpanded = expandedWord === v.word;
          return (
            <div
              key={v.word}
              className={`vocab-card ${isLearned ? 'learned' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedWord(isExpanded ? null : v.word)}
            >
              <div className="vocab-card-header">
                <div className="vocab-word">
                  <span className="vocab-kanji">{v.word}</span>
                  <span className="vocab-reading">{v.reading}</span>
                </div>
                <SpeakButton text={v.word} />
                <div className="vocab-meaning">{v.meaning}</div>
                <span className={`vocab-tag ${v.category}`}>{v.category}</span>
              </div>
              {isExpanded && (
                <div className="vocab-card-details">
                  <button
                    className={`learn-btn ${isLearned ? 'learned' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      markVocabLearned(v.word);
                      sfxLearned();
                    }}
                  >
                    {isLearned ? '✓ Appris' : 'Marquer comme appris'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="empty-message">Aucun mot trouvé pour ces filtres.</p>
        )}
      </div>
    </div>
  );
}
