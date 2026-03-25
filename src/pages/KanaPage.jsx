import { useState } from 'react';
import { hiragana, katakana, kanaGroups } from '../data/kana';
import { useProgress } from '../context/ProgressContext';

export default function KanaPage() {
  const [type, setType] = useState('hiragana');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [flipped, setFlipped] = useState({});
  const { progress, markKanaLearned } = useProgress();

  const data = type === 'hiragana' ? hiragana : katakana;
  const filtered = selectedGroup === 'all' ? data : data.filter(k => k.group === selectedGroup);
  const learnedList = progress.kana[type];

  const toggleFlip = (romaji) => {
    setFlipped(prev => ({ ...prev, [romaji]: !prev[romaji] }));
    markKanaLearned(type, romaji);
  };

  return (
    <div className="kana-page">
      <h1>{type === 'hiragana' ? 'Hiragana ひらがな' : 'Katakana カタカナ'}</h1>

      <div className="kana-controls">
        <div className="toggle-group">
          <button className={type === 'hiragana' ? 'active' : ''} onClick={() => { setType('hiragana'); setFlipped({}); }}>
            Hiragana
          </button>
          <button className={type === 'katakana' ? 'active' : ''} onClick={() => { setType('katakana'); setFlipped({}); }}>
            Katakana
          </button>
        </div>

        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
          <option value="all">Tous les groupes</option>
          {kanaGroups.map(g => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>

        <span className="kana-progress">
          {learnedList.length}/{data.length} appris
        </span>
      </div>

      <div className="kana-grid">
        {filtered.map(k => {
          const isLearned = learnedList.includes(k.romaji);
          const isFlipped = flipped[k.romaji];
          return (
            <div
              key={k.romaji}
              className={`kana-card ${isFlipped ? 'flipped' : ''} ${isLearned ? 'learned' : ''}`}
              onClick={() => toggleFlip(k.romaji)}
            >
              <div className="kana-card-front">
                <span className="kana-char">{k.kana}</span>
              </div>
              <div className="kana-card-back">
                <span className="kana-romaji">{k.romaji}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
