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
  resetLoop
} from '../services/loopService';

const LoopContext = createContext(null);

export const useLoop = () => useContext(LoopContext);

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
    
    setLoading(true);
    try {
      const loopList = await listLoops();
      
      // Sort by updated_at date (most recent first)
      loopList.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      setLoops(loopList);
      setLoopsLoaded(true);
      return loopList;
    } catch (error) {
      console.error('Failed to load loops:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loopsLoaded]); // Avoid adding loops to dependencies

  const loadLoop = useCallback(async (loopId) => {
    if (!loopId) return null;
    
    // If current loop is already loaded and matches the requested id, return it
    if (currentLoop && currentLoop.id === loopId && lastLoadedLoopId === loopId) {
      return currentLoop;
    }
    
    setLoadingLoop(true);
    try {
      const loop = await getLoop(loopId);
      if (loop) {
        setCurrentLoop(loop);
        setLastLoadedLoopId(loopId);
        
        // Update loop in the list if it exists and loops are loaded
        if (loopsLoaded) {
          const loopExists = loops.some(l => l.id === loopId);
          if (loopExists) {
            setLoops(prevLoops => 
              prevLoops.map(l => l.id === loopId ? loop : l)
            );
          } else {
            setLoops(prevLoops => [loop, ...prevLoops]);
          }
        }
        
        // Set isRunning based on loop status
        setIsRunning(loop.status === 'running');
        
        // Set up polling if loop is running
        if (loop.status === 'running' && !updateInterval) {
          const intervalId = setInterval(() => {
            getLoop(loopId).then(updatedLoop => {
              if (updatedLoop) {
                setCurrentLoop(updatedLoop);
              }
            });
          }, 2000); // Poll every 2 seconds
          setUpdateInterval(intervalId);
        }
      }
      return loop;
    } catch (error) {
      console.error('Failed to load loop:', error);
      return null;
    } finally {
      setLoadingLoop(false);
    }
  }, [currentLoop, lastLoadedLoopId, loops, loopsLoaded, updateInterval]);

  const createNewLoop = async (title) => {
    setLoading(true);
    try {
      const newLoop = await createLoop(title);
      
      // Update loops list only if we have loops loaded already
      if (loopsLoaded) {
        setLoops(prevLoops => [newLoop, ...prevLoops]);
      }
      
      setCurrentLoop(newLoop);
      setLastLoadedLoopId(newLoop.id);
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

  const addNewParticipant = async (loopId, model, systemPrompt = '', displayName = null) => {
    setLoading(true);
    try {
      const result = await addParticipant(loopId, model, systemPrompt, displayName);
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
      console.error('Failed to add participant:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLoopParticipant = async (loopId, participantId, updates) => {
    setLoading(true);
    try {
      const result = await updateParticipant(loopId, participantId, updates);
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
      console.error('Failed to update participant:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeLoopParticipant = async (loopId, participantId) => {
    setLoading(true);
    try {
      const result = await removeParticipant(loopId, participantId);
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
      console.error('Failed to remove participant:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reorderLoopParticipants = async (loopId, participantIds) => {
    setLoading(true);
    try {
      const result = await reorderParticipants(loopId, participantIds);
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
      console.error('Failed to reorder participants:', error);
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
    addNewParticipant,
    updateLoopParticipant,
    removeLoopParticipant,
    reorderLoopParticipants,
    startLoopWithPrompt,
    pauseCurrentLoop,
    resumeCurrentLoop,
    stopCurrentLoop,
    resetCurrentLoop
  };

  return (
    <LoopContext.Provider value={value}>
      {children}
    </LoopContext.Provider>
  );
};

export default LoopProvider;