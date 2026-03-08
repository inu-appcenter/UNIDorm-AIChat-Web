export interface ChatButton {
  label: string;
  url: string;
  primary?: boolean;
}

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp?: number;
  isError?: boolean;
  buttons?: ChatButton[];
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  chatbotType?: string;
}
