import React from "react";
import styled from "styled-components";
import { MessageSquare, Plus } from "lucide-react";
import { COLORS } from "../../constants/colors";
import type { ChatRoom } from "../../types/chat";

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  width: 280px;
  background-color: ${COLORS.bgWhite};
  border-right: 1px solid #eeeeee;
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
  background-color: ${COLORS.bgWhite};
  color: ${COLORS.textDark};
  border: 1px solid #dddddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  &:hover {
    background-color: #f0f2f5;
  }
`;

const RoomList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-top: 25px;
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

interface SidebarProps {
  isOpen: boolean;
  rooms: ChatRoom[];
  currentRoomId: string;
  onSelectRoom: (id: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  rooms,
  currentRoomId,
  onSelectRoom,
  onNewChat,
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
    </SidebarContainer>
  );
};
