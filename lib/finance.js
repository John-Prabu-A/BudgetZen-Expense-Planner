import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// Accounts CRUD
export const createAccount = async (accountData) => {
  const { data, error } = await supabase.from('accounts').insert(accountData).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const readAccounts = async () => {
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const updateAccount = async (id, updatedData) => {
  const { data, error } = await supabase.from('accounts').update(updatedData).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const deleteAccount = async (id) => {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
};

// Categories CRUD
export const createCategory = async (categoryData) => {
  const { data, error } = await supabase.from('categories').insert(categoryData).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const readCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const updateCategory = async (id, updatedData) => {
  const { data, error } = await supabase.from('categories').update(updatedData).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
};

// Records CRUD
export const createRecord = async (recordData) => {
  console.log('🚀 [createRecord] Creating record with data:', {
    type: recordData.type,
    amount: recordData.amount,
    account_id: recordData.account_id,
    category_id: recordData.category_id,
    to_account_id: recordData.to_account_id,
    transfer_group_id: recordData.transfer_group_id,
  });
  
  // Normalize type to lowercase for database storage
  const normalizedType = (recordData.type || '').toLowerCase();
  
  // Handle transfers specially - create two linked records
  if (normalizedType === 'transfer' && recordData.to_account_id) {
    const transferGroupId = recordData.transfer_group_id || uuidv4();
    
    console.log('🔄 [createRecord] Transfer detected - creating linked records with group:', transferGroupId);
    
    // Record 1: Debit from source account
    const sourceRecord = {
      ...recordData,
      type: normalizedType, // Use normalized lowercase type
      transfer_group_id: transferGroupId,
    };
    
    // Record 2: Credit to destination account
    const destRecord = {
      user_id: recordData.user_id,
      amount: recordData.amount,
      type: normalizedType, // Use normalized lowercase type
      account_id: recordData.to_account_id, // Credit to destination
      to_account_id: recordData.account_id, // Link back to source
      category_id: null,
      notes: recordData.notes,
      transaction_date: recordData.transaction_date,
      transfer_group_id: transferGroupId,
    };
    
    try {
      const { data: source, error: sourceError } = await supabase.from('records').insert(sourceRecord).select();
      if (sourceError) throw new Error(sourceError.message);
      
      console.log('✅ [createRecord] Source record created:', source[0]?.id);
      
      const { data: dest, error: destError } = await supabase.from('records').insert(destRecord).select();
      if (destError) throw new Error(destError.message);
      
      console.log('✅ [createRecord] Destination record created:', dest[0]?.id);
      console.log('✅ [createRecord] Transfer complete - both records linked via group:', transferGroupId);
      
      return source[0]; // Return the source record
    } catch (error) {
      console.error('❌ [createRecord] Transfer creation failed:', error.message);
      throw new Error(error.message);
    }
  }
  
  // Regular income/expense records
  const normalizedRecordData = {
    ...recordData,
    type: normalizedType, // Use normalized lowercase type
  };
  
  const { data, error } = await supabase.from('records').insert(normalizedRecordData).select();
  if (error) {
    console.error('❌ [createRecord] Insert failed:', error.message);
    throw new Error(error.message);
  }
  
  console.log('✅ [createRecord] Regular record created:', data[0]?.id);
  return data[0];
};

export const readRecords = async () => {
  // Fetch records with explicit foreign key aliases to avoid ambiguity
  // Since records has TWO foreign keys to accounts (account_id and to_account_id),
  // we need to use aliases for clarity
  const { data, error } = await supabase
    .from('records')
    .select('*, source_account:account_id(id, name), categories(*), destination_account:to_account_id(id, name)');
  
  if (error) {
    console.error('❌ [readRecords] Error fetching records:', error.message);
    throw new Error(error.message);
  }

  console.log('📊 [readRecords] Raw records fetched:', data?.length || 0, 'records');

  if (!data || data.length === 0) {
    console.log('📊 [readRecords] No records found in database');
    return [];
  }

  // NORMALIZE: Convert all record types to UPPERCASE and organize account data
  const normalizedData = (data || []).map(record => ({
    ...record,
    type: (record.type || '').toUpperCase(),
    accounts: record.source_account, // Map source_account to accounts for compatibility
    to_account: record.destination_account, // Map destination_account to to_account
  }));
  
  // LOGGING: Detailed data received from Supabase
  console.log('📊 [readRecords] Processed records:', {
    totalRecords: normalizedData?.length || 0,
    typeBreakdown: normalizedData ? normalizedData.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {}) : {},
    sampleRecords: normalizedData?.slice(0, 3)?.map(r => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      fromAccount: r.accounts?.name,
      category: r.categories?.name,
      toAccount: r.to_account?.name,
      transfer_group_id: r.transfer_group_id,
    })) || [],
  });
  
  return normalizedData;
};

export const updateRecord = async (id, updatedData) => {
  console.log('✏️ [updateRecord] Updating record:', {
    id,
    type: updatedData.type,
    amount: updatedData.amount,
  });
  
  // Normalize type to lowercase for database storage
  const normalizedType = (updatedData.type || '').toLowerCase();
  
  // For transfers, we need to update both linked records
  if (normalizedType === 'transfer') {
    console.log('🔄 [updateRecord] Transfer record detected - updating linked records');
    
    try {
      // Get the original record to find its transfer group
      const { data: originalRecord, error: getError } = await supabase
        .from('records')
        .select('transfer_group_id')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('❌ [updateRecord] Failed to fetch original record:', getError.message);
        throw new Error(getError.message);
      }
      
      const transferGroupId = originalRecord.transfer_group_id;
      console.log('📍 [updateRecord] Found transfer group:', transferGroupId);
      
      // Get both records in this transfer group
      const { data: linkedRecords, error: linkedError } = await supabase
        .from('records')
        .select('*')
        .eq('transfer_group_id', transferGroupId);
      
      if (linkedError) {
        console.error('❌ [updateRecord] Failed to fetch linked records:', linkedError.message);
        throw new Error(linkedError.message);
      }
      
      console.log('📋 [updateRecord] Found', linkedRecords.length, 'linked records in group');
      
      // Update source record
      const sourceData = {
        amount: updatedData.amount,
        notes: updatedData.notes,
        transaction_date: updatedData.transaction_date,
      };
      
      const sourceRecord = linkedRecords.find(r => r.id === id);
      const { data: updated, error: updateError } = await supabase
        .from('records')
        .update(sourceData)
        .eq('id', id)
        .select();
      
      if (updateError) {
        console.error('❌ [updateRecord] Failed to update source record:', updateError.message);
        throw new Error(updateError.message);
      }
      
      console.log('✅ [updateRecord] Source record updated:', id);
      
      // Update destination record
      const destRecord = linkedRecords.find(r => r.id !== id);
      if (destRecord) {
        const destUpdate = await supabase
          .from('records')
          .update(sourceData)
          .eq('id', destRecord.id);
        
        if (destUpdate.error) {
          console.error('❌ [updateRecord] Failed to update destination record:', destUpdate.error.message);
          throw new Error(destUpdate.error.message);
        }
        
        console.log('✅ [updateRecord] Destination record updated:', destRecord.id);
      }
      
      console.log('✅ [updateRecord] Transfer update complete');
      return updated[0];
    } catch (error) {
      console.error('❌ [updateRecord] Transfer update failed:', error.message);
      throw new Error(error.message);
    }
  }
  
  // Regular update for income/expense
  console.log('📝 [updateRecord] Regular record update');
  const normalizedUpdateData = {
    ...updatedData,
    type: normalizedType, // Use normalized lowercase type
  };
  
  const { data, error } = await supabase.from('records').update(normalizedUpdateData).eq('id', id).select();
  if (error) {
    console.error('❌ [updateRecord] Regular update failed:', error.message);
    throw new Error(error.message);
  }
  
  console.log('✅ [updateRecord] Record updated successfully');
  return data[0];
};

export const deleteRecord = async (id) => {
  console.log('🗑️ [deleteRecord] Attempting to delete record:', id);
  
  try {
    // Check if it's a transfer record with a group
    const { data: record, error: getError } = await supabase
      .from('records')
      .select('transfer_group_id, type')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('❌ [deleteRecord] Failed to fetch record:', getError.message);
      throw new Error(getError.message);
    }
    
    console.log('📋 [deleteRecord] Record type:', record.type);
    
    // Normalize type comparison
    const normalizedRecordType = (record.type || '').toLowerCase();
    
    // If it's a transfer, delete both linked records
    if (normalizedRecordType === 'transfer' && record.transfer_group_id) {
      console.log('🔄 [deleteRecord] Transfer detected - deleting both linked records in group:', record.transfer_group_id);
      
      const { error: deleteError } = await supabase
        .from('records')
        .delete()
        .eq('transfer_group_id', record.transfer_group_id);
      
      if (deleteError) {
        console.error('❌ [deleteRecord] Failed to delete transfer records:', deleteError.message);
        throw new Error(deleteError.message);
      }
      
      console.log('✅ [deleteRecord] Transfer records deleted successfully');
    } else {
      // Regular delete for single records
      console.log('📝 [deleteRecord] Regular record - deleting single record');
      
      const { error: deleteError } = await supabase.from('records').delete().eq('id', id);
      if (deleteError) {
        console.error('❌ [deleteRecord] Failed to delete record:', deleteError.message);
        throw new Error(deleteError.message);
      }
      
      console.log('✅ [deleteRecord] Record deleted successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ [deleteRecord] Delete operation failed:', error.message);
    throw new Error(error.message);
  }
};

// Budgets CRUD
export const createBudget = async (budgetData) => {
  const { data, error } = await supabase.from('budgets').insert(budgetData).select();
  if (error) throw new Error(error.message);
return data[0];
};

export const readBudgets = async () => {
  const { data, error } = await supabase.from('budgets').select('*, categories(*)');
  if (error) throw new Error(error.message);
  return data;
};

export const updateBudget = async (id, updatedData) => {
  const { data, error } = await supabase.from('budgets').update(updatedData).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const deleteBudget = async (id) => {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
};

// Enhanced Records CRUD with auto-formatting
export const readRecordsWithSpending = async () => {
  // This function normalizes all records for consistent budget calculation
  const { data, error } = await supabase
    .from('records')
    .select('*, source_account:account_id(id, name), categories(*), destination_account:to_account_id(id, name)');
  
  if (error) throw new Error(error.message);
  
  // Normalize record types to uppercase for consistent filtering
  return (data || []).map(record => ({
    ...record,
    type: (record.type || '').toUpperCase(),
    accounts: record.source_account,
    to_account: record.destination_account,
  }));
};
