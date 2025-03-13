
import { useState, useEffect } from 'react';
import { Outpass } from '@/lib/types';
import storageSync from '@/lib/storageSync';

/**
 * Custom hook for real-time outpass data
 * This hook will automatically update when outpasses are modified in any tab
 */
export function useOutpasses() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadOutpasses = () => {
      const storedOutpasses = localStorage.getItem('outpasses');
      if (storedOutpasses) {
        try {
          const parsedOutpasses = JSON.parse(storedOutpasses);
          setOutpasses(parsedOutpasses);
        } catch (error) {
          console.error('Error parsing outpasses:', error);
          setOutpasses([]);
        }
      } else {
        // Initialize empty array if none exists
        localStorage.setItem('outpasses', JSON.stringify([]));
        setOutpasses([]);
      }
      setIsLoading(false);
    };

    loadOutpasses();

    // Subscribe to outpass changes in other tabs
    const unsubscribe = storageSync.subscribe('outpasses', (newOutpasses) => {
      if (newOutpasses) {
        setOutpasses(newOutpasses);
      } else {
        setOutpasses([]);
      }
    });

    return unsubscribe;
  }, []);

  // Function to update outpasses
  const updateOutpass = (updatedOutpass: Outpass) => {
    const updatedOutpasses = outpasses.map(outpass => 
      outpass.id === updatedOutpass.id ? updatedOutpass : outpass
    );
    
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  // Function to add a new outpass
  const addOutpass = (newOutpass: Outpass) => {
    const updatedOutpasses = [...outpasses, newOutpass];
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  // Function to delete an outpass
  const deleteOutpass = (outpassId: string) => {
    const updatedOutpasses = outpasses.filter(outpass => outpass.id !== outpassId);
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  return {
    outpasses,
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass
  };
}
