import React from "react";
import styled from "styled-components";
import { COLORS } from "../../constants/colors";

const GuideScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  max-width: 800px;
  padding: 20px 0;
`;

const GuideTitle = styled.h2`
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: 700;
  color: ${COLORS.inuBlue};
  padding-left: 5px;
`;

const GuideCard = styled.button`
  background-color: ${COLORS.bgWhite};
  border: none;
  padding: 14px 20px;
  border-radius: 24px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${COLORS.textDark};
  font-size: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
  display: inline-block;
  width: fit-content;

  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
`;

interface GuideScreenProps {
  onSelectGuide: (message: string) => void;
}

const guideMessages = [
  "인천대학교 기숙사에 대해 알려줘.",
  "교양강좌 뭐 있어?",
  "최근 공지사항 알려줘.",
  "생활원 전화번호 알려줘.",
  "2기숙사 몇시에 닫아?",
];

export const GuideScreen: React.FC<GuideScreenProps> = ({ onSelectGuide }) => {
  return (
    <GuideScreenContainer>
      <GuideTitle>이렇게 질문해 보세요</GuideTitle>
      {guideMessages.map((message, index) => (
        <GuideCard key={index} onClick={() => onSelectGuide(message)}>
          {message}
        </GuideCard>
      ))}
    </GuideScreenContainer>
  );
};
