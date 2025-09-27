class GlobalController {
  constructor(dao) {
    this.dao = dao;
  }

  // Obtener todos los registros
  getAll = async (req, res) => {
    try {
      const items = await this.dao.getAll();
      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros',
        error: error.message
      });
    }
  };

  // Leer un registro por ID
  read = async (req, res) => {
    try {
      const { id } = req.params;
      const item = await this.dao.getById(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registro',
        error: error.message
      });
    }
  };

  // Crear nuevo registro
  create = async (req, res) => {
    try {
      const newItem = await this.dao.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Registro creado exitosamente',
        data: newItem
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear registro',
        error: error.message
      });
    }
  };

  // Actualizar registro
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedItem = await this.dao.update(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Registro actualizado exitosamente',
        data: updatedItem
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar registro',
        error: error.message
      });
    }
  };

  // Eliminar registro
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedItem = await this.dao.delete(id);
      
      if (!deletedItem) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Registro eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar registro',
        error: error.message
      });
    }
  };
}

module.exports = GlobalController;

class GlobalDAO {
  constructor(model) {
    this.model = model;
  }

  // Obtener todos los registros
  async getAll() {
    return await this.model.find({});
  }

  // Obtener un registro por ID
  async getById(id) {
    return await this.model.findById(id);
  }

  // Crear un nuevo registro
  async create(data) {
    const newItem = new this.model(data);
    return await newItem.save();
  }

  // Actualizar un registro
  async update(id, data) {
    return await this.model.findByIdAndUpdate(
      id, 
      data, 
      { 
        new: true, // Retorna el documento actualizado
        runValidators: true // Ejecuta las validaciones del schema
      }
    );
  }

  // Eliminar un registro
  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  // Buscar por criterios específicos
  async findBy(criteria) {
    return await this.model.find(criteria);
  }

  // Buscar un registro por criterios específicos
  async findOneBy(criteria) {
    return await this.model.findOne(criteria);
  }
}

module.exports = GlobalDAO;