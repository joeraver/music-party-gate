export interface ThemeOption {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  badge: string;
}

export interface AppConfig {
  theme: 'halloween' | 'neon' | 'cyberpunk' | 'classic' | string;
  partyTitle: string;
  partySubtitle: string;
  partyUrl?: string;
  rewards: {
    boosts: number;
    requests: number;
  };
  redirectDelay: number;
  hasPartyUrl: boolean;
  availableThemes: ThemeOption[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  category: string;
}

export interface AdminQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  category?: string;
}

export interface VerifyResponse {
  success: boolean;
  redirectUrl?: string;
  correctAnswer?: string;
  explanation?: string;
  rewards?: {
    boosts: number;
    requests: number;
  };
  redirectDelay?: number;
  message?: string;
}
