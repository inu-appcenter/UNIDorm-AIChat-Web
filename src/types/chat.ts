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
  buttons?: ChatButton[]; // 버튼 목록 추가
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  chatbotType?: string; // 어떤 챗봇을 사용했는지 기록 (선택 사항)
}
