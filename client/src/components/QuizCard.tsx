import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Question } from '../types';

interface QuizCardProps {
  question: Question;
  theme: string;
  isVerifying: boolean;
  errorMessage: string | null;
  onSelectAndVerify: (selectedAnswer: string) => void;
  onRefreshQuestion: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  theme,
  isVerifying,
  errorMessage,
  onSelectAndVerify,
  onRefreshQuestion,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isHalloween = theme === 'halloween';

  const handleSubmit = () => {
    if (!selectedOption || isVerifying) return;
    onSelectAndVerify(selectedOption);
  };

  return (
    <div className={`w-full max-w-xl mx-auto rounded-3xl p-6 sm:p-8 transition-all relative ${
      isHalloween ? 'glass-panel-halloween' : 'glass-panel'
    } ${errorMessage ? 'animate-shake' : ''}`}>
      {/* Category Pill and Refresh */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            isHalloween
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          }`}>
            {isHalloween ? '🦇 ' : '🏷️ '}{question.category || 'Trivia Challenge'}
          </span>
        </div>

        <button
          onClick={() => {
            setSelectedOption(null);
            onRefreshQuestion();
          }}
          disabled={isVerifying}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
          title="Get a different question"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>Another Riddle</span>
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
          {question.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const letter = String.fromCharCode(65 + index); // A, B, C, D

          return (
            <button
              key={`${question.id}-opt-${index}`}
              onClick={() => setSelectedOption(option)}
              disabled={isVerifying}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                isSelected
                  ? isHalloween
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 pr-2">
                <span className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isSelected
                    ? isHalloween
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}>
                  {letter}
                </span>
                <span className="font-medium text-sm sm:text-base leading-snug">
                  {option}
                </span>
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                isSelected
                  ? isHalloween
                    ? 'border-orange-400 bg-orange-500 text-white'
                    : 'border-indigo-400 bg-indigo-500 text-white'
                  : 'border-slate-700 group-hover:border-slate-500'
              }`}>
                {isSelected && <CheckCircle2 className="w-4 h-4 fill-current" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-3 text-sm animate-fade-in shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">Incorrect Answer!</p>
            <p className="text-xs text-red-200/90 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setSelectedOption(null);
              onRefreshQuestion();
            }}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2.5 py-1 rounded-lg border border-red-400/30 whitespace-nowrap transition-colors"
          >
            Try New Question
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedOption || isVerifying}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-xl ${
          selectedOption && !isVerifying
            ? isHalloween
              ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0'
            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Consulting the spirits...</span>
          </>
        ) : (
          <>
            <span>Submit Riddle Answer</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Helpful footnote */}
      <p className="text-center text-xs text-slate-400 mt-4">
        Need help? Tap <strong className="text-slate-300">Another Riddle</strong> above to get a different question.
      </p>
    </div>
  );
};
