import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import './LoopMessage.css';

const LoopMessage = ({ message, participant, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!message) return null;
  
  // Convert ISO string to Date object
  const messageDate = new Date(message.timestamp);
  
  // Format the timestamp
  const formattedTime = formatDistanceToNow(messageDate, { addSuffix: true });
  
  // Get participant info
  const displayName = participant?.display_name || 'Unknown';
  const model = participant?.model || '';
  
  // Check if this is the initial input (using participant info from findParticipant)
  const isInitialInput = displayName === "Initial Input";
  
  // Handle toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`loop-message ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="message-header" onClick={toggleExpand}>
        <div className="message-sender">
          {isInitialInput ? (
            <span className="sender-name initial-input">Initial Input</span>
          ) : (
            <>
              <span className="sender-name">{displayName}</span>
              {model && <span className="sender-model"> ({model})</span>}
            </>
          )}
        </div>
        <div className="message-meta">
          <span className="message-time">{formattedTime}</span>
          <span className="expand-toggle">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="message-content">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <pre className={`code-block language-${match[1]}`}>
                    <code {...props}>
                      {String(children).replace(/\n$/, '')}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default LoopMessage;