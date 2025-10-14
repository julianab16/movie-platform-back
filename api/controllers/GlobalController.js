class GlobalController {
  constructor(dao) {
    this.dao = dao;
  }

  // Get all records
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

  // Read a record by ID
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

  // Create new record
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

  // Update record
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

  // Delete record
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

export default GlobalController;