import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage chat scrolling behavior
 * @param {Object} props - Hook properties
 * @param {React.RefObject} props.containerRef - Ref to the message container element
 * @param {Array} props.messages - Array of messages to track for changes
 * @param {number} props.bottomThreshold - Pixel threshold to consider "near bottom" (default: 150)
 * @returns {Object} Scroll handling utilities
 */
export const useChatScrollManager = ({ 
  containerRef, 
  messages = [], 
  bottomThreshold = 150 
}) => {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  
  // Scroll to the bottom of the container
  const scrollToBottom = useCallback(() => {
    if (containerRef?.current) {
      // 즉시 스크롤을 최하단으로 이동
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      
      // 스크롤이 제대로 적용되지 않을 수 있으므로 약간의 지연 후 한번 더 시도
      setTimeout(() => {
        if (containerRef?.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [containerRef]);
  
  // Check if the scroll position is near the bottom
  const checkIfNearBottom = useCallback(() => {
    if (!containerRef?.current) return true;
    
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    
    return scrollBottom <= bottomThreshold;
  }, [containerRef, bottomThreshold]);
  
  // Handle scroll events
  const handleScroll = useCallback(() => {
    setIsNearBottom(checkIfNearBottom());
  }, [checkIfNearBottom]);
  
  // Auto-scroll behavior for new messages
  useEffect(() => {
    // If messages have been added and we were previously at the bottom
    // 메시지가 추가되었거나 초기 로드 시 스크롤을 아래로 이동
    if (messages.length > prevMessageCount || messages.length === 1) {
      scrollToBottom();
    }
    
    setPrevMessageCount(messages.length);
  }, [messages.length, prevMessageCount, scrollToBottom]);
  
  // Initialize scroll position check
  useEffect(() => {
    setIsNearBottom(checkIfNearBottom());
    
    // 컴포넌트 마운트 시 스크롤을 아래로 이동
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [checkIfNearBottom, scrollToBottom, messages.length]);
  
  return {
    isNearBottom,
    handleScroll,
    scrollToBottom,
    checkIfNearBottom
  };
}; 