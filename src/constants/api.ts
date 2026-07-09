export const getChatUrl = (service: "unidorm" | "intip", mode: string = "prod") => {
  const prefix = service === "intip" ? "/inuchat" : "/unidorm";
  const prodUrl = import.meta.env.VITE_API_BASE_URL || "https://ai-server.inuappcenter.kr";
  const devUrl = import.meta.env.VITE_API_BASE_URL_DEV || "https://ai-server-dev.inuappcenter.kr";
  const baseUrl = mode === "dev" ? devUrl : prodUrl;
  return `${baseUrl}${prefix}/chat`;
};

export const getClassifyUrl = (service: "unidorm" | "intip", mode: string = "prod") => {
  const prefix = service === "intip" ? "/inuchat" : "/unidorm";
  const prodUrl = import.meta.env.VITE_API_BASE_URL || "https://ai-server.inuappcenter.kr";
  const devUrl = import.meta.env.VITE_API_BASE_URL_DEV || "https://ai-server-dev.inuappcenter.kr";
  const baseUrl = mode === "dev" ? devUrl : prodUrl;
  return `${baseUrl}${prefix}/classify`;
};

export type ChatbotType = "special" | "general" | "classify";

export const CHATBOT_LABELS: Record<ChatbotType, string> = {
  special: "선배 컨셉 (특화)",
  general: "일반 정보 (공지)",
  classify: "스마트 상담 (분류 후 연결)",
};
