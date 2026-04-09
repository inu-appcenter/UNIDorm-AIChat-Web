import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { CHAT_URL, LOGIN_URL, type ChatbotType } from "../constants/api";
import { injectButtonPlaceholders } from "../utils/chatButtons";

const STORAGE_KEY = "unidorm_chat_rooms";
const TOKEN_KEY = "unidorm_ai_access_token";
const AUTO_SCROLL_THRESHOLD_PX = 80;
const MAX_HISTORY_LENGTH = 2; // 직전 대화 1턴(내 질문 + AI 응답)만 유지

type ChatButton = {
  label: string;
  url: string;
  primary?: boolean;
};

class ChatHttpError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`Chat HTTP ${status}: ${detail}`);
    this.name = "ChatHttpError";
    this.status = status;
    this.detail = detail;
  }
}

const STREAM_ERROR_REGEX = /\[(bridge|engine) error\]\s*([\s\S]+)/i;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const parseErrorDetail = (raw: string) => {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === "string") {
      return parsed.detail;
    }
  } catch {
    // ignore JSON parse error
  }
  return raw.trim();
};

const shouldRetryChat = (error: unknown) =>
  error instanceof ChatHttpError
    ? [502, 503, 504].includes(error.status)
    : error instanceof TypeError;

const getChatErrorMessage = (error: unknown) => {
  if (error instanceof ChatHttpError) {
    if (error.status === 503) {
      return "서버가 응답을 준비 중입니다. 잠시 후 다시 시도해주세요.";
    }
    if (error.status === 502 || error.status === 504) {
      return "첫 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
    }
    return "채팅 요청 처리 중 오류가 발생했습니다.";
  }

  if (error instanceof TypeError) {
    return "네트워크 연결 문제로 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "죄송합니다. 오류가 발생했습니다.";
};

const createEmptyRoom = (): ChatRoom => ({
  id: Date.now().toString(),
  title: "새로운 대화",
  messages: [],
  chatbotType: "special",
});

const ensureGuideRoom = (rooms: ChatRoom[]) => {
  const emptyRoomIndex = rooms.findIndex((room) => room.messages.length === 0);

  if (emptyRoomIndex !== -1) {
    if (emptyRoomIndex === 0) {
      return {
        rooms,
        currentRoomId: rooms[0].id,
      };
    }

    const emptyRoom = rooms[emptyRoomIndex];
    return {
      rooms: [emptyRoom, ...rooms.filter((room) => room.id !== emptyRoom.id)],
      currentRoomId: emptyRoom.id,
    };
  }

  const newRoom = createEmptyRoom();
  return {
    rooms: [newRoom, ...rooms],
    currentRoomId: newRoom.id,
  };
};

export const useChat = () => {
  const searchParamsRef = useRef<URLSearchParams | null>(null);
  if (searchParamsRef.current === null) {
    searchParamsRef.current = new URLSearchParams(window.location.search);
  }

  const tokenParam = searchParamsRef.current.get("token");
  const mode = searchParamsRef.current.get("mode") || "prod";

  const getFrontendBaseUrl = () => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return window.location.origin;
    }

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

  const handleRequiredLogin = () => {
    window.open(`${WEB_BASE_URL}/login`, "_top");
  };

  const [selectedChatbotType, setSelectedChatbotType] =
    useState<ChatbotType>("special");
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (
      isLocal &&
      (!tokenParam || !searchParamsRef.current?.get("mode")) &&
      !hasAlertedRef.current
    ) {
      window.alert("url파라미터로 token과 mode를 전달해주세요.");
      hasAlertedRef.current = true;
    }
  }, [tokenParam]);

  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialRooms: ChatRoom[] | null = null;

    if (saved) {
      try {
        initialRooms = JSON.parse(saved);
      } catch (error) {
        console.error("Failed to parse rooms from localStorage", error);
      }
    }

    return ensureGuideRoom(initialRooms ?? [createEmptyRoom()]).rooms;
  });

  const [currentRoomId, setCurrentRoomId] = useState<string>(() => {
    const guideRoom =
      rooms.find((room) => room.messages.length === 0) ?? rooms[0];
    return guideRoom.id;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY),
  );
  const [loginStatus, setLoginStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExchangingRef = useRef<boolean>(false);
  const isAutoScrollEnabledRef = useRef(true);

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  useEffect(() => {
    if (tokenParam && !isExchangingRef.current) {
      isExchangingRef.current = true;

      const exchangeToken = async () => {
        setLoginStatus("loading");

        try {
          const response = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken: tokenParam, mode }),
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

          window.setTimeout(() => {
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

          if (
            window.confirm(
              "유니돔 로그인이 필요합니다. 로그인 페이지로 이동할까요?",
            )
          ) {
            handleRequiredLogin();
          }
        }
      };

      void exchangeToken();
    } else {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(!!savedToken);
    }
  }, [mode, tokenParam]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  const isNearBottom = (element: HTMLDivElement) =>
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    AUTO_SCROLL_THRESHOLD_PX;

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) return;

    const handleScroll = () => {
      isAutoScrollEnabledRef.current = isNearBottom(chatArea);
    };

    handleScroll();
    chatArea.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      chatArea.removeEventListener("scroll", handleScroll);
    };
  }, [currentRoomId]);

  useEffect(() => {
    isAutoScrollEnabledRef.current = true;
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [currentRoomId]);

  useEffect(() => {
    if (isAutoScrollEnabledRef.current) {
      scrollToBottom();
    }
  }, [currentRoom.messages]);

  const createNewRoom = () => {
    const emptyRoom = rooms.find((room) => room.messages.length === 0);
    if (emptyRoom) {
      setCurrentRoomId(emptyRoom.id);
      return;
    }

    const newRoom = createEmptyRoom();
    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
  };

  const deleteRoom = (id: string) => {
    const updatedRooms = rooms.filter((room) => room.id !== id);

    if (updatedRooms.length === 0) {
      const newRoom = createEmptyRoom();
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
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? { ...room, title } : room)),
    );
  };

  const clearHistory = () => {
    if (window.confirm("모든 대화 내역을 삭제하시겠습니까?")) {
      const newRoom = createEmptyRoom();
      setRooms([newRoom]);
      setCurrentRoomId(newRoom.id);
    }
  };

  const updateAiMessage = (
    content: string,
    isComplete = false,
    buttons?: ChatButton[],
  ) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== currentRoomId) return room;

        const messages = [...room.messages];
        if (
          messages.length > 0 &&
          messages[messages.length - 1].role === "ai"
        ) {
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
      }),
    );
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);

      const lastMessage = currentRoom.messages[currentRoom.messages.length - 1];
      if (lastMessage?.role === "ai") {
        updateAiMessage(lastMessage.content, true, lastMessage.buttons);
      }
    }
  };

  const sendMessage = async (
    content: string,
    isRetry = false,
    customHistory?: { role: string; content: string }[],
  ) => {
    if (!content.trim()) return;

    isAutoScrollEnabledRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isRetry) {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== currentRoomId) return room;

          const messages = [...room.messages];
          if (
            messages.length > 0 &&
            messages[messages.length - 1].role === "ai"
          ) {
            messages.pop();
          }

          return { ...room, messages };
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
            ? {
                ...room,
                messages: [...room.messages, userMessage],
                title: room.messages.length === 0 ? content : room.title,
              }
            : room,
        ),
      );
    }

    setIsLoading(true);
    updateAiMessage("", false);

    try {
      if (selectedChatbotType === "classify") {
        // ... (classify logic)
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsAuthenticated(false);
        handleRequiredLogin();
        return;
      }

      let baseMessages = [...currentRoom.messages];

      if (
        baseMessages.length > 0 &&
        baseMessages[baseMessages.length - 1].role === "user" &&
        baseMessages[baseMessages.length - 1].content === content
      ) {
        baseMessages.pop();
      }

      const history = customHistory
        ? customHistory
        : baseMessages.slice(-MAX_HISTORY_LENGTH).map((msg) => ({
            role:
              msg.role === "ai" || msg.role === "assistant"
                ? "assistant"
                : "user",
            content: msg.content,
          }));

      const requestBody = JSON.stringify({
        question: content,
        history,
      });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(CHAT_URL, {
            method: "POST",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: requestBody,
            signal: abortControllerRef.current.signal,
          });

          if (response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            setIsAuthenticated(false);
            handleRequiredLogin();
            return;
          }

          if (!response.ok) {
            const raw = await response.text().catch(() => "");
            const detail = parseErrorDetail(raw) || response.statusText;

            console.error("Chat HTTP error", {
              status: response.status,
              statusText: response.statusText,
              detail,
              raw,
            });

            throw new ChatHttpError(response.status, detail);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("응답 스트림이 없습니다.");
          }

          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;

            const streamingMessage = injectButtonPlaceholders(
              fullContent,
              BUTTON_MAP,
            );

            updateAiMessage(
              streamingMessage.content,
              false,
              streamingMessage.buttons,
            );
          }

          fullContent += decoder.decode();

          const streamErrorMatch = fullContent.match(STREAM_ERROR_REGEX);
          if (streamErrorMatch) {
            console.error("Chat stream error", {
              type: streamErrorMatch[1],
              detail: streamErrorMatch[2].trim(),
              fullContent,
            });
            throw new Error(
              "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            );
          }

          if (!fullContent.trim()) {
            throw new Error("응답이 비어 있습니다.");
          }

          const finalMessage = injectButtonPlaceholders(
            fullContent,
            BUTTON_MAP,
          );

          updateAiMessage(finalMessage.content, true, finalMessage.buttons);
          return;
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          if (attempt === 0 && shouldRetryChat(error)) {
            console.warn("Retrying chat after transient error", error);
            await sleep(1500);

            if (abortControllerRef.current?.signal.aborted) {
              return;
            }
            continue;
          }

          throw error;
        }
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("Chat error:", error);
      updateAiMessage(getChatErrorMessage(error), true);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = async () => {
    const messages = [...currentRoom.messages];
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((msg) => msg.role === "user");

    if (lastUserIndex !== -1) {
      const actualIndex = messages.length - 1 - lastUserIndex;
      const lastUserContent = messages[actualIndex].content;

      const historyBeforeThis = messages
        .slice(0, actualIndex)
        .slice(-MAX_HISTORY_LENGTH)
        .map((msg) => ({
          role:
            msg.role === "ai" || msg.role === "assistant"
              ? "assistant"
              : "user",
          content: msg.content,
        }));

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== currentRoomId) return room;

          return {
            ...room,
            messages: room.messages.slice(0, actualIndex + 1),
          };
        }),
      );

      void sendMessage(lastUserContent, true, historyBeforeThis);
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
