import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { COLORS } from "../../constants/colors";
import ChatbotLogo from "../../assets/chatbot-logo.svg";

const GuideScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 800px;
  padding: 20px 0 40px;
  box-sizing: border-box;
  margin: 0;
  gap: 16px;
  z-index: 1;

  @media (max-height: 680px) {
    gap: 10px;
    padding: 10px 0 20px;
  }
`;

const LogoContainer = styled.div`
  width: 72px;
  height: 60.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;

  @media (max-height: 680px) {
    width: 56px;
    height: 47px;
    margin-bottom: 0px;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-family:
    "Pretendard",
    -apple-system,
    BlinkMacSystemFont,
    system-ui,
    Roboto,
    sans-serif;
  word-break: keep-all;
`;

const TitleText = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: #1c1e1e;
  text-align: center;
  white-space: pre-line;
`;

const SubtitleText = styled.p`
  margin: 12px 0 0 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #6f6f6f;
  text-align: center;
  white-space: pre-line;

  @media (max-height: 680px) {
    margin-top: 6px;
  }
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  max-width: 520px;
  margin-top: 4px;
  box-sizing: border-box;

  @media (max-height: 680px) {
    gap: 8px;
    margin-top: 2px;
  }
`;

const GuideChip = styled.button`
  width: fit-content;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  background: rgba(225, 236, 255, 0.25);
  border: 1px solid ${COLORS.blue200};
  border-radius: 60px;
  padding: 11px 20px;
  color: ${COLORS.figmaBlue};
  font-family:
    "Pretendard",
    -apple-system,
    sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.2s ease;
  word-break: keep-all;
  box-sizing: border-box;

  @media (max-height: 680px) {
    padding: 9px 16px;
    font-size: 13.5px;
  }

  &:hover {
    background: rgba(225, 236, 255, 0.5);
    border-color: ${COLORS.figmaBlue};
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
  activeService: "unidorm" | "intip";
}

// 기숙사 학생 실제 구어체 질문 리스트 (수십 개 구성)
const DORM_MESSAGES = [
  "벌점 상쇄하려면 어떻게 해야 해?",
  "룸메이트 신청은 어떻게 해?",
  "식당 운영시간이 어떻게 돼?",
  "기숙사비 기한 내 미지출 시 어떻게 돼?",
  "방 안 와이파이 공유기는 어디에 있어?",
  "내 벌점 점수 어디서 확인해?",
  "벌점 1점 감점받으려면 뭐 해야 해?",
  "벌점 10점 넘으면 퇴사 처리돼?",
  "와이파이 비밀번호 뭐야?",
  "와이파이 연결 안 될 때 어디에 문의해?",
  "룸메이트 변경은 언제부터 가능해?",
  "친구랑 같은 방 쓰고 싶은데 어떻게 신청해?",
  "룸메 신청은 두 명 다 해야 적용돼?",
  "기숙사 호실 배정 결과는 언제 나와?",
  "예비번호 빠지면 추가 합격 연락 와?",
  "입사할 때 꼭 제출해야 하는 서류가 뭐야?",
  "주민등록등본 발급일 기준이 어떻게 돼?",
  "건강진단서(흉부X선) 검사 유효기간이 언제까지야?",
  "기숙사비 납부 기간 알려줘",
  "야간 출입 통제 몇 시부터 몇 시까지야?",
  "외부인 친구 방에 데려와도 돼?",
  "무단 외박하면 벌점 몇 점 받게 돼?",
  "방 시설 고장 나면 수리 신청 어디서 해?",
  "형광등 전등 나가면 교체 신청 어떻게 해?",
  "통합행정실 전화번호가 몇 번이야?",
  "택배 받을 때 도로명 주소 뭐라고 적어야 해?",
  "쓰레기 분리수거장은 어디에 위치해 있어?",
  "스터디룸 예약은 어떻게 해?",
  "기숙사 내 세탁기랑 건조기 요금이 얼마야?",
  "에어컨이랑 난방 작동이 안 돼서 조치하고 싶어",
  "중도 퇴사하면 잔여 기숙사비 환불 얼마나 걸려?",
  "입사 첫날 체크인할 때 서약서 어디서 내?",
  "입사 오리엔테이션(OT) 안 들으면 어떻게 돼?",
  "기숙사 카드키 잃어버렸는데 재발급 어떻게 해?",
  "귀가 및 외박 신청은 어디 앱에서 해?",
  "체력단련실이랑 헬스장 이용 시간이 어떻게 돼?",
];

// 학사 학생 실제 구어체 질문 리스트
const INTIP_MESSAGES = [
  "경영학부 과사 전화번호 뭐야?",
  "마일리지 장학금 신청이랑 지급 조건 알려줘.",
  "조기졸업도 수료나 졸업유예 가능해?",
  "간부장학금은 등록금 감면이야 생활비 지급이야?",
  "간부장학금 지급 금액 얼마 정도야?",
  "영어 졸업인증 자격은 어떻게 취득해?",
  "교내외 봉사활동 실적 등록 어떻게 해?",
  "한 학기 다니고 다음 학기에 바로 또 휴학할 수 있어?",
  "초과학기 4월 등록금도 신용카드 납부 돼?",
  "조기졸업 조건이랑 신청 시기 알려줘.",
  "전공심화트랙은 한 학기에 다 들어야 해?",
  "휴학 취소하고 바로 재이수 신청할 수 있어?",
  "전과할 때 필수로 들어야 하는 전공 학점 있어?",
  "1월 전역이면 3월 1학기에 바로 복학 가능해?",
  "군휴학 최대 인정 기간이 얼마나 돼?",
  "부전공 다 못 채워도 주전공으로 졸업 돼?",
  "휴학 후 등록금 환불은 어디서 신청해?",
  "이번 학기 수강신청 기간 언제야?",
  "자퇴 후 등록금 반환 신청 어떻게 해?",
  "모바일 학생증 사진 바꿀 수 있어?",
  "포털에 등록된 부모님 번호 내 번호로 어떻게 바꿔?",
  "자퇴하면 등록금 얼마나 환불돼?",
  "학점 딱 2.50이어도 국장 받을 수 있어?",
  "졸업유예 상태에서 재수강 과목 수강신청 돼?",
  "교수님 폭언 상담이나 신고 어디서 해?",
  "포털에 환불·장학금 계좌 등록 어떻게 해?",
  "3시간 연강 결석하면 결석 3회로 처리돼?",
  "결석 몇 번이면 자동으로 F 처리돼?",
  "수강포기 조건이랑 신청 방법 알려줘.",
  "논문 미제출 수료 상태에서 졸업유예 언제까지 돼?",
  "3학년인데 2학년 전공심화 과목 들어도 돼?",
  "부전공 하면 졸업 학점에 부전공 학점 더해져?",
  "전과 전에 전과할 과 전공 미리 들어도 인정돼?",
  "전과하려면 기존 과 1학년 전공 다 들어야 해?",
  "부전공 학점은 총 졸업 기준 학점에 포함돼?",
  "휴학 중에 학업재이수나 학점포기 신청 돼?",
  "졸업유예 후에 다음 학기 재수강 신청 가능해?",
  "등록금 분할납부 신청 가능해?",
  "전과 자격 조건이랑 신청 기준이 뭐야?",
  "편입생도 전과 신청할 수 있어?",
  "학생설계융합전공이 뭐야?",
  "학생설계융합전공 신청 어떻게 해?",
  "부전공 미이수자도 졸업연기 신청 대상이야?",
  "국가장학금은 등록금 고지서 감면이야 계좌 입금이야?",
  "개명 신청 후 학사 시스템 이름 변경 어떻게 해?",
  "성적 낮아서 휴학했는데 1학년 1학기부터 다시 다녀야 해?",
  "엇학기 복학하면 꼭 휴학해서 학기 맞춰야 해?",
  "이미 수강해서 성적 나온 과목 삭제나 포기 돼?",
];

export const GuideScreen: React.FC<GuideScreenProps> = ({
  onSelectGuide,
  isAuthenticated,
  onRequiredLogin,
  activeService,
}) => {
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCount = useMemo(() => {
    if (windowHeight < 440) return 2;
    if (windowHeight < 530) return 3;
    if (windowHeight < 620) return 4;
    return 5;
  }, [windowHeight]);

  const randomMessages = useMemo(() => {
    const pool = activeService === "intip" ? INTIP_MESSAGES : DORM_MESSAGES;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [activeService]);

  const visibleMessages = useMemo(() => {
    return randomMessages.slice(0, visibleCount);
  }, [randomMessages, visibleCount]);

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

  const getTitleText = () => {
    if (activeService === "intip") {
      return `안녕하세요!\n인천대학교 학사 AI 챗봇, 챗불이에요!`;
    } else if (activeService === "unidorm") {
      return `안녕하세요! 기숙사 생활을 더 편하게\n만들어줄 챗불이에요!`;
    }
    return `안녕하세요!\n인천대학교 학사 AI 챗봇, 챗불이에요!`;
  };

  const getSubtitleText = () => {
    if (activeService === "intip") {
      return `챗불이는 학칙과 학사 관련 공지사항에\n기반해서 답변할 수 있어요.`;
    } else if (activeService === "unidorm") {
      return `기숙사 규정과 공지사항에\n기반해서 답변해드릴 수 있어요.`;
    }

    return `챗불이는 대학 규정과 학사 관련 공지사항에\n기반해서 답변할 수 있어요.`;
  };

  return (
    <GuideScreenContainer>
      <LogoContainer>
        <LogoImage src={ChatbotLogo} alt="챗불이 로고" />
      </LogoContainer>
      <TextBlock>
        <TitleText>{getTitleText()}</TitleText>
        <SubtitleText>{getSubtitleText()}</SubtitleText>
      </TextBlock>
      <ChipsContainer>
        {visibleMessages.map((message, index) => (
          <GuideChip key={index} onClick={() => handleClick(message)}>
            {message}
          </GuideChip>
        ))}
      </ChipsContainer>
    </GuideScreenContainer>
  );
};
