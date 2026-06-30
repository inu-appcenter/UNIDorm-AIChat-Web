import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Menu, PanelLeftClose, ChevronDown } from "lucide-react";
import { COLORS } from "../../constants/colors";

const HeaderContainer = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: transparent;
  color: ${COLORS.textDark};
  z-index: 10;
  position: relative;
`;

const HeaderTitleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  padding: 6px 10px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const BetaBadge = styled.span`
  background: linear-gradient(142deg, #007aff 26.94%, #570099 87.68%);
  color: #fafafa;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.08);
  width: 280px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 100;
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownItem = styled.div<{ $isActive: boolean }>`
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isActive ? "#f0f4fa" : "transparent"};

  &:hover {
    background-color: #f0f4fa;
  }
`;

const ItemTitle = styled.div<{ $isActive: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.$isActive ? COLORS.inuBlue : COLORS.textDark};
  margin-bottom: 2px;
`;

const ItemDesc = styled.div`
  font-size: 11px;
  color: ${COLORS.textMuted};
  line-height: 1.3;
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
  activeService: "unidorm" | "intip";
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeService,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isDropdownOpen]);

  const handleServiceSelect = (service: "unidorm" | "intip") => {
    if (service !== activeService) {
      if (service === "unidorm") {
        window.alert("해당 서비스는 유니돔 앱에서 사용할 수 있어요.");
      } else {
        window.alert("해당 서비스는 인팁 앱에서 사용할 수 있어요.");
      }
    }
    setIsDropdownOpen(false);
  };

  const getServiceLabel = () => {
    return activeService === "intip" ? "챗불이" : "챗불이 in UNIDorm";
  };

  return (
    <HeaderContainer>
      <MenuButton onClick={onToggleSidebar}>
        {isSidebarOpen ? (
          <PanelLeftClose size={24} />
        ) : (
          <Menu size={24} />
        )}
      </MenuButton>

      <HeaderTitleContainer ref={dropdownRef}>
        <HeaderTitle onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          {getServiceLabel()}
          <ChevronDown size={16} style={{ opacity: 0.7, transform: isDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
          <BetaBadge>BETA</BetaBadge>
        </HeaderTitle>

        {isDropdownOpen && (
          <DropdownMenu>
            <DropdownItem 
              $isActive={activeService === "intip"} 
              onClick={() => handleServiceSelect("intip")}
            >
              <ItemTitle $isActive={activeService === "intip"}>챗불이</ItemTitle>
              <ItemDesc>학사 관련 질문을 할 수 있어요</ItemDesc>
            </DropdownItem>
            <DropdownItem 
              $isActive={activeService === "unidorm"} 
              onClick={() => handleServiceSelect("unidorm")}
            >
              <ItemTitle $isActive={activeService === "unidorm"}>챗불이 in UNIDorm</ItemTitle>
              <ItemDesc>기숙사 관련 질문을 할 수 있어요</ItemDesc>
            </DropdownItem>
          </DropdownMenu>
        )}
      </HeaderTitleContainer>
    </HeaderContainer>
  );
};
