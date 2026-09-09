import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Music, Rocket, ExternalLink, CheckCircle2, Pause, Play } from 'lucide-react';
import { VerifyResponse } from '../types';

interface SuccessViewProps {
  result: VerifyResponse;
  theme: string;
  onReset: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ result, theme, onReset }) => {
  const isHalloween = theme === 'halloween';
  const initialDelay = result.redirectDelay || 4;
  const [secondsRemaining, setSecondsRemaining] = useState(initialDelay);
  const [isPaused, setIsPaused] = useState(false);

  // Trigger celebratory confetti burst on mount
  useEffect(() => {
    const end = Date.now() + 2.5 * 1000;
    const colors = isHalloween
      ? ['#ff6b00', '#8b5cf6', '#10b981', '#facc15', '#000000']
      : ['#ec4899', '#3b82f6', '#10b981', '#facc15', '#6366f1'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [isHalloween]);

  // Handle countdown & redirect
  useEffect(() => {
    if (isPaused) return;

    if (secondsRemaining <= 0) {
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, isPaused, result.redirectUrl]);

  const handleManualRedirect = () => {
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  const progressPercent = ((initialDelay - secondsRemaining) / initialDelay) * 100;

  return (
    <div className={`w-full max-w-xl mx-auto rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all shadow-2xl ${
      isHalloween ? 'glass-panel-halloween' : 'glass-panel'
    }`}>
      {/* Top Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-green-500/20 to-emerald-500/30 border border-green-500/40 text-green-400 mb-3 shadow-lg animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold text-white mb-2 ${
          isHalloween ? 'font-creep text-glow-orange text-3xl sm:text-4xl' : ''
        }`}>
          {isHalloween ? '🎃 Riddle Solved! Access Granted!' : '🎉 Correct! Access Unlocked!'}
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          You conquered the trivia challenge and unlocked party jukebox control.
        </p>
      </div>

      {/* Answer & Explanation Card */}
      {result.explanation && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs sm:text-sm leading-relaxed">
          <span className="font-bold text-purple-300 block mb-1">Trivia Insight:</span>
          {result.explanation}
        </div>
      )}

      {/* Reward Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Boost Reward */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-500/40 flex items-start gap-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex-shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-400 font-bold">Your Priority Pass</div>
            <div className="text-lg font-extrabold text-white">1 Boost</div>
            <p className="text-xs text-slate-300 mt-0.5">
              Jumps the queue! Plays your song next right after the current track.
            </p>
          </div>
        </div>

        {/* Requests Reward */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 flex items-start gap-3 shadow-md">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex-shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-purple-400 font-bold">Your Jukebox Quota</div>
            <div className="text-lg font-extrabold text-white">2 Song Requests</div>
            <p className="text-xs text-slate-300 mt-0.5">
              Search your favorite songs and queue them up for the party crowd.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-redirect progress */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex justify-between items-center text-xs font-semibold mb-2">
          <span className="text-slate-400">
            {isPaused ? 'Auto-redirect paused' : `Summoning music queue in ${secondsRemaining}s...`}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isHalloween
                ? 'bg-gradient-to-r from-orange-500 to-purple-500'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleManualRedirect}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
          isHalloween
            ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        <span>Open Music Queue Now</span>
        <ExternalLink className="w-5 h-5" />
      </button>

      {/* Target URL notice */}
      <p className="text-center text-xs text-slate-400 mt-3 truncate px-4">
        Redirecting to: <span className="text-slate-300 font-mono">{result.redirectUrl}</span>
      </p>

      {/* Play again button for testing */}
      <div className="text-center mt-4">
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-orange-400 transition-colors underline"
        >
          Try another question (Testing mode)
        </button>
      </div>
    </div>
  );
};
