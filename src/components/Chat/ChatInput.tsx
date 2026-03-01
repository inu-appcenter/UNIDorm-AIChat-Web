import React, { useState, useRef } from "react";
import styled from "styled-components";
import { Send } from "lucide-react";
import { COLORS } from "../../constants/colors";

const InputWrapper = styled.div`
  position: absolute;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 760px;
  z-index: 20;
`;

const InputForm = styled.form`
  display: flex;
  align-items: flex-end;
  background-color: ${COLORS.bgWhite};
  border-radius: 30px;
  padding: 8px 12px 8px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: 0 6px 24px rgba(0, 62, 147, 0.12);
  }
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

const SendButton = styled.button<{ $isActive: boolean }>`
  background-color: ${(props) =>
    props.$isActive ? COLORS.inuBlue : "#f0f0f0"};
  color: ${(props) => (props.$isActive ? "#ffffff" : "#bbbbbb")};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.$isActive ? "pointer" : "default")};
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-bottom: 2px;
`;

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
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
    if (input.trim() && !isLoading) {
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
          placeholder="질문을 입력하세요"
        />
        <SendButton
          type="submit"
          $isActive={input.trim().length > 0 && !isLoading}
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} />
        </SendButton>
      </InputForm>
    </InputWrapper>
  );
};
