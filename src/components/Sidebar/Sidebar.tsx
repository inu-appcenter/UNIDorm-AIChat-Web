import React from "react";
import styled from "styled-components";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/colors";
import type { ChatRoom } from "../../types/chat";

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  width: 280px;
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  padding: 20px 15px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
  @media (max-width: 768px) {
    position: absolute;
    height: 100%;
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  }
`;

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background-color: rgba(255, 255, 255, 0.5);
  color: ${COLORS.textDark};
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-bottom: 25px;
  &:hover {
    background-color: rgba(240, 242, 245, 0.8);
  }
`;

const RoomList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dddddd;
    border-radius: 4px;
  }
`;

const RoomItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  color: ${(props) => (props.$isActive ? COLORS.inuBlue : COLORS.textMuted)};
  background-color: ${(props) => (props.$isActive ? "#f0f4fa" : "transparent")};
  transition: background-color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    background-color: #f0f4fa;
  }
`;

const SidebarFooter = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eeeeee;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #fff1f0;
  }
`;

interface SidebarProps {
  isOpen: boolean;
  rooms: ChatRoom[];
  currentRoomId: string;
  onSelectRoom: (id: string) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  rooms,
  currentRoomId,
  onSelectRoom,
  onNewChat,
  onClearHistory,
}) => {
  return (
    <SidebarContainer $isOpen={isOpen}>
      <NewChatButton onClick={onNewChat}>
        <Plus size={18} />
        새로운 대화
      </NewChatButton>
      <RoomList>
        {rooms.map((room) => (
          <RoomItem
            key={room.id}
            $isActive={room.id === currentRoomId}
            onClick={() => onSelectRoom(room.id)}
          >
            <MessageSquare size={16} />
            {room.title}
          </RoomItem>
        ))}
      </RoomList>
      <SidebarFooter>
        <ClearButton onClick={onClearHistory}>
          <Trash2 size={16} />
          대화 내역 삭제
        </ClearButton>
      </SidebarFooter>
    </SidebarContainer>
  );
};
