import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Menu,
  PanelLeftClose,
  ChevronDown,
  Home,
  GraduationCap,
} from "lucide-react";
import { COLORS } from "../../constants/colors";
import TooltipMessage from "../Common/TooltipMessage";

// 추후 로고 이미지 파일을 추가하려면 아래 주석을 해제하고 이미지 파일명을 적절히 설정하세요.
// import UnidormLogoImg from "../../assets/unidorm-logo.png";
// import IntipLogoImg from "../../assets/intip-logo.png";
const UNIDORM_LOGO_SRC: string | null = null; // UnidormLogoImg
const INTIP_LOGO_SRC: string | null = null; // IntipLogoImg

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
  gap: 8px;
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
  //left: 10px;
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
  background-color: ${(props) => (props.$isActive ? "#f0f4fa" : "transparent")};
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background-color: #f0f4fa;
  }
`;

const ItemTitle = styled.div<{ $isActive: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => (props.$isActive ? COLORS.inuBlue : COLORS.textDark)};
  margin-bottom: 2px;
`;

const ItemDesc = styled.div`
  font-size: 11px;
  color: ${COLORS.textMuted};
  line-height: 1.3;
`;

const LogoCircle = styled.div<{ $service: "unidorm" | "intip" }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background-color: ${(props) =>
    props.$service === "unidorm" ? "#eef2ff" : "#ecfdf5"};
  color: ${(props) => (props.$service === "unidorm" ? "#0046ff" : "#10b981")};
  border: 1px solid
    ${(props) => (props.$service === "unidorm" ? "#d0deff" : "#a7f3d0")};
`;

const LogoImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
`;

const MenuButton = styled.button<{ $isSidebarOpen: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${COLORS.textDark};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;

  // 전환 효과 설정 (사이드바 0.3s 애니메이션과 동기화)
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  // PC에서 사이드바가 열려있을 때 서서히 크기와 여백을 0으로 만들어 튀는 현상 방지
  width: ${(props) => (props.$isSidebarOpen ? "0px" : "36px")};
  height: ${(props) => (props.$isSidebarOpen ? "0px" : "36px")};
  padding: ${(props) => (props.$isSidebarOpen ? "0px" : "6px")};
  margin-right: ${(props) => (props.$isSidebarOpen ? "0px" : "10px")};
  opacity: ${(props) => (props.$isSidebarOpen ? 0 : 1)};
  pointer-events: ${(props) => (props.$isSidebarOpen ? "none" : "auto")};

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    // 모바일에서는 항상 일반 노출
    width: 36px;
    height: 36px;
    padding: 6px;
    margin-right: 10px;
    opacity: 1;
    pointer-events: auto;
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
  const [showTooltip, setShowTooltip] = useState(
    () => !localStorage.getItem("has_closed_service_tooltip")
  );

  const handleCloseTooltip = () => {
    localStorage.setItem("has_closed_service_tooltip", "true");
    setShowTooltip(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
      <MenuButton onClick={onToggleSidebar} $isSidebarOpen={isSidebarOpen}>
        {isSidebarOpen ? <PanelLeftClose size={24} /> : <Menu size={24} />}
      </MenuButton>

      <HeaderTitleContainer ref={dropdownRef}>
        <HeaderTitle onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          {getServiceLabel()}
          <ChevronDown
            size={16}
            style={{
              opacity: 0.7,
              transform: isDropdownOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
          <BetaBadge>BETA</BetaBadge>
        </HeaderTitle>

        {showTooltip && !isDropdownOpen && (
          <TooltipMessage
            message="다양한 챗봇 서비스를 확인해보세요!"
            onClose={handleCloseTooltip}
            position="bottom"
            align="left"
            minWidth="220px"
          />
        )}

        {isDropdownOpen && (
          <DropdownMenu>
            <DropdownItem
              $isActive={activeService === "intip"}
              onClick={() => handleServiceSelect("intip")}
            >
              <LogoCircle $service="intip">
                {INTIP_LOGO_SRC ? (
                  <LogoImage src={INTIP_LOGO_SRC} alt="INTIP Logo" />
                ) : (
                  <GraduationCap size={16} />
                )}
              </LogoCircle>
              <div>
                <ItemTitle $isActive={activeService === "intip"}>
                  챗불이
                </ItemTitle>
                <ItemDesc>학사 관련 질문을 할 수 있어요</ItemDesc>
              </div>
            </DropdownItem>
            <DropdownItem
              $isActive={activeService === "unidorm"}
              onClick={() => handleServiceSelect("unidorm")}
            >
              <LogoCircle $service="unidorm">
                {UNIDORM_LOGO_SRC ? (
                  <LogoImage src={UNIDORM_LOGO_SRC} alt="UNIDorm Logo" />
                ) : (
                  <Home size={16} />
                )}
              </LogoCircle>
              <div>
                <ItemTitle $isActive={activeService === "unidorm"}>
                  챗불이 in UNIDorm
                </ItemTitle>
                <ItemDesc>기숙사 관련 질문을 할 수 있어요</ItemDesc>
              </div>
            </DropdownItem>
          </DropdownMenu>
        )}
      </HeaderTitleContainer>
    </HeaderContainer>
  );
};
