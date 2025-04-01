
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Outpass, OutpassDB, dbToOutpassFormat } from '@/lib/types';
import { handleApiError } from '@/lib/errorHandler';
import { toast } from 'sonner';

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
    // Configure Supabase for real-time updates
    const configureRealtime = async () => {
      try {
        // For PostgreSQL Broadcast, we are using REPLICA IDENTITY FULL to get 'old' value
        // Removed the Supabase RPC call that was causing type errors
        console.log('Attempting to configure real-time for outpasses table');
      } catch (error) {
        console.error('Could not set up realtime:', error);
      }
    };
    
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
        const formattedOutpasses = (data || []).map((item: OutpassDB) => {
          const outpass = dbToOutpassFormat(item);
          return outpass;
        });
        
        setOutpasses(formattedOutpasses);
        console.log("Fetched outpasses:", formattedOutpasses);
      } catch (error) {
        handleApiError(error, 'Fetching outpasses');
      } finally {
        setIsLoading(false);
      }
    };

    // Try to enable realtime
    configureRealtime();

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
          try {
            // Ensure the payload data follows the OutpassDB structure
            const payloadData = payload.new as OutpassDB;
            const newOutpass = dbToOutpassFormat(payloadData);
            console.log("Inserted new outpass:", newOutpass);
            setOutpasses(prev => [newOutpass, ...prev]);
            
            // Show toast notification for new outpass
            toast.info(`New outpass request from ${payloadData.student_name}`);
          } catch (error) {
            console.error("Error processing inserted outpass:", error);
          }
        })
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'outpasses' 
        },
        (payload) => {
          try {
            // Ensure the payload data follows the OutpassDB structure
            const payloadData = payload.new as OutpassDB;
            const updatedOutpass = dbToOutpassFormat(payloadData);
            console.log("Updated outpass:", updatedOutpass);
            setOutpasses(prev => 
              prev.map(outpass => 
                outpass.id === updatedOutpass.id ? updatedOutpass : outpass
              )
            );
            
            // Show appropriate toast based on status change
            const oldData = payload.old as OutpassDB;
            if (oldData.status !== payloadData.status) {
              if (payloadData.status === 'approved') {
                toast.success(`Outpass for ${payloadData.student_name} has been approved`);
              } else if (payloadData.status === 'denied') {
                toast.error(`Outpass for ${payloadData.student_name} has been denied`);
              }
            }
          } catch (error) {
            console.error("Error processing updated outpass:", error);
          }
        })
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'outpasses'
        },
        (payload) => {
          try {
            // Delete the outpass from state
            const oldId = payload.old?.id;
            if (oldId) {
              console.log("Deleted outpass with ID:", oldId);
              setOutpasses(prev => 
                prev.filter(outpass => outpass.id !== oldId)
              );
              toast.info("An outpass has been deleted");
            }
          } catch (error) {
            console.error("Error processing deleted outpass:", error);
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
