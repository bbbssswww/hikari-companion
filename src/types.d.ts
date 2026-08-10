export {};

declare global {
  interface Window {
    hikari?: {
      getState: () => Promise<AppState>;
      saveState: (state: AppState) => Promise<{ ok: boolean }>;
      chat: (payload: ChatPayload) => Promise<{ content: string; provider: string }>;
      setCompanionMode: (enabled: boolean) => Promise<{ ok: boolean }>;
      minimize: () => void;
      close: () => void;
    };
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }

  interface SpeechRecognitionLike {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  type ConnectionMode = "demo" | "online" | "local";

  interface AssistantProfile {
    name: string;
    userName: string;
    relationship: string;
    personality: string;
    background: string;
    avatarDataUrl: string;
  }

  interface ConnectionSettings {
    mode: ConnectionMode;
    baseUrl: string;
    model: string;
    apiKey: string;
  }

  interface MemoryItem {
    id: string;
    content: string;
    createdAt: string;
  }

  interface AppState {
    onboarded: boolean;
    profile: AssistantProfile;
    connection: ConnectionSettings;
    preferences: {
      speakReplies: boolean;
      requireDangerousActionConfirmation: boolean;
    };
    memories: MemoryItem[];
  }

  interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }

  interface ChatPayload {
    connection: ConnectionSettings;
    messages: ChatMessage[];
    assistantName: string;
  }
}
