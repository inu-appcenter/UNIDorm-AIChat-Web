import React, { useState, useRef, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { MessageSquare, Plus, Send, Menu, PanelLeftClose } from 'lucide-react';

// 전역 스타일
const GlobalStyle = createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #f7f9fc;
    }
    * {
        box-sizing: border-box;
    }
`;

// 색상 변수
const COLORS = {
    inuBlue: '#003E93',
    inuYellow: '#FFA500',
    textDark: '#111111',
    textMuted: '#666666',
    bgWhite: '#ffffff',
};

// 타입 정의
interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

// 방 타입
interface ChatRoom {
    id: string;
    title: string;
    messages: ChatMessage[];
}

// 전체 레이아웃
const AppContainer = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    overflow: hidden;
    position: relative;
    background-color: #fafbfc;
`;

// 오버레이 (사이드바 외부 터치)
const Overlay = styled.div<{ $isOpen: boolean }>`
    display: none;
    @media (max-width: 768px) {
        display: ${props => props.$isOpen ? 'block' : 'none'};
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 40;
    }
`;

// 사이드바 영역
const Sidebar = styled.div<{ $isOpen: boolean }>`
    width: 280px;
    background-color: ${COLORS.bgWhite};
    border-right: 1px solid #eeeeee;
    display: flex;
    flex-direction: column;
    padding: 20px 15px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 50;
    @media (max-width: 768px) {
        position: absolute;
        height: 100%;
        transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
        box-shadow: 2px 0 12px rgba(0,0,0,0.05);
    }
`;

// 새 대화 버튼
const NewChatButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background-color: ${COLORS.bgWhite};
    color: ${COLORS.textDark};
    border: 1px solid #dddddd;
    border-radius: 20px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.2s ease;
    &:hover {
        background-color: #f0f2f5;
    }
`;

// 대화 목록 영역
const RoomList = styled.div`
    flex: 1;
    overflow-y: auto;
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: #dddddd;
        border-radius: 4px;
    }
`;

// 개별 대화 항목
const RoomItem = styled.div<{ $isActive: boolean }>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: ${props => props.$isActive ? '600' : '500'};
    color: ${props => props.$isActive ? COLORS.inuBlue : COLORS.textMuted};
    background-color: ${props => props.$isActive ? '#f0f4fa' : 'transparent'};
    transition: background-color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover {
        background-color: #f0f4fa;
    }
`;

// 메인 채팅 영역
const MainArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
`;

// 배경 빛반사 효과 (오브)
const AmbientOrb = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(0, 62, 147, 0.12) 0%, rgba(0, 62, 147, 0) 70%);
    filter: blur(40px);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
`;

// 상단 헤더
const Header = styled.div`
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: transparent;
    color: ${COLORS.textDark};
    z-index: 10;
`;

// 헤더 로고 텍스트
const HeaderTitle = styled.div`
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

// 모바일 메뉴 버튼
const MenuButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    margin-right: 10px;
    color: ${COLORS.textDark};
    display: none;
    @media (max-width: 768px) {
        display: block;
    }
`;

// 채팅 스크롤 영역
const ChatScrollArea = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 10px 20px 100px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: #dddddd;
        border-radius: 4px;
    }
`;

// 초심자 가이드 화면
const GuideScreen = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    max-width: 800px;
    padding: 20px 0;
`;

// 가이드 제목
const GuideTitle = styled.h2`
    font-size: 16px;
    margin-bottom: 20px;
    font-weight: 700;
    color: ${COLORS.inuBlue};
    padding-left: 5px;
`;

// 가이드 버튼
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

// 메시지 행 배열
const MessageRow = styled.div<{ $isUser: boolean }>`
    width: 100%;
    max-width: 800px;
    display: flex;
    justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
    margin-bottom: 20px;
`;

// 메시지 말풍선
const MessageBubble = styled.div<{ $isUser: boolean }>`
    max-width: 80%;
    padding: 14px 20px;
    border-radius: 24px;
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    
    background-color: ${props => props.$isUser ? COLORS.inuBlue : COLORS.bgWhite};
    color: ${props => props.$isUser ? '#ffffff' : COLORS.textDark};
    border-bottom-right-radius: ${props => props.$isUser ? '6px' : '24px'};
    border-bottom-left-radius: ${props => props.$isUser ? '24px' : '6px'};
    
    a {
        color: ${props => props.$isUser ? COLORS.inuYellow : COLORS.inuBlue};
        text-decoration: underline;
        font-weight: 500;
        word-break: break-all;
    }
`;

// 플로팅 입력 컨테이너
const InputWrapper = styled.div`
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 40px);
    max-width: 760px;
    z-index: 20;
`;

// 입력폼 바
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

// 텍스트 입력창
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

// 전송 버튼
const SendButton = styled.button<{ $isActive: boolean }>`
    background-color: ${props => props.$isActive ? COLORS.inuBlue : '#f0f0f0'};
    color: ${props => props.$isActive ? '#ffffff' : '#bbbbbb'};
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: ${props => props.$isActive ? 'pointer' : 'default'};
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-bottom: 2px;
`;

// 메인 컴포넌트
export default function App() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // 상태 관리
    const [rooms, setRooms] = useState<ChatRoom[]>([
        { id: Date.now().toString(), title: '새로운 대화', messages: [] }
    ]);
    const [currentRoomId, setCurrentRoomId] = useState<string>(rooms[0].id);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 현재 대화방 추출
    const currentRoom = rooms.find(room => room.id === currentRoomId) || rooms[0];

    // 스크롤 하단 고정
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [currentRoom.messages]);

    // 입력창 높이 자동 조절
    const handleInputResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    // 새 방 생성
    const createNewRoom = () => {
        const newRoom: ChatRoom = {
            id: Date.now().toString(),
            title: '새로운 대화',
            messages: []
        };
        setRooms([newRoom, ...rooms]);
        setCurrentRoomId(newRoom.id);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    // 링크 변환 처리
    const formatMessageContent = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
            }
            return part;
        });
    };

    // 스트리밍 전송 로직
    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        
        // 상태 초기 셋팅
        setRooms(prevRooms => prevRooms.map(room => {
            if (room.id === currentRoomId) {
                const isFirstMessage = room.messages.length === 0;
                return {
                    ...room,
                    title: isFirstMessage ? text.slice(0, 20) : room.title,
                    messages: [...room.messages, userMsg, { role: 'ai', content: '' }]
                };
            }
            return room;
        }));
        
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setIsLoading(true);


        try {
            // 백엔드 통신
                const response = await fetch(`${API_URL}/chat`, {                
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    history: currentRoom.messages
                }),
            });

            if (!response.body) throw new Error('ReadableStream not supported');

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let aiMessageContent = "";

            // 데이터 수신 반복
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 디코딩 및 누적
                aiMessageContent += decoder.decode(value, { stream: true });
                
                // 실시간 화면 갱신
                setRooms(prevRooms => prevRooms.map(room => {
                    if (room.id === currentRoomId) {
                        const newMessages = [...room.messages];
                        newMessages[newMessages.length - 1].content = aiMessageContent;
                        return { ...room, messages: newMessages };
                    }
                    return room;
                }));
            }
        } catch (error) {
            console.error('API Error:', error);
            setRooms(prevRooms => prevRooms.map(room => {
                if (room.id === currentRoomId) {
                    const newMessages = [...room.messages];
                    newMessages[newMessages.length - 1].content = "서버와 연결할 수 없습니다.";
                    return { ...room, messages: newMessages };
                }
                return room;
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // 전송 키 입력 처리
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            <GlobalStyle />
            <AppContainer>
                {/* 모바일 화면 닫기 오버레이 */}
                <Overlay 
                    $isOpen={isSidebarOpen} 
                    onClick={() => setIsSidebarOpen(false)} 
                />

                {/* 사이드바 */}
                <Sidebar $isOpen={isSidebarOpen}>
                    <NewChatButton onClick={createNewRoom}>
                        <Plus size={18} />
                        새로운 대화
                    </NewChatButton>
                    <RoomList>
                        {rooms.map(room => (
                            <RoomItem 
                                key={room.id} 
                                $isActive={room.id === currentRoomId}
                                onClick={() => {
                                    setCurrentRoomId(room.id);
                                    if (window.innerWidth <= 768) setIsSidebarOpen(false);
                                }}
                            >
                                <MessageSquare size={16} />
                                {room.title}
                            </RoomItem>
                        ))}
                    </RoomList>
                </Sidebar>

                {/* 메인 영역 */}
                <MainArea>
                    <AmbientOrb />
                    
                    <Header>
                        <MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <PanelLeftClose size={24} /> : <Menu size={24} />}
                        </MenuButton>
                        <HeaderTitle>
                            챗불이 in UNIDorm
                        </HeaderTitle>
                    </Header>

                    <ChatScrollArea ref={chatAreaRef}>
                        {currentRoom.messages.length === 0 ? (
                            // 가이드 화면
                            <GuideScreen>
                                <GuideTitle>이렇게 질문해 보세요</GuideTitle>
                                <GuideCard onClick={() => sendMessage("인천대 제1기숙사 위치가 어디야?")}>
                                    인천대 제1기숙사 위치가 어디야?
                                </GuideCard>
                                <GuideCard onClick={() => sendMessage("기숙사 상점과 벌점 기준표를 알려줘.")}>
                                    기숙사 상점과 벌점 기준표를 알려줘.
                                </GuideCard>
                                <GuideCard onClick={() => sendMessage("최근 정주대학(교양강좌) 모집 일정 알려줘.")}>
                                    최근 정주대학(교양강좌) 모집 일정 알려줘.
                                </GuideCard>
                                <GuideCard onClick={() => sendMessage("외박 신청은 어떻게 하고, 언제까지 해야 해?")}>
                                    외박 신청은 어떻게 하고, 언제까지 해야 해?
                                </GuideCard>
                            </GuideScreen>
                        ) : (
                            // 대화 내용
                            currentRoom.messages.map((msg, index) => (
                                <MessageRow key={index} $isUser={msg.role === 'user'}>
                                    <MessageBubble $isUser={msg.role === 'user'}>
                                        {formatMessageContent(msg.content)}
                                    </MessageBubble>
                                </MessageRow>
                            ))
                        )}
                    </ChatScrollArea>

                    {/* 플로팅 입력 바 */}
                    <InputWrapper>
                        <InputForm onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
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
                            <SendButton type="submit" $isActive={input.trim().length > 0 && !isLoading} disabled={!input.trim() || isLoading}>
                                <Send size={18} />
                            </SendButton>
                        </InputForm>
                    </InputWrapper>
                </MainArea>
            </AppContainer>
        </>
    );
}