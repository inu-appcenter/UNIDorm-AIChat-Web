import { useState, useRef, useEffect } from "react";
import type { ChatRoom, ChatMessage } from "../types/chat";
import { API_URL } from "../constants/api";

const STORAGE_KEY = "unidorm_chat_rooms";

export const useChat = () => {
  // 로컬 스토리지에서 초기 데이터 불러오기
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

  const currentRoom =
    rooms.find((room) => room.id === currentRoomId) || rooms[0];

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [currentRoom.messages]);

  const createNewRoom = () => {
    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      title: "새로운 대화",
      messages: [],
    };
    setRooms([newRoom, ...rooms]);
    setCurrentRoomId(newRoom.id);
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id === currentRoomId) {
          const isFirstMessage = room.messages.length === 0;
          return {
            ...room,
            title: isFirstMessage ? text.slice(0, 20) : room.title,
            messages: [...room.messages, userMsg, { role: "ai", content: "" }],
          };
        }
        return room;
      }),
    );

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history: currentRoom.messages,
        }),
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
          }),
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === currentRoomId) {
            const newMessages = [...room.messages];
            newMessages[newMessages.length - 1].content =
              "서버와 연결할 수 없습니다.";
            return { ...room, messages: newMessages };
          }
          return room;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rooms,
    currentRoom,
    currentRoomId,
    setCurrentRoomId,
    isLoading,
    createNewRoom,
    clearHistory,
    sendMessage,
    chatAreaRef,
  };
};
