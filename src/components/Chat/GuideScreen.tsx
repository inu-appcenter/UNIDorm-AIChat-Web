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
  padding-left: 5px;

  /* 3색 파랑보라 그라데이션 */
  background: linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  display: inline-block;
`;

const GuideCard = styled.button`
  background-color: ${COLORS.bgWhite};
  border: none;
  padding: 10px 18px;
  border-radius: 20px;
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
  isAuthenticated: boolean;
  onRequiredLogin: () => void;
}

// 전체 질문 리스트
const ALL_MESSAGES = [
  "내 벌점 몇 점이야?",
  "벌점 어디서 확인해?",
  "벌점 상점은 어떻게 받아?",
  "벌점 1점 줄이려면 뭐 해야 해?",
  "벌점 10점 넘으면 어떻게 돼?",

  "와이파이 비밀번호 뭐야?",
  "와이파이 비밀번호 어디서 확인해?",
  "공유기 어디 붙어 있어?",
  "와이파이 안 되면 어디에 말해?",

  "룸메이트 바꾸고 싶어",
  "룸메이트 변경 신청 어떻게 해?",
  "친구랑 같은 방 쓰고 싶은데 어떻게 해?",
  "룸메 신청은 둘 다 해야 돼?",
  "입사 후에도 룸메 변경 가능해?",

  "내 방 번호 어디서 확인해?",
  "배정된 호실 어디서 봐?",
  "기숙사 배정 결과 언제 나와?",
  "입사 합격 여부 어디서 확인해?",
  "대기번호 어디서 확인해?",

  "기숙사 추가 모집 있어?",
  "예비번호 빠지면 추가 합격 연락 와?",
  "입사 취소는 어디서 해?",
  "중도 퇴사 신청은 어떻게 해?",
  "중도 퇴사하면 환불 얼마나 걸려?",

  "입사할 때 서류 뭐 필요해?",
  "주민등록등본은 언제 발급한 거여야 해?",
  "건강진단서는 언제 검사한 거여야 해?",
  "입사 서약서는 어디서 제출해?",
  "OT 안 들으면 어떻게 돼?",

  "기숙사비는 어디서 내?",
  "기숙사비 납부 기간 언제야?",
  "기숙사비 안 내면 어떻게 돼?",
  "카드 결제 돼?",
  "납부했는지 확인은 어디서 해?",

  "문 닫는 시간 몇 시야?",
  "출입 통제 시간 언제야?",
  "외부인 출입 가능해?",
  "친구 방 들어가도 돼?",
  "무단 외박하면 벌점 있어?",

  "시설 고장 났는데 어디에 말해?",
  "전등 나갔는데 어떻게 신청해?",
  "에어컨 고장 났어 어디로 접수해?",
  "민원 접수는 어디서 해?",
  "불편 신고는 어디로 해야 해?",

  "통합행정실 전화번호 뭐야?",
  "관리사무실 전화번호 알려줘",
  "택배 받는 주소 뭐야?",
  "분리수거장 어디 있어?",
  "스터디룸 예약 어떻게 해?",
  "식당 운영시간 알려줘",
  "최근 공지 뭐 올라왔어?",
];

export const GuideScreen: React.FC<GuideScreenProps> = ({
  onSelectGuide,
  isAuthenticated,
  onRequiredLogin,
}) => {
  // 랜덤 5개 질문 추출 (메모이제이션)
  const randomMessages = useMemo(() => {
    return [...ALL_MESSAGES]
      .sort(() => Math.random() - 0.5) // 무작위 섞기
      .slice(0, 5); // 5개 선택
  }, []);

  const handleClick = (message: string) => {
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
    onSelectGuide(message);
  };

  return (
    <GuideScreenContainer>
      <GuideTitle>이렇게 질문해 보세요</GuideTitle>
      {randomMessages.map((message, index) => (
        <GuideCard key={index} onClick={() => handleClick(message)}>
          {message}
        </GuideCard>
      ))}
    </GuideScreenContainer>
  );
};
