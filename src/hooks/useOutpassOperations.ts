
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
      
      const { error } = await supabase
        .from('outpasses')
        .update(dbOutpass)
        .eq('id', updatedOutpass.id);
      
      if (error) throw error;
      
      // Show toast for real-time feedback with tab ID
      const toastMessage = `[Tab: ${tabId}] `;
      const userRole = sessionStorage.getItem('userRole');
      
      if (userRole === 'mentor' && updatedOutpass.status === 'approved') {
        toast.success(`${toastMessage}Outpass for ${updatedOutpass.studentName} approved`);
      } else if (userRole === 'mentor' && updatedOutpass.status === 'denied') {
        toast.error(`${toastMessage}Outpass for ${updatedOutpass.studentName} denied`);
      }
    } catch (error) {
      console.error('Error updating outpass:', error);
      toast.error('Failed to update outpass. Please try again.');
    }
  }, [tabId]);

  // Function to add a new outpass with real-time syncing
  const addOutpass = useCallback(async (newOutpass: Outpass) => {
    try {
      // Convert camelCase to snake_case for database
      const dbOutpass = outpassToDbFormat(newOutpass);
      
      const { error } = await supabase
        .from('outpasses')
        .insert(dbOutpass);
      
      if (error) throw error;
      
      // Show toast for real-time feedback
      const userRole = sessionStorage.getItem('userRole');
      if (userRole === 'student') {
        toast.success(`[Tab: ${tabId}] Outpass request submitted successfully`);
      }
    } catch (error) {
      console.error('Error adding outpass:', error);
      toast.error('Failed to submit outpass request. Please try again.');
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
      
      toast.success(`[Tab: ${tabId}] Outpass deleted successfully`);
    } catch (error) {
      console.error('Error deleting outpass:', error);
      toast.error('Failed to delete outpass. Please try again.');
    }
  }, [tabId]);

  return {
    updateOutpass,
    addOutpass,
    deleteOutpass
  };
}
