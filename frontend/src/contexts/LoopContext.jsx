import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  createLoop,
  listLoops,
  getLoop,
  updateLoopTitle,
  deleteLoop,
  addParticipant,
  updateParticipant,
  removeParticipant,
  reorderParticipants,
  startLoop,
  pauseLoop,
  resumeLoop,
  stopLoop,
  resetLoop,
  updateLoopUserPrompt as updateLoopUserPromptService,
  addStopSequence,
  updateStopSequence,
  removeStopSequence,
  reorderStopSequences
} from '../services/loopService';

const LoopContext = createContext(null);

export const useLoop = () => {
  const context = useContext(LoopContext);
  if (!context) {
    throw new Error('useLoop must be used within a LoopProvider');
  }
  
  return {
    ...context,
    reorderParticipants: context.reorderLoopParticipants,
    reorderStopSequences: context.reorderLoopStopSequences
  };
};

export const LoopProvider = ({ children }) => {
  const [loops, setLoops] = useState([]);
  const [currentLoop, setCurrentLoop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLoop, setLoadingLoop] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loopsLoaded, setLoopsLoaded] = useState(false);
  const [lastLoadedLoopId, setLastLoadedLoopId] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);

  // Memoize loadLoops to avoid dependency issues
  const loadLoops = useCallback(async (force = false) => {
    if (loopsLoaded && !force) return loops;
    
    // 이미 로딩 중이면 중복 요청을 방지
    if (loading) {
      console.log("Already loading loops, skipping duplicate request");
      return loops;
    }
    
    setLoading(true);
    try {
      console.log("Loading loops from server...");
      const loopList = await listLoops();
      
      // 중복 항목 제거
      const uniqueLoops = [];
      const seenIds = new Set();
      
      for (const loop of loopList) {
        if (!seenIds.has(loop.id)) {
          seenIds.add(loop.id);
          uniqueLoops.push(loop);
        } else {
          console.warn(`Duplicate loop detected and removed: ${loop.id}`);
        }
      }
      
      // Sort by updated_at date (most recent first)
      uniqueLoops.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      console.log(`Loaded ${uniqueLoops.length} unique loops`);
      
      setLoops(uniqueLoops);
      setLoopsLoaded(true);
      return uniqueLoops;
    } catch (error) {
      console.error('Failed to load loops:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loopsLoaded, loading, loops]); // Add loading, loops to dependencies to prevent race conditions

  const loadLoop = useCallback(async (loopId) => {
    if (!loopId) return null;
    
    // 이미 로딩 중이면 중복 요청 방지
    if (loadingLoop) {
      console.log(`Already loading loop ${loopId}, skipping duplicate request`);
      return currentLoop && currentLoop.id === loopId ? currentLoop : null;
    }
    
    // If current loop is already loaded and matches the requested id, return it
    // but continue loading in the background to update it
    if (currentLoop && currentLoop.id === loopId && lastLoadedLoopId === loopId) {
      // Load in background to update, but don't show loading state
      getLoop(loopId).then(updatedLoop => {
        if (updatedLoop) {
          // Only update if there are meaningful changes to avoid unnecessary renders
          if (hasLoopContentChanged(currentLoop, updatedLoop)) {
            console.log(`Background update for loop ${loopId}`, updatedLoop);
            
            // 불필요한 재렌더링을 막기 위해 업데이트 필드만 변경
            const newLoop = JSON.parse(JSON.stringify(updatedLoop));
            setCurrentLoop(newLoop);
            
            // Update loop in the list - 중복 루프 방지를 위한 처리
            if (loopsLoaded) {
              setLoops(prevLoops => {
                const existingLoopIndex = prevLoops.findIndex(l => l.id === loopId);
                
                if (existingLoopIndex >= 0) {
                  // 기존 루프 업데이트
                  const updatedLoops = [...prevLoops];
                  updatedLoops[existingLoopIndex] = newLoop;
                  return updatedLoops;
                }
                
                // 존재하지 않는다면 목록에 추가하지 않음 - 빈 루프 생성 방지
                return prevLoops;
              });
            }
          }
        }
      }).catch(error => {
        console.error("Background loop update failed:", error);
      });
      
      return currentLoop;
    }
    
    setLoadingLoop(true);
    console.log(`Loading loop ${loopId} from server...`);
    
    try {
      const loop = await getLoop(loopId);
      if (loop) {
        console.log(`Successfully loaded loop ${loopId}`, loop);
        
        // 완전한 루프인지 확인 - 빈 루프 생성 방지 조건 강화
        const isCompleteLoop = loop.id && 
                               loop.title && 
                               (loop.participants?.length > 0 || loop.messages?.length > 0 || loop.stop_sequences?.length > 0);
        
        // 중요: 완전한 루프만 현재 루프로 설정하고 상태 업데이트
        if (isCompleteLoop) {
          // 깊은 복사를 통해 참조 문제 방지
          const newLoop = JSON.parse(JSON.stringify(loop));
          setCurrentLoop(newLoop);
          setLastLoadedLoopId(loopId);
          
          // Update loop in the list if it exists and loops are loaded
          if (loopsLoaded) {
            setLoops(prevLoops => {
              const existingLoopIndex = prevLoops.findIndex(l => l.id === loopId);
              
              if (existingLoopIndex >= 0) {
                // 기존 루프 업데이트
                const updatedLoops = [...prevLoops];
                updatedLoops[existingLoopIndex] = newLoop;
                return updatedLoops;
              } else {
                // 완전한 루프일 경우만 새로 추가 - 빈 루프 생성 방지
                return [newLoop, ...prevLoops];
              }
            });
          }
          
          // Set isRunning based on loop status
          setIsRunning(loop.status === 'running');
        } else {
          console.warn(`Loop ${loopId} is incomplete, not adding to UI`);
        }
      } else {
        console.warn(`Loop ${loopId} not found on server`);
      }
      return loop;
    } catch (error) {
      console.error(`Failed to load loop ${loopId}:`, error);
      return null;
    } finally {
      setLoadingLoop(false);
    }
  }, [currentLoop, lastLoadedLoopId, loops, loopsLoaded, updateInterval, loadingLoop]);

  // Helper function to determine if loop content has meaningfully changed
  const hasLoopContentChanged = (oldLoop, newLoop) => {
    // Check if messages have changed (different count or different content)
    if (!oldLoop || !newLoop) return true;
    
    if (oldLoop.messages?.length !== newLoop.messages?.length) {
      return true;
    }
    
    // Check if status changed
    if (oldLoop.status !== newLoop.status) {
      return true;
    }
    
    // For large message sets, just compare the last message to avoid deep comparison of all messages
    if (newLoop.messages?.length > 0) {
      const oldLastMsg = oldLoop.messages[oldLoop.messages.length - 1];
      const newLastMsg = newLoop.messages[newLoop.messages.length - 1];
      
      if (!oldLastMsg || !newLastMsg) return true;
      
      // Check content and timestamp
      if (oldLastMsg.content !== newLastMsg.content || 
          oldLastMsg.timestamp !== newLastMsg.timestamp) {
        return true;
      }
    }
    
    // No significant changes detected
    return false;
  };

  const createNewLoop = async (title) => {
    // 이미 로딩 중이면 중복 생성 방지
    if (loading) {
      console.log("Already creating/loading loops, skipping duplicate creation");
      return null;
    }
    
    setLoading(true);
    try {
      console.log(`Creating new loop with title: ${title}`);
      const newLoop = await createLoop(title);
      
      if (!newLoop || !newLoop.id) {
        console.error("Failed to create new loop: Invalid response from server");
        return null;
      }
      
      // 중복 생성 검사
      let existingLoop = null;
      if (loopsLoaded) {
        existingLoop = loops.find(loop => loop.id === newLoop.id);
      }
      
      if (existingLoop) {
        console.warn(`Loop with ID ${newLoop.id} already exists, not adding duplicate`);
      } else {
        // Update loops list only if we have loops loaded already
        if (loopsLoaded) {
          setLoops(prevLoops => [newLoop, ...prevLoops]);
        }
      }
      
      // 현재 루프 업데이트
      setCurrentLoop(newLoop);
      setLastLoadedLoopId(newLoop.id);
      
      console.log(`Created new loop with ID: ${newLoop.id}`);
      return newLoop;
    } catch (error) {
      console.error('Failed to create loop:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLoopName = async (loopId, newTitle) => {
    setLoading(true);
    try {
      const loop = await updateLoopTitle(loopId, newTitle);
      if (loop) {
        // Update currentLoop if it's the one being updated
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(loop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? loop : l)
          );
        }
      }
      return loop;
    } catch (error) {
      console.error('Failed to update loop title:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeLoop = async (loopId) => {
    try {
      await deleteLoop(loopId);
      
      // 루프가 삭제될 때 해당 프롬프트도 삭제
      loopPromptManager.clearPrompt(loopId);
      
      setLoops(prevLoops => prevLoops.filter(loop => loop.id !== loopId));
      if (currentLoop && currentLoop.id === loopId) {
        setCurrentLoop(null);
        setLastLoadedLoopId(null);
        
        // 폴링 중지
        if (updateInterval) {
          clearInterval(updateInterval);
          setUpdateInterval(null);
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to delete loop:', error);
      return false;
    }
  };

  const addNewParticipant = async (loopId, model, systemPrompt = '', displayName = null, userPrompt = '', temperature = 0.7, maxTokens = 4000) => {
    if (!loopId) {
      console.error("Missing loopId for addNewParticipant");
      return Promise.reject(new Error("Missing loopId"));
    }
    
    // 이미 로딩 중이면 중복 요청 방지
    if (loading) {
      console.log(`Already updating another participant, queueing add participant request`);
      // 프로미스 반환하여 나중에 체인 가능하도록 함
      return new Promise((resolve) => {
        // 200ms 후에 재시도
        setTimeout(() => {
          resolve(addNewParticipant(loopId, model, systemPrompt, displayName, userPrompt, temperature, maxTokens));
        }, 200);
      });
    }
    
    setLoading(true);
    
    // Pause polling during update
    const wasPaused = !!updateInterval;
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    try {
      const result = await addParticipant(loopId, model, systemPrompt, displayName, userPrompt, temperature, maxTokens);
      
      if (result && result.loop) {
        // 유효한 루프가 반환되었는지 확인
        const isValidLoop = result.loop.id === loopId && 
                           result.loop.participants && 
                           result.loop.participants.length > 0;
                           
        if (!isValidLoop) {
          console.error("Invalid loop data returned from API:", result);
          return Promise.resolve(null);
        }
        
        // Deep copy to avoid reference issues
        const updatedLoopData = JSON.parse(JSON.stringify(result.loop));
        
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          // Update directly like other participant functions
          setCurrentLoop(updatedLoopData);
        }
        
        // Update loops array and handle duplicates
        if (loopsLoaded) {
          setLoops(prevLoops => {
            // 중복 루프가 있는지 확인
            const existingLoops = prevLoops.filter(loop => loop.id === loopId);
            
            if (existingLoops.length > 1) {
              console.warn(`Found ${existingLoops.length} duplicate loops for ID ${loopId}, cleaning up`);
              // 중복 루프 제거하고 하나만 업데이트
              const cleanedLoops = prevLoops.filter(loop => loop.id !== loopId);
              return [...cleanedLoops, updatedLoopData];
            } else if (existingLoops.length === 1) {
              // 정상적인 케이스 - 기존 루프 업데이트
              return prevLoops.map(l => l.id === loopId ? updatedLoopData : l);
            } else if (loopId === updatedLoopData.id) {
              // 유효한 루프가 생성되었고 목록에 없는 경우 추가
              return [updatedLoopData, ...prevLoops];
            }
            
            // 유효하지 않은 루프는 추가하지 않음
            return prevLoops;
          });
        }
      }
      
      return Promise.resolve(result);
    } catch (error) {
      console.error('Failed to add participant:', error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
      
      // Resume polling if it was active
      if (wasPaused && currentLoop && currentLoop.id) {
        const intervalId = setInterval(() => {
          loadLoop(currentLoop.id);
        }, currentLoop.status === 'running' ? 500 : 2000);
        setUpdateInterval(intervalId);
      }
    }
  };

  const updateLoopParticipant = async (loopId, participantId, updates) => {
    if (!loopId || !participantId) {
      console.error("Missing required parameters for updateLoopParticipant");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    // 이미 로딩 중이면 중복 요청 방지
    if (loading) {
      console.log(`Already updating another participant, queueing update for ${participantId}`);
      // 프로미스 반환하여 나중에 체인 가능하도록 함
      return new Promise((resolve) => {
        // 100ms 후에 재시도
        setTimeout(() => {
          resolve(updateLoopParticipant(loopId, participantId, updates));
        }, 100);
      });
    }
    
    setLoading(true);
    
    // 업데이트 중에 폴링이 간섭하지 않도록 일시 중지
    const wasPaused = !!updateInterval;
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    try {
      // Make a copy and ensure numeric types are correct
      const processedUpdates = {
        ...updates,
        // Ensure model is properly passed
        model: updates.model || 'gpt-4o',
        system_prompt: updates.system_prompt || '',
        user_prompt: updates.user_prompt || '',
        display_name: updates.display_name || '',
        temperature: parseFloat(updates.temperature) || 0.7,
        max_tokens: parseInt(updates.max_tokens) || 4000
      };
      
      console.log("Sending participant update to API:", processedUpdates);
      const updatedLoop = await updateParticipant(loopId, participantId, processedUpdates);
      
      if (updatedLoop) {
        // 유효한 루프가 반환되었는지 확인
        const isValidLoop = updatedLoop.id === loopId && 
                           updatedLoop.participants && 
                           updatedLoop.participants.length > 0;
                           
        if (!isValidLoop) {
          console.error("Invalid loop data returned from API:", updatedLoop);
          return Promise.resolve(null);
        }
        
        // Deep copy to avoid reference issues
        const updatedLoopData = JSON.parse(JSON.stringify(updatedLoop));
        
        // Update the current loop if it's the one being modified
        if (currentLoop && currentLoop.id === loopId) {
          console.log("Updating current loop with new data:", updatedLoopData);
          // Update currentLoop directly like in updateLoopStopSequence
          setCurrentLoop(updatedLoopData);
        }
        
        // Update the loop in the list if it exists
        if (loopsLoaded) {
          // Use a functional update to ensure we're operating on the most up-to-date state
          setLoops(prevLoops => {
            // 중복 루프가 있는지 확인
            const existingLoops = prevLoops.filter(loop => loop.id === loopId);
            
            if (existingLoops.length > 1) {
              console.warn(`Found ${existingLoops.length} duplicate loops for ID ${loopId}, cleaning up`);
              // 중복 루프 제거하고 하나만 업데이트
              const cleanedLoops = prevLoops.filter(loop => loop.id !== loopId);
              return [...cleanedLoops, updatedLoopData];
            } else if (existingLoops.length === 1) {
              // 정상적인 케이스 - 기존 루프 업데이트
              return prevLoops.map(loop => 
                loop.id === loopId ? updatedLoopData : loop
              );
            }
            
            // 존재하지 않는 경우에도 추가하지 않음 (빈 루프 생성 방지)
            console.warn(`No existing loop with ID ${loopId} found, not adding new loop`);
            return prevLoops;
          });
        }
        
        return Promise.resolve(updatedLoopData);
      }
      
      return Promise.resolve(null);
    } catch (error) {
      console.error("Failed to update loop participant:", error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
      
      // 폴링이 중지되었다면 다시 시작
      if (wasPaused && currentLoop && currentLoop.id) {
        const intervalId = setInterval(() => {
          loadLoop(currentLoop.id);
        }, currentLoop.status === 'running' ? 500 : 2000);
        setUpdateInterval(intervalId);
      }
    }
  };

  const removeLoopParticipant = async (loopId, participantId) => {
    setLoading(true);
    
    // Pause polling during update
    const wasPaused = !!updateInterval;
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    try {
      const result = await removeParticipant(loopId, participantId);
      if (result && result.loop) {
        // Deep copy to avoid reference issues
        const updatedLoopData = JSON.parse(JSON.stringify(result.loop));
        
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          // Update directly like other participant functions
          setCurrentLoop(updatedLoopData);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => {
            // Check if loop exists before updating
            const loopExists = prevLoops.some(loop => loop.id === loopId);
            
            if (loopExists) {
              return prevLoops.map(l => l.id === loopId ? updatedLoopData : l);
            }
            return prevLoops;
          });
        }
        
        // Wait to ensure update is processed
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return Promise.resolve(result);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
      
      // Resume polling if it was active
      if (wasPaused && currentLoop && currentLoop.id) {
        const intervalId = setInterval(() => {
          loadLoop(currentLoop.id);
        }, currentLoop.status === 'running' ? 500 : 2000);
        setUpdateInterval(intervalId);
      }
    }
  };

  const reorderLoopParticipants = async (loopId, participantIds) => {
    setLoading(true);
    
    // Pause polling during update
    const wasPaused = !!updateInterval;
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    try {
      const result = await reorderParticipants(loopId, participantIds);
      if (result && result.loop) {
        // Deep copy to avoid reference issues
        const updatedLoopData = JSON.parse(JSON.stringify(result.loop));
        
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          // Update directly like other participant functions
          setCurrentLoop(updatedLoopData);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => {
            // Check if loop exists before updating
            const loopExists = prevLoops.some(loop => loop.id === loopId);
            
            if (loopExists) {
              return prevLoops.map(l => l.id === loopId ? updatedLoopData : l);
            }
            return prevLoops;
          });
        }
        
        // Wait to ensure update is processed
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return Promise.resolve(result);
    } catch (error) {
      console.error('Failed to reorder participants:', error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
      
      // Resume polling if it was active
      if (wasPaused && currentLoop && currentLoop.id) {
        const intervalId = setInterval(() => {
          loadLoop(currentLoop.id);
        }, currentLoop.status === 'running' ? 500 : 2000);
        setUpdateInterval(intervalId);
      }
    }
  };

  const addNewStopSequence = async (loopId, model, systemPrompt = '', displayName = null, stopCondition = '') => {
    setLoading(true);
    try {
      const result = await addStopSequence(loopId, model, systemPrompt, displayName, stopCondition);
      if (result && result.loop) {
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(result.loop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? result.loop : l)
          );
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to add stop sequence:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLoopStopSequence = async (loopId, stopSequenceId, updates) => {
    setLoading(true);
    
    // Temporarily pause polling to prevent stale data overwriting our update
    const wasPaused = !!updateInterval;
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    try {
      // Ensure field names match what backend expects
      const apiUpdates = {
        ...updates,
        // Convert model options properly
        model: updates.model,
        system_prompt: updates.system_prompt,
        display_name: updates.display_name,
        stop_condition: updates.stop_condition,
        max_tokens: updates.max_tokens,
        temperature: updates.temperature
      };
      
      console.log('Sending stop sequence update to API:', apiUpdates);
      const result = await updateStopSequence(loopId, stopSequenceId, apiUpdates);
      
      if (result && result.loop) {
        // Deep copy current loop to avoid reference issues
        const updatedLoop = JSON.parse(JSON.stringify(result.loop));
        
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(updatedLoop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? updatedLoop : l)
          );
        }
        
        // Wait a moment before resuming polling to ensure update is processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return result;
    } catch (error) {
      console.error('Failed to update stop sequence:', error);
      return null;
    } finally {
      setLoading(false);
      
      // Resume polling if it was active before
      if (wasPaused && currentLoop && currentLoop.id) {
        const intervalId = setInterval(() => {
          loadLoop(currentLoop.id);
        }, currentLoop.status === 'running' ? 500 : 2000);
        setUpdateInterval(intervalId);
      }
    }
  };

  const removeLoopStopSequence = async (loopId, stopSequenceId) => {
    setLoading(true);
    try {
      const result = await removeStopSequence(loopId, stopSequenceId);
      if (result && result.loop) {
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(result.loop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? result.loop : l)
          );
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to remove stop sequence:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reorderLoopStopSequences = async (loopId, stopSequenceIds) => {
    setLoading(true);
    try {
      const result = await reorderStopSequences(loopId, stopSequenceIds);
      if (result && result.loop) {
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(result.loop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? result.loop : l)
          );
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to reorder stop sequences:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loopPromptManager = {
    // 특정 루프의 프롬프트 저장
    savePrompt: (loopId, prompt) => {
      if (!loopId) return;
      localStorage.setItem(`loop_prompt_${loopId}`, prompt || '');
    },
    
    // 특정 루프의 프롬프트 로드
    loadPrompt: (loopId) => {
      if (!loopId) return '';
      return localStorage.getItem(`loop_prompt_${loopId}`) || '';
    },
    
    // 특정 루프의 프롬프트 삭제
    clearPrompt: (loopId) => {
      if (!loopId) return;
      localStorage.removeItem(`loop_prompt_${loopId}`);
    }
  };

  const startLoopWithPrompt = async (loopId, initialPrompt) => {
  setLoading(true);
  try {
    // 루프 시작 시 프롬프트 저장 (중복 확인)
    loopPromptManager.savePrompt(loopId, initialPrompt);
    
    const result = await startLoop(loopId, initialPrompt);
    if (result && result.loop) {
      // 현재 루프 업데이트
      setCurrentLoop(result.loop);
      setIsRunning(true);
      
      // 루프 목록 업데이트
      if (loopsLoaded) {
        setLoops(prevLoops => 
          prevLoops.map(l => l.id === loopId ? result.loop : l)
        );
      }
      
      // 폴링 간격 설정
      if (!updateInterval) {
        const intervalId = setInterval(() => {
          loadLoop(loopId);
        }, 2000);
        setUpdateInterval(intervalId);
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to start loop:', error);
    return null;
  } finally {
    setLoading(false);
  }
};

  const pauseCurrentLoop = async () => {
    if (!currentLoop) return null;
    
    setLoading(true);
    try {
      const result = await pauseLoop(currentLoop.id);
      if (result && result.loop) {
        setCurrentLoop(result.loop);
        setIsRunning(false);
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === currentLoop.id ? result.loop : l)
          );
        }
        
        // Clear polling interval
        if (updateInterval) {
          clearInterval(updateInterval);
          setUpdateInterval(null);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to pause loop:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resumeCurrentLoop = async () => {
    if (!currentLoop) return null;
    
    setLoading(true);
    try {
      const result = await resumeLoop(currentLoop.id);
      if (result && result.loop) {
        setCurrentLoop(result.loop);
        setIsRunning(true);
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === currentLoop.id ? result.loop : l)
          );
        }
        
        // Set up polling interval if not already running
        if (!updateInterval) {
          const intervalId = setInterval(() => {
            loadLoop(currentLoop.id);
          }, 2000); // Poll every 2 seconds
          setUpdateInterval(intervalId);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to resume loop:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const stopCurrentLoop = async () => {
    if (!currentLoop) return null;
    
    setLoading(true);
    try {
      const result = await stopLoop(currentLoop.id);
      if (result && result.loop) {
        setCurrentLoop(result.loop);
        setIsRunning(false);
        
        // 루프 목록 업데이트
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === currentLoop.id ? result.loop : l)
          );
        }
        
        // 프롬프트는 유지, 삭제하지 않음
        
        // 폴링 간격 제거
        if (updateInterval) {
          clearInterval(updateInterval);
          setUpdateInterval(null);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to stop loop:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetCurrentLoop = async () => {
    if (!currentLoop) return null;
    
    setLoading(true);
    try {
      const result = await resetLoop(currentLoop.id);
      if (result && result.loop) {
        setCurrentLoop(result.loop);
        setIsRunning(false);
        
        // 루프 목록 업데이트
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === currentLoop.id ? result.loop : l)
          );
        }
        
        // 프롬프트는 유지됨 (삭제하지 않음)
        
        // 폴링 간격 제거
        if (updateInterval) {
          clearInterval(updateInterval);
          setUpdateInterval(null);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to reset loop:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add the updateLoopUserPrompt function
  const updateLoopUserPrompt = async (loopId, loopUserPrompt) => {
    setLoading(true);
    try {
      const loop = await updateLoopUserPromptService(loopId, loopUserPrompt);
      if (loop) {
        // Update currentLoop if it's the one being updated
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(loop);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? loop : l)
          );
        }
      }
      return loop;
    } catch (error) {
      console.error('Failed to update loop user prompt:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [updateInterval]);

  // Update the loop polling logic
  useEffect(() => {
    // Clear any existing interval
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }

    // Set up polling if we have a current loop that is running
    if (currentLoop && currentLoop.status === 'running' && currentLoop.id) {
      const intervalId = setInterval(() => {
        getLoop(currentLoop.id).then(updatedLoop => {
          if (updatedLoop) {
            setCurrentLoop(updatedLoop);
          }
        });
      }, 500); // Poll more frequently (every 500ms)
      setUpdateInterval(intervalId);
    } else if (currentLoop && currentLoop.status === 'paused' && currentLoop.id) {
      // Slower polling for paused loops
      const intervalId = setInterval(() => {
        getLoop(currentLoop.id).then(updatedLoop => {
          if (updatedLoop) {
            setCurrentLoop(updatedLoop);
          }
        });
      }, 2000); // Poll less frequently when paused
      setUpdateInterval(intervalId);
    }
  }, [currentLoop?.id, currentLoop?.status]);

  // Load loops on initial mount
  useEffect(() => {
    loadLoops();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    loops,
    currentLoop,
    loading,
    loadingLoop,
    isRunning,
    loopsLoaded,
    lastLoadedLoopId,
    loadLoops,
    loadLoop,
    createNewLoop,
    updateLoopName,
    removeLoop,
    addParticipant: addNewParticipant,
    updateParticipant: updateLoopParticipant,
    removeParticipant: removeLoopParticipant,
    reorderParticipants: reorderLoopParticipants,
    startLoopWithPrompt,
    pauseCurrentLoop,
    resumeCurrentLoop,
    stopCurrentLoop,
    resetCurrentLoop,
    updateLoopUserPrompt,
    addStopSequence: addNewStopSequence,
    updateStopSequence: updateLoopStopSequence,
    removeStopSequence: removeLoopStopSequence,
    reorderStopSequences: reorderLoopStopSequences,
    updateLoopParticipant,
    removeLoopParticipant,
    reorderLoopParticipants,
    reorderLoopStopSequences
  };

  return (
    <LoopContext.Provider value={value}>
      {children}
    </LoopContext.Provider>
  );
};

export default LoopProvider;