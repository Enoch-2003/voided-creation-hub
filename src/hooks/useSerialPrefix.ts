
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SerialCodeLog } from '@/lib/types'; // Ensure this type is correctly defined

const SERIAL_CODE_CONFIG_KEY = 'serialCodeConfig';

interface SerialCodeConfig {
  prefix: string;
  updatedAt: string;
  updatedBy: string;
}

export function useSerialPrefix(adminId?: string) {
  const [serialPrefix, setSerialPrefix] = useState<string>('A'); // Default prefix
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [prefixLogs, setPrefixLogs] = useState<SerialCodeLog[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(adminId || null);

  const fetchLatestPrefixAndLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch the most recent prefix log
      const { data: latestLogData, error: latestLogError } = await supabase
        .from('serial_code_logs')
        .select('prefix, created_at, created_by, id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestLogError && latestLogError.code !== 'PGRST116') { // PGRST116: no rows found
        throw latestLogError;
      }

      if (latestLogData) {
        setSerialPrefix(latestLogData.prefix);
      } else {
        // If no logs, check local storage or set default
        const storedConfig = localStorage.getItem(SERIAL_CODE_CONFIG_KEY);
        if (storedConfig) {
          const config = JSON.parse(storedConfig) as SerialCodeConfig;
          setSerialPrefix(config.prefix);
        } else {
          setSerialPrefix('A'); // Default if nothing is found
        }
      }

      // Fetch all logs
      const { data: logsData, error: logsError } = await supabase
        .from('serial_code_logs')
        .select('id, prefix, created_at, created_by')
        .order('created_at', { ascending: false });

      if (logsError) {
        throw logsError;
      }
      
      // Map snake_case to camelCase for logs
      const mappedLogs = logsData.map(log => ({
        id: log.id,
        prefix: log.prefix,
        createdAt: log.created_at, // Map here
        createdBy: log.created_by, // Map here
      }));
      setPrefixLogs(mappedLogs);

    } catch (error: any) {
      console.error('Error fetching serial prefix or logs:', error);
      toast.error(error.message || 'Failed to fetch serial prefix configuration.');
      // Fallback to local storage or default if DB fetch fails for prefix
      const storedConfig = localStorage.getItem(SERIAL_CODE_CONFIG_KEY);
      if (storedConfig) {
        const config = JSON.parse(storedConfig) as SerialCodeConfig;
        setSerialPrefix(config.prefix);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestPrefixAndLogs();

    // Set up Supabase real-time subscription for logs
    const channel = supabase
      .channel('serial_code_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'serial_code_logs' },
        (payload) => {
          console.log('Serial code log change received!', payload);
          fetchLatestPrefixAndLogs(); // Refetch logs and latest prefix on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestPrefixAndLogs]);

  useEffect(() => {
    if (adminId) {
      setCurrentAdminId(adminId);
    }
  }, [adminId]);

  const updateSerialPrefix = async (newPrefix: string) => {
    if (!currentAdminId) {
      toast.error("Admin ID is not set. Cannot update prefix.");
      console.error("Admin ID not set for prefix update.");
      return;
    }
    if (!newPrefix.trim()) {
      toast.error("Prefix cannot be empty.");
      return;
    }
    setIsLoading(true);
    try {
      const newLogEntry = {
        prefix: newPrefix.trim().toUpperCase(),
        created_by: currentAdminId, 
      };

      const { data, error } = await supabase
        .from('serial_code_logs')
        .insert(newLogEntry)
        .select('prefix, created_at, created_by, id') // Ensure new log is returned with all fields
        .single();

      if (error) throw error;

      if (data) {
        setSerialPrefix(data.prefix); // Update state with the prefix from the new log
         // No need to manually update prefixLogs here, subscription will handle it.
        toast.success(`Serial prefix updated to ${data.prefix}`);
      }
      
      // Update local storage as a fallback/legacy
      const config: SerialCodeConfig = {
        prefix: newPrefix.trim().toUpperCase(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentAdminId,
      };
      localStorage.setItem(SERIAL_CODE_CONFIG_KEY, JSON.stringify(config));

    } catch (error: any) {
      console.error('Error updating serial prefix:', error);
      toast.error(error.message || 'Failed to update serial prefix.');
    } finally {
      setIsLoading(false);
    }
  };

  return { serialPrefix, prefixLogs, isLoading, updateSerialPrefix, fetchLatestPrefixAndLogs };
}
