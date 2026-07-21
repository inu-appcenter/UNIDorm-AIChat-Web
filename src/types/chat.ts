export interface ChatButton {
  label: string;
  url: string;
  primary?: boolean;
}

export interface ChatMessage {
  id: string;
  messageId?: string;
  role: "user" | "ai" | "assistant";
  content: string;
  timestamp: number | Date;
  isError?: boolean;
  isComplete?: boolean;
  buttons?: ChatButton[];
  feedbackScore?: 1 | -1 | null;
}

export interface ChatRoom {
  id: string;
  sessionId?: string;
  title: string;
  messages: ChatMessage[];
  chatbotType?: string;
  service?: "unidorm" | "intip";
}
