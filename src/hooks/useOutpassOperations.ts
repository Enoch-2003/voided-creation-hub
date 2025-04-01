
import { useCallback } from 'react';
import { Outpass, outpassToDbFormat } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      
      // Also update in localStorage for backup purposes
      const storedOutpasses = localStorage.getItem("outpasses");
      if (storedOutpasses) {
        const outpasses = JSON.parse(storedOutpasses);
        const updatedOutpasses = outpasses.map((o: Outpass) => {
          if (o.id === updatedOutpass.id) {
            return updatedOutpass;
          }
          return o;
        });
        localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
      }
      
      // Show toast for real-time feedback with tab ID
      const toastMessage = `[Tab: ${tabId}] `;
      const userRole = sessionStorage.getItem('userRole');
      
      if (userRole === 'mentor' && updatedOutpass.status === 'approved') {
        toast.success(`${toastMessage}Outpass for ${updatedOutpass.studentName} approved`);
      } else if (userRole === 'mentor' && updatedOutpass.status === 'denied') {
        toast.error(`${toastMessage}Outpass for ${updatedOutpass.studentName} denied`);
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
      
      // Also store in localStorage for backup purposes
      const storedOutpasses = localStorage.getItem("outpasses");
      if (storedOutpasses) {
        const outpasses = JSON.parse(storedOutpasses);
        outpasses.unshift(newOutpass);
        localStorage.setItem("outpasses", JSON.stringify(outpasses));
      } else {
        localStorage.setItem("outpasses", JSON.stringify([newOutpass]));
      }
      
      // Show toast for real-time feedback
      const userRole = sessionStorage.getItem('userRole');
      if (userRole === 'student') {
        toast.success(`[Tab: ${tabId}] Outpass request submitted successfully`);
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
      const storedOutpasses = localStorage.getItem("outpasses");
      if (storedOutpasses) {
        const outpasses = JSON.parse(storedOutpasses);
        const filteredOutpasses = outpasses.filter((o: Outpass) => o.id !== outpassId);
        localStorage.setItem("outpasses", JSON.stringify(filteredOutpasses));
      }
      
      toast.success(`[Tab: ${tabId}] Outpass deleted successfully`);
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
