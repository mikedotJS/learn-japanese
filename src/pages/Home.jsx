import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { vocabulary } from '../data/vocabulary';
import { kanji } from '../data/kanji';
import { grammar } from '../data/grammar';
import { hiragana, katakana } from '../data/kana';

export default function Home() {
  const { progress } = useProgress();
  const level = progress.settings.currentLevel;

  const vocabCount = vocabulary.filter(v => v.level === level).length;
  const kanjiCount = kanji.filter(k => k.level === level).length;
  const grammarCount = grammar.filter(g => g.level === level).length;

  const vocabLearned = vocabulary.filter(v => v.level === level && progress.vocabulary.learned.includes(v.word)).length;
  const kanjiLearned = kanji.filter(k => k.level === level && progress.kanji.learned.includes(k.kanji)).length;
  const grammarLearned = grammar.filter(g => g.level === level && progress.grammar.learned.includes(g.pattern)).length;

  const modules = [
    { path: '/kana', icon: 'あ', title: 'Kana', desc: 'Hiragana & Katakana', stat: `${progress.kana.hiragana.length}/${hiragana.length} hiragana` },
    { path: '/vocabulary', icon: '言', title: 'Vocabulaire', desc: `Mots ${level}`, stat: `${vocabLearned}/${vocabCount} appris` },
    { path: '/kanji', icon: '漢', title: 'Kanji', desc: `Kanji ${level}`, stat: `${kanjiLearned}/${kanjiCount} appris` },
    { path: '/grammar', icon: '文', title: 'Grammaire', desc: `Points ${level}`, stat: `${grammarLearned}/${grammarCount} appris` },
    { path: '/quiz', icon: '試', title: 'Quiz', desc: 'Testez vos connaissances', stat: `${progress.quiz.history.length} quiz complétés` },
    { path: '/progress', icon: '進', title: 'Progrès', desc: 'Statistiques détaillées', stat: `Niveau actuel : ${level}` },
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <h1>日本語マスター</h1>
        <p>Apprenez le japonais du niveau N5 au N1</p>
        <p className="home-level">Niveau actuel : <strong>{level}</strong></p>
      </div>
      <div className="home-grid">
        {modules.map(m => (
          <Link key={m.path} to={m.path} className="home-card">
            <div className="home-card-icon">{m.icon}</div>
            <h2>{m.title}</h2>
            <p>{m.desc}</p>
            <span className="home-card-stat">{m.stat}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
