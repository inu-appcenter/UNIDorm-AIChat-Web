import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { getChatUrl, getFeedbackUrl, type ChatbotType } from "../constants/api";
import { injectButtonPlaceholders } from "../utils/chatButtons";

const STORAGE_KEY = "unidorm_chat_rooms";
const GUEST_DEVICE_ID_KEY = "unidorm_chat_guest_device_id";
const AUTO_SCROLL_THRESHOLD_PX = 80;
const MAX_HISTORY_LENGTH = 6; // 직전 대화 3턴(6개 메시지) 유지

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getOrCreateGuestDeviceId = (): string => {
  let deviceId = localStorage.getItem(GUEST_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(GUEST_DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

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

const createEmptyRoom = (service: "unidorm" | "intip"): ChatRoom => ({
  id: Date.now().toString(),
  sessionId: generateUUID(),
  title: "새로운 대화",
  messages: [],
  chatbotType: "special",
  service,
});

const ensureGuideRoom = (rooms: ChatRoom[], activeService: "unidorm" | "intip") => {
  const emptyRoomIndex = rooms.findIndex((room) => room.messages.length === 0 && room.service === activeService);

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

  const newRoom = createEmptyRoom(activeService);
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

  const rawService = searchParamsRef.current.get("service") || "intip";
  const activeService: "unidorm" | "intip" = (rawService.toLowerCase() === "unidorm" ? "unidorm" : "intip");

  const getFrontendBaseUrl = () => {
    return window.location.origin;
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
    // 비인증으로 변경되어 더 이상 로그인이 필요하지 않습니다.
  };

  const [selectedChatbotType, setSelectedChatbotType] =
    useState<ChatbotType>("special");

  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialRooms: ChatRoom[] | null = null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          initialRooms = parsed.map((room: any) => ({
            ...room,
            service: room.service || "unidorm", // 기존 방 마이그레이션
          }));
        }
      } catch (error) {
        console.error("Failed to parse rooms from localStorage", error);
      }
    }

    return ensureGuideRoom(initialRooms ?? [createEmptyRoom(activeService)], activeService).rooms;
  });

  const [currentRoomId, setCurrentRoomId] = useState<string>(() => {
    const guideRoom =
      rooms.find((room) => room.messages.length === 0 && room.service === activeService) ??
      rooms.find((room) => room.service === activeService) ??
      rooms[0];
    return guideRoom.id;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated] = useState<boolean>(true);
  const [loginStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isAutoScrollEnabledRef = useRef(true);
  const shouldScrollUserMessageRef = useRef<boolean>(false);

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  useEffect(() => {
    getOrCreateGuestDeviceId();
  }, []);

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
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      const spacer = chatArea.querySelector("#scroll-spacer") as HTMLElement;
      if (spacer) {
        spacer.style.height = "0px";
      }
    }
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [currentRoomId]);

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) return;

    const spacer = chatArea.querySelector("#scroll-spacer") as HTMLElement;

    if (shouldScrollUserMessageRef.current) {
      const userMessages = chatArea.querySelectorAll(".chat-message-user");
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1] as HTMLElement;
        const containerRect = chatArea.getBoundingClientRect();
        const targetRect = lastUserMessage.getBoundingClientRect();
        const scrollOffset = targetRect.top - containerRect.top + chatArea.scrollTop;

        // Calculate and set the initial required spacer height dynamically and mathematically
        if (spacer) {
          const currentSpacerHeight = spacer.offsetHeight || 0;
          const scrollHeightWithoutSpacer = chatArea.scrollHeight - currentSpacerHeight;
          const requiredSpacerHeight = Math.max(
            0,
            scrollOffset + chatArea.clientHeight - scrollHeightWithoutSpacer
          );
          spacer.style.height = `${requiredSpacerHeight}px`;
        }

        requestAnimationFrame(() => {
          chatArea.scrollTo({
            top: scrollOffset,
            behavior: "smooth"
          });
          shouldScrollUserMessageRef.current = false;
        });
      }
    } else {
      const userMessages = chatArea.querySelectorAll(".chat-message-user");
      if (userMessages.length > 0 && spacer && isLoading) {
        const lastUserMessage = userMessages[userMessages.length - 1] as HTMLElement;
        const containerRect = chatArea.getBoundingClientRect();
        const targetRect = lastUserMessage.getBoundingClientRect();
        const scrollOffset = targetRect.top - containerRect.top + chatArea.scrollTop;

        const currentSpacerHeight = spacer.offsetHeight || 0;
        const scrollHeightWithoutSpacer = chatArea.scrollHeight - currentSpacerHeight;
        const requiredSpacerHeight = Math.max(
          0,
          scrollOffset + chatArea.clientHeight - scrollHeightWithoutSpacer
        );
        spacer.style.height = `${requiredSpacerHeight}px`;
      }

      if (isAutoScrollEnabledRef.current && !isLoading) {
        scrollToBottom();
      }
    }
  }, [currentRoom.messages, isLoading]);

  const createNewRoom = () => {
    const emptyRoom = rooms.find((room) => room.messages.length === 0 && room.service === activeService);
    if (emptyRoom) {
      setCurrentRoomId(emptyRoom.id);
      return;
    }

    const newRoom = createEmptyRoom(activeService);
    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
  };

  const deleteRoom = (id: string) => {
    const updatedRooms = rooms.filter((room) => room.id !== id);

    if (updatedRooms.length === 0) {
      const newRoom = createEmptyRoom(activeService);
      setRooms([newRoom]);
      setCurrentRoomId(newRoom.id);
    } else {
      setRooms(updatedRooms);
      if (currentRoomId === id) {
        const sameServiceRoom = updatedRooms.find((room) => room.service === activeService);
        setCurrentRoomId(sameServiceRoom ? sameServiceRoom.id : updatedRooms[0].id);
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
      const newRoom = createEmptyRoom(activeService);
      setRooms([newRoom]);
      setCurrentRoomId(newRoom.id);
    }
  };

  const updateAiMessage = (
    content: string,
    isComplete = false,
    buttons?: ChatButton[],
    messageId?: string,
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
            ...(messageId ? { messageId } : {}),
          };
        } else {
          messages.push({
            id: Date.now().toString(),
            role: "ai",
            content,
            timestamp: Date.now(),
            isComplete,
            buttons,
            ...(messageId ? { messageId } : {}),
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

    isAutoScrollEnabledRef.current = false;
    shouldScrollUserMessageRef.current = true;

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

      const currentSessionId = currentRoom.sessionId || generateUUID();

      const requestBody = JSON.stringify({
        question: content,
        history,
        sessionId: currentSessionId,
      });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(getChatUrl(activeService), {
            method: "POST",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
              "X-Guest-Device-Id": getOrCreateGuestDeviceId(),
            },
            body: requestBody,
            signal: abortControllerRef.current.signal,
          });


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

          const messageId = response.headers.get("X-Message-ID") || response.headers.get("x-message-id") || undefined;

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
              messageId,
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

          updateAiMessage(finalMessage.content, true, finalMessage.buttons, messageId);
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

  const [closedTooltipRooms, setClosedTooltipRooms] = useState<Record<string, boolean>>({});

  const isFeedbackTooltipClosed = Boolean(closedTooltipRooms[currentRoomId]);

  const closeFeedbackTooltip = () => {
    setClosedTooltipRooms((prev) => ({
      ...prev,
      [currentRoomId]: true,
    }));
  };

  const sendFeedback = async (
    clientMsgId: string,
    serverMsgId: string,
    score: 1 | -1,
  ) => {
    try {
      const response = await fetch(getFeedbackUrl(activeService), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Device-Id": getOrCreateGuestDeviceId(),
        },
        body: JSON.stringify({
          messageId: serverMsgId,
          score,
        }),
      });

      if (!response.ok) {
        throw new Error("피드백 반영 실패");
      }

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== currentRoomId) return room;
          return {
            ...room,
            messages: room.messages.map((msg) =>
              msg.id === clientMsgId
                ? { ...msg, feedbackScore: score }
                : msg,
            ),
          };
        }),
      );
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return {
    activeService,
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
    sendFeedback,
    isFeedbackTooltipClosed,
    closeFeedbackTooltip,
  };
};
