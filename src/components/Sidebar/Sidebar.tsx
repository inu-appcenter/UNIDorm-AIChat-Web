import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Home,
  GraduationCap,
  PanelLeftClose,
} from "lucide-react";
import { COLORS } from "../../constants/colors";
import type { ChatRoom } from "../../types/chat";
import AppCenterLogo from "../../assets/텍스트O_블랙.png";
import ChatbotLogo from "../../assets/chatbot-logo.svg";

// 추후 로고 이미지 파일을 추가하려면 아래 주석을 해제하고 이미지 파일명을 적절히 설정하세요.
// import UnidormLogoImg from "../../assets/unidorm-logo.png";
// import IntipLogoImg from "../../assets/intip-logo.png";
const UNIDORM_LOGO_SRC: string | null = null; // UnidormLogoImg
const INTIP_LOGO_SRC: string | null = null; // IntipLogoImg

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  width: 280px;
  flex-shrink: 0;
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;

  /* PC에서 닫혔을 때: 마진만 음수로 조절하여 메인 영역이 자연스럽게 확장되게 함 */
  ${(props) =>
    !props.$isOpen &&
    `
    margin-left: -280px;
    opacity: 0;
    pointer-events: none;
  `}

  @media (max-width: 768px) {
    position: absolute;
    height: 100%;
    margin-left: 0;
    opacity: 1;
    pointer-events: auto;
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
  padding: 0 4px;
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BrandLogo = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`;

const BrandName = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${COLORS.textDark};
  font-family:
    "Pretendard",
    -apple-system,
    sans-serif;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.textDark};
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
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
  gap: 8px;
  padding: 8px;
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
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ServiceLogoCircle = styled.div<{ $service: "unidorm" | "intip" }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background-color: ${(props) =>
    props.$service === "unidorm" ? "#eef2ff" : "#ecfdf5"};
  color: ${(props) => (props.$service === "unidorm" ? "#0046ff" : "#10b981")};
  border: 1.5px solid
    ${(props) => (props.$service === "unidorm" ? "#d0deff" : "#a7f3d0")};
`;

const ServiceLogoImage = styled.img`
  width: 14px;
  height: 14px;
  object-fit: contain;
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

const LogoContainer = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0 5px 0;
  opacity: 0.9;
  cursor: pointer;
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 1;
  }
`;

const LogoImage = styled.img`
  width: 180px;
  height: auto;
  object-fit: contain;
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
  onToggleSidebar: () => void;
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
  onToggleSidebar,
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
    if (window.confirm("이 대화방을 삭제할까요?")) {
      onDeleteRoom(id);
    }
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <SidebarHeader>
        <SidebarBrand>
          <BrandLogo src={ChatbotLogo} alt="챗불이 로고" />
          <BrandName>챗불이</BrandName>
        </SidebarBrand>
        <CollapseButton onClick={onToggleSidebar} title="사이드바 닫기">
          <PanelLeftClose size={20} />
        </CollapseButton>
      </SidebarHeader>

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
            <ServiceLogoCircle $service={room.service || "unidorm"}>
              {(room.service || "unidorm") === "intip" ? (
                INTIP_LOGO_SRC ? (
                  <ServiceLogoImage src={INTIP_LOGO_SRC} alt="INTIP" />
                ) : (
                  <GraduationCap size={12} />
                )
              ) : UNIDORM_LOGO_SRC ? (
                <ServiceLogoImage src={UNIDORM_LOGO_SRC} alt="UNIDorm" />
              ) : (
                <Home size={12} />
              )}
            </ServiceLogoCircle>

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
                    <IconButton
                      onClick={(e) => startEdit(e, room.id, room.title)}
                    >
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
        <LogoContainer
          href="https://home.inuappcenter.kr"
          target="_blank"
          rel="noopener noreferrer"
        >
          <LogoImage src={AppCenterLogo} alt="App Center Logo" />
        </LogoContainer>
      </SidebarFooter>
    </SidebarContainer>
  );
};
