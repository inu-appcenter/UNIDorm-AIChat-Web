import { useState } from "react";
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

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
              currentRoom.messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isError={msg.isError}
                  isLast={index === currentRoom.messages.length - 1}
                  onRetry={() => sendMessage(currentRoom.messages[index-1]?.content || "", true)}
                  onRegenerate={regenerateResponse}
                />
              ))
            )}
          </ChatArea>

          <ChatInput 
            onSendMessage={(msg) => sendMessage(msg)} 
            isLoading={isLoading} 
            onStopGeneration={stopGeneration}
          />
        </MainArea>
      </AppContainer>
    </>
  );
}
