import React from "react";
import styled, { keyframes } from "styled-components";
import { COLORS } from "../../constants/colors";

const bounce = keyframes`
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-8px);
  }
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  margin-bottom: 20px;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 14px 20px;
  border-radius: 24px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  background-color: ${(props) =>
    props.$isUser ? COLORS.inuBlue : COLORS.bgWhite};
  color: ${(props) => (props.$isUser ? "#ffffff" : COLORS.textDark)};
  border-bottom-right-radius: ${(props) => (props.$isUser ? "6px" : "24px")};
  border-bottom-left-radius: ${(props) => (props.$isUser ? "24px" : "6px")};

  a {
    color: ${(props) => (props.$isUser ? COLORS.inuYellow : COLORS.inuBlue)};
    text-decoration: underline;
    font-weight: 500;
    word-break: break-all;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
`;

const Dot = styled.div<{ $delay: string }>`
  width: 6px;
  height: 6px;
  background-color: #bbbbbb;
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite ease-in-out both;
  animation-delay: ${(props) => props.$delay};
`;

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
}

const formatMessageContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    return part;
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === "user";
  const isLoading = !isUser && content === "";

  return (
    <MessageRow $isUser={isUser}>
      <MessageBubble $isUser={isUser}>
        {isLoading ? (
          <LoadingDots>
            <Dot $delay="-0.32s" />
            <Dot $delay="-0.16s" />
            <Dot $delay="0s" />
          </LoadingDots>
        ) : (
          formatMessageContent(content)
        )}
      </MessageBubble>
    </MessageRow>
  );
};
