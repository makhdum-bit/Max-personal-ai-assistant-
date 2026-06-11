export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: { title: string; url: string }[] | null;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export interface AssistantConfig {
  voiceEnabled: boolean;
  webSearchEnabled: boolean;
  autoSpeak: boolean;
  selectedVoiceName: string;
}
