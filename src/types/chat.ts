export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
}
