
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Outpass, OutpassDB, dbToOutpassFormat } from '@/lib/types';
import { handleApiError } from '@/lib/errorHandler';
import { toast } from 'sonner';
import { setupRealtimeFunctions } from '@/integrations/supabase/realtimeUtils';

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
    console.log("Setting up outpass subscription");
    
    // Configure Supabase for real-time updates
    const configureRealtime = async () => {
      try {
        // For PostgreSQL Broadcast, we are using REPLICA IDENTITY FULL to get 'old' value
        await setupRealtimeFunctions();
        console.log('Configured real-time for outpasses table');
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
        console.log("Fetched outpasses:", formattedOutpasses.length);
        
        // Store outpasses in localStorage for backup/offline access
        localStorage.setItem("outpasses", JSON.stringify(formattedOutpasses));
      } catch (error) {
        handleApiError(error, 'Fetching outpasses');
        
        // Try to load from localStorage if network request fails
        const storedOutpasses = localStorage.getItem("outpasses");
        if (storedOutpasses) {
          setOutpasses(JSON.parse(storedOutpasses));
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Try to enable realtime
    configureRealtime();

    // Set up real-time subscription with improved channel name and error handling
    const channel = supabase
      .channel(`outpasses-realtime-${tabId}`)
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
            
            // Update state with the new outpass
            setOutpasses(prev => {
              const updated = [newOutpass, ...prev];
              // Also update localStorage
              localStorage.setItem("outpasses", JSON.stringify(updated));
              return updated;
            });
            
            // Show toast notification for new outpass
            const userRole = sessionStorage.getItem('userRole');
            if (userRole === 'mentor' || userRole === 'admin') {
              toast.info(`New outpass request from ${payloadData.student_name}`);
            }
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
            const oldData = payload.old as OutpassDB;
            const updatedOutpass = dbToOutpassFormat(payloadData);
            console.log("Updated outpass:", updatedOutpass);
            
            // Update state with the updated outpass
            setOutpasses(prev => {
              const updated = prev.map(outpass => 
                outpass.id === updatedOutpass.id ? updatedOutpass : outpass
              );
              // Also update localStorage
              localStorage.setItem("outpasses", JSON.stringify(updated));
              return updated;
            });
            
            // Show appropriate toast based on status change and user role
            const userRole = sessionStorage.getItem('userRole');
            const userId = sessionStorage.getItem('userId');
            
            if (oldData.status !== payloadData.status) {
              if (userRole === 'student' && payloadData.student_id === userId) {
                if (payloadData.status === 'approved') {
                  toast.success(`Your outpass has been approved by ${payloadData.mentor_name}`);
                } else if (payloadData.status === 'denied') {
                  toast.error(`Your outpass has been denied. Reason: ${payloadData.deny_reason || 'Not provided'}`);
                }
              } else if (userRole === 'mentor') {
                if (payloadData.status === 'approved' && payloadData.mentor_id === userId) {
                  toast.success(`You approved the outpass for ${payloadData.student_name}`);
                } else if (payloadData.status === 'denied' && payloadData.mentor_id === userId) {
                  toast.error(`You denied the outpass for ${payloadData.student_name}`);
                } else if (payloadData.mentor_id !== userId) {
                  // Notification for other mentors
                  if (payloadData.status === 'approved') {
                    toast.info(`Outpass for ${payloadData.student_name} was approved by ${payloadData.mentor_name}`);
                  } else if (payloadData.status === 'denied') {
                    toast.info(`Outpass for ${payloadData.student_name} was denied by ${payloadData.mentor_name}`);
                  }
                }
              } else if (userRole === 'admin') {
                if (payloadData.status === 'approved') {
                  toast.success(`Outpass for ${payloadData.student_name} has been approved by ${payloadData.mentor_name}`);
                } else if (payloadData.status === 'denied') {
                  toast.error(`Outpass for ${payloadData.student_name} has been denied by ${payloadData.mentor_name}`);
                }
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
              
              // Update state without the deleted outpass
              setOutpasses(prev => {
                const updated = prev.filter(outpass => outpass.id !== oldId);
                // Also update localStorage
                localStorage.setItem("outpasses", JSON.stringify(updated));
                return updated;
              });
              
              const userRole = sessionStorage.getItem('userRole');
              if (userRole === 'mentor' || userRole === 'admin') {
                toast.info("An outpass has been deleted");
              }
            }
          } catch (error) {
            console.error("Error processing deleted outpass:", error);
          }
        })
      .subscribe((status) => {
        console.log("Outpasses subscription status:", status);
      });

    // Fetch initial data
    fetchOutpasses();

    // Clean up subscription on unmount
    return () => {
      console.log("Cleaning up outpasses subscription");
      supabase.removeChannel(channel);
    };
  }, [tabId]); // Add tabId as dependency

  return { outpasses, isLoading, tabId };
}
