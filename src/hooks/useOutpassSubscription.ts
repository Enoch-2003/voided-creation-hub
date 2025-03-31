
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Outpass, OutpassDB, dbToOutpassFormat } from '@/lib/types';
import { handleApiError } from '@/lib/errorHandler';

/**
 * Custom hook for subscribing to outpass updates in real-time
 */
export function useOutpassSubscription() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate a unique ID for this tab/session using crypto instead of uuid
  const [tabId] = useState(() => crypto.randomUUID());

  // Fetch initial outpasses and set up real-time subscription
  useEffect(() => {
    // Fetch all outpasses on component mount
    const fetchOutpasses = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('outpasses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Convert outpasses to the frontend format
        const formattedOutpasses = (data || []).map((item: OutpassDB) => dbToOutpassFormat(item));
        
        setOutpasses(formattedOutpasses);
      } catch (error) {
        handleApiError(error, 'Fetching outpasses');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up real-time subscription
    const subscription = supabase
      .channel('outpasses-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'outpasses' 
        },
        (payload) => {
          // Ensure the payload data follows the OutpassDB structure
          const payloadData = payload.new as OutpassDB;
          const newOutpass = dbToOutpassFormat(payloadData);
          setOutpasses(prev => [newOutpass, ...prev]);
        })
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'outpasses' 
        },
        (payload) => {
          // Ensure the payload data follows the OutpassDB structure
          const payloadData = payload.new as OutpassDB;
          const updatedOutpass = dbToOutpassFormat(payloadData);
          setOutpasses(prev => 
            prev.map(outpass => 
              outpass.id === updatedOutpass.id ? updatedOutpass : outpass
            )
          );
        })
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'outpasses'
        },
        (payload) => {
          // Delete the outpass from state
          const oldId = payload.old?.id;
          if (oldId) {
            setOutpasses(prev => 
              prev.filter(outpass => outpass.id !== oldId)
            );
          }
        })
      .subscribe();

    // Fetch initial data
    fetchOutpasses();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { outpasses, isLoading, tabId };
}
