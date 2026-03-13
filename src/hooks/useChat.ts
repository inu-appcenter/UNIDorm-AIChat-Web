import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import {
  CLASSIFY_URL,
  CHAT_URL,
  LOGIN_URL,
  type ChatbotType,
} from "../constants/api";

const STORAGE_KEY = "unidorm_chat_rooms";
const TOKEN_KEY = "unidorm_ai_access_token";
const MAX_HISTORY_LENGTH = 10;

export const useChat = () => {
  // 0. 프론트엔드 베이스 URL 결정 로직 (mode 파라미터 활용)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode") || "prod";

  const getFrontendBaseUrl = () => {
    // 로컬 환경 체크
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return window.location.origin;
    }
    // mode 파라미터에 따른 분기
    if (mode === "dev") return "https://unidorm-test.pages.dev";
    return "https://unidorm.inuappcenter.kr";
  };

  const WEB_BASE_URL = getFrontendBaseUrl();

  const BUTTON_MAP: Record<string, { label: string; url: string }> = {
    UNIDORM: { label: "유니돔", url: WEB_BASE_URL },
    PORTAL_MAIN: { label: "인천대 포털", url: "https://portal.inu.ac.kr" },
    EDUFMS: {
      label: "에듀맥(EDUFMS)",
      url: "https://edumac.kr/mon/index.do?schlType=Univ",
    },
    DORM_MAIN: { label: "기숙사 홈페이지", url: "https://dorm.inu.ac.kr" },
    DORM_RESERVE: {
      label: "세미나실 예약 페이지",
      url: "https://dorm.inu.ac.kr/dorm/13698/subview.do",
    },
  };

  const [selectedChatbotType, setSelectedChatbotType] =
    useState<ChatbotType>("special");
  const hasAlertedRef = useRef(false);

  // 개발 환경 파라미터 경고 (StrictMode 중복 방지)
  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (
      isLocal &&
      (!urlParams.get("token") || !urlParams.get("mode")) &&
      !hasAlertedRef.current
    ) {
      alert("url파라미터로 token과 mode를 전달해주세요.");
      hasAlertedRef.current = true;
    }
  }, []);

  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse rooms from localStorage", e);
      }
    }
    return [
      {
        id: Date.now().toString(),
        title: "새로운 대화",
        messages: [],
        chatbotType: "special",
      },
    ];
  });

  const [currentRoomId, setCurrentRoomId] = useState<string>(rooms[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY),
  );
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success">("idle");
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExchangingRef = useRef<boolean>(false);

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  // 1. URL에서 토큰 추출 및 정제 로직
  useEffect(() => {
    const accessToken = urlParams.get("token");

    if (accessToken && !isExchangingRef.current) {
      isExchangingRef.current = true;
      const exchangeToken = async () => {
        setLoginStatus("loading");
        try {
          const response = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken, mode }),
          });

          if (!response.ok) {
            throw new Error("Failed to exchange token");
          }

          const data = await response.json();
          const aiToken =
            data.accessToken ||
            (typeof data === "string" ? data : data.token || data.access_token);

          if (!aiToken) {
            throw new Error("No token found in response");
          }

          localStorage.setItem(TOKEN_KEY, aiToken);
          setIsAuthenticated(true);
          setLoginStatus("success");
          
          setTimeout(() => {
            setLoginStatus("idle");
          }, 1000);

          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
          console.log("AI Server Token saved and URL cleaned");
        } catch (error) {
          console.error("Token exchange failed", error);
          setIsAuthenticated(false);
          setLoginStatus("idle");
          localStorage.removeItem(TOKEN_KEY);

          if (window.confirm("유니돔 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
            handleRequiredLogin();
          }
        }
      };

      exchangeToken();
    } else {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [currentRoom.messages]);

  // 로그인 유도 처리 함수
  const handleRequiredLogin = () => {
    window.open(`${WEB_BASE_URL}/login`, "_top");
  };

  const createNewRoom = () => {
    const emptyRoom = rooms.find((room) => room.messages.length === 0);
    if (emptyRoom) {
      setCurrentRoomId(emptyRoom.id);
      return;
    }

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      title: "새로운 대화",
      messages: [],
      chatbotType: "special",
    };
    setRooms([newRoom, ...rooms]);
    setCurrentRoomId(newRoom.id);
  };

  const deleteRoom = (id: string) => {
    const updatedRooms = rooms.filter((room) => room.id !== id);
    if (updatedRooms.length === 0) {
      const newRoom: ChatRoom = {
        id: Date.now().toString(),
        title: "새로운 대화",
        messages: [],
        chatbotType: "special",
      };
      setRooms([newRoom]);
      setCurrentRoomId(newRoom.id);
    } else {
      setRooms(updatedRooms);
      if (currentRoomId === id) {
        setCurrentRoomId(updatedRooms[0].id);
      }
    }
  };

  const updateRoomTitle = (id: string, title: string) => {
    setRooms(
      rooms.map((room) => (room.id === id ? { ...room, title } : room)),
    );
  };

  const clearHistory = () => {
    setRooms(
      rooms.map((room) =>
        room.id === currentRoomId ? { ...room, messages: [] } : room,
      ),
    );
  };

  const updateAiMessage = (
    content: string,
    isComplete: boolean = false,
    buttons?: { label: string; url: string; primary?: boolean }[],
  ) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === currentRoomId) {
          const messages = [...room.messages];
          if (messages.length > 0 && messages[messages.length - 1].role === "ai") {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
              isComplete,
              buttons,
            };
          } else {
            messages.push({
              id: Date.now().toString(),
              role: "ai",
              content,
              timestamp: Date.now(),
              isComplete,
              buttons,
            });
          }
          return { ...room, messages };
        }
        return room;
      }),
    );
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      updateAiMessage(currentRoom.messages[currentRoom.messages.length - 1].content, true);
    }
  };

  const sendMessage = async (content: string, isRetry: boolean = false) => {
    if (!content.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isRetry) {
      // 리트라이 시 마지막 AI 메시지 삭제
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === currentRoomId) {
            const messages = [...room.messages];
            if (messages.length > 0 && messages[messages.length - 1].role === "ai") {
              messages.pop();
            }
            return { ...room, messages };
          }
          return room;
        }),
      );
    } else {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setRooms((prev) =>
        prev.map((room) =>
          room.id === currentRoomId
            ? { ...room, messages: [...room.messages, userMessage] }
            : room,
        ),
      );
    }

    setIsLoading(true);
    updateAiMessage("", false);

    try {
      if (selectedChatbotType === "classify") {
        const classifyResponse = await fetch(CLASSIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
          body: JSON.stringify({ message: content }),
          signal: abortControllerRef.current.signal,
        });

        if (classifyResponse.status === 401) {
          handleRequiredLogin();
          return;
        }

        if (!classifyResponse.ok) throw new Error("분류 서버 응답 실패");

        const classifyResult = await classifyResponse.json();
        const category = classifyResult.category;
        const rawResponse = `[분류 서버 응답 데이터]\n${JSON.stringify(classifyResult, null, 2)}\n\n`;

        if (category === "유니돔민원") {
          updateAiMessage(
            rawResponse + "유니돔 민원 페이지에서 접수하실 수 있습니다.",
            true,
            [
              {
                label: "유니돔 민원 접수",
                url: `${WEB_BASE_URL}/complain`,
                primary: true,
              },
            ],
          );
          setIsLoading(false);
          return;
        } else if (category === "시설고장") {
          updateAiMessage(
            rawResponse + "시설 고장 신고는 포털 사이트를 이용해주세요.",
            true,
            [
              {
                label: "인천대 포털 바로가기",
                url: "https://portal.inu.ac.kr",
                primary: true,
              },
            ],
          );
          setIsLoading(false);
          return;
        } else if (category === "기숙사운영") {
          updateAiMessage(
            rawResponse + "기숙사 운영 관련 문의는 기숙사 홈페이지를 참고하시거나 에듀맥을 확인해주세요.",
            true,
            [
              {
                label: "기숙사 홈페이지",
                url: "https://dorm.inu.ac.kr",
                primary: true,
              },
              {
                label: "에듀맥 바로가기",
                url: "https://edufms.inu.ac.kr",
              },
            ],
          );
          setIsLoading(false);
          return;
        } else {
          updateAiMessage(rawResponse + "일반 질문으로 판단되어 일반 챗봇으로 연결합니다...", false);
        }
      }

      const history = currentRoom.messages
        .slice(-MAX_HISTORY_LENGTH)
        .map((msg) => ({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content,
        }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify({
          message: content,
          history,
          type: selectedChatbotType === "classify" ? "general" : selectedChatbotType,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 401) {
        handleRequiredLogin();
        return;
      }

      if (!response.ok) throw new Error("챗봇 서버 응답 실패");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const contentChunk = parsed.choices[0].delta.content || "";
                fullContent += contentChunk;
                
                const detectedButtons: { label: string; url: string; primary?: boolean }[] = [];
                Object.keys(BUTTON_MAP).forEach((key) => {
                  if (fullContent.includes(key)) {
                    if (!detectedButtons.find((b) => b.url === BUTTON_MAP[key].url)) {
                      detectedButtons.push(BUTTON_MAP[key]);
                    }
                  }
                });

                updateAiMessage(fullContent, false, detectedButtons.length > 0 ? detectedButtons : undefined);
              } catch (e) {
                console.error("Error parsing SSE chunk", e);
              }
            }
          }
        }
      }
      updateAiMessage(fullContent, true);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Chat error:", error);
      updateAiMessage("죄송합니다. 오류가 발생했습니다.", true);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = async () => {
    const lastUserMessage = [...currentRoom.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (lastUserMessage) {
      // 마지막 AI 응답 삭제
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === currentRoomId) {
            const messages = [...room.messages];
            if (messages[messages.length - 1].role === "ai") {
              messages.pop();
            }
            return { ...room, messages };
          }
          return room;
        }),
      );
      sendMessage(lastUserMessage.content);
    }
  };

  return {
    rooms,
    currentRoom,
    currentRoomId,
    setCurrentRoomId,
    isLoading,
    isAuthenticated,
    loginStatus,
    chatAreaRef,
    selectedChatbotType,
    setSelectedChatbotType,
    handleRequiredLogin,
    createNewRoom,
    deleteRoom,
    updateRoomTitle,
    clearHistory,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  };
};
