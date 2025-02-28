import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { chats, loading, loadChats, removeChat } = useChat();

  useEffect(() => {
    loadChats();
  }, []);

  const handleChatClick = (id) => {
    navigate(`/chat/${id}`);
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