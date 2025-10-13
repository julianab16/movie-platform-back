// routes/users.js - Ejemplo de rutas para usuarios
import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET - Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET - Obtener un usuario por ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST - Crear un nuevo usuario
router.post('/users', async (req, res) => {
  try {
    const userData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// PUT - Actualizar un usuario
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE - Eliminar un usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Usuario eliminado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;