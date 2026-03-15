import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { CHAT_URL, LOGIN_URL, type ChatbotType } from "../constants/api";

const STORAGE_KEY = "unidorm_chat_rooms";
const TOKEN_KEY = "unidorm_ai_access_token";
const MAX_HISTORY_LENGTH = 2; // 직전 대화 1턴(내 질문 + AI 응답)만 유지

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
  const [loginStatus, setLoginStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");
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

          if (
            window.confirm(
              "유니돔 로그인이 필요합니다. 로그인 페이지로 이동할까요?",
            )
          ) {
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
    setRooms(rooms.map((room) => (room.id === id ? { ...room, title } : room)));
  };

  const clearHistory = () => {
    if (window.confirm("모든 대화 내역을 삭제하시겠습니까?")) {
      const newRoom: ChatRoom = {
        id: Date.now().toString(),
        title: "새로운 대화",
        messages: [],
        chatbotType: "special",
      };
      setRooms([newRoom]);
      setCurrentRoomId(newRoom.id);
    }
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
      updateAiMessage(
        currentRoom.messages[currentRoom.messages.length - 1].content,
        true,
      );
    }
  };

  const sendMessage = async (
    content: string,
    isRetry: boolean = false,
    customHistory?: { role: string; content: string }[],
  ) => {
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
            if (
              messages.length > 0 &&
              messages[messages.length - 1].role === "ai"
            ) {
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

      // 히스토리 구성 (재시도일 경우 마지막 AI 메시지 제외)
      let baseMessages = [...currentRoom.messages];
      if (
        isRetry &&
        baseMessages.length > 0 &&
        baseMessages[baseMessages.length - 1].role === "ai"
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

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify({
          question: content,
          history,
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
          fullContent += chunk;

          const detectedButtons: {
            label: string;
            url: string;
            primary?: boolean;
          }[] = [];

          // 1. [버튼: KEY] 패턴 감지 (BUTTON_MAP 기반)
          Object.keys(BUTTON_MAP).forEach((key) => {
            const pattern = new RegExp(`\\[버튼:\\s*${key}\\]`, "g");
            if (pattern.test(fullContent)) {
              if (!detectedButtons.find((b) => b.url === BUTTON_MAP[key].url)) {
                detectedButtons.push({ ...BUTTON_MAP[key], primary: true });
              }
            }
            // 기존 키워드 포함 방식도 하위 호환성을 위해 유지 (필요 시)
            else if (
              fullContent.includes(key) &&
              !fullContent.includes(`[버튼: ${key}]`)
            ) {
              if (!detectedButtons.find((b) => b.url === BUTTON_MAP[key].url)) {
                detectedButtons.push(BUTTON_MAP[key]);
              }
            }
          });

          // 2. [버튼: 라벨|URL] 패턴 감지 및 추출
          const customButtonRegex = /\[버튼:\s*([^|\]]+)\|([^\]]+)\]/g;
          let match;
          while ((match = customButtonRegex.exec(fullContent)) !== null) {
            const [, label, url] = match;
            if (!detectedButtons.find((b) => b.url === url.trim())) {
              detectedButtons.push({
                label: label.trim(),
                url: url.trim(),
                primary: true,
              });
            }
          }

          // 모든 [버튼: ...] 패턴을 본문에서 제거
          const displayContent = fullContent
            .replace(/\[버튼:\s*[^\]|]+\|[^\]]+\]/g, "") // [버튼: 라벨|URL] 제거
            .replace(/\[버튼:\s*[^\]]+\]/g, "") // [버튼: KEY] 제거
            .trim();

          updateAiMessage(
            displayContent,
            false,
            detectedButtons.length > 0 ? detectedButtons : undefined,
          );
        }
      }

      // 스트리밍 완료 후 최종 처리
      const finalButtons: { label: string; url: string; primary?: boolean }[] =
        [];

      // BUTTON_MAP 기반 최종 확인
      Object.keys(BUTTON_MAP).forEach((key) => {
        const pattern = new RegExp(`\\[버튼:\\s*${key}\\]`, "g");
        if (
          pattern.test(fullContent) ||
          (fullContent.includes(key) && !fullContent.includes(`[버튼: ${key}]`))
        ) {
          if (!finalButtons.find((b) => b.url === BUTTON_MAP[key].url)) {
            finalButtons.push({ ...BUTTON_MAP[key], primary: true });
          }
        }
      });

      // 커스텀 버튼 최종 확인
      const customButtonRegex = /\[버튼:\s*([^|\]]+)\|([^\]]+)\]/g;
      let match;
      while ((match = customButtonRegex.exec(fullContent)) !== null) {
        const [, label, url] = match;
        if (!finalButtons.find((b) => b.url === url.trim())) {
          finalButtons.push({
            label: label.trim(),
            url: url.trim(),
            primary: true,
          });
        }
      }

      const finalDisplayContent = fullContent
        .replace(/\[버튼:\s*[^\]|]+\|[^\]]+\]/g, "")
        .replace(/\[버튼:\s*[^\]]+\]/g, "")
        .trim();

      updateAiMessage(
        finalDisplayContent,
        true,
        finalButtons.length > 0 ? finalButtons : undefined,
      );
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
    const messages = [...currentRoom.messages];
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((msg) => msg.role === "user");

    if (lastUserIndex !== -1) {
      const actualIndex = messages.length - 1 - lastUserIndex;
      const lastUserContent = messages[actualIndex].content;

      // 1. 재생성할 질문 '이전'까지의 히스토리만 추출
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

      // 2. 상태에서 현재 질문과 그 이후 답변(들)을 삭제
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === currentRoomId) {
            return {
              ...room,
              messages: room.messages.slice(0, actualIndex),
            };
          }
          return room;
        }),
      );

      // 3. 추출한 히스토리를 명시적으로 전달하며 다시 전송
      sendMessage(lastUserContent, false, historyBeforeThis);
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
