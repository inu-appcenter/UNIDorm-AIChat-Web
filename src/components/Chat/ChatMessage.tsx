import React, { useState } from "react";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import LoadingAnimation from "../../assets/횃불이ai로딩애니메이션.gif";
import { COLORS } from "../../constants/colors";
import type { ChatButton as ChatButtonType } from "../../types/chat";
import {
  splitContentByButtonPlaceholders,
  stripButtonPlaceholders,
} from "../../utils/chatButtons";



const MessageRow = styled.div<{ $isUser: boolean }>`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  margin-bottom: 24px;
  gap: 12px;
`;

const BubbleContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  max-width: ${(props) => (props.$isUser ? "80%" : "100%")};
  width: ${(props) => (props.$isUser ? "auto" : "100%")};
`;

const MessageBubble = styled.div<{ $isUser: boolean; $isError?: boolean }>`
  padding: ${(props) => (props.$isUser ? "12px 18px" : "8px 0px")};
  font-size: 15px;
  line-height: 1.6;
  word-break: keep-all;
  overflow-wrap: anywhere;

  background-color: ${(props) => {
    if (props.$isError) return "#fff1f0";
    return props.$isUser ? "rgba(255, 255, 255, 0.10)" : "transparent";
  }};

  backdrop-filter: none;

  color: ${(props) => {
    if (props.$isError) return "#ff4d4f";
    return COLORS.textDark;
  }};

  border: ${(props) => {
    if (props.$isError) return "1px solid #ffa39e";
    return props.$isUser ? "0.5px solid #E7E7E7" : "none";
  }};

  box-shadow: ${(props) => {
    if (props.$isError) return "none";
    return props.$isUser ? "0px 2px 10px 0px rgba(0, 0, 0, 0.03)" : "none";
  }};

  border-radius: ${(props) => (props.$isUser ? "8px 8px 0px 8px" : "0px")};


  /* Markdown Styles */
  p {
    margin: 0 0 8px 0;
  }
  p:last-child {
    margin: 0;
  }
  a {
    color: ${(props) => (props.$isUser ? COLORS.inuYellow : COLORS.inuBlue)};
    text-decoration: underline;
    font-weight: 500;
    word-break: break-all;
  }
  ul,
  ol {
    margin: 8px 0;
    padding-left: 24px;
  }
  li {
    margin-bottom: 4px;
  }
  strong {
    font-weight: 700;
  }
  code {
    background-color: rgba(0, 0, 0, 0.05);
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
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const LoadingGif = styled.img`
  width: 48px;
  height: auto;
  display: block;
  margin-top: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
`;

const StyledButtonLink = styled.a<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 60px; /* Aligned to chip rounded design */
  font-size: 14px;
  font-weight: 600;
  text-decoration: none !important;
  transition: all 0.2s ease;
  cursor: pointer;

  background-color: ${(props) => (props.$primary ? COLORS.figmaBlue : "#ffffff")};
  color: ${(props) => (props.$primary ? "#ffffff" : COLORS.figmaBlue)} !important;
  border: 1.5px solid ${COLORS.figmaBlue};
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.08);

  &:hover {
    background-color: ${(props) => (props.$primary ? "#0056b3" : "rgba(225, 236, 255, 0.2)")};
    transform: translateY(-1.5px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(2px);
  }
`;

interface ChatMessageProps {
  role: "user" | "ai" | "assistant";
  content: string;
  timestamp?: number | Date;
  isError?: boolean;
  isLast?: boolean;
  onRetry?: () => void;
  onRegenerate?: () => void;
  buttons?: ChatButtonType[];
  isAuthenticated: boolean;
  onRequiredLogin: () => void;
  serverMsgId?: string;
  feedbackScore?: 1 | -1 | null;
  onFeedback?: (score: 1 | -1) => void;
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
    rest: url.substring(end),
  };
};

/**
 * 마크다운 링크와 일반 URL을 구분하여 처리하는 정규표현식
 * Group 1, 2: [label](url)
 * Group 3: naked url
 */
const COMBINED_LINK_REGEX =
  /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s가-힣\]()]+)/g;

/**
 * 링크 텍스트가 URL 날것인 경우 "바로가기"로 대체하는 헬퍼 함수
 */
const renderLinkText = (children: React.ReactNode, href?: string) => {
  if (typeof children === "string") {
    const trimmed = children.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed === href
    ) {
      return "바로가기";
    }
  }
  if (Array.isArray(children) && children.length === 1) {
    const firstChild = children[0];
    if (typeof firstChild === "string") {
      const trimmed = firstChild.trim();
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed === href
      ) {
        return "바로가기";
      }
    }
  }
  return children;
};

/**
 * 텍스트 노드를 단어 단위로 쪼개어 페이드인 효과(fade-in-word class)를 적용하는 헬퍼 함수
 */
const wrapTextWithSpans = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === "string") {
    if (!children) return children;
    const words = children.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.trim() === "") {
        return <React.Fragment key={i}>{word}</React.Fragment>;
      }
      return (
        <span key={i} className="fade-in-word">
          {word}
        </span>
      );
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <React.Fragment key={index}>
        {wrapTextWithSpans(child)}
      </React.Fragment>
    ));
  }

  return children;
};

const markdownComponents: any = {
  p: ({ children }: { children: React.ReactNode }) => <p>{wrapTextWithSpans(children)}</p>,
  li: ({ children }: { children: React.ReactNode }) => <li>{wrapTextWithSpans(children)}</li>,
  strong: ({ children }: { children: React.ReactNode }) => <strong>{wrapTextWithSpans(children)}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em>{wrapTextWithSpans(children)}</em>,
  h1: ({ children }: { children: React.ReactNode }) => <h1>{wrapTextWithSpans(children)}</h1>,
  h2: ({ children }: { children: React.ReactNode }) => <h2>{wrapTextWithSpans(children)}</h2>,
  h3: ({ children }: { children: React.ReactNode }) => <h3>{wrapTextWithSpans(children)}</h3>,
  h4: ({ children }: { children: React.ReactNode }) => <h4>{wrapTextWithSpans(children)}</h4>,
  h5: ({ children }: { children: React.ReactNode }) => <h5>{wrapTextWithSpans(children)}</h5>,
  h6: ({ children }: { children: React.ReactNode }) => <h6>{wrapTextWithSpans(children)}</h6>,
  a: ({ children, href, ...props }: { children: React.ReactNode; href?: string; [key: string]: any }) => (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
      {wrapTextWithSpans(renderLinkText(children, href))}
    </a>
  ),
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  isError,
  isLast,
  onRetry,
  onRegenerate,
  buttons,
  isAuthenticated,
  onRequiredLogin,
  serverMsgId,
  feedbackScore,
  onFeedback,
}) => {
  const isUser = role === "user";
  const isLoading = !isUser && content === "";
  const [copied, setCopied] = useState(false);
  const copyableContent = stripButtonPlaceholders(content);

  const formatTime = (ts?: number | Date) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleAuthAction = (action: () => void) => {
    if (!isAuthenticated) {
      if (
        window.confirm(
          "로그인이 필요한 서비스입니다. 로그인 페이지로 이동할까요?",
        )
      ) {
        onRequiredLogin();
      }
      return;
    }
    action();
  };

  const renderContent = () => {
    // 텍스트 전처리 (마크다운 엔진 전달용 또는 직접 렌더링용)
    const processed = content.replace(
      COMBINED_LINK_REGEX,
      (match, label, link, naked) => {
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
      },
    );

    if (isUser) {
      // 사용자 메시지는 마크다운을 적용하지 않고 텍스트로 처리하되 링크만 수동 연결
      // (필요 시 사용자 메시지도 마크다운을 적용하려면 아래 AI 로직과 통일 가능)
      const parts: (string | React.JSX.Element)[] = [];
      let lastIndex = 0;
      let match;
      const regex = new RegExp(COMBINED_LINK_REGEX);

      while ((match = regex.exec(content)) !== null) {
        parts.push(content.substring(lastIndex, match.index));
        const [, , link, naked] = match;
        const targetUrl = link || naked;
        const { cleaned, rest } = cleanUrl(targetUrl);

        parts.push(
          <a
            key={match.index}
            href={cleaned}
            target="_blank"
            rel="noopener noreferrer"
          >
            {cleaned}
          </a>,
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
        components={markdownComponents}
      >
        {processed}
      </ReactMarkdown>
    );
  };

  const renderRichContent = () => {
    if (isUser || !buttons || buttons.length === 0) {
      return renderContent();
    }

    const normalizeLinks = (value: string) =>
      value.replace(COMBINED_LINK_REGEX, (match, label, link, naked) => {
        if (link) {
          const { cleaned, rest } = cleanUrl(link);
          return `[${label}](${cleaned})${rest}`;
        }

        if (naked) {
          const { cleaned, rest } = cleanUrl(naked);
          return `<${cleaned}>${rest}`;
        }

        return match;
      });

    const renderMarkdown = (value: string, key: React.Key) => {
      if (!value.trim()) return null;

      return (
        <ReactMarkdown
          key={key}
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {normalizeLinks(value)}
        </ReactMarkdown>
      );
    };

    const segments = splitContentByButtonPlaceholders(content);

    if (segments.length === 0) {
      return renderMarkdown(content, "content");
    }

    return segments.map((segment, index) => {
      if (segment.type === "text") {
        return renderMarkdown(segment.value, `text-${index}`);
      }

      const button = buttons[segment.index];
      if (!button) return null;

      return (
        <ButtonContainer key={`button-${index}`}>
          <StyledButtonLink
            href={button.url}
            target="_top"
            rel="noopener noreferrer"
            $primary={button.primary}
          >
            {button.label}
            <ExternalLink size={14} />
          </StyledButtonLink>
        </ButtonContainer>
      );
    });
  };

  return (
    <MessageRow $isUser={isUser} className={isUser ? "chat-message-user" : "chat-message-ai"}>
      {/*{!isUser && (*/}
      {/*  <Avatar $isUser={isUser}>*/}
      {/*    <Bot size={20} />*/}
      {/*  </Avatar>*/}
      {/*)}*/}

      <BubbleContainer $isUser={isUser}>
        <MessageBubble $isUser={isUser} $isError={isError}>
          {isLoading ? (
            <LoadingGif src={LoadingAnimation} alt="답변 생성 중..." />
          ) : (
            <>
              {renderRichContent()}
            </>
          )}
        </MessageBubble>

        {!isLoading && (timestamp || !isUser) && (
          <MessageFooter $isUser={isUser}>
            {timestamp && <span>{formatTime(timestamp)}</span>}

            {!isUser && !isError && content && (
              <>
                <ActionButton onClick={handleCopy} title="답변 복사">
                  {copied ? (
                    <Check size={12} color="#52c41a" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? "복사됨" : "복사"}
                </ActionButton>

                {onFeedback && serverMsgId && (
                  <>
                    <ActionButton
                      onClick={() => handleAuthAction(() => onFeedback(1))}
                      title="좋아요"
                      style={feedbackScore === 1 ? { color: COLORS.inuBlue, fontWeight: 600 } : undefined}
                    >
                      <ThumbsUp size={12} color={feedbackScore === 1 ? COLORS.inuBlue : undefined} />
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleAuthAction(() => onFeedback(-1))}
                      title="싫어요"
                      style={feedbackScore === -1 ? { color: "#ff4d4f", fontWeight: 600 } : undefined}
                    >
                      <ThumbsDown size={12} color={feedbackScore === -1 ? "#ff4d4f" : undefined} />
                    </ActionButton>
                  </>
                )}

                {isLast && onRegenerate && (
                  <ActionButton
                    onClick={() => handleAuthAction(onRegenerate)}
                    title="다시 생성"
                  >
                    <RefreshCw size={12} /> 다시 생성
                  </ActionButton>
                )}
              </>
            )}

            {isError && onRetry && (
              <ActionButton
                onClick={() => handleAuthAction(onRetry)}
                style={{ color: "#ff4d4f" }}
              >
                <RefreshCw size={12} /> 재시도
              </ActionButton>
            )}
          </MessageFooter>
        )}
      </BubbleContainer>
    </MessageRow>
  );
};
