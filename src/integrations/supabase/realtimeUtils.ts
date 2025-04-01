
import { supabase } from './client';

/**
 * Configure a table for real-time updates
 * This function sets REPLICA IDENTITY to FULL for a table, which allows accessing
 * the 'old' data in real-time change events
 */
export async function setTableReplication(tableName: string): Promise<void> {
  try {
    // Use RPC to set replica identity to FULL
    const { error } = await supabase.rpc('set_table_replication', { table_name: tableName });
    
    if (error) throw error;
    console.log(`Successfully configured real-time for table: ${tableName}`);
  } catch (error) {
    console.error(`Error configuring real-time for table ${tableName}:`, error);
    
    // Create the function if it doesn't exist
    try {
      await supabase.rpc('create_replication_function');
      // Try again after creating the function
      const { error: retryError } = await supabase.rpc('set_table_replication', { table_name: tableName });
      
      if (retryError) throw retryError;
      console.log(`Successfully created function and configured real-time for table: ${tableName}`);
    } catch (innerError) {
      console.error('Could not create real-time configuration function:', innerError);
    }
  }
}

/**
 * Create stored procedures for realtime configuration if they don't exist
 */
export async function setupRealtimeFunctions(): Promise<void> {
  try {
    const { error } = await supabase.rpc('create_replication_function');
    if (error) throw error;
    
    console.log('Created real-time helper functions');
    
    // Configure tables that need real-time
    await setTableReplication('outpasses');
    await setTableReplication('students');
    await setTableReplication('mentors');
    await setTableReplication('admins');
    await setTableReplication('serial_code_logs');
  } catch (error) {
    console.error('Failed to create real-time helper functions:', error);
  }
}
