
import { useState, useEffect } from 'react';
import { Outpass, dbToOutpassFormat } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook for real-time outpass data using Supabase
 */
export function useOutpassSubscription() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabId, setTabId] = useState<string>('');

  // Generate a unique tab ID for notifications
  useEffect(() => {
    setTabId(crypto.randomUUID().substring(0, 5));
  }, []);

  // Load initial outpass data and set up real-time subscription
  useEffect(() => {
    setIsLoading(true);
    
    // Initial fetch of outpasses
    const fetchOutpasses = async () => {
      try {
        const { data, error } = await supabase
          .from('outpasses')
          .select('*');
        
        if (error) {
          console.error('Error fetching outpasses:', error);
          return;
        }
        
        if (data) {
          // Convert database column names to camelCase for our frontend
          const mappedData: Outpass[] = data.map(item => dbToOutpassFormat(item));
          setOutpasses(mappedData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchOutpasses:', error);
        setIsLoading(false);
      }
    };
    
    fetchOutpasses();
    
    // Subscribe to outpass changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'outpasses' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            const mappedRecord = dbToOutpassFormat(newRecord);
            setOutpasses(prev => [...prev, mappedRecord]);
          } else if (eventType === 'UPDATE') {
            const mappedRecord = dbToOutpassFormat(newRecord);
            
            setOutpasses(prev => 
              prev.map(outpass => outpass.id === mappedRecord.id ? mappedRecord : outpass)
            );
            
            // Show toast notification based on status change
            const userRole = sessionStorage.getItem('userRole');
            
            if (userRole === 'student' && newRecord.status === 'approved' && oldRecord.status === 'pending') {
              toast.success(`Your outpass has been approved!`);
            } else if (userRole === 'student' && newRecord.status === 'denied' && oldRecord.status === 'pending') {
              toast.error(`Your outpass was denied: ${newRecord.deny_reason}`);
            }
          } else if (eventType === 'DELETE') {
            setOutpasses(prev => prev.filter(outpass => outpass.id !== oldRecord.id));
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    outpasses,
    isLoading,
    tabId
  };
}
