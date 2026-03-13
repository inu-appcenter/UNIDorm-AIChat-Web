export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// 기존의 8002 포트 대신 API_BASE_URL의 /classify 엔드포인트를 사용합니다.
export const CLASSIFY_URL = `${API_BASE_URL}/unidorm/classify`;
export const CHAT_URL = `${API_BASE_URL}/unidorm/chat`;
export const LOGIN_URL = `${API_BASE_URL}/unidorm/auth/login`;

export type ChatbotType = "special" | "general" | "classify";

export const CHATBOT_LABELS: Record<ChatbotType, string> = {
  special: "선배 컨셉 (특화)",
  general: "일반 정보 (공지)",
  classify: "스마트 상담 (분류 후 연결)",
};
