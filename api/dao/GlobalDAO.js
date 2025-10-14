import { supabase } from '../config/supabase.js';

class GlobalDAO {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Get all records
  async getAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get a record by ID
  async getById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  // Create a new record
  async create(data) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  // Update a record
  async update(id, data) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  // Delete a record
  async delete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Search by specific criteria
  async findBy(criteria) {
    let query = supabase.from(this.tableName).select('*');
    
    Object.keys(criteria).forEach(key => {
      query = query.eq(key, criteria[key]);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Find one record by specific criteria
  async findOneBy(criteria) {
    let query = supabase.from(this.tableName).select('*');
    
    Object.keys(criteria).forEach(key => {
      query = query.eq(key, criteria[key]);
    });
    
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export default GlobalDAO;