export const getChatUrl = (service: "unidorm" | "intip") => {
  const prefix = service === "intip" ? "/inuchat" : "/unidorm";
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ai-server.inuappcenter.kr";
  return `${baseUrl}${prefix}/chat`;
};

export const getClassifyUrl = (service: "unidorm" | "intip") => {
  const prefix = service === "intip" ? "/inuchat" : "/unidorm";
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ai-server.inuappcenter.kr";
  return `${baseUrl}${prefix}/classify`;
};

export type ChatbotType = "special" | "general" | "classify";

export const CHATBOT_LABELS: Record<ChatbotType, string> = {
  special: "선배 컨셉 (특화)",
  general: "일반 정보 (공지)",
  classify: "스마트 상담 (분류 후 연결)",
};
