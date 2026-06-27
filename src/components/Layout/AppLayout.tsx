import styled from "styled-components";

export const AppContainer = styled.div`
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100dvh;
  background: linear-gradient(163.11deg, rgb(240, 240, 255) 10.193%, rgb(253, 253, 255) 111.84%);
  /* overflow: hidden; 대신 기본 스크롤 허용하여 새로고침 제스처 인식 */
`;

export const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: ${(props) => (props.$isOpen ? "block" : "none")};
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 40;
  }
`;

export const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

export const AmbientOrb = styled.img`
  position: absolute;
  top: 404px;
  left: 50%;
  transform: translateX(-50%);
  width: 512px;
  height: 549.5px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
`;
