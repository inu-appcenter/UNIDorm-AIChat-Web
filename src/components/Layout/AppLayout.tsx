import styled from "styled-components";

export const AppContainer = styled.div`
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100dvh;
  background: linear-gradient(135deg, #e2eafc 0%, #edf2f7 50%, #fcebb6 100%);
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

export const AmbientOrb = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 350px;
  height: 350px;
  background: radial-gradient(
    circle,
    rgba(0, 62, 147, 0.12) 0%,
    rgba(0, 62, 147, 0) 70%
  );
  filter: blur(40px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
`;
