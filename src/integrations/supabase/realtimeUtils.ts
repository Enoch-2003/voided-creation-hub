
import { supabase } from './client';

/**
 * Configure a table for real-time updates
 * This function sets REPLICA IDENTITY to FULL for a table, which allows accessing
 * the 'old' data in real-time change events
 */
export async function setTableReplication(tableName: string): Promise<void> {
  try {
    // Use RPC to set replica identity to FULL
    await supabase.rpc('set_table_replication', { table_name: tableName });
    console.log(`Successfully configured real-time for table: ${tableName}`);
  } catch (error) {
    console.error(`Error configuring real-time for table ${tableName}:`, error);
    
    // Create the function if it doesn't exist
    try {
      await supabase.rpc('create_replication_function');
      // Try again after creating the function
      await supabase.rpc('set_table_replication', { table_name: tableName });
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
    await supabase.rpc('create_replication_function');
    console.log('Created real-time helper functions');
    
    // Configure tables that need real-time
    await setTableReplication('outpasses');
    await setTableReplication('students');
    await setTableReplication('mentors');
    await setTableReplication('admins');
  } catch (error) {
    console.error('Failed to create real-time helper functions:', error);
  }
}
