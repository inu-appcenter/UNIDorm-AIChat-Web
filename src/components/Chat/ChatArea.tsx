import styled from "styled-components";

export const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-anchor: none;
  scrollbar-gutter: stable;
  padding: 10px 20px 100px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;

  /* 스크롤 및 드래그 렌더링 최적화 */
  will-change: scroll-position;
  transform: translateZ(0);
  overscroll-behavior-y: contain;

  scrollbar-width: auto;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 9999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.45);
    background-clip: content-box;
  }
`;
