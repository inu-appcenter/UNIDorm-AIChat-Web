import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { API_URL } from "../constants/api";

const STORAGE_KEY = "unidorm_chat_rooms";
const MAX_HISTORY_LENGTH = 10; // 최근 10개 메시지만 서버에 전송 (Context Windowing)

export const useChat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse rooms from localStorage", e);
      }
    }
    return [{ id: Date.now().toString(), title: "새로운 대화", messages: [] }];
  });

  const [currentRoomId, setCurrentRoomId] = useState<string>(rooms[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [currentRoom.messages]);

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
    };
    setRooms([newRoom, ...rooms]);
    setCurrentRoomId(newRoom.id);
  };

  const deleteRoom = (id: string) => {
    if (rooms.length === 1) {
      clearHistory(); // 마지막 방이면 전체 초기화와 동일하게 처리
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
        room.id === id ? { ...room, title: newTitle.trim() } : room
      )
    );
  };

  const clearHistory = () => {
    if (window.confirm("모든 대화 내역을 삭제하시겠습니까?")) {
      const initialRoom = {
        id: Date.now().toString(),
        title: "새로운 대화",
        messages: [],
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

      // 마지막 메시지가 비어있는 AI 메시지라면 안내 문구로 교체하여 로딩 애니메이션 제거
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
        })
      );
    }
  };

  const sendMessage = async (text: string, isRetry: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { 
      role: "user", 
      content: text, 
      timestamp: Date.now() 
    };

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id === currentRoomId) {
          const isFirstMessage = room.messages.length === 0;
          const newMessages: ChatMessage[] = isRetry 
            ? [...room.messages] 
            : [...room.messages, userMsg, { role: "ai", content: "", timestamp: Date.now() }];
          
          if (isRetry) {
             newMessages[newMessages.length - 1] = { role: "ai", content: "", timestamp: Date.now() };
          }

          return {
            ...room,
            title: isFirstMessage && !isRetry ? text.slice(0, 20) : room.title,
            messages: newMessages,
          };
        }
        return room;
      })
    );

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      // 최근 대화만 추출 (Windowing)
      const targetRoom = rooms.find(r => r.id === currentRoomId);
      const messagesToSend = targetRoom ? targetRoom.messages : [];
      const historyPayload = isRetry 
        ? messagesToSend.slice(0, -1) // 마지막 에러 메시지 제외
        : messagesToSend;
      
      const slicedHistory = historyPayload.slice(-MAX_HISTORY_LENGTH);

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history: slicedHistory,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiMessageContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiMessageContent += decoder.decode(value, { stream: true });

        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (room.id === currentRoomId) {
              const newMessages = [...room.messages];
              newMessages[newMessages.length - 1].content = aiMessageContent;
              return { ...room, messages: newMessages };
            }
            return room;
          })
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user.");
        return; // 중단된 경우 별도 에러 처리 안 함
      }
      
      console.error("API Error:", error);
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === currentRoomId) {
            const newMessages = [...room.messages];
            newMessages[newMessages.length - 1] = {
              role: "ai",
              content: "서버와 연결할 수 없습니다. 다시 시도해주세요.",
              timestamp: Date.now(),
              isError: true, // 에러 플래그 추가
            };
            return { ...room, messages: newMessages };
          }
          return room;
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = () => {
    if (isLoading) return;
    
    // 현재 방의 메시지 중 마지막 사용자 메시지 찾기
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
  };
};
