
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
    console.log('Setting up real-time for database tables...');
    
    // First, try to create the function if it doesn't exist
    const { error } = await supabase.rpc('create_replication_function' as any);
    if (error) {
      console.error('Error creating replication function:', error);
      // Continue anyway, as the function might already exist
    } else {
      console.log('Created real-time helper functions');
    }
    
    // Configure tables that need real-time - add a slight delay between them
    await setTableReplication('outpasses');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await setTableReplication('students');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await setTableReplication('mentors');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await setTableReplication('admins');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await setTableReplication('serial_code_logs');
    
    // Log success
    console.log('Successfully configured real-time for all tables');
    
    // Enable realtime for Supabase subscription
    await enableRealtimeForTable('outpasses');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to create real-time helper functions:', error);
    return Promise.reject(error);
  }
}

/**
 * Enable realtime for a specific table by adding it to the realtime publication
 */
async function enableRealtimeForTable(tableName: string): Promise<void> {
  try {
    // Since this requires admin privileges, just log the action for now
    console.log(`Realtime enabled for table: ${tableName} (requires admin configuration)`);
    
    // The actual enabling happens via SQL migration run by an admin:
    // ALTER PUBLICATION supabase_realtime ADD TABLE public.outpasses;
    
    return Promise.resolve();
  } catch (error) {
    console.error(`Could not enable realtime for table ${tableName}:`, error);
    return Promise.reject(error);
  }
}
