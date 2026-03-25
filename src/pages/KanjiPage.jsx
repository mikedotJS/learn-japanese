import { useState } from 'react';
import { kanji } from '../data/kanji';
import { useProgress } from '../context/ProgressContext';
import { SpeakButton } from '../hooks/useSpeech';
import { sfxLearned, sfxTap } from '../hooks/useSoundEffects';

export default function KanjiPage() {
  const { progress, markKanjiLearned } = useProgress();
  const level = progress.settings.currentLevel;
  const [selectedKanji, setSelectedKanji] = useState(null);

  const filtered = kanji.filter(k => k.level === level);
  const learnedCount = filtered.filter(k => progress.kanji.learned.includes(k.kanji)).length;

  return (
    <div className="kanji-page">
      <h1>Kanji {level}</h1>
      <p className="kanji-stats">{learnedCount}/{filtered.length} kanji appris</p>

      <div className="kanji-grid">
        {filtered.map(k => {
          const isLearned = progress.kanji.learned.includes(k.kanji);
          return (
            <div
              key={k.kanji}
              className={`kanji-card ${isLearned ? 'learned' : ''} ${selectedKanji?.kanji === k.kanji ? 'selected' : ''}`}
              onClick={() => { setSelectedKanji(selectedKanji?.kanji === k.kanji ? null : k); sfxTap(); }}
            >
              <span className="kanji-char">{k.kanji}</span>
              <span className="kanji-meaning-short">{k.meaning}</span>
            </div>
          );
        })}
      </div>

      {selectedKanji && (
        <div className="kanji-detail">
          <div className="kanji-detail-header">
            <span className="kanji-detail-char">{selectedKanji.kanji}</span>
            <div>
              <h2>{selectedKanji.meaning}</h2>
              <p>{selectedKanji.strokes} traits</p>
            </div>
            <SpeakButton text={selectedKanji.kanji} className="speak-btn-large" />
          </div>

          <div className="kanji-readings">
            <div>
              <h3>Lecture On&apos;yomi (音読み)</h3>
              <div className="reading-tags">
                {selectedKanji.readings.on.map(r => <span key={r} className="tag on">{r}</span>)}
                {selectedKanji.readings.on.length === 0 && <span className="tag empty">—</span>}
              </div>
            </div>
            <div>
              <h3>Lecture Kun&apos;yomi (訓読み)</h3>
              <div className="reading-tags">
                {selectedKanji.readings.kun.map(r => <span key={r} className="tag kun">{r}</span>)}
                {selectedKanji.readings.kun.length === 0 && <span className="tag empty">—</span>}
              </div>
            </div>
          </div>

          <div className="kanji-examples">
            <h3>Exemples</h3>
            <ul>
              {selectedKanji.examples.map(ex => {
                const word = ex.split('（')[0];
                return <li key={ex}>{ex} <SpeakButton text={word} className="speak-btn-inline" /></li>;
              })}
            </ul>
          </div>

          <button
            className={`learn-btn ${progress.kanji.learned.includes(selectedKanji.kanji) ? 'learned' : ''}`}
            onClick={() => { markKanjiLearned(selectedKanji.kanji); sfxLearned(); }}
          >
            {progress.kanji.learned.includes(selectedKanji.kanji) ? '✓ Appris' : 'Marquer comme appris'}
          </button>
        </div>
      )}
    </div>
  );
}
