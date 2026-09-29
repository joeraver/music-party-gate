import { AppConfig, Question, AdminQuestion, VerifyResponse, ThemeOption } from '../types';

const STORAGE_KEY_CONFIG = 'mpg_config';
const STORAGE_KEY_QUESTIONS = 'mpg_questions';

const DEFAULT_THEMES: ThemeOption[] = [
  {
    id: 'halloween',
    name: 'Spooky Halloween 🎃',
    primaryColor: '#ff6b00',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    badge: '🎃 Halloween Edition'
  },
  {
    id: 'neon',
    name: 'Electric Neon ⚡',
    primaryColor: '#ec4899',
    secondaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    badge: '⚡ Neon Rave'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077 🌆',
    primaryColor: '#facc15',
    secondaryColor: '#06b6d4',
    accentColor: '#f43f5e',
    badge: '🌆 Cyberpunk'
  },
  {
    id: 'classic',
    name: 'Midnight Lounge 🍸',
    primaryColor: '#6366f1',
    secondaryColor: '#14b8a6',
    accentColor: '#f59e0b',
    badge: '🍸 Midnight Lounge'
  }
];

const DEFAULT_CONFIG: AppConfig & { adminPassword?: string } = {
  theme: 'halloween',
  partyTitle: 'Spooky Beats Halloween Bash 🎃',
  partySubtitle: "Answer the crypt's trivia riddle to unlock the jukebox!",
  partyUrl: 'https://home.raverendo.com/#/party',
  rewards: {
    boosts: 1,
    requests: 2
  },
  redirectDelay: 4,
  hasPartyUrl: true,
  adminPassword: 'party',
  availableThemes: DEFAULT_THEMES
};

// Built-in fallback questions bank in case static JSON is inaccessible
const FALLBACK_QUESTIONS: AdminQuestion[] = [
  {
    id: "q1",
    question: "Who sang the iconic 1984 spooky synth-pop hit 'Somebody's Watching Me'?",
    options: ["Rockwell", "Michael Jackson", "Rick James", "Prince"],
    answer: "Rockwell",
    explanation: "Rockwell recorded the track in 1984, featuring his childhood friend Michael Jackson singing the famous chorus!",
    category: "Halloween Music"
  },
  {
    id: "q2",
    question: "In Bobby 'Boris' Pickett's legendary 1962 song 'Monster Mash', what dance was replaced by the Mash?",
    options: ["The Twist", "The Macarena", "The Charleston", "The Watusi"],
    answer: "The Twist",
    explanation: "The lyrics state: 'For my mash came a dancing from my laboratory / It grew to be a smash, and it replaced The Twist!'",
    category: "Halloween Music"
  },
  {
    id: "q3",
    question: "Which iconic horror director composed the chilling piano/synth theme for his own movie 'Halloween' (1978)?",
    options: ["John Carpenter", "Wes Craven", "George A. Romero", "Tobe Hooper"],
    answer: "John Carpenter",
    explanation: "John Carpenter composed the score himself in 5/4 time, creating one of cinema's most famous horror themes.",
    category: "Horror Soundtracks"
  },
  {
    id: "q4",
    question: "Which legendary horror film famously adopted Mike Oldfield's track 'Tubular Bells' as its chilling main theme?",
    options: ["The Exorcist", "The Shining", "Rosemary's Baby", "The Omen"],
    answer: "The Exorcist",
    explanation: "William Friedkin chose Oldfield's 'Tubular Bells' for the 1973 film, turning an avant-garde rock album into a terrifying classic.",
    category: "Horror Soundtracks"
  },
  {
    id: "q5",
    question: "What legendary horror movie icon delivered the chilling spoken-word outro in Michael Jackson's 'Thriller'?",
    options: ["Vincent Price", "Bela Lugosi", "Christopher Lee", "Boris Karloff"],
    answer: "Vincent Price",
    explanation: "Horror legend Vincent Price recorded the ominous rap and iconic sinister laugh in just two takes in 1982!",
    category: "Halloween Music"
  },
  {
    id: "q6",
    question: "In 'The Nightmare Before Christmas', which renowned composer wrote the score and sang Jack Skellington's songs?",
    options: ["Danny Elfman", "Hans Zimmer", "Alan Menken", "John Williams"],
    answer: "Danny Elfman",
    explanation: "Oingo Boingo frontman and legendary film composer Danny Elfman composed all songs and sang Jack's parts.",
    category: "Spooky Soundtracks"
  },
  {
    id: "q7",
    question: "Which shock-rock pioneer is known for his theatrical stage shows featuring guillotines, fake blood, and boa constrictors?",
    options: ["Alice Cooper", "Ozzy Osbourne", "Gene Simmons", "Marilyn Manson"],
    answer: "Alice Cooper",
    explanation: "Alice Cooper pioneered shock rock in the early 1970s with his grand guignol theatrical live concerts.",
    category: "Rock Trivia"
  },
  {
    id: "q8",
    question: "Who recorded the Oscar-nominated, chart-topping theme song for 1984's 'Ghostbusters'?",
    options: ["Ray Parker Jr.", "Huey Lewis", "Lionel Richie", "Stevie Wonder"],
    answer: "Ray Parker Jr.",
    explanation: "Ray Parker Jr. wrote and performed the famous anthem answering the musical question: 'Who you gonna call?'",
    category: "Halloween Music"
  },
  {
    id: "q9",
    question: "What 1994 alt-rock protest anthem by The Cranberries shares its title with a classic Halloween undead creature?",
    options: ["Zombie", "Vampire", "Skeleton", "Ghost"],
    answer: "Zombie",
    explanation: "'Zombie' was written by Dolores O'Riordan in 1994, becoming one of the decade's most powerful rock tracks.",
    category: "Rock Trivia"
  },
  {
    id: "q10",
    question: "In 'Hocus Pocus' (1993), which famous song does Winifred Sanderson (Bette Midler) perform at the party?",
    options: ["I Put a Spell on You", "Witchcraft", "Season of the Witch", "Black Magic Woman"],
    answer: "I Put a Spell on You",
    explanation: "Bette Midler's showstopping rendition of Screamin' Jay Hawkins' 1956 hit cast a dancing spell on all the parents of Salem!",
    category: "Halloween Pop Culture"
  }
];

// Helper: Fisher-Yates array shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class TriviaService {
  private static cachedQuestions: AdminQuestion[] | null = null;
  private static cachedConfig: (AppConfig & { adminPassword?: string }) | null = null;

  /**
   * Load the active configuration. Merges:
   * 1. Built-in defaults
   * 2. Static /config.json (if accessible)
   * 3. localStorage overrides (from host admin)
   * 4. URL query parameters (e.g. ?join=... or ?partyUrl=...)
   */
  static async getConfig(): Promise<AppConfig & { adminPassword?: string }> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    let config: AppConfig & { adminPassword?: string } = { ...DEFAULT_CONFIG };

    // Try fetching static config.json from public directory
    try {
      const res = await fetch('/config.json');
      if (res.ok) {
        const staticCfg = await res.json();
        config = { ...config, ...staticCfg };
      }
    } catch {
      // Fallback silently if running in standalone preview
    }

    // Merge localStorage if host has saved custom settings
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        config = { ...config, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse stored config from localStorage', e);
    }

    // Check URL query parameters (useful for QR codes with custom join URLs)
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join') || params.get('partyUrl');
      if (joinParam) {
        config.partyUrl = joinParam;
      }
      const themeParam = params.get('theme');
      if (themeParam) {
        config.theme = themeParam;
      }
    }

    config.hasPartyUrl = Boolean(config.partyUrl);
    this.cachedConfig = config;
    return config;
  }

  /**
   * Update configuration and persist in localStorage
   */
  static saveConfig(updates: Partial<AppConfig & { adminPassword?: string }>): AppConfig & { adminPassword?: string } {
    const current = this.cachedConfig || { ...DEFAULT_CONFIG };
    const updated = { ...current, ...updates, hasPartyUrl: Boolean(updates.partyUrl || current.partyUrl) };
    
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }

    this.cachedConfig = updated;
    return updated;
  }

  /**
   * Retrieve all questions from localStorage or static public/questions.json
   */
  static async getAllQuestions(): Promise<AdminQuestion[]> {
    if (this.cachedQuestions && this.cachedQuestions.length > 0) {
      return this.cachedQuestions;
    }

    // Check localStorage first
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (stored) {
        const parsed: AdminQuestion[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedQuestions = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load questions from localStorage', e);
    }

    // Fetch from static questions.json
    try {
      const res = await fetch('/questions.json');
      if (res.ok) {
        const staticQuestions: AdminQuestion[] = await res.json();
        if (Array.isArray(staticQuestions) && staticQuestions.length > 0) {
          this.cachedQuestions = staticQuestions;
          return staticQuestions;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /questions.json, using fallback bank', e);
    }

    this.cachedQuestions = [...FALLBACK_QUESTIONS];
    return this.cachedQuestions;
  }

  /**
   * Save questions list to localStorage
   */
  static saveQuestions(questions: AdminQuestion[]): void {
    this.cachedQuestions = questions;
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
    } catch (e) {
      console.error('Failed to save questions to localStorage', e);
    }
  }

  /**
   * Reset questions to the default bank
   */
  static async resetQuestions(): Promise<AdminQuestion[]> {
    try {
      localStorage.removeItem(STORAGE_KEY_QUESTIONS);
      this.cachedQuestions = null;
      const defaults = await this.getAllQuestions();
      return defaults;
    } catch {
      this.cachedQuestions = [...FALLBACK_QUESTIONS];
      return this.cachedQuestions;
    }
  }

  /**
   * Select a random question and shuffle its options
   */
  static async getRandomQuestion(excludeIds: string[] = []): Promise<Question> {
    const all = await this.getAllQuestions();
    let available = all.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      available = all;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];

    return {
      id: selected.id,
      question: selected.question,
      options: shuffleArray(selected.options),
      category: selected.category || 'Trivia Challenge'
    };
  }

  /**
   * Instant client-side verification
   */
  static async verifyAnswer(questionId: string, selectedAnswer: string): Promise<VerifyResponse> {
    const all = await this.getAllQuestions();
    const question = all.find(q => q.id === questionId);

    if (!question) {
      return { success: false, message: 'Question riddle not found in spirits vault.' };
    }

    const isCorrect = String(question.answer).trim().toLowerCase() === String(selectedAnswer).trim().toLowerCase();

    if (isCorrect) {
      const cfg = await this.getConfig();
      return {
        success: true,
        redirectUrl: cfg.partyUrl || 'https://home.raverendo.com/#/party',
        correctAnswer: question.answer,
        explanation: question.explanation || 'Great job! The jukebox unlocks!',
        rewards: cfg.rewards || { boosts: 1, requests: 2 },
        redirectDelay: cfg.redirectDelay || 4
      };
    }

    return {
      success: false,
      message: 'Not quite right! The spirits demand another attempt.'
    };
  }

  /**
   * Admin password verification
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    const cfg = await this.getConfig();
    const correctPassword = cfg.adminPassword || 'party';
    return String(password).trim() === correctPassword;
  }
}
