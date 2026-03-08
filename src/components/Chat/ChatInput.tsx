import React, { useState, useRef } from "react";
import styled from "styled-components";
import { Send, Square, ChevronDown } from "lucide-react";
import { COLORS } from "../../constants/colors";
import { CHATBOT_LABELS, type ChatbotType } from "../../constants/api";

const InputWrapper = styled.div`
  position: absolute;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 800px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputForm = styled.form`
  display: flex;
  align-items: flex-end;
  background-color: ${COLORS.bgWhite};
  border-radius: 30px;
  padding: 8px 12px 8px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: 0 6px 24px rgba(0, 62, 147, 0.12);
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  width: fit-content;
  margin-left: 12px;
  margin-bottom: -4px;
`;

const StyledSelect = styled.select`
  appearance: none;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  padding: 6px 32px 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.inuBlue};
  cursor: default;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  opacity: 0.8;

  &:disabled {
    cursor: default;
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  color: ${COLORS.inuBlue};
  opacity: 0.5;
`;

const TextInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 15px;
  resize: none;
  outline: none;
  max-height: 120px;
  font-family: inherit;
  color: ${COLORS.textDark};
  line-height: 1.5;
  margin-right: 10px;
  &::placeholder {
    color: #aaaaaa;
  }
  &::-webkit-scrollbar {
    width: 0;
  }
`;

const ActionButton = styled.button<{ $isActive: boolean; $isStop?: boolean }>`
  background-color: ${(props) => {
    if (props.$isStop) return "#fff1f0";
    return props.$isActive ? COLORS.inuBlue : "#f0f0f0";
  }};
  color: ${(props) => {
    if (props.$isStop) return "#ff4d4f";
    return props.$isActive ? "#ffffff" : "#bbbbbb";
  }};
  border: ${(props) => (props.$isStop ? "1px solid #ff4d4f" : "none")};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) =>
    props.$isActive || props.$isStop ? "pointer" : "default"};
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-bottom: 2px;

  &:hover {
    background-color: ${(props) => (props.$isStop ? "#ffccc7" : "")};
  }
`;

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  selectedChatbotType: ChatbotType;
  onChatbotTypeChange: (type: ChatbotType) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  selectedChatbotType,
  onChatbotTypeChange,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) {
      onStopGeneration();
      return;
    }
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <InputWrapper>
      <SelectWrapper>
        <StyledSelect 
          value={selectedChatbotType}
          onChange={(e) => onChatbotTypeChange(e.target.value as ChatbotType)}
          disabled={true} // 임시 비활성화
        >
          {Object.entries(CHATBOT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </StyledSelect>
        <SelectIcon>
          <ChevronDown size={14} />
        </SelectIcon>
      </SelectWrapper>
      <InputForm onSubmit={handleSubmit}>
        <TextInput
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleInputResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading ? "답변을 생성하고 있습니다..." : "질문을 입력하세요"
          }
          disabled={isLoading}
        />
        <ActionButton
          type="submit"
          $isActive={input.trim().length > 0}
          $isStop={isLoading}
          disabled={!isLoading && !input.trim()}
          title={isLoading ? "응답 중지" : "전송"}
        >
          {isLoading ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Send size={18} />
          )}
        </ActionButton>
      </InputForm>
    </InputWrapper>
  );
};
