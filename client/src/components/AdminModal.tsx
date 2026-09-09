import React, { useState, useEffect } from 'react';
import { X, Save, Lock, Sliders, Trash2, RotateCcw, ExternalLink, Plus, Check } from 'lucide-react';
import { AppConfig, AdminQuestion } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigSaved: (updatedConfig: AppConfig) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigSaved,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  // Form states
  const [partyUrl, setPartyUrl] = useState(config.partyUrl || 'https://home.raverendo.com/#/party');
  const [theme, setTheme] = useState(config.theme || 'halloween');
  const [partyTitle, setPartyTitle] = useState(config.partyTitle || '');
  const [partySubtitle, setPartySubtitle] = useState(config.partySubtitle || '');
  const [redirectDelay, setRedirectDelay] = useState(config.redirectDelay || 4);
  const [boosts, setBoosts] = useState(config.rewards?.boosts || 1);
  const [requests, setRequests] = useState(config.rewards?.requests || 2);
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Question manager states
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQAnsIndex, setNewQAnsIndex] = useState(0);
  const [newQExp, setNewQExp] = useState('');
  const [newQCat, setNewQCat] = useState('Halloween Music');

  useEffect(() => {
    if (config) {
      setPartyUrl(config.partyUrl || 'https://home.raverendo.com/#/party');
      setTheme(config.theme || 'halloween');
      setPartyTitle(config.partyTitle || '');
      setPartySubtitle(config.partySubtitle || '');
      setRedirectDelay(config.redirectDelay || 4);
      setBoosts(config.rewards?.boosts || 1);
      setRequests(config.rewards?.requests || 2);
    }
  }, [config]);

  // Load questions when authenticated and switching to questions tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'questions') {
      fetchQuestions();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || 'Incorrect password');
      }
    } catch (err) {
      setLoginError('Error connecting to server');
    }
  };

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/admin/questions', {
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const payload: any = {
        partyUrl,
        theme,
        partyTitle,
        partySubtitle,
        redirectDelay: Number(redirectDelay),
        rewards: {
          boosts: Number(boosts),
          requests: Number(requests)
        }
      };
      if (newPassword.trim()) {
        payload.adminPassword = newPassword.trim();
      }

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (newPassword.trim()) {
          setPassword(newPassword.trim());
          setNewPassword('');
        }
        onConfigSaved(data.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;

    const validOptions = newQOpts.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options.');
      return;
    }

    const answer = newQOpts[newQAnsIndex] || validOptions[0];

    const newQuestion: AdminQuestion = {
      id: 'q_' + Date.now(),
      question: newQText.trim(),
      options: newQOpts.map(o => o.trim()).filter(Boolean),
      answer: answer.trim(),
      explanation: newQExp.trim(),
      category: newQCat.trim() || 'General'
    };

    const updated = [newQuestion, ...questions];
    await saveQuestionsList(updated);
    setNewQText('');
    setNewQOpts(['', '', '', '']);
    setNewQExp('');
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const updated = questions.filter(q => q.id !== id);
    await saveQuestionsList(updated);
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset all questions back to the default Halloween trivia collection?')) return;
    try {
      const res = await fetch('/api/admin/questions/reset', {
        method: 'POST',
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error resetting questions:', err);
    }
  };

  const saveQuestionsList = async (updatedList: AdminQuestion[]) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ questions: updatedList })
      });
      if (res.ok) {
        setQuestions(updatedList);
      }
    } catch (err) {
      console.error('Failed to save questions list:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#110e21] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Host Administration</h2>
              <p className="text-xs text-slate-400">Manage party settings, URLs, and question pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Password prompt */
          <div className="py-8 flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Host Password Required</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              Enter your admin password to configure the party gatekeeper. Default password is <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">party</code>.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter host password..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm text-center"
                  autoFocus
                />
                {loginError && (
                  <p className="text-xs text-red-400 mt-2">{loginError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-600/30"
              >
                Unlock Settings
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated tabs */
          <div className="flex-1 overflow-y-auto pt-4 space-y-6">
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Party & Redirect Settings
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'questions'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Question Bank ({questions.length || '...'})
              </button>
            </div>

            {/* Tab 1: Party Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Party URL */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Music Assistant Party URL / Join Link
                    </label>
                    <a
                      href={partyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>Test link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="url"
                    value={partyUrl}
                    onChange={e => setPartyUrl(e.target.value)}
                    placeholder="https://home.raverendo.com/#/party"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The guest URL generated by Music Assistant Party plugin (e.g. from scanning the QR code or copying party join link).
                  </p>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Visual Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'halloween', name: '🎃 Halloween (Default)' },
                      { id: 'neon', name: '⚡ Electric Neon' },
                      { id: 'cyberpunk', name: '🌆 Cyberpunk 2077' },
                      { id: 'classic', name: '🍸 Midnight Lounge' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          theme === t.id
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Party Title
                    </label>
                    <input
                      type="text"
                      value={partyTitle}
                      onChange={e => setPartyTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Auto-Redirect Delay (Seconds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={redirectDelay}
                      onChange={e => setRedirectDelay(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Subtitle / Instructions Prompt
                  </label>
                  <input
                    type="text"
                    value={partySubtitle}
                    onChange={e => setPartySubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                  />
                </div>

                {/* Rewards Quotas displayed to guests */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      🚀 Boost Allowance Text
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={boosts}
                      onChange={e => setBoosts(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      🎵 Song Requests Allowance Text
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={requests}
                      onChange={e => setRequests(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                </div>

                {/* Change Admin Password */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Change Host Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-xs"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    {saveSuccess ? <Check className="w-4 h-4 text-green-300" /> : <Save className="w-4 h-4" />}
                    <span>{saveSuccess ? 'Settings Saved Successfully!' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Question Bank Manager */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">Active Question Bank ({questions.length})</h4>
                    <p className="text-[11px] text-slate-400">Questions are picked at random for arriving guests</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetDefaults}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      title="Reset back to default Halloween trivia"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={() => setShowAddQuestion(!showAddQuestion)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>
                </div>

                {/* Add Question Form */}
                {showAddQuestion && (
                  <form onSubmit={handleAddQuestion} className="p-4 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-3 animate-fade-in">
                    <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wide">New Trivia Question</h5>
                    <div>
                      <input
                        type="text"
                        value={newQText}
                        onChange={e => setNewQText(e.target.value)}
                        placeholder="Question prompt..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {newQOpts.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={newQAnsIndex === i}
                            onChange={() => setNewQAnsIndex(i)}
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const copy = [...newQOpts];
                              copy[i] = e.target.value;
                              setNewQOpts(copy);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newQCat}
                        onChange={e => setNewQCat(e.target.value)}
                        placeholder="Category (e.g. Halloween Music)"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                      <input
                        type="text"
                        value={newQExp}
                        onChange={e => setNewQExp(e.target.value)}
                        placeholder="Explanation / Fun trivia fact..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddQuestion(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs"
                      >
                        Save Question
                      </button>
                    </div>
                  </form>
                )}

                {/* Questions List */}
                {isLoadingQuestions ? (
                  <div className="text-center py-8 text-slate-400 text-xs">Loading questions...</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-start gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                              {q.category || 'Trivia'}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {idx + 1}. {q.question}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] pl-2 border-l border-slate-700">
                            Correct Answer: <strong className="text-emerald-400">{q.answer}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
