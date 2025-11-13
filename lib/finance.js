
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
  const { data, error } = await supabase.from('records').insert(recordData).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const readRecords = async () => {
  const { data, error } = await supabase.from('records').select('*, accounts(*), categories(*)');
  if (error) throw new Error(error.message);
  return data;
};

export const updateRecord = async (id, updatedData) => {
  const { data, error } = await supabase.from('records').update(updatedData).eq('id
', id).select();
  if (error) throw new Error(error.message);
  return data[0];
};

export const deleteRecord = async (id) => {
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
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
