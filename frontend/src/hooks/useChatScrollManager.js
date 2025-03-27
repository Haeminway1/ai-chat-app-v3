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
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
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
    if (messages.length > prevMessageCount && isNearBottom) {
      scrollToBottom();
    }
    
    setPrevMessageCount(messages.length);
  }, [messages.length, prevMessageCount, isNearBottom, scrollToBottom]);
  
  // Initialize scroll position check
  useEffect(() => {
    setIsNearBottom(checkIfNearBottom());
  }, [checkIfNearBottom]);
  
  return {
    isNearBottom,
    handleScroll,
    scrollToBottom,
    checkIfNearBottom
  };
}; 