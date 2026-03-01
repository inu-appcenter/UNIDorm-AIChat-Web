import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from "lucide-react";
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
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  color: ${(props) => (props.$isActive ? COLORS.inuBlue : COLORS.textMuted)};
  background-color: ${(props) => (props.$isActive ? "#f0f4fa" : "transparent")};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f0f4fa;
    .room-actions {
      opacity: 1;
    }
  }
`;

const RoomTitle = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoomInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: inherit;
  outline: none;
  border-bottom: 1px solid ${COLORS.inuBlue};
  padding: 2px 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  /* 모바일에서는 항상 보이도록 */
  @media (max-width: 768px) {
    opacity: 1;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  border-radius: 6px;
  
  &:hover {
    color: ${COLORS.textDark};
    background-color: rgba(0,0,0,0.05);
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
  onDeleteRoom: (id: string) => void;
  onUpdateRoomTitle: (id: string, title: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  rooms,
  currentRoomId,
  onSelectRoom,
  onNewChat,
  onClearHistory,
  onDeleteRoom,
  onUpdateRoomTitle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEdit = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateRoomTitle(id, editTitle);
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("이 대화방을 삭제하시겠습니까?")) {
      onDeleteRoom(id);
    }
  };

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
            
            {editingId === room.id ? (
              <>
                <RoomInput
                  ref={inputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(e, room.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <IconButton onClick={(e) => saveEdit(e, room.id)}>
                  <Check size={14} />
                </IconButton>
                <IconButton onClick={cancelEdit}>
                  <X size={14} />
                </IconButton>
              </>
            ) : (
              <>
                <RoomTitle>{room.title}</RoomTitle>
                {room.messages.length > 0 && (
                  <ActionButtons className="room-actions">
                    <IconButton onClick={(e) => startEdit(e, room.id, room.title)}>
                      <Edit2 size={14} />
                    </IconButton>
                    <IconButton onClick={(e) => handleDelete(e, room.id)}>
                      <Trash2 size={14} color="#ff4d4f" />
                    </IconButton>
                  </ActionButtons>
                )}
              </>
            )}
          </RoomItem>
        ))}
      </RoomList>
      <SidebarFooter>
        <ClearButton onClick={onClearHistory}>
          <Trash2 size={16} />
          모든 대화 내역 삭제
        </ClearButton>
      </SidebarFooter>
    </SidebarContainer>
  );
};
