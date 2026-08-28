import React, { useState, useRef } from "react";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import LoadingAnimation from "../../assets/횃불이ai로딩애니메이션.gif";
import { COLORS } from "../../constants/colors";
import type { ChatButton as ChatButtonType } from "../../types/chat";
import TooltipMessage from "../Common/TooltipMessage";
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
  padding: ${(props) => (props.$isUser ? "16px" : "8px 0px")};
  font-size: ${(props) => (props.$isUser ? "16px" : "15px")};
  line-height: ${(props) => (props.$isUser ? "22px" : "1.6")};
  font-weight: ${(props) => (props.$isUser ? "400" : "inherit")};
  word-break: keep-all;
  overflow-wrap: anywhere;

  background-color: ${(props) => {
    if (props.$isError) return "#fff1f0";
    return props.$isUser ? COLORS.figmaBlue : "transparent";
  }};

  backdrop-filter: none;

  color: ${(props) => {
    if (props.$isError) return "#ff4d4f";
    return props.$isUser ? "#ffffff" : COLORS.textDark;
  }};

  border: ${(props) => {
    if (props.$isError) return "1px solid #ffa39e";
    return "none";
  }};

  box-shadow: none;

  border-radius: ${(props) => (props.$isUser ? "8px" : "0px")};

  /* Markdown Styles */
  p {
    margin: 0 0 8px 0;
  }
  p:last-child {
    margin: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 14px 0 6px 0;
    font-weight: 700;
    line-height: 1.4;
    color: inherit;
    &:first-child {
      margin-top: 0;
    }
  }
  h1 {
    font-size: 1.25em;
  }
  h2 {
    font-size: 1.15em;
  }
  h3 {
    font-size: 1.05em;
  }
  h4,
  h5,
  h6 {
    font-size: 1em;
  }

  a {
    color: ${(props) => (props.$isUser ? "#ffd700" : COLORS.inuBlue)};
    text-decoration: underline;
    font-weight: 500;
    word-break: break-all;
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 22px;
  }
  li {
    margin-bottom: 4px;
  }
  li:last-child {
    margin-bottom: 0;
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

  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: 13px;
    }
  }

  blockquote {
    margin: 8px 0;
    padding: 6px 12px;
    border-left: 3.5px solid ${COLORS.figmaBlue};
    background-color: rgba(0, 122, 255, 0.04);
    border-radius: 0 6px 6px 0;
    color: #4a5568;

    p {
      margin: 0;
    }
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 14px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 13.5px;
    text-align: left;
  }

  th {
    background-color: rgba(0, 122, 255, 0.08);
    color: ${COLORS.textDark};
    font-weight: 600;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
  }

  td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
  }

  tr:nth-child(even) td {
    background-color: rgba(0, 0, 0, 0.015);
  }

  input[type="checkbox"] {
    margin-right: 6px;
    vertical-align: middle;
  }

  /* KaTeX Math Styles */
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0;
    margin: 8px 0;
  }

  .katex {
    font-size: 1.05em;
    text-rendering: auto;
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

  background-color: ${(props) =>
    props.$primary ? COLORS.figmaBlue : "#ffffff"};
  color: ${(props) =>
    props.$primary ? "#ffffff" : COLORS.figmaBlue} !important;
  border: 1.5px solid ${COLORS.figmaBlue};
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.08);

  &:hover {
    background-color: ${(props) =>
      props.$primary ? "#0056b3" : "rgba(225, 236, 255, 0.2)"};
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
  showTooltip?: boolean;
  onCloseTooltip?: () => void;
}

/**
 * URL 끝에 붙은 문장 부호와 괄호, 따옴표를 분리하여 정제하는 함수
 */
const cleanUrl = (url: string) => {
  let end = url.length;
  while (end > 0 && /[.,!?;:\])"']/.test(url[end - 1])) {
    end--;
  }
  return {
    cleaned: url.substring(0, end),
    rest: url.substring(end),
  };
};

/**
 * 프로토콜(http/https)이 누락된 도메인 URL에 https:// 스킴을 추가하는 함수
 */
const ensureHttpScheme = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

/**
 * 마크다운 링크([label](url)), 일반 HTTP(S) URL, 스킴 없는 도메인 주소(portal.inu.ac.kr 등)를 구분하여 처리하는 정규표현식
 * Group 1, 2: [label](url)
 * Group 3: naked scheme url (https://...)
 * Group 4: naked domain url (portal.inu.ac.kr, www.inu.ac.kr 등)
 */
const COMBINED_LINK_REGEX =
  /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s가-힣\]()<>"]+)|(?<![a-zA-Z0-9@/])((?:www\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\/[^\s가-힣\]()<>"]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.(?:inu\.ac\.kr|ac\.kr|co\.kr|go\.kr|or\.kr|re\.kr|kr|com|org|net|edu|gov|io|ai|app|me|info|biz|site|xyz|dev|page|gle|gl)(?:\/[^\s가-힣\]()<>"]*)?))/g;

/**
 * AI 응답에서 자주 나오는 LaTeX 수학/화살표 기호 매핑
 */
const LATEX_SYMBOLS: Record<string, string> = {
  rightarrow: "→",
  to: "→",
  leftarrow: "←",
  gets: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  pm: "±",
  times: "×",
  div: "÷",
  neq: "≠",
  ne: "≠",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  approx: "≈",
  cdot: "·",
  bullet: "•",
  dots: "…",
  cdots: "⋯",
  infty: "∞",
  deg: "°",
};

/**
 * AI 응답 텍스트를 마크다운 엔진이 잘 해석할 수 있도록 전처리하는 함수
 */
const preprocessMarkdown = (rawText: string): string => {
  if (!rawText) return rawText;

  let text = rawText;

  // 0. URL이 비어 있는 출처 마크다운 링크 항목 제거 ([제목](), - [제목]() 등)
  text = text.replace(
    /^[ \t]*(?:[-*+]|\d+\.)?[ \t]*\[[^\]]*\]\(\s*\)[ \t]*\r?\n?/gm,
    "",
  );
  text = text.replace(/\[[^\]]*\]\(\s*\)/g, "");

  // 0-1. 출처에 '없음'으로만 표기된 경우 (동일 라인 또는 다음 라인) 해당 내용 및 헤더 제거
  text = text.replace(
    /(?:\r?\n|^)[ \t]*(?:#{1,6}\s*)?(?:\*{1,2})?\[?(?:출처|참고자료|참고\s*자료)\]?(?:\*{1,2})?:?[ \t]*(?:\(?\s*(?:없음|해당\s*없음|조문\s*없음|none|n\/a)\s*\)?)[ \t]*(?=\r?\n|$)/gi,
    "",
  );
  text = text.replace(
    /((?:\r?\n|^)[ \t]*(?:#{1,6}\s*)?(?:\*{1,2})?\[?(?:출처|참고자료|참고\s*자료)\]?(?:\*{1,2})?:?[ \t]*\r?\n)[ \t]*(?:[-*+]|\d+\.)?[ \t]*(?:\(?\s*(?:없음|해당\s*없음|조문\s*없음|none|n\/a)\s*\)?)[ \t]*(?=\r?\n|$)/gi,
    "$1",
  );

  // 0-2. 출처 항목이 모두 제거되어 빈 [출처] 헤더만 남은 경우 헤더 제거
  text = text.replace(
    /(?:\r?\n|^)[ \t]*(?:#{1,6}\s*)?(?:\*{1,2})?\[?(?:출처|참고자료|참고\s*자료)\]?(?:\*{1,2})?:?[ \t]*(?=\r?\n\s*(?:#{1,6}\s*|\*{1,2}\[?|$)|$)/gi,
    "",
  );

  // 1. LaTeX 기호 치환 ($\rightarrow$, $\to$, \rightarrow 등)
  text = text.replace(
    /\$(?:\\?([a-zA-Z]+))\$/g,
    (match, symbol) => LATEX_SYMBOLS[symbol] || match,
  );
  text = text.replace(
    /\\(rightarrow|to|leftarrow|gets|leftrightarrow|Rightarrow|Leftarrow|Leftrightarrow|pm|times|div|neq|ne|leq|le|geq|ge|approx|cdot|bullet|dots|cdots|infty|deg)\b/g,
    (match, symbol) => LATEX_SYMBOLS[symbol] || match,
  );

  // 2. '=== 섹션 제목 ===' 형태를 Setext 헤딩으로 오인하지 않도록 안전하게 변환
  text = text.replace(
    /^[ \t]*={3,}[ \t]*(.*?)[ \t]*={3,}[ \t]*$/gm,
    (_, inner) => {
      const trimmed = inner.trim();
      return trimmed ? `\n> **${trimmed}**\n` : "\n---\n";
    },
  );

  // 3. 단독 '===' 구분선이 앞 문장과 합쳐져 H1으로 변환되는 것 방지
  text = text.replace(/(.)\n(={3,}|-{3,})(\n|$)/g, "$1\n\n$2$3");

  // 4. URL/링크 정제
  text = text.replace(
    COMBINED_LINK_REGEX,
    (match, label, link, nakedScheme, nakedDomain) => {
      if (link) {
        const { cleaned, rest } = cleanUrl(link);
        return `[${label}](${ensureHttpScheme(cleaned)})${rest}`;
      } else if (nakedScheme) {
        const { cleaned, rest } = cleanUrl(nakedScheme);
        return `<${cleaned}>${rest}`;
      } else if (nakedDomain) {
        const { cleaned, rest } = cleanUrl(nakedDomain);
        return `[${cleaned}](${ensureHttpScheme(cleaned)})${rest}`;
      }
      return match;
    },
  );

  // 5. HTML 태그가 아닌 한글/일반 텍스트가 담긴 <식별자> 형태 이스케이프 (<학적변동관리> 등)
  text = text.replace(/<([^>/\s]+)>/g, (match, tag) => {
    // URL autolink거나 기본 허용 HTML 태그인 경우 유지
    if (/^https?:\/\//i.test(tag) || /^(br|b|i|u|strong|em|code|pre|p|span|div|table|th|td|tr|tbody|thead|ul|ol|li|hr|img|a)$/i.test(tag)) {
      return match;
    }
    return `&lt;${tag}&gt;`;
  });

  // 6. LaTeX 수식 오타 및 문법 보정
  // 6-1. |text{...} -> \text{...} (파이프 오타 보정)
  text = text.replace(/\|text\s*\{/g, "\\text{");
  // 6-2. \text { -> \text{ (공백 제거)
  text = text.replace(/\\text\s+\{/g, "\\text{");

  // 7. 마크다운 볼드(**) 내부의 따옴표나 괄호가 CommonMark flanking 규칙을 깨뜨리지 않도록 보정
  // 7-1. **'텍스트'**, **"텍스트"**, **(텍스트)** 등 양끝이 구두점으로 감싸진 경우 바깥으로 이동
  text = text.replace(
    /\*\*([`'""‘’“”\(\[\{<])([^*]+?)([`'""‘’“”\)\]\}>])\*\*/g,
    "$1**$2**$3",
  );
  // 7-2. **텍스트(부연)**조사 처럼 닫는 볼드 앞이 구두점이고 뒤에 한글/영문이 바로 붙어 right-flanking이 실패하는 경우 보정
  text = text.replace(
    /\*\*([^*]+?)([`'""‘’“”\)\]\}]+)\*\*([가-힣a-zA-Z0-9])/g,
    "**$1**$2$3",
  );
  // 7-3. 단어**'텍스트'** 처럼 여는 볼드 뒤가 구두점이고 앞이 한글/영문이라 left-flanking이 실패하는 경우 보정
  text = text.replace(
    /([가-힣a-zA-Z0-9])\*\*([`'""‘’“”\(\[\{<]+)([^*]+?)\*\*/g,
    "$1$2**$3**",
  );

  return text;
};

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
      <React.Fragment key={index}>{wrapTextWithSpans(child)}</React.Fragment>
    ));
  }

  return children;
};

const markdownComponents: any = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p>{wrapTextWithSpans(children)}</p>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li>{wrapTextWithSpans(children)}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong>{wrapTextWithSpans(children)}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em>{wrapTextWithSpans(children)}</em>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1>{wrapTextWithSpans(children)}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2>{wrapTextWithSpans(children)}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3>{wrapTextWithSpans(children)}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4>{wrapTextWithSpans(children)}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5>{wrapTextWithSpans(children)}</h5>
  ),
  h6: ({ children }: { children: React.ReactNode }) => (
    <h6>{wrapTextWithSpans(children)}</h6>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote>{wrapTextWithSpans(children)}</blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table {...props}>{children}</table>
    </div>
  ),
  a: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href?: string;
    [key: string]: any;
  }) => {
    if (!href || !href.trim()) {
      return null;
    }
    return (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {wrapTextWithSpans(renderLinkText(children, href))}
      </a>
    );
  },
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
  showTooltip,
  onCloseTooltip,
}) => {
  const isUser = role === "user";
  const isLoading = !isUser && content === "";
  const [copied, setCopied] = useState(false);
  const feedbackAnchorRef = useRef<HTMLDivElement>(null);
  const copyableContent = isUser
    ? stripButtonPlaceholders(content)
    : preprocessMarkdown(stripButtonPlaceholders(content));

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
    if (isUser) {
      // 사용자 메시지는 마크다운을 적용하지 않고 텍스트로 처리하되 링크만 수동 연결
      const parts: (string | React.JSX.Element)[] = [];
      let lastIndex = 0;
      let match;
      const regex = new RegExp(COMBINED_LINK_REGEX);

      while ((match = regex.exec(content)) !== null) {
        parts.push(content.substring(lastIndex, match.index));
        const [, , link, nakedScheme, nakedDomain] = match;
        const targetUrl = link || nakedScheme || nakedDomain;
        const { cleaned, rest } = cleanUrl(targetUrl);

        parts.push(
          <a
            key={match.index}
            href={ensureHttpScheme(cleaned)}
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

    const processed = preprocessMarkdown(content);

    return (
      <ReactMarkdown
        remarkPlugins={[
          [remarkGfm, { singleTilde: false }],
          remarkBreaks,
          remarkMath,
        ]}
        rehypePlugins={[rehypeKatex]}
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

    const renderMarkdown = (value: string, key: React.Key) => {
      if (!value.trim()) return null;

      const processed = preprocessMarkdown(value);

      return (
        <ReactMarkdown
          key={key}
          remarkPlugins={[
            [remarkGfm, { singleTilde: false }],
            remarkBreaks,
            remarkMath,
          ]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {processed}
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
    <MessageRow
      $isUser={isUser}
      className={isUser ? "chat-message-user" : "chat-message-ai"}
    >
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
            <>{renderRichContent()}</>
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

                {isLast && onRegenerate && (
                  <ActionButton
                    onClick={() => handleAuthAction(onRegenerate)}
                    title="다시 생성"
                  >
                    <RefreshCw size={12} /> 다시 생성
                  </ActionButton>
                )}

                {onFeedback && serverMsgId && (
                  <div
                    ref={feedbackAnchorRef}
                    style={{
                      display: "inline-flex",
                      gap: "4px",
                      position: "relative",
                    }}
                  >
                    <ActionButton
                      onClick={() => handleAuthAction(() => onFeedback(1))}
                      title="좋아요"
                      style={
                        feedbackScore === 1
                          ? { color: COLORS.inuBlue, fontWeight: 600 }
                          : undefined
                      }
                    >
                      <ThumbsUp
                        size={12}
                        color={feedbackScore === 1 ? COLORS.inuBlue : undefined}
                      />
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleAuthAction(() => onFeedback(-1))}
                      title="싫어요"
                      style={
                        feedbackScore === -1
                          ? { color: "#ff4d4f", fontWeight: 600 }
                          : undefined
                      }
                    >
                      <ThumbsDown
                        size={12}
                        color={feedbackScore === -1 ? "#ff4d4f" : undefined}
                      />
                    </ActionButton>

                    {showTooltip && onCloseTooltip && (
                      <TooltipMessage
                        message="챗불이가 더 똑똑해지도록\n도와주세요!"
                        onClose={onCloseTooltip}
                        position="top"
                        align="center"
                      />
                    )}
                  </div>
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
