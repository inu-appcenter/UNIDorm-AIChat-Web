import React, { useMemo } from "react";
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

// 전체 질문 리스트
const ALL_MESSAGES = [
  "택배 주소 뭐야?",
  "기숙사 주소 알려줘.",
  "내 호실이랑 침대 번호 어떻게 알아?",
  "배정받은 방 어디서 확인해?",
  "포탈 어디로 들어가야 방 번호 나와?",
  "와이파이 비밀번호 뭐야?",
  "1기숙사 공유기 어디 있어?",
  "2기숙사 공유기 위치 알려줘.",
  "3기숙사 공유기 어디에 달려 있어?",
  "분리수거장 어디 있어?",
  "1기숙사 분리수거 어디서 해?",
  "세미나실 예약 어떻게 해?",
  "시설 고장 났는데 어디서 신청해?",
  "1기숙사 수리 신청 어떻게 해?",
  "2기숙사 수리 신청 어디서 해?",
  "문에 있는 QR코드로 수리 신청하는 거 맞아?",
  "내 벌점 몇 점이야?",
  "벌점 어디서 확인해?",
  "룸메이트 바꾸고 싶어. 어떻게 해?",
  "방 변경 신청 어떻게 해?",
  "벌점 어떻게 깎아?",
  "헌혈하면 벌점 상쇄돼?",
  "봉사활동으로 벌점 없앨 수 있어?",
  "지난 학기 벌점 지금 상쇄 가능해?",
  "기숙사 추가 모집 있어?",
  "예비 순위인데 추가 합격 돼?",
  "중도 퇴사했는데 환불금 언제 들어와?",
  "환불 처리되는 데 얼마나 걸려?",
];

export const GuideScreen: React.FC<GuideScreenProps> = ({ onSelectGuide }) => {
  // 랜덤 5개 질문 추출 (메모이제이션)
  const randomMessages = useMemo(() => {
    return [...ALL_MESSAGES]
      .sort(() => Math.random() - 0.5) // 무작위 섞기
      .slice(0, 5); // 5개 선택
  }, []);

  return (
    <GuideScreenContainer>
      <GuideTitle>이렇게 질문해 보세요</GuideTitle>
      {randomMessages.map((message, index) => (
        <GuideCard key={index} onClick={() => onSelectGuide(message)}>
          {message}
        </GuideCard>
      ))}
    </GuideScreenContainer>
  );
};