const axios = require('axios');
const utils = require('../utils');

const minerd = require('./minerd/center');

exports.dep_minerd = async function(req, res) {
  const allResults = await minerd.findByAll();
  
  res.send(allResults);
};