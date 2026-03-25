import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import KanaPage from './pages/KanaPage';
import VocabularyPage from './pages/VocabularyPage';
import KanjiPage from './pages/KanjiPage';
import GrammarPage from './pages/GrammarPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/kana" element={<KanaPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
              <Route path="/kanji" element={<KanjiPage />} />
              <Route path="/grammar" element={<GrammarPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/progress" element={<ProgressPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ProgressProvider>
  );
}
