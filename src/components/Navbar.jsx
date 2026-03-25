import { NavLink } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';

export default function Navbar() {
  const { progress, setCurrentLevel } = useProgress();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">🇯🇵 日本語マスター</NavLink>
      </div>
      <div className="navbar-links">
        <NavLink to="/kana">Kana</NavLink>
        <NavLink to="/vocabulary">Vocabulaire</NavLink>
        <NavLink to="/kanji">Kanji</NavLink>
        <NavLink to="/grammar">Grammaire</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/progress">Progrès</NavLink>
      </div>
      <div className="navbar-level">
        <select
          value={progress.settings.currentLevel}
          onChange={(e) => setCurrentLevel(e.target.value)}
        >
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
      </div>
    </nav>
  );
}
