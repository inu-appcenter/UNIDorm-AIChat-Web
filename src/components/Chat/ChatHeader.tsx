import React from "react";
import styled from "styled-components";
import { Menu, PanelLeftClose } from "lucide-react";
import { COLORS } from "../../constants/colors";

const HeaderContainer = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: transparent;
  color: ${COLORS.textDark};
  z-index: 10;
`;

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BetaBadge = styled.span`
  background-color: ${COLORS.inuBlue};
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 1px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin-right: 10px;
  color: ${COLORS.textDark};
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <HeaderContainer>
      <MenuButton onClick={onToggleSidebar}>
        {isSidebarOpen ? (
          <PanelLeftClose size={24} />
        ) : (
          <Menu size={24} />
        )}
      </MenuButton>
      <HeaderTitle>
        챗불이 in UNIDorm
        <BetaBadge>Beta</BetaBadge>
      </HeaderTitle>
    </HeaderContainer>
  );
};
