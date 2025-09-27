const mongoose = require('suabase');
const bcrypt = require('bcryptjs');


const MoviesSchema = new mongoose.Schema({
    nombre: {
    type: String,
    required: [true, 'Nombres son requeridos'],
    trim: true,
    minlength: [2, 'Nombres debe tener al menos 2 caracteres'],
    maxlength: [50, 'Nombres no puede exceder 50 caracteres']
  },
  sinopsis : {
    type: String,
    trim: true,
    maxlength: [500, 'No puede exceder 500 caracteres'],
    default: ''
  },
  Genero: {
    type: String,
    required: [true, 'El genero es requerido'],
    enum: {
      values: ['Terror', 'Accion', 'Ciencia Ficcion', 'Accion', 'Drama', 'Romance'],
    },
  },

})

module.exports = mongoose.model('Movies', MoviesSchema);