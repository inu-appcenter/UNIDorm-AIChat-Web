export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// 기존의 8002 포트 대신 API_BASE_URL의 /classify 엔드포인트를 사용합니다.
export const CLASSIFY_URL = `${API_BASE_URL}/unidorm/classify`;
export const CHAT_URL = `${API_BASE_URL}/unidorm/chat`;
export const LOGIN_URL = `${API_BASE_URL}/unidorm/auth/login`;

export const getApiEndpoints = (service: "unidorm" | "intip", mode: string = "prod") => {
  const prefix = service === "intip" ? "/inuchat" : "/unidorm";
  
  // 로컬 환경인 경우 .env 설정을 최우선으로 따름 (로컬 백엔드 테스트 용도)
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
    
  let baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ai-server.inuappcenter.kr";
  
  // 로컬이 아니고 실서버(배포 환경)인 경우 mode 값에 따라 백엔드 AI 서버 분기
  if (!isLocal) {
    if (mode === "dev") {
      baseUrl = "https://ai-server-dev.inuappcenter.kr";
    } else {
      baseUrl = "https://ai-server.inuappcenter.kr";
    }
  }

  return {
    login: `${baseUrl}${prefix}/auth/login`,
    chat: `${baseUrl}${prefix}/chat`,
    classify: `${baseUrl}${prefix}/classify`,
  };
};

export type ChatbotType = "special" | "general" | "classify";

export const CHATBOT_LABELS: Record<ChatbotType, string> = {
  special: "선배 컨셉 (특화)",
  general: "일반 정보 (공지)",
  classify: "스마트 상담 (분류 후 연결)",
};
