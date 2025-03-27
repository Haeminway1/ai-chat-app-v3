import React, { useEffect, useRef, useState } from 'react';
import LoopMessage from './LoopMessage';
import './LoopMessageList.css';

const LoopMessageList = ({ messages, participants }) => {
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isNewMessage, setIsNewMessage] = useState(false);
  
  // 새 메시지 감지
  useEffect(() => {
    if (messages) {
      const currentCount = messages.length;
      
      // 새 메시지가 있는지 확인
      if (currentCount > lastMessageCount) {
        setIsNewMessage(true);
        
        // 새 메시지가 도착했을 때 스크롤
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        // 1초 후 애니메이션 효과 제거
        const timer = setTimeout(() => {
          setIsNewMessage(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      setLastMessageCount(currentCount);
    }
  }, [messages, lastMessageCount]);

  // 컴포넌트가 처음 마운트될 때 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, []); 

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages?.length]);

  // 스크롤 헬퍼
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 빈 메시지 처리
  if (!messages || messages.length === 0) {
    return (
      <div className="empty-loop-messages">
        <p>This loop has no messages yet. Configure participants and start the loop to begin the conversation.</p>
      </div>
    );
  }

  // 참가자 ID로 참가자 찾기
  const findParticipant = (participantId) => {
    if (!participantId || participantId === "user") {
      return { display_name: "Initial Input" };
    }
    return participants?.find(p => p.id === participantId) || { display_name: 'Unknown' };
  };

  return (
    <div 
      className={`loop-message-list ${isNewMessage ? 'new-message-highlight' : ''}`}
      ref={listRef}
    >
      {messages.map((message, index) => {
        const participant = findParticipant(message.sender || message.participant_id);
        return (
          <LoopMessage
            key={message.id}
            message={message}
            participant={participant}
            isLast={index === messages.length - 1}
          />
        );
      })}
      <div ref={messagesEndRef} style={{ float: "left", clear: "both", paddingBottom: "30px" }} />
    </div>
  );
};

export default LoopMessageList;