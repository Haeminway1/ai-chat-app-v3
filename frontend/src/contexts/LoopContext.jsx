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
      }
      return loop;
    } catch (error) {
      console.error('Failed to load loop:', error);
      return null;
    } finally {
      setLoadingLoop(false);
    }
  }, [currentLoop, lastLoadedLoopId, loops, loopsLoaded]);

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
      setLoops(prevLoops => prevLoops.filter(loop => loop.id !== loopId));
      if (currentLoop && currentLoop.id === loopId) {
        setCurrentLoop(null);
        setLastLoadedLoopId(null);
        
        // Cleanup any existing interval
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

  const addNewParticipant = async (loopId, model, systemPrompt, displayName) => {
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

  const startLoopWithPrompt = async (loopId, initialPrompt) => {
    setLoading(true);
    try {
      const result = await startLoop(loopId, initialPrompt);
      if (result && result.loop) {
        // Update currentLoop
        if (currentLoop && currentLoop.id === loopId) {
          setCurrentLoop(result.loop);
          setIsRunning(true);
        }
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === loopId ? result.loop : l)
          );
        }
        
        // Set up polling interval to get updates
        if (!updateInterval) {
          const intervalId = setInterval(() => {
            loadLoop(loopId);
          }, 2000); // Poll every 2 seconds
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
        
        // Update loop in the list
        if (loopsLoaded) {
          setLoops(prevLoops => 
            prevLoops.map(l => l.id === currentLoop.id ? result.loop : l)
          );
        }
        
        // Clear polling interval if it exists
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