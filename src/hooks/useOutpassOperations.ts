
import { useCallback } from 'react';
import { Outpass, outpassToDbFormat } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import storageSync from '@/lib/storageSync';

/**
 * Custom hook for outpass CRUD operations
 */
export function useOutpassOperations(tabId: string) {
  // Function to update outpasses with real-time syncing
  const updateOutpass = useCallback(async (updatedOutpass: Outpass) => {
    try {
      // Update timestamp
      updatedOutpass.updatedAt = new Date().toISOString();
      
      // Convert camelCase to snake_case for database
      const dbOutpass = outpassToDbFormat(updatedOutpass);
      
      console.log("Updating outpass in database:", dbOutpass);
      
      const { data, error } = await supabase
        .from('outpasses')
        .update(dbOutpass)
        .eq('id', updatedOutpass.id)
        .select();
      
      if (error) throw error;
      
      console.log("Database update response:", data);
      
      // Also update in localStorage for backup purposes and cross-tab sync
      const storedOutpasses = storageSync.getItem<Outpass[]>("outpasses");
      if (storedOutpasses) {
        const updatedOutpasses = storedOutpasses.map((o: Outpass) => {
          if (o.id === updatedOutpass.id) {
            return updatedOutpass;
          }
          return o;
        });
        storageSync.setItem("outpasses", updatedOutpasses);
      }
      
      // Broadcast the changes to other tabs
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('outpass_changes');
        bc.postMessage({ 
          type: 'update', 
          outpass: updatedOutpass,
          oldStatus: storedOutpasses?.find(o => o.id === updatedOutpass.id)?.status || 'pending'
        });
        bc.close();
      }
      
      return data ? data[0] : undefined;
    } catch (error) {
      console.error('Error updating outpass:', error);
      toast.error('Failed to update outpass. Please try again.');
      throw error;
    }
  }, [tabId]);

  // Function to add a new outpass with real-time syncing
  const addOutpass = useCallback(async (newOutpass: Outpass) => {
    try {
      // Set timestamps
      const now = new Date().toISOString();
      newOutpass.createdAt = now;
      newOutpass.updatedAt = now;
      
      // Convert camelCase to snake_case for database
      const dbOutpass = outpassToDbFormat(newOutpass);
      
      console.log("Adding new outpass to database:", dbOutpass);
      
      const { data, error } = await supabase
        .from('outpasses')
        .insert(dbOutpass)
        .select();
      
      if (error) throw error;
      
      console.log("Database insert response:", data);
      
      // Also store in localStorage for backup purposes and cross-tab sync
      const storedOutpasses = storageSync.getItem<Outpass[]>("outpasses");
      if (storedOutpasses) {
        const updatedOutpasses = [newOutpass, ...storedOutpasses];
        storageSync.setItem("outpasses", updatedOutpasses);
      } else {
        storageSync.setItem("outpasses", [newOutpass]);
      }
      
      // Broadcast the changes to other tabs
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('outpass_changes');
        bc.postMessage({ type: 'insert', outpass: newOutpass });
        bc.close();
      }
      
      // Show success for student who submitted
      const userRole = sessionStorage.getItem('userRole');
      if (userRole === 'student') {
        toast.success(`Outpass request submitted successfully`);
      }
      
      return data ? data[0] : undefined;
    } catch (error) {
      console.error('Error adding outpass:', error);
      toast.error('Failed to submit outpass request. Please try again.');
      throw error;
    }
  }, [tabId]);

  // Function to delete an outpass with real-time syncing
  const deleteOutpass = useCallback(async (outpassId: string) => {
    try {
      const { error } = await supabase
        .from('outpasses')
        .delete()
        .eq('id', outpassId);
      
      if (error) throw error;
      
      // Also delete from localStorage
      const storedOutpasses = storageSync.getItem<Outpass[]>("outpasses");
      if (storedOutpasses) {
        const filteredOutpasses = storedOutpasses.filter((o: Outpass) => o.id !== outpassId);
        storageSync.setItem("outpasses", filteredOutpasses);
      }
      
      // Broadcast the changes to other tabs
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('outpass_changes');
        bc.postMessage({ type: 'delete', id: outpassId });
        bc.close();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting outpass:', error);
      toast.error('Failed to delete outpass. Please try again.');
      throw error;
    }
  }, [tabId]);

  return {
    updateOutpass,
    addOutpass,
    deleteOutpass
  };
}
