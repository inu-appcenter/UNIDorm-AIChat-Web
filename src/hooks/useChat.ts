import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { CLASSIFY_URL, CHAT_URL, type ChatbotType } from "../constants/api";

const STORAGE_KEY = "unidorm_chat_rooms";
const TOKEN_KEY = "unidorm_access_token";
const MAX_HISTORY_LENGTH = 10;

const BUTTON_MAP: Record<string, { label: string; url: string }> = {
  UNIDORM: { label: "유니돔", url: "https://unidorm.inuappcenter.kr" },
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

export const useChat = () => {
  const [selectedChatbotType, setSelectedChatbotType] =
    useState<ChatbotType>("special");
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
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  // 1. URL에서 토큰 추출 및 정제 로직
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      console.log("Token saved and URL cleaned");
    } else {
      // 페이지 로드 시 토큰이 아예 없는 경우 처리
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        handleRequiredLogin();
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
    if (
      window.confirm(
        "로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?",
      )
    ) {
      window.location.href = "https://unidorm.inuappcenter.kr/login";
    }
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
    if (rooms.length === 1) {
      clearHistory();
      return;
    }
    const filteredRooms = rooms.filter((r) => r.id !== id);
    setRooms(filteredRooms);
    if (currentRoomId === id) {
      setCurrentRoomId(filteredRooms[0].id);
    }
  };

  const updateRoomTitle = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === id ? { ...room, title: newTitle.trim() } : room,
      ),
    );
  };

  const clearHistory = () => {
    if (window.confirm("모든 대화 내역을 삭제할까요?")) {
      const initialRoom: ChatRoom = {
        id: Date.now().toString(),
        title: "새로운 대화",
        messages: [],
        chatbotType: "special",
      };
      setRooms([initialRoom]);
      setCurrentRoomId(initialRoom.id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);

      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === currentRoomId) {
            const newMessages = [...room.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === "ai" && lastMsg.content === "") {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: "응답이 중단되었습니다.",
              };
              return { ...room, messages: newMessages };
            }
          }
          return room;
        }),
      );
    }
  };

  const updateAiMessage = (
    content: string,
    isError: boolean = false,
    customButtons?: any[],
  ) => {
    const buttonRegex = /\[(?:BUTTON|버튼):\s*(\w+)\]/g;
    const detectedButtons: any[] = [...(customButtons || [])];
    let cleanedContent = content;
    let match;

    while ((match = buttonRegex.exec(content)) !== null) {
      const key = match[1];
      if (BUTTON_MAP[key]) {
        if (!detectedButtons.find((b) => b.url === BUTTON_MAP[key].url)) {
          detectedButtons.push({ ...BUTTON_MAP[key], primary: true });
        }
      }
    }

    cleanedContent = content.replace(buttonRegex, "").trim();

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id === currentRoomId) {
          const newMessages = [...room.messages];
          const lastMsgIdx = newMessages.length - 1;
          newMessages[lastMsgIdx] = {
            ...newMessages[lastMsgIdx],
            content: cleanedContent,
            isError,
            buttons: detectedButtons.length > 0 ? detectedButtons : undefined,
            timestamp: Date.now(),
          };
          return { ...room, messages: newMessages };
        }
        return room;
      }),
    );
  };

  const sendMessage = async (text: string, isRetry: boolean = false) => {
    if (!text.trim() || isLoading) return;

    // 2. 메시지 전송 시점에 토큰 체크
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      handleRequiredLogin();
      return;
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id === currentRoomId) {
          const isFirstMessage = room.messages.length === 0;
          const newMessages: ChatMessage[] = isRetry
            ? [...room.messages]
            : [
                ...room.messages,
                userMsg,
                { role: "ai", content: "", timestamp: Date.now() },
              ];

          if (isRetry) {
            newMessages[newMessages.length - 1] = {
              role: "ai",
              content: "",
              timestamp: Date.now(),
            };
          }

          return {
            ...room,
            title: isFirstMessage && !isRetry ? text.slice(0, 20) : room.title,
            messages: newMessages,
          };
        }
        return room;
      }),
    );

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      let activeChatbotType = selectedChatbotType;
      let prefixContent = "";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      };

      if (selectedChatbotType === "classify") {
        updateAiMessage("질문을 분류하는 중입니다...");

        const classifyResponse = await fetch(CLASSIFY_URL, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ text: text }),
          signal: abortControllerRef.current.signal,
        });

        // 3. 401 Unauthorized 처리 (토큰 만료 등)
        if (classifyResponse.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
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
            false,
            [
              {
                label: "유니돔 민원 접수",
                url: "https://unidorm.inuappcenter.kr/complain",
                primary: true,
              },
            ],
          );
          setIsLoading(false);
          return;
        } else if (category === "시설고장") {
          updateAiMessage(
            rawResponse + "시설 고장 신고는 포털 사이트를 이용해주세요.",
            false,
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
        } else if (category === "기타민원") {
          updateAiMessage(
            rawResponse +
              "기타 민원 접수는 소속 기숙사에 따라 아래 시스템을 이용해주세요.",
            false,
            [
              {
                label: "포털 사이트 (1기숙사)",
                url: "https://portal.inu.ac.kr",
                primary: true,
              },
              {
                label: "EDUFMS (2,3기숙사)",
                url: "https://edufms.inu.ac.kr",
                primary: true,
              },
            ],
          );
          setIsLoading(false);
          return;
        } else if (category === "단순문의") {
          activeChatbotType = "special";
          prefixContent =
            rawResponse + `✅ ${category}으로 판정되었습니다.\n\n---\n\n`;
          updateAiMessage(prefixContent + "챗봇 답변을 생성 중입니다...");
        } else {
          updateAiMessage(
            rawResponse +
              (classifyResult.final_guidance ||
                "해당 문의는 관련 부서로 문의해주세요."),
          );
          setIsLoading(false);
          return;
        }
      }

      const targetRoom = rooms.find((r) => r.id === currentRoomId);
      const messagesToSend = targetRoom ? targetRoom.messages : [];
      const historyPayload = isRetry
        ? messagesToSend.slice(0, -1)
        : messagesToSend;

      const slicedHistory = historyPayload.slice(-MAX_HISTORY_LENGTH);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          question: text,
          history: slicedHistory,
          type: activeChatbotType,
        }),
        signal: abortControllerRef.current.signal,
      });

      // 채팅 서버 응답에서도 401 처리
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        handleRequiredLogin();
        return;
      }

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiMessageContent = prefixContent;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiMessageContent += decoder.decode(value, { stream: true });
        updateAiMessage(aiMessageContent);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user.");
        return;
      }

      console.error("API Error:", error);
      updateAiMessage("서버와 연결할 수 없습니다. 다시 시도해주세요.", true);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = () => {
    if (isLoading) return;

    const lastUserMsg = [...currentRoom.messages]
      .reverse()
      .find((m) => m.role === "user");

    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, true);
    }
  };

  return {
    rooms,
    currentRoom,
    currentRoomId,
    setCurrentRoomId,
    isLoading,
    createNewRoom,
    deleteRoom,
    updateRoomTitle,
    clearHistory,
    sendMessage,
    regenerateResponse,
    stopGeneration,
    chatAreaRef,
    selectedChatbotType,
    setSelectedChatbotType,
  };
};
