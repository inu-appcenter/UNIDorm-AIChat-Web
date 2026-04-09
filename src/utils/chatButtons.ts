import type { ChatButton } from "../types/chat";

const BUTTON_TOKEN_REGEX = /\[\uBC84\uD2BC:\s*([^|\]]+)(?:\|([^\]]+))?\]/g;
const BUTTON_PLACEHOLDER_REGEX = /__CHAT_BUTTON_(\d+)__/g;

type ButtonMap = Record<string, { label: string; url: string }>;

export const injectButtonPlaceholders = (
  content: string,
  buttonMap: ButtonMap,
): { content: string; buttons?: ChatButton[] } => {
  const buttons: ChatButton[] = [];

  const contentWithPlaceholders = content.replace(
    BUTTON_TOKEN_REGEX,
    (match, rawLabel: string, rawUrl?: string) => {
      const label = rawLabel.trim();
      const customUrl = rawUrl?.trim();

      const button = customUrl
        ? {
            label,
            url: customUrl,
            primary: true,
          }
        : buttonMap[label]
          ? {
              ...buttonMap[label],
              primary: true,
            }
          : null;

      if (!button) {
        return match;
      }

      const placeholder = `__CHAT_BUTTON_${buttons.length}__`;
      buttons.push(button);
      return placeholder;
    },
  );

  return {
    content: contentWithPlaceholders.trim(),
    buttons: buttons.length > 0 ? buttons : undefined,
  };
};

export const splitContentByButtonPlaceholders = (content: string) => {
  const parts: Array<
    | { type: "text"; value: string }
    | { type: "button"; index: number }
  > = [];

  BUTTON_PLACEHOLDER_REGEX.lastIndex = 0;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BUTTON_PLACEHOLDER_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "button",
      index: Number(match[1]),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return parts;
};

export const stripButtonPlaceholders = (content: string) =>
  content.replace(BUTTON_PLACEHOLDER_REGEX, "").replace(/\n{3,}/g, "\n\n").trim();
