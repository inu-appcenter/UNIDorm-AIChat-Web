export type AiConcept = "senior" | "general";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp?: number;
  isError?: boolean;
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  concept?: AiConcept;
}
