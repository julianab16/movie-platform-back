const { supabase } = require('../config/supabase');

class GlobalDAO {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Obtener todos los registros
  async getAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Obtener un registro por ID
  async getById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  // Crear un nuevo registro
  async create(data) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  // Actualizar un registro
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

  // Eliminar un registro
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

  // Buscar por criterios específicos
  async findBy(criteria) {
    let query = supabase.from(this.tableName).select('*');
    
    Object.keys(criteria).forEach(key => {
      query = query.eq(key, criteria[key]);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Buscar un registro por criterios específicos
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

module.exports = GlobalDAO;