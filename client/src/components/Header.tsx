import React from 'react';
import { Settings, Sparkles, HelpCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, onOpenAdmin, onOpenGuide }) => {
  const isHalloween = config.theme === 'halloween';

  return (
    <header className="w-full max-w-xl mx-auto pt-6 pb-4 px-4 flex flex-col items-center text-center relative z-10">
      {/* Top action row */}
      <div className="w-full flex justify-between items-center mb-4">
        {/* Host setup guide trigger */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 hover:text-white transition-all shadow-sm"
          title="Music Assistant Setup Guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          <span>Host Guide</span>
        </button>

        {/* Theme badge */}
        <span className={`text-xs px-3 py-1 rounded-full font-bold tracking-wide uppercase border ${
          isHalloween 
            ? 'bg-orange-950/60 text-orange-400 border-orange-500/30 shadow-orange-500/10' 
            : 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30 shadow-cyan-500/10'
        } shadow-sm`}>
          {isHalloween ? '🎃 Halloween Edition' : '🎵 Party Jukebox'}
        </span>

        {/* Admin settings trigger */}
        <button
          onClick={onOpenAdmin}
          className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-all shadow-sm"
          title="Host & Admin Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Title */}
      <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 ${
        isHalloween ? 'text-white font-creep tracking-wider text-glow-orange text-4xl sm:text-5xl' : 'text-white'
      }`}>
        {config.partyTitle || 'Spooky Beats Halloween Bash 🎃'}
      </h1>

      {/* Subtitle */}
      <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-4 font-medium">
        {config.partySubtitle || "Answer the crypt's trivia riddle to unlock the jukebox!"}
      </p>

      {/* Rewards Pill Banner */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold border ${
        isHalloween
          ? 'bg-gradient-to-r from-orange-950/70 via-purple-950/70 to-orange-950/70 border-orange-500/40 text-orange-200'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/40 text-indigo-200'
      } shadow-lg backdrop-blur-md`}>
        <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
        <span>Reward:</span>
        <span className="text-white font-bold bg-orange-500/30 px-2 py-0.5 rounded-md border border-orange-400/40">
          🚀 {config.rewards?.boosts || 1} Boost
        </span>
        <span>+</span>
        <span className="text-white font-bold bg-purple-500/30 px-2 py-0.5 rounded-md border border-purple-400/40">
          🎵 {config.rewards?.requests || 2} Song Requests
        </span>
      </div>
    </header>
  );
};
