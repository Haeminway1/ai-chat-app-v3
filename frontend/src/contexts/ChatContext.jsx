import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  const [isTyping, setIsTyping] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [lastLoadedChatId, setLastLoadedChatId] = useState(null);
  const [pendingMessageId, setPendingMessageId] = useState(null);
  const pollingRef = useRef(null);

  // Clear any active polling
  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Memoize loadChats to avoid dependency issues
  const loadChats = useCallback(async (force = false) => {
    if (chatsLoaded && !force) return chats;
    
    setLoading(true);
    try {
      const chatList = await listChats();
      
      // Sort by updated_at date (most recent first)
      chatList.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      setChats(chatList);
      setChatsLoaded(true);
      return chatList;
    } catch (error) {
      console.error('Failed to load chats:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [chatsLoaded]);

  const loadChat = useCallback(async (chatId, forceRefresh = false) => {
    if (!chatId) return null;
    
    // If current chat is already loaded and matches the requested id, return it
    // Unless forceRefresh is true
    if (!forceRefresh && currentChat && currentChat.id === chatId && lastLoadedChatId === chatId) {
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
        
        // If this was a force refresh, stop any pending typing indicator
        if (forceRefresh) {
          setIsTyping(false);
          setSending(false);
          clearPolling();
        }
      }
      return chat;
    } catch (error) {
      console.error('Failed to load chat:', error);
      return null;
    } finally {
      setLoadingChat(false);
    }
  }, [currentChat, lastLoadedChatId, chats, chatsLoaded, clearPolling]);

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

  // Helper to check if a message is an error message
  const isErrorMessage = (content) => {
    if (!content) return false;
    return content.startsWith('Error generating content:') || 
           content.startsWith('Error:') || 
           (typeof content === 'string' && content.includes('error'));
  };

  // Helper to remove error messages when retrying
  const removeErrorMessages = (chatId) => {
    if (!currentChat || currentChat.id !== chatId) return;
    
    // Find the last error message and remove it along with any subsequent messages
    const messages = [...currentChat.messages];
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      
      if (message.role === 'assistant' && isErrorMessage(message.content)) {
        // Remove this message and any messages that came after it
        const updatedMessages = messages.slice(0, i);
        
        // Update current chat with the filtered messages
        const updatedChat = {
          ...currentChat,
          messages: updatedMessages
        };
        
        setCurrentChat(updatedChat);
        
        // Also update in the chats list
        if (chatsLoaded) {
          setChats(prevChats => 
            prevChats.map(chat => chat.id === chatId ? updatedChat : chat)
          );
        }
        
        break;
      }
    }
  };

  // Poll for chat updates when a response is taking a long time
  const startPollingForResponse = useCallback((chatId) => {
    // Clear any existing polling
    clearPolling();
    
    // Set a polling interval of 3 seconds
    pollingRef.current = setInterval(async () => {
      try {
        console.log("Polling for chat updates...");
        const updatedChat = await getChat(chatId);
        
        if (updatedChat) {
          // Check if the last message is from the assistant and different from our current chat
          const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            // Found a response, update the UI
            setCurrentChat(updatedChat);
            
            // Update chat in the list
            if (chatsLoaded) {
              setChats(prevChats => 
                prevChats.map(chat => chat.id === chatId ? updatedChat : chat)
              );
            }
            
            // Clear polling and reset states
            clearPolling();
            setIsTyping(false);
            setSending(false);
            setPendingMessageId(null);
          }
        }
      } catch (error) {
        console.error("Error polling for chat updates:", error);
      }
    }, 3000);
    
    // Set a timeout to eventually stop polling after 5 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        clearPolling();
        setIsTyping(false);
        setSending(false);
        console.log("Polling timeout reached");
      }
    }, 5 * 60 * 1000);
  }, [chatsLoaded]);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => clearPolling();
  }, []);

  const sendChatMessage = async (chatId, content, isRetry = false) => {
    // When retrying, first remove the error messages
    if (isRetry) {
      removeErrorMessages(chatId);
    }
    
    // First add the message locally for immediate display
    if (!isRetry) {
      addLocalMessage(chatId, content);
    }
    
    // Then send to the server
    setSending(true);
    setIsTyping(true);
    
    try {
      const result = await sendMessage(chatId, content);
      
      console.log("Server response for message:", result);
      
      if (result.status === "success") {
        if (result.chat && Array.isArray(result.chat.messages)) {
          // Update chat with server response
          setCurrentChat(result.chat);
          
          // Update chat in the list
          if (chatsLoaded) {
            setChats(prevChats => 
              prevChats.map(chat => chat.id === chatId ? result.chat : chat)
            );
          }
          
          // Reset states
          setSending(false);
          setIsTyping(false);
          setPendingMessageId(null);
          clearPolling();
        } else {
          console.error("Invalid chat data in response:", result);
          
          // Response didn't include complete chat data, start polling
          setPendingMessageId(Date.now().toString());
          startPollingForResponse(chatId);
        }
      } else if (result.error) {
        console.error("Error in chat response:", result.error);
        setSending(false);
        setIsTyping(false);
      } else {
        // No status or incomplete response, start polling
        setPendingMessageId(Date.now().toString());
        startPollingForResponse(chatId);
      }
      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Network error or timeout, start polling
      setPendingMessageId(Date.now().toString());
      startPollingForResponse(chatId);
      
      return { error: 'Failed to send message' };
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
    isTyping,
    chatsLoaded,
    lastLoadedChatId,
    pendingMessageId,
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