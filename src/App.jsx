import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { SRSProvider } from './context/SRSContext';
import { GamificationProvider } from './context/GamificationContext';
import Navbar from './components/Navbar';
import XPNotifications from './components/XPNotifications';
import XPBar from './components/XPBar';
import Home from './pages/Home';
import KanaPage from './pages/KanaPage';
import VocabularyPage from './pages/VocabularyPage';
import KanjiPage from './pages/KanjiPage';
import GrammarPage from './pages/GrammarPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import CurriculumPage from './pages/CurriculumPage';
import StudySession from './pages/StudySession';
import ReviewPage from './pages/ReviewPage';
import AchievementsPage from './pages/AchievementsPage';

export default function App() {
  return (
    <ProgressProvider>
      <SRSProvider>
        <GamificationProvider>
          <HashRouter>
            <div className="app">
              <Navbar />
              <XPBar />
              <XPNotifications />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/curriculum" element={<CurriculumPage />} />
                  <Route path="/study/:lessonId" element={<StudySession />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/kana" element={<KanaPage />} />
                  <Route path="/vocabulary" element={<VocabularyPage />} />
                  <Route path="/kanji" element={<KanjiPage />} />
                  <Route path="/grammar" element={<GrammarPage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                </Routes>
              </main>
            </div>
          </HashRouter>
        </GamificationProvider>
      </SRSProvider>
    </ProgressProvider>
  );
}
