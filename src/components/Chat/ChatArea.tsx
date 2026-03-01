import styled from "styled-components";

export const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px 100px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dddddd;
    border-radius: 4px;
  }
`;
