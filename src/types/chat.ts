export interface ChatButton {
  label: string;
  url: string;
  primary?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "assistant";
  content: string;
  timestamp: number | Date;
  isError?: boolean;
  isComplete?: boolean;
  buttons?: ChatButton[];
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  chatbotType?: string;
}
