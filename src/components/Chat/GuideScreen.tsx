import React, { useMemo } from "react";
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
`;

const LogoContainer = styled.div`
  width: 72px;
  height: 60.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
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

// 학사 학생 실제 구어체 질문 리스트 (수십 개 구성)
const INTIP_MESSAGES = [
  "성적 우수 장학금은 어떻게 신청해?",
  "교수상담 안 받으면 성적장학금 못 받아?",
  "국가장학금 소득분위 기준이랑 지급일은 언제야?",
  "강의평가 기간 놓쳤는데 성적 확인 어떻게 해?",
  "강의평가 다 했는데도 성적 조회가 안 될 때는 어떻게 해야 해?",
  "휴학 신청 기간이랑 방법 알려줘.",
  "군 휴학 신청할 때 입영통지서 제출은 어떻게 해?",
  "군 복학 신청은 언제부터 가능해?",
  "전역일이 개강일보다 늦은데 복학할 수 있어?",
  "일반휴학 연장은 어떻게 해?",
  "자퇴 신청 절차랑 등록금 환불 기준은 어떻게 돼?",
  "재입학 신청 기간이랑 자격 요건은 뭐야?",
  "수강신청 정정 기간은 언제야?",
  "수강취소는 어떻게 해?",
  "다른 학과 전공과목을 들으면 일반선택으로 인정돼?",
  "이수구분 변경 신청은 어디서 어떻게 해?",
  "F학점 받은 과목 재수강이나 학점포기 가능해?",
  "OCU나 K-MOOC 이수 학점 인정은 어떻게 받아?",
  "계절학기 수강신청 기간이랑 최대 신청 가능 학점은 몇 점이야?",
  "타 대학교 학점교류 신청은 어떻게 해?",
  "복수전공이랑 부전공 신청 기간은 언제야?",
  "전과 신청 조건이랑 시기 알려줘.",
  "졸업 요건이랑 졸업학점 충족 여부 확인은 어디서 해?",
  "졸업유예 신청은 어떻게 하고 최대 몇 학기까지 가능해?",
  "공인영어성적 졸업인증 등록은 어떻게 해?",
  "졸업증명서랑 성적증명서는 어디서 발급받아?",
  "등록금 분할납부 신청 기간이랑 방법은 어떻게 돼?",
  "등록금 납부 고지서 출력은 어디서 해?",
  "등록금 납부 기간 놓쳤는데 추가 납부 기간은 언제야?",
  "전과생이나 편입생 학점 인정 확인은 어떻게 해?",
  "학생증 재발급 신청은 어디서 해?",
  "모바일 학생증 발급은 어떻게 받아?",
  "통합정보시스템 비밀번호 분실했을 때 어떻게 재설정해?",
  "교내 와이파이 연결 방법 알려줘.",
  "사물함 신청이랑 배정은 언제 어떻게 진행돼?",
  "도서관 좌석 예약이랑 스터디룸 대여는 어떻게 해?",
  "학습도서관이나 열람실 이용 시간은 어떻게 돼?",
  "기숙사 입사 신청 기간이랑 선발 기준은 뭐야?",
  "예비군 훈련 연계 신청이랑 대원 신고는 어떻게 해?",
  "사회봉사 교과목 학점 인정 신청 방법은 뭐야?",
  "교환학생 파견 신청 자격이랑 모집 기간은 언제야?",
  "포털 개인정보 수정은 어디서 해?",
];

export const GuideScreen: React.FC<GuideScreenProps> = ({
  onSelectGuide,
  isAuthenticated,
  onRequiredLogin,
  activeService,
}) => {
  const randomMessages = useMemo(() => {
    const pool = activeService === "intip" ? INTIP_MESSAGES : DORM_MESSAGES;
    // 무작위 셔플 후 상위 5개 질문 무작위 추출
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [activeService]);

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
      return `안녕하세요! 대학 생활을 더 편하게\n만들어줄 챗불이에요!`;
    }
    return `안녕하세요! 기숙사 생활을 더 편하게\n만들어줄 챗불이에요!`;
  };

  const getSubtitleText = () => {
    return `궁금한 점이 있으시다면 아래 메뉴를\n선택하거나 자유롭게 입력해주세요!`;
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
        {randomMessages.map((message, index) => (
          <GuideChip key={index} onClick={() => handleClick(message)}>
            {message}
          </GuideChip>
        ))}
      </ChipsContainer>
    </GuideScreenContainer>
  );
};
