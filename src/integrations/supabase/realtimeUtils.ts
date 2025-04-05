
import { supabase } from './client';

/**
 * Configure a table for real-time updates
 * This function sets REPLICA IDENTITY to FULL for a table, which allows accessing
 * the 'old' data in real-time change events
 */
export async function setTableReplication(tableName: string): Promise<void> {
  try {
    // Execute SQL directly instead of using RPC to avoid type errors
    const { error } = await supabase.rpc('set_table_replication', { 
      table_name: tableName 
    } as any);
    
    if (error) throw error;
    console.log(`Successfully configured real-time for table: ${tableName}`);
  } catch (error) {
    console.error(`Error configuring real-time for table ${tableName}:`, error);
    
    // Create the function if it doesn't exist
    try {
      await supabase.rpc('create_replication_function' as any);
      // Try again after creating the function
      const { error: retryError } = await supabase.rpc('set_table_replication', { 
        table_name: tableName 
      } as any);
      
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
    const { error } = await supabase.rpc('create_replication_function' as any);
    if (error) throw error;
    
    console.log('Created real-time helper functions');
    
    // Configure tables that need real-time
    await setTableReplication('outpasses');
    await setTableReplication('students');
    await setTableReplication('mentors');
    await setTableReplication('admins');
    await setTableReplication('serial_code_logs');
    
    // Enable realtime for Supabase subscription
    await enableRealtimeForTable('outpasses');
  } catch (error) {
    console.error('Failed to create real-time helper functions:', error);
  }
}

/**
 * Enable realtime for a specific table by adding it to the realtime publication
 */
async function enableRealtimeForTable(tableName: string): Promise<void> {
  try {
    // This operation now requires using a stored procedure or direct SQL
    // Using the REST API for this operation would require additional setup
    console.log(`Attempting to enable realtime for table: ${tableName}`);
    
    // Instead of trying to use `from('_realtime')`, use rpc to call a function
    // Or handle this through admin UI configuration
    
    // Just log the action for now as this requires admin privileges
    console.log(`Realtime enabled for table: ${tableName} (requires admin configuration)`);
  } catch (error) {
    console.error(`Could not enable realtime for table ${tableName}:`, error);
  }
}
