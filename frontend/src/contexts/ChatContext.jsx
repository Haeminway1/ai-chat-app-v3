import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createChat,
  listChats,
  getChat,
  deleteChat,
  sendMessage,
  updateSystemMessage as updateSystemAPI,
  updateChatTitle as updateTitleAPI
} from '../services/chatService';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadChats = async () => {
    setLoading(true);
    try {
      const chatList = await listChats();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (chatId) => {
    setLoading(true);
    try {
      const chat = await getChat(chatId);
      setCurrentChat(chat);
      return chat;
    } catch (error) {
      console.error('Failed to load chat:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async (title, provider, model, parameters) => {
    setLoading(true);
    try {
      const newChat = await createChat(title, provider, model, parameters);
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(null);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  };

  const addLocalMessage = (chatId, content, role = 'user') => {
    // Create a temporary message locally before sending to server
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    // Update currentChat and chats with the temporary message
    if (currentChat && currentChat.id === chatId) {
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, tempMessage]
      };
      setCurrentChat(updatedChat);
      
      // Also update in the chats list
      setChats(chats.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
    }
    
    return tempId;
  };

  const sendChatMessage = async (chatId, content) => {
    // First add the message locally for immediate display
    const tempId = addLocalMessage(chatId, content);
    
    // Then send to the server
    setSending(true);
    try {
      const result = await sendMessage(chatId, content);
      if (result.status === "success") {
        setCurrentChat(result.chat);
        
        // Update chat in the list
        setChats(chats.map(chat => 
          chat.id === chatId ? result.chat : chat
        ));
      }
      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      return { error: 'Failed to send message' };
    } finally {
      setSending(false);
    }
  };
  
  const updateSystemMessage = async (chatId, content) => {
    setLoading(true);
    try {
      const result = await updateSystemAPI(chatId, content);
      if (result.status === "success") {
        setCurrentChat(result.chat);
        
        // Update chat in the list
        setChats(chats.map(chat => 
          chat.id === chatId ? result.chat : chat
        ));
      }
      return result;
    } catch (error) {
      console.error('Failed to update system message:', error);
      return { error: 'Failed to update system message' };
    } finally {
      setLoading(false);
    }
  };
  
  const updateChatTitle = async (chatId, newTitle) => {
    setLoading(true);
    try {
      const result = await updateTitleAPI(chatId, newTitle);
      if (result.status === "success") {
        setCurrentChat(result.chat);
        
        // Update chat in the list
        setChats(chats.map(chat => 
          chat.id === chatId ? result.chat : chat
        ));
      }
      return result;
    } catch (error) {
      console.error('Failed to update chat title:', error);
      return { error: 'Failed to update chat title' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const value = {
    chats,
    currentChat,
    loading,
    sending,
    loadChats,
    loadChat,
    createNewChat,
    removeChat,
    sendChatMessage,
    updateSystemMessage,
    updateChatTitle,
    setCurrentChat,
    addLocalMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};