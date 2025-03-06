import React, { useEffect, useRef, useState } from 'react';
import LoopMessage from './LoopMessage';
import './LoopMessageList.css';

const LoopMessageList = ({ loop }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  
  // 새로운 메시지가 있는지 감지
  useEffect(() => {
    if (loop?.messages) {
      const currentCount = loop.messages.length;
      
      // 새 메시지가 있는지 확인
      if (currentCount > lastMessageCount) {
        setIsNewMessage(true);
        
        // 1초 후 애니메이션 효과 제거
        const timer = setTimeout(() => {
          setIsNewMessage(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      setLastMessageCount(currentCount);
    }
  }, [loop?.messages, lastMessageCount]);

  // 조건부 스크롤 - 사용자가 스크롤하지 않은 경우에만 자동 스크롤
  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 메시지 변경 시 조건부 스크롤
  useEffect(() => {
    if (loop?.messages && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [loop?.messages, shouldAutoScroll]);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // 스크롤이 하단에서 30px 이내인지 확인
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 30;
      
      if (isNearBottom) {
        // 사용자가 하단에 가까이 스크롤했으면 자동 스크롤 활성화
        setShouldAutoScroll(true);
        setUserScrolled(false);
      } else if (!userScrolled) {
        // 사용자가 위로 스크롤했으면 자동 스크롤 비활성화
        setShouldAutoScroll(false);
        setUserScrolled(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [userScrolled]);

  // 메시지가 없거나 루프가 없을 때 처리
  if (!loop?.messages || loop.messages.length === 0) {
    return (
      <div className="empty-loop-messages">
        <p>This loop has no messages yet. Configure participants and start the loop to begin the conversation.</p>
      </div>
    );
  }

  // 참가자 정보 맵 생성
  const participantInfo = {};
  loop.participants.forEach(p => {
    participantInfo[p.id] = {
      displayName: p.display_name,
      model: p.model,
      systemPrompt: p.system_prompt
    };
  });

  // 처음 사용자 메시지를 숨기는 로직
  const displayMessages = () => {
    if (loop.messages.length > 0 && loop.messages[0].sender === 'user') {
      return loop.messages.slice(1);
    }
    return loop.messages;
  };

  const messagesToShow = displayMessages();

  // 스크롤 위치 맞춤 안내 UI
  const renderScrollHelper = () => {
    if (!shouldAutoScroll && loop.status === 'running') {
      return (
        <div className="scroll-helper" onClick={() => {
          setShouldAutoScroll(true);
          setUserScrolled(false);
          scrollToBottom();
        }}>
          <div className="scroll-helper-content">
            <span>새 메시지가 있습니다</span>
            <span className="scroll-arrow">⬇</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`loop-message-list ${isNewMessage ? 'new-message-highlight' : ''}`}
      ref={containerRef}
    >
      {messagesToShow.map(message => (
        <LoopMessage 
          key={message.id}
          message={message}
          participantInfo={participantInfo}
        />
      ))}
      <div ref={messagesEndRef} />
      {renderScrollHelper()}
    </div>
  );
};

export default LoopMessageList;