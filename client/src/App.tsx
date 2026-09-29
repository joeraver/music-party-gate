import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { QuizCard } from './components/QuizCard';
import { SuccessView } from './components/SuccessView';
import { AdminModal } from './components/AdminModal';
import { HostGuideModal } from './components/HostGuideModal';
import { AppConfig, Question, VerifyResponse } from './types';
import { Loader2 } from 'lucide-react';

import { TriviaService } from './services/triviaService';

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({
    theme: 'halloween',
    partyTitle: 'Spooky Beats Halloween Bash 🎃',
    partySubtitle: "Answer the crypt's trivia riddle to unlock the jukebox!",
    rewards: { boosts: 1, requests: 2 },
    redirectDelay: 4,
    hasPartyUrl: true,
    availableThemes: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<VerifyResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Fetch initial config and question on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadConfig();
      await loadRandomQuestion([]);
      setIsLoading(false);
    }
    init();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await TriviaService.getConfig();
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadRandomQuestion = async (excludeList: string[]) => {
    setErrorMessage(null);
    try {
      const q = await TriviaService.getRandomQuestion(excludeList);
      setCurrentQuestion(q);
      setSeenQuestionIds(prev => [...prev.slice(-15), q.id]);
    } catch (err) {
      console.error('Failed to fetch question:', err);
    }
  };

  const handleVerify = async (selectedAnswer: string) => {
    if (!currentQuestion || isVerifying) return;
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const data = await TriviaService.verifyAnswer(currentQuestion.id, selectedAnswer);
      if (data.success) {
        setVerifiedResult(data);
      } else {
        setErrorMessage(data.message || 'Incorrect answer! Give it another shot.');
      }
    } catch (err) {
      setErrorMessage('Unexpected error verifying answer.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefreshQuestion = () => {
    loadRandomQuestion(seenQuestionIds);
  };

  const handleReset = () => {
    setVerifiedResult(null);
    setErrorMessage(null);
    loadRandomQuestion(seenQuestionIds);
  };

  const isHalloween = config.theme === 'halloween';

  // Ambient background class depending on theme
  const getThemeBg = () => {
    switch (config.theme) {
      case 'halloween':
        return 'fog-bg';
      case 'neon':
        return 'fog-neon';
      case 'cyberpunk':
        return 'fog-cyberpunk';
      case 'classic':
        return 'fog-classic';
      default:
        return 'fog-bg';
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden ${getThemeBg()}`}>
      {/* Decorative ambient elements */}
      {isHalloween && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-10 left-[10%] text-3xl opacity-20 animate-float">🎃</div>
          <div className="absolute top-40 right-[12%] text-2xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>👻</div>
          <div className="absolute bottom-32 left-[8%] text-3xl opacity-15 animate-float" style={{ animationDelay: '2.5s' }}>🦇</div>
          <div className="absolute bottom-20 right-[15%] text-2xl opacity-20 animate-float" style={{ animationDelay: '0.8s' }}>🕷️</div>
        </div>
      )}

      {/* Header */}
      <Header
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            <p className="text-sm font-medium">Summoning trivia riddle...</p>
          </div>
        ) : verifiedResult ? (
          <SuccessView
            result={verifiedResult}
            theme={config.theme}
            onReset={handleReset}
          />
        ) : currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            theme={config.theme}
            isVerifying={isVerifying}
            errorMessage={errorMessage}
            onSelectAndVerify={handleVerify}
            onRefreshQuestion={handleRefreshQuestion}
          />
        ) : (
          <div className="text-center p-8 glass-panel rounded-3xl max-w-md">
            <p className="text-slate-300 mb-4">No questions found in question bank.</p>
            <button
              onClick={() => loadRandomQuestion([])}
              className="py-2 px-4 rounded-xl bg-orange-600 text-white text-xs font-bold"
            >
              Retry Loading
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 px-4 text-xs text-slate-400 relative z-10">
        <p>
          Powered by <strong className="text-slate-300">Music Assistant</strong> & the Party Plugin • Hosted at <span className="text-purple-400 font-mono">party.raverendo.com</span>
        </p>
      </footer>

      {/* Modals */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigSaved={updated => {
          setConfig(updated);
          loadRandomQuestion([]);
        }}
      />

      <HostGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenAdmin={() => {
          setIsGuideOpen(false);
          setIsAdminOpen(true);
        }}
      />
    </div>
  );
};

export default App;
