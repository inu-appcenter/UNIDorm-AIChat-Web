import React, { useMemo } from "react";
import styled from "styled-components";
import { COLORS } from "../../constants/colors";
import ChatbotLogo from "../../assets/chatbot-logo.svg";

const GuideScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  max-width: 800px;
  padding: 20px 0;
  box-sizing: border-box;
`;

const LogoImage = styled.img`
  width: 42px;
  height: auto;
  object-fit: contain;
  //margin-bottom: 12px;
  margin-left: 0px;
  align-self: flex-start;
  pointer-events: none;
`;

const WelcomeBubble = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 0.5px solid #e7e7e7;
  border-radius: 0px 8px 8px 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
  margin-left: 0px;
  margin-right: 0px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const WelcomeText = styled.p`
  margin: 0;
  font-family:
    "Pretendard",
    -apple-system,
    sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: ${COLORS.textDark};
  white-space: pre-wrap;
  word-break: keep-all;
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  padding: 0px;
  margin-bottom: 30px;
  max-width: 100%;
  box-sizing: border-box;
`;

const GuideChip = styled.button`
  background: rgba(225, 236, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 60px;
  padding: 8px 16px;
  color: ${COLORS.figmaBlue};
  font-family:
    "Pretendard",
    -apple-system,
    sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-sizing: border-box;

  &:hover {
    background: rgba(225, 236, 255, 0.4);
    border-color: rgba(0, 122, 255, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface GuideScreenProps {
  onSelectGuide: (message: string) => void;
  isAuthenticated: boolean;
  onRequiredLogin: () => void;
}

// 전체 질문 리스트
const ALL_MESSAGES = [
  "와이파이 공유기 위치",
  "벌점 상점",
  "식당 운영시간",
  "룸메 신청",
  "기숙사비 미지출 시",
  "내 벌점 몇 점이야?",
  "벌점 어디서 확인해?",
  "벌점 1점 줄이려면 뭐 해야 해?",
  "벌점 10점 넘으면 어떻게 돼?",
  "와이파이 비밀번호 뭐야?",
  "공유기 어디 붙어 있어?",
  "와이파이 안 되면 어디에 말해?",
  "룸메이트 바꾸고 싶어",
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
  "카드 결제 돼?",
  "납부했는지 확인은 어디서 해?",
  "문 닫는 시간 몇 시야?",
  "출입 통제 시간 언제야?",
  "외부인 출입 가능해?",
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
];

export const GuideScreen: React.FC<GuideScreenProps> = ({
  onSelectGuide,
  isAuthenticated,
  onRequiredLogin,
}) => {
  // 랜덤 5개 질문 추출 (메모이제이션)
  // 단, 첫 로드 시 사용자가 피그마와 동일한 경험을 할 수 있도록
  // 피그마에 기재된 5가지 질문을 기본 목록으로 섞어 추출하되, Figma 질문 5개 중 일부 또는 전부가 높은 우선순위로 나올 수 있게 조정
  const randomMessages = useMemo(() => {
    // Figma 질문 5개
    const figmaQuestions = [
      "와이파이 공유기 위치",
      "벌점 상점",
      "식당 운영시간",
      "룸메 신청",
      "기숙사비 미지출 시",
    ];

    // 나머지 질문들 필터링
    const remainingQuestions = ALL_MESSAGES.filter(
      (msg) => !figmaQuestions.includes(msg),
    );

    // Figma 질문 5개와 나머지 질문 중 랜덤 3개를 섞어서 5개 만들기
    // 혹은 Figma 질문 5개를 우선 보여주되 매번 신선하게 하기 위해 두 버전을 적절히 섞을 수 있음.
    // 여기서는 기본적으로 피그마 질문 5개를 1순위로 포함하고 섞어 렌더링하도록 디자인 충실도를 극대화
    const mixed = [...figmaQuestions];
    if (mixed.length < 5) {
      const extra = [...remainingQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5 - mixed.length);
      mixed.push(...extra);
    }

    return mixed.sort(() => Math.random() - 0.5).slice(0, 5);
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
      <LogoImage src={ChatbotLogo} alt="챗불이 로고" />
      <WelcomeBubble>
        <WelcomeText>
          안녕하세요! 기숙사 생활을 더 편하게{"\n"}
          만들어줄 챗불이에요!{"\n\n"}
          궁금한 점이 있으시다면 아래 메뉴를{"\n"}
          선택하거나 자유롭게 입력해주세요!
        </WelcomeText>
      </WelcomeBubble>
      <ChipsContainer>
        {randomMessages.map((message, index) => (
          <GuideChip key={index} onClick={() => handleClick(message)}>
            {message}
          </GuideChip>
        ))}
      </ChipsContainer>
    </GuideScreenContainer>
  );
};
