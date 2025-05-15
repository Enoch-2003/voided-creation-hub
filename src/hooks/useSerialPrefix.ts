
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SerialCodeLog } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';

export function useSerialPrefix() {
  const [serialPrefix, setSerialPrefix] = useState<string>("XYZ");
  const [prefixLogs, setPrefixLogs] = useState<SerialCodeLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the latest prefix and logs on mount
  useEffect(() => {
    fetchSerialCodeData();
  }, []);
  
  // Subscribe to realtime changes in the serial_code_logs table
  useEffect(() => {
    const channel = supabase
      .channel('serial-prefix-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'serial_code_logs'
        },
        (payload) => {
          console.log("New serial code prefix log:", payload);
          const newLog = payload.new as SerialCodeLog;
          
          // Update the current prefix to the new one
          setSerialPrefix(newLog.prefix);
          
          // Add the new log to the beginning of our logs array
          setPrefixLogs(currentLogs => [newLog, ...currentLogs]);
          
          toast({
            title: "Serial Code Prefix Updated",
            description: `Prefix changed to ${newLog.prefix} by ${newLog.createdBy}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSerialCodeData = async () => {
    setIsLoading(true);
    try {
      // Fetch all logs sorted by creation date (newest first)
      const { data: logs, error: logsError } = await supabase
        .from('serial_code_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error("Error fetching serial code logs:", logsError);
        throw logsError;
      }

      setPrefixLogs(logs || []);
      
      // Set the current prefix to the most recent one
      if (logs && logs.length > 0) {
        setSerialPrefix(logs[0].prefix);
      }
    } catch (error) {
      console.error("Error in fetchSerialCodeData:", error);
      // Fallback to localStorage for backward compatibility
      try {
        const serialCodeSettings = localStorage.getItem("serialCodeSettings");
        if (serialCodeSettings) {
          const settings = JSON.parse(serialCodeSettings);
          setSerialPrefix(settings.prefix || "XYZ");
        }
      } catch (localStorageError) {
        console.error("Error parsing localStorage data:", localStorageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSerialPrefix = async (newPrefix: string, adminName: string) => {
    if (!newPrefix || !adminName) {
      toast({
        title: "Error",
        description: "Prefix and admin name are required",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Insert the new prefix log into the database
      const { data, error } = await supabase
        .from('serial_code_logs')
        .insert({
          prefix: newPrefix.toUpperCase(),
          created_by: adminName
        })
        .select();

      if (error) {
        console.error("Error updating serial prefix:", error);
        toast({
          title: "Error",
          description: "Failed to update serial code prefix",
          variant: "destructive",
        });
        return false;
      }

      // Update local state
      setSerialPrefix(newPrefix.toUpperCase());
      
      // For backward compatibility, also update localStorage
      const settings = { prefix: newPrefix.toUpperCase() };
      localStorage.setItem("serialCodeSettings", JSON.stringify(settings));

      toast({
        title: "Success",
        description: "Serial code prefix updated successfully",
      });
      return true;
    } catch (error) {
      console.error("Error in updateSerialPrefix:", error);
      toast({
        title: "Error",
        description: "Failed to update serial code prefix",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    serialPrefix,
    prefixLogs,
    isLoading,
    updateSerialPrefix,
    refreshData: fetchSerialCodeData
  };
}
