const GlobalController = require('./GlobalController');
const MoviesDAO = require('../dao/MoviesDAO');

class MviesController extends GlobalController {
  constructor() {
    super(MoviesDAO);
  }

}

module.exports = new MviesController();