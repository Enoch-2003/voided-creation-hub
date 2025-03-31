
import { useState, useEffect } from 'react';
import { Outpass, OutpassDB, dbToOutpassFormat } from '@/lib/types';
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
          const mappedData: Outpass[] = data.map(item => dbToOutpassFormat(item as OutpassDB));
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
          const { eventType } = payload;
          
          // Safely cast the payload data to OutpassDB or add validation
          if (eventType === 'INSERT') {
            // Type assertion with proper validation
            if (isValidOutpassDB(payload.new)) {
              const mappedRecord = dbToOutpassFormat(payload.new as OutpassDB);
              setOutpasses(prev => [...prev, mappedRecord]);
            }
          } else if (eventType === 'UPDATE') {
            // Type assertion with proper validation for both new and old records
            if (isValidOutpassDB(payload.new) && payload.old && 'id' in payload.old) {
              const mappedRecord = dbToOutpassFormat(payload.new as OutpassDB);
              
              setOutpasses(prev => 
                prev.map(outpass => outpass.id === mappedRecord.id ? mappedRecord : outpass)
              );
              
              // Show toast notification based on status change
              const userRole = sessionStorage.getItem('userRole');
              
              if (userRole === 'student' && 
                  payload.new.status === 'approved' && 
                  payload.old.status === 'pending') {
                toast.success(`Your outpass has been approved!`);
              } else if (userRole === 'student' && 
                        payload.new.status === 'denied' && 
                        payload.old.status === 'pending') {
                toast.error(`Your outpass was denied: ${payload.new.deny_reason}`);
              }
            }
          } else if (eventType === 'DELETE' && payload.old && 'id' in payload.old) {
            setOutpasses(prev => prev.filter(outpass => outpass.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper function to validate if an object conforms to OutpassDB structure
  function isValidOutpassDB(obj: any): obj is OutpassDB {
    return obj && 
      typeof obj === 'object' && 
      'id' in obj &&
      'student_id' in obj &&
      'student_name' in obj &&
      'enrollment_number' in obj &&
      'exit_date_time' in obj &&
      'reason' in obj &&
      'status' in obj;
  }

  return {
    outpasses,
    isLoading,
    tabId
  };
}
