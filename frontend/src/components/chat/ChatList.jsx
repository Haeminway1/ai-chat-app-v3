import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { 
    chats, 
    loading, 
    loadChats, 
    removeChat, 
    chatsLoaded,
    loadChat,
    currentChat
  } = useChat();

  // Load chat list on initial render if not already loaded
  useEffect(() => {
    if (!chatsLoaded) {
      loadChats(true); // Force reload to ensure fresh data
    }
  }, [chatsLoaded, loadChats]);

  // Ensure current chat is synchronized with URL parameter
  useEffect(() => {
    if (chatId && (!currentChat || currentChat.id !== chatId)) {
      loadChat(chatId);
    }
  }, [chatId, currentChat, loadChat]);

  const handleChatClick = (id) => {
    if (id === chatId) return; // Already on this chat
    
    // First load the chat data
    loadChat(id).then(result => {
      if (result) {
        // Then navigate only if the load was successful
        navigate(`/chat/${id}`, { replace: true });
      } else {
        console.error('Failed to load chat:', id);
        // Could show an error toast/notification here
      }
    });
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      removeChat(id);
      if (id === chatId) {
        navigate('/chat');
      }
    }
  };

  if (loading && chats.length === 0) {
    return <div className="chat-list-loading">Loading chats...</div>;
  }

  if (chats.length === 0) {
    return <div className="no-chats">No chats yet. Create a new chat to get started.</div>;
  }

  return (
    <div className="chat-list">
      {chats.map(chat => (
        <div 
          key={chat.id} 
          className={`chat-item ${chat.id === chatId ? 'active' : ''}`}
          onClick={() => handleChatClick(chat.id)}
        >
          <div className="chat-title">{chat.title}</div>
          <div className="chat-meta">
            <span className="chat-model">{chat.model}</span>
            <button 
              className="delete-chat-button"
              onClick={(e) => handleDeleteChat(e, chat.id)}
              aria-label="Delete chat"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;