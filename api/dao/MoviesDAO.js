const Task = require('../models/Movies');
const GlobalDAO = require('./GlobalDAO');

class MoviesDAO extends GlobalDAO {
  constructor() {
    super(Movies);
  }

}

module.exports = new MoviesDAO();