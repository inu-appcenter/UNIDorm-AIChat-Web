import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Bot, User, RefreshCw, ExternalLink } from "lucide-react";
import { COLORS } from "../../constants/colors";
import type { ChatButton as ChatButtonType } from "../../types/chat";

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  margin-bottom: 24px;
  gap: 12px;
`;

const Avatar = styled.div<{ $isUser: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${(props) => (props.$isUser ? "#e2eafc" : COLORS.inuBlue)};
  color: ${(props) => (props.$isUser ? COLORS.inuBlue : "#ffffff")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  order: ${(props) => (props.$isUser ? 2 : 0)};
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const BubbleContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  max-width: ${(props) => (props.$isUser ? "90%" : "calc(100% - 48px)")};
`;

const MessageBubble = styled.div<{ $isUser: boolean; $isError?: boolean }>`
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  word-break: keep-all;
  overflow-wrap: anywhere;

  background-color: ${(props) => {
    if (props.$isError) return "#fff1f0";
    return props.$isUser ? COLORS.inuBlue : COLORS.bgWhite;
  }};
  
  color: ${(props) => {
    if (props.$isError) return "#ff4d4f";
    return props.$isUser ? "#ffffff" : COLORS.textDark;
  }};

  border: ${(props) => (props.$isError ? "1px solid #ffa39e" : "none")};
  
  border-bottom-right-radius: ${(props) => (props.$isUser ? "6px" : "20px")};
  border-bottom-left-radius: ${(props) => (props.$isUser ? "20px" : "6px")};

  /* Markdown Styles */
  p { margin: 0 0 8px 0; }
  p:last-child { margin: 0; }
  a { 
    color: ${(props) => (props.$isUser ? COLORS.inuYellow : COLORS.inuBlue)}; 
    text-decoration: underline; 
    font-weight: 500;
    word-break: break-all;
  }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 700; }
  code {
    background-color: rgba(0,0,0,0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
`;

const MessageFooter = styled.div<{ $isUser: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #999999;
  flex-direction: ${(props) => (props.$isUser ? "row-reverse" : "row")};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${COLORS.textDark};
    background-color: rgba(0,0,0,0.05);
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

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const StyledButtonLink = styled.a<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none !important;
  transition: all 0.2s ease;
  
  background-color: ${props => props.$primary ? COLORS.inuBlue : "#f0f2f5"};
  color: ${props => props.$primary ? "#ffffff" : COLORS.textDark} !important;
  border: 1px solid ${props => props.$primary ? COLORS.inuBlue : "#e1e4e8"};

  &:hover {
    background-color: ${props => props.$primary ? "#002d6b" : "#e4e6e9"};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  timestamp?: number;
  isError?: boolean;
  isLast?: boolean;
  onRetry?: () => void;
  onRegenerate?: () => void;
  buttons?: ChatButtonType[];
}

/**
 * URL 끝에 붙은 문장 부호와 괄호를 분리하여 정제하는 함수
 */
const cleanUrl = (url: string) => {
  let end = url.length;
  while (end > 0 && /[.,!?;:\])]/.test(url[end - 1])) {
    end--;
  }
  return {
    cleaned: url.substring(0, end),
    rest: url.substring(end)
  };
};

/**
 * 마크다운 링크와 일반 URL을 구분하여 처리하는 정규표현식
 * Group 1, 2: [label](url)
 * Group 3: naked url
 */
const COMBINED_LINK_REGEX = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s가-힣\]()]+)/g;

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  timestamp, 
  isError,
  isLast,
  onRetry,
  onRegenerate,
  buttons 
}) => {
  const isUser = role === "user";
  const isLoading = !isUser && content === "";
  const [copied, setCopied] = useState(false);

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const renderContent = () => {
    // 텍스트 전처리 (마크다운 엔진 전달용 또는 직접 렌더링용)
    const processed = content.replace(COMBINED_LINK_REGEX, (match, label, link, naked) => {
      if (link) {
        // 이미 마크다운 링크인 경우: URL 정제 후 유지
        const { cleaned, rest } = cleanUrl(link);
        return `[${label}](${cleaned})${rest}`;
      } else if (naked) {
        // 일반 URL인 경우: 정제 후 <>로 격리
        const { cleaned, rest } = cleanUrl(naked);
        return `<${cleaned}>${rest}`;
      }
      return match;
    });

    if (isUser) {
        // 사용자 메시지는 마크다운을 적용하지 않고 텍스트로 처리하되 링크만 수동 연결
        // (필요 시 사용자 메시지도 마크다운을 적용하려면 아래 AI 로직과 통일 가능)
        const parts: (string | React.JSX.Element)[] = [];
        let lastIndex = 0;
        let match;
        const regex = new RegExp(COMBINED_LINK_REGEX);
        
        while ((match = regex.exec(content)) !== null) {
            parts.push(content.substring(lastIndex, match.index));
            const [,, link, naked] = match;
            const targetUrl = link || naked;
            const { cleaned, rest } = cleanUrl(targetUrl);
            
            parts.push(
                <a key={match.index} href={cleaned} target="_blank" rel="noopener noreferrer">
                    {cleaned}
                </a>
            );
            parts.push(rest);
            lastIndex = regex.lastIndex;
        }
        parts.push(content.substring(lastIndex));
        return parts;
    }

    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    );
  };

  return (
    <MessageRow $isUser={isUser}>
      {!isUser && (
        <Avatar $isUser={isUser}>
          <Bot size={20} />
        </Avatar>
      )}
      
      <BubbleContainer $isUser={isUser}>
        <MessageBubble $isUser={isUser} $isError={isError}>
          {isLoading ? (
            <LoadingDots>
              <Dot $delay="-0.32s" />
              <Dot $delay="-0.16s" />
              <Dot $delay="0s" />
            </LoadingDots>
          ) : (
            <>
              {renderContent()}
              {buttons && buttons.length > 0 && (
                <ButtonContainer>
                  {buttons.map((btn, idx) => (
                    <StyledButtonLink 
                      key={idx} 
                      href={btn.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      $primary={btn.primary}
                    >
                      {btn.label}
                      <ExternalLink size={14} />
                    </StyledButtonLink>
                  ))}
                </ButtonContainer>
              )}
            </>
          )}
        </MessageBubble>

        {(!isLoading && (timestamp || !isUser)) && (
          <MessageFooter $isUser={isUser}>
            {timestamp && <span>{formatTime(timestamp)}</span>}
            
            {!isUser && !isError && content && (
              <>
                <ActionButton onClick={handleCopy} title="답변 복사">
                  {copied ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                  {copied ? "복사됨" : "복사"}
                </ActionButton>
                
                {isLast && onRegenerate && (
                  <ActionButton onClick={onRegenerate} title="다시 생성">
                    <RefreshCw size={12} /> 다시 생성
                  </ActionButton>
                )}
              </>
            )}

            {isError && onRetry && (
              <ActionButton onClick={onRetry} style={{ color: "#ff4d4f" }}>
                <RefreshCw size={12} /> 재시도
              </ActionButton>
            )}
          </MessageFooter>
        )}
      </BubbleContainer>
    </MessageRow>
  );
};
