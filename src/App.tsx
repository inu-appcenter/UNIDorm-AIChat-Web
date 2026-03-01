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
    clearHistory,
    sendMessage,
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
        />

        <MainArea>
          <AmbientOrb />

          <ChatHeader
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />

          <ChatArea ref={chatAreaRef}>
            {currentRoom.messages.length === 0 ? (
              <GuideScreen onSelectGuide={sendMessage} />
            ) : (
              currentRoom.messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
              ))
            )}
          </ChatArea>

          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </MainArea>
      </AppContainer>
    </>
  );
}
