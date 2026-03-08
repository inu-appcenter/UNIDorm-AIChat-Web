import React, { useState } from "react";
import styled from "styled-components";
import { GlobalStyle } from "./styles/GlobalStyle";
import { useChat } from "./hooks/useChat";
import { Sidebar } from "./components/Sidebar/Sidebar";
import {
  AppContainer,
  Overlay,
  MainArea,
  AmbientOrb,
} from "./components/Layout/AppLayout";
import { ChatHeader } from "./components/Chat/ChatHeader";
import { ChatArea } from "./components/Chat/ChatArea";
import { ChatMessage } from "./components/Chat/ChatMessage";
import { ChatInput } from "./components/Chat/ChatInput";
import { GuideScreen } from "./components/Chat/GuideScreen";
import { COLORS } from "./constants/colors";

const Disclaimer = styled.div`
  font-size: 11px;
  color: ${COLORS.textMuted};
  //text-align: center;
  padding: 10px 20px;
  opacity: 0.7;
  line-height: 1.4;
  width: 100%;
  max-width: 800px;
  margin-top: -12px;
  margin-bottom: 24px;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const DateSeparatorContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 32px 0 16px 0;
`;

const DateLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: #eeeeee;
`;

const DateText = styled.div`
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  color: #999999;
  background-color: transparent;
`;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const {
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
  } = useChat();

  const handleSelectRoom = (id: string) => {
    setCurrentRoomId(id);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    createNewRoom();
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatSeparatorDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const isDifferentDay = (idx: number) => {
    if (idx === 0) return true;
    const prev = currentRoom.messages[idx - 1].timestamp;
    const curr = currentRoom.messages[idx].timestamp;
    if (!prev || !curr) return false;

    const prevDate = new Date(prev).toDateString();
    const currDate = new Date(curr).toDateString();
    return prevDate !== currDate;
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Overlay
          $isOpen={isSidebarOpen}
          onClick={() => setIsSidebarOpen(false)}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          rooms={rooms}
          currentRoomId={currentRoomId}
          onSelectRoom={handleSelectRoom}
          onNewChat={handleNewChat}
          onClearHistory={clearHistory}
          onDeleteRoom={deleteRoom}
          onUpdateRoomTitle={updateRoomTitle}
        />

        <MainArea>
          <AmbientOrb />

          <ChatHeader
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />

          <ChatArea ref={chatAreaRef}>
            {currentRoom.messages.length === 0 ? (
              <GuideScreen onSelectGuide={(msg) => sendMessage(msg)} />
            ) : (
              <>
                {currentRoom.messages.map((msg, index) => (
                  <React.Fragment key={index}>
                    {isDifferentDay(index) && (
                      <DateSeparatorContainer>
                        <DateLine />
                        <DateText>{formatSeparatorDate(msg.timestamp)}</DateText>
                        <DateLine />
                      </DateSeparatorContainer>
                    )}
                    <ChatMessage
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                      isError={msg.isError}
                      buttons={msg.buttons}
                      isLast={index === currentRoom.messages.length - 1}
                      onRetry={() =>
                        sendMessage(
                          currentRoom.messages[index - 1]?.content || "",
                          true,
                        )
                      }
                      onRegenerate={regenerateResponse}
                    />
                  </React.Fragment>
                ))}
                <Disclaimer>
                  챗불이는 AI이며 실수할 수 있습니다.
                  <br />
                  중요한 정보는 직접 확인하세요.
                </Disclaimer>
              </>
            )}
          </ChatArea>

          <ChatInput
            onSendMessage={(msg) => sendMessage(msg)}
            isLoading={isLoading}
            onStopGeneration={stopGeneration}
            selectedChatbotType={selectedChatbotType}
            onChatbotTypeChange={setSelectedChatbotType}
          />
        </MainArea>
      </AppContainer>
    </>
  );
}
