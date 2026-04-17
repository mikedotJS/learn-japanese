import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { useSRS } from '../context/SRSContext';

export default function Navbar() {
  const { progress, setCurrentLevel } = useProgress();
  const { getStats } = useSRS();
  const { signOut } = useAuth();
  const stats = getStats();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">日本語マスター</NavLink>
      </div>
      <div className="navbar-links">
        <NavLink to="/curriculum" className="nav-curriculum">
          Parcours
        </NavLink>
        <NavLink to="/review" className="nav-review">
          Révisions
          {stats.dueCount > 0 && <span className="nav-badge">{stats.dueCount}</span>}
        </NavLink>
        <NavLink to="/kana">Kana</NavLink>
        <NavLink to="/vocabulary">Vocabulaire</NavLink>
        <NavLink to="/kanji">Kanji</NavLink>
        <NavLink to="/grammar">Grammaire</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/achievements">Succès</NavLink>
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
        <button className="nav-signout" onClick={() => signOut()}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
