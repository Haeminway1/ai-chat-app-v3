import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  createChat,
  listChats,
  getChat,
  deleteChat,
  sendMessage,
  updateSystemMessage as updateSystemAPI,
  updateChatTitle as updateTitleAPI,
  updateChatModel as updateModelAPI
} from '../services/chatService';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [lastLoadedChatId, setLastLoadedChatId] = useState(null);

  // Memoize loadChats to avoid dependency issues
  const loadChats = useCallback(async (force = false) => {
    if (chatsLoaded && !force) return chats;
    
    setLoading(true);
    try {
      const chatList = await listChats();
      setChats(chatList);
      setChatsLoaded(true);
      return chatList;
    } catch (error) {
      console.error('Failed to load chats:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [chats, chatsLoaded]);

  const loadChat = useCallback(async (chatId) => {
    if (!chatId) return null;
    
    // If current chat is already loaded and matches the requested id, return it
    if (currentChat && currentChat.id === chatId && lastLoadedChatId === chatId) {
      return currentChat;
    }
    
    setLoadingChat(true);
    try {
      const chat = await getChat(chatId);
      if (chat) {
        setCurrentChat(chat);
        setLastLoadedChatId(chatId);
        
        // Update chat in the list if it exists and chats are loaded
        if (chatsLoaded) {
          const chatExists = chats.some(c => c.id === chatId);
          if (chatExists) {
            setChats(prevChats => 
              prevChats.map(c => c.id === chatId ? chat : c)
            );
          } else {
            setChats(prevChats => [chat, ...prevChats]);
          }
        }
      }
      return chat;
    } catch (error) {
      console.error('Failed to load chat:', error);
      return null;
    } finally {
      setLoadingChat(false);
    }
  }, [currentChat, lastLoadedChatId, chats, chatsLoaded]);

  const createNewChat = async (title, provider, model, parameters) => {
    setLoading(true);
    try {
      const newChat = await createChat(title, provider, model, parameters);
      
      // Update chats list only if we have chats loaded already
      if (chatsLoaded) {
        setChats(prevChats => [newChat, ...prevChats]);
      }
      
      setCurrentChat(newChat);
      setLastLoadedChatId(newChat.id);
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
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(null);
        setLastLoadedChatId(null);
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
      if (chatsLoaded) {
        setChats(prevChats => 
          prevChats.map(chat => chat.id === chatId ? updatedChat : chat)
        );
      }
    }
    
    return tempId; // Return this in case it's needed
  };

  const sendChatMessage = async (chatId, content) => {
    // First add the message locally for immediate display
    addLocalMessage(chatId, content);
    
    // Then send to the server
    setSending(true);
    try {
      const result = await sendMessage(chatId, content);
      if (result.status === "success") {
        setCurrentChat(result.chat);
        
        // Update chat in the list
        if (chatsLoaded) {
          setChats(prevChats => 
            prevChats.map(chat => chat.id === chatId ? result.chat : chat)
          );
        }
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
        if (chatsLoaded) {
          setChats(prevChats => 
            prevChats.map(chat => chat.id === chatId ? result.chat : chat)
          );
        }
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
        if (chatsLoaded) {
          setChats(prevChats => 
            prevChats.map(chat => chat.id === chatId ? result.chat : chat)
          );
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to update chat title:', error);
      return { error: 'Failed to update chat title' };
    } finally {
      setLoading(false);
    }
  };
  
  const updateChatModel = async (chatId, model) => {
    setLoading(true);
    try {
      const result = await updateModelAPI(chatId, model);
      if (result.status === "success") {
        setCurrentChat(result.chat);
        
        // Update chat in the list
        if (chatsLoaded) {
          setChats(prevChats => 
            prevChats.map(chat => chat.id === chatId ? result.chat : chat)
          );
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to update chat model:', error);
      return { error: 'Failed to update chat model' };
    } finally {
      setLoading(false);
    }
  };

  // Load chats on initial mount
  useEffect(() => {
    loadChats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    chats,
    currentChat,
    loading,
    loadingChat,
    sending,
    chatsLoaded,
    lastLoadedChatId,
    loadChats,
    loadChat,
    createNewChat,
    removeChat,
    sendChatMessage,
    updateSystemMessage,
    updateChatTitle,
    updateChatModel,
    setCurrentChat,
    addLocalMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};